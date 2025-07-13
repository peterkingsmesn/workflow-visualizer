const { 
  buildCompleteFileTree, 
  calculateTreeDepth, 
  countFolders,
  findCircularDependencies,
  findUnusedExports,
  findDuplicateImports
} = require('../utils/fileTreeBuilder');

class WorkflowGeneratorService {
  /**
   * 진행상황 전송
   */
  sendProgress(sessionId, phase, progress, details = {}) {
    if (sessionId && global.analysisEmitter) {
      global.analysisEmitter.emit(sessionId, {
        phase,
        progress,
        timestamp: new Date().toISOString(),
        ...details
      });
    }
  }

  /**
   * 전체 워크플로우 분석 수행
   */
  async analyzeWorkflow(projectData, fileAnalysisService, codeAnalysisService) {
    const { projectName, fileCount, totalSize, files, sessionId } = projectData;
    
    console.log('📊 Backend analysis request:', { projectName, fileCount, totalSize });
    
    // 1단계: 전체 폴더 구조 완전 매핑
    this.sendProgress(sessionId, '파일 구조 분석', 0.1, { status: '폴더 구조 매핑 중...' });
    const completeFileTree = buildCompleteFileTree(files);
    const treeDepth = calculateTreeDepth(completeFileTree);
    const totalFolders = countFolders(completeFileTree);
    
    console.log('🌲 Complete file tree built:', {
      totalFiles: files.length,
      treeDepth,
      totalFolders
    });
    
    this.sendProgress(sessionId, '파일 구조 분석', 0.2, { 
      status: '폴더 구조 매핑 완료',
      totalFiles: files.length,
      treeDepth,
      totalFolders
    });
    
    // 2단계: 파일 분석
    this.sendProgress(sessionId, '파일 분석', 0.3, { status: '파일 유형 분석 중...' });
    const fileAnalysis = fileAnalysisService.analyzeFiles(files);
    
    // 3단계: 오류 및 경고 감지
    this.sendProgress(sessionId, '코드 분석', 0.4, { status: '코드 이슈 검사 중...' });
    const errors = [];
    const warnings = [];
    
    if (files && Array.isArray(files)) {
      files.forEach(file => {
        const { errors: fileErrors, warnings: fileWarnings } = codeAnalysisService.detectIssuesInFile(file);
        errors.push(...fileErrors);
        warnings.push(...fileWarnings);
      });
    }
    
    // TypeScript 오류 추가 (옵션)
    try {
      const tsErrors = await fileAnalysisService.checkTypeScriptErrors();
      errors.push(...tsErrors);
    } catch (error) {
      console.warn('TypeScript 검사 실패:', error.message);
    }
    
    // 4단계: Import/Export 관계 분석
    this.sendProgress(sessionId, 'Import 분석', 0.5, { status: 'Import 관계 분석 중...' });
    const importConnections = codeAnalysisService.analyzeImports(files);
    
    // 5단계: API 호출 분석
    this.sendProgress(sessionId, 'API 분석', 0.6, { status: 'API 호출 분석 중...' });
    const apiConnections = codeAnalysisService.analyzeApiCalls(files);
    
    // 6단계: 연결 관계 종합 분석
    this.sendProgress(sessionId, '종합 분석', 0.8, { status: '연결 관계 종합 분석 중...' });
    const connectionAnalysis = {
      totalConnections: importConnections.length + apiConnections.length,
      validConnections: [...importConnections, ...apiConnections].filter(c => c.status === 'success').length,
      warningConnections: [...importConnections, ...apiConnections].filter(c => c.hasWarning).length,
      errorConnections: [...importConnections, ...apiConnections].filter(c => c.hasError).length,
      circularDependencies: findCircularDependencies(importConnections),
      unusedExports: findUnusedExports(files, importConnections),
      duplicateImports: findDuplicateImports(importConnections),
      brokenLinks: [...importConnections, ...apiConnections].filter(c => c.hasError || c.status === 'error')
    };
    
    // 실제 파일 정보 생성
    const realFiles = files.map((file, index) => ({
      id: index,
      name: file.name,
      path: file.path,
      type: file.type || file.name.split('.').pop()?.toLowerCase() || '',
      size: file.size,
      hasErrors: errors.some(e => e.file === file.name || e.path === file.path),
      hasWarnings: warnings.some(w => w.file === file.name || w.path === file.path)
    }));
    
    this.sendProgress(sessionId, '분석 완료', 1.0, { status: '분석이 완료되었습니다.' });
    
    // 최종 결과 반환
    return {
      projectName,
      completeFileTree,
      connectionAnalysis,
      totalFiles: fileCount || 0,
      totalSize: totalSize || 0,
      languages: fileAnalysis.languages,
      frameworks: fileAnalysis.frameworks,
      topDirectories: fileAnalysis.topDirectories,
      largeFiles: fileAnalysis.largeFiles,
      errors: errors,
      warnings: warnings,
      errorCount: errors.length,
      warningCount: warnings.length,
      hasIssues: errors.length > 0 || warnings.length > 0,
      analyzedAt: new Date().toISOString(),
      isRealAnalysis: !!files,
      realFiles: realFiles,
      importConnections: importConnections,
      apiConnections: apiConnections
    };
  }

  /**
   * 의존성 분석
   */
  async analyzeDependencies(filePaths, codeAnalysisService) {
    const dependencies = {};
    const fs = require('fs').promises;
    
    for (const filePath of filePaths) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const imports = codeAnalysisService.extractImports(content, filePath);
        const exports = codeAnalysisService.extractExports(content, filePath);
        
        dependencies[filePath] = {
          imports,
          exports,
          path: filePath,
          name: require('path').basename(filePath)
        };
      } catch (error) {
        console.error(`Error analyzing ${filePath}:`, error);
        dependencies[filePath] = {
          error: error.message,
          imports: [],
          exports: []
        };
      }
    }
    
    return dependencies;
  }

  /**
   * 순환 참조 감지
   */
  detectCircularDependencies(dependencies) {
    const { resolveImportPathWithFS } = require('../utils/importResolver');
    const graph = {};
    
    Object.keys(dependencies).forEach(file => {
      graph[file] = dependencies[file].imports
        .map(imp => resolveImportPathWithFS(imp.source, file))
        .filter(path => path && dependencies[path]);
    });

    // DFS로 순환 참조 찾기
    const cycles = [];
    const visited = new Set();
    const recursionStack = new Set();

    function dfs(node, path = []) {
      if (recursionStack.has(node)) {
        const cycleStart = path.indexOf(node);
        const cycle = path.slice(cycleStart).concat(node);
        cycles.push(cycle);
        return;
      }

      if (visited.has(node)) return;

      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = graph[node] || [];
      neighbors.forEach(neighbor => {
        dfs(neighbor, [...path]);
      });

      recursionStack.delete(node);
    }

    Object.keys(graph).forEach(node => {
      if (!visited.has(node)) {
        dfs(node);
      }
    });

    // 중복 제거
    return cycles.filter((c, i, arr) => 
      i === arr.findIndex(cycle => 
        cycle.join(',') === c.join(',')
      )
    );
  }

  /**
   * API 매칭
   */
  matchAPIs(backend, frontend) {
    const { pathsMatch } = require('../utils/apiContractValidator');
    const matches = {
      matched: [],
      unmatched: {
        backend: [],
        frontend: []
      }
    };
    
    // REST API 매칭
    const backendREST = backend.filter(e => e.type === 'rest');
    const frontendREST = frontend.filter(e => e.type === 'rest');
    
    backendREST.forEach(be => {
      const found = frontendREST.find(fe => 
        fe.method === be.method && 
        pathsMatch(be.path, fe.path)
      );
      
      if (found) {
        matches.matched.push({
          backend: be,
          frontend: found
        });
      } else {
        matches.unmatched.backend.push(be);
      }
    });
    
    frontendREST.forEach(fe => {
      const found = backendREST.find(be => 
        be.method === fe.method && 
        pathsMatch(be.path, fe.path)
      );
      
      if (!found) {
        matches.unmatched.frontend.push(fe);
      }
    });
    
    // WebSocket 이벤트 매칭
    const backendWS = backend.filter(e => e.type === 'websocket');
    const frontendWS = frontend.filter(e => e.type === 'websocket');
    
    backendWS.forEach(be => {
      const found = frontendWS.find(fe => 
        be.path === fe.path && 
        ((be.method === 'WS_IN' && fe.method === 'WS_OUT') ||
         (be.method === 'WS_OUT' && fe.method === 'WS_IN'))
      );
      
      if (found) {
        matches.matched.push({
          backend: be,
          frontend: found
        });
      } else {
        matches.unmatched.backend.push(be);
      }
    });
    
    return matches;
  }
}

module.exports = WorkflowGeneratorService;