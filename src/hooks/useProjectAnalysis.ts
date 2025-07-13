import { useState, useCallback } from 'react';
import { APIAnalyzer } from '../core/analyzers/APIAnalyzer';
import { TranslationAnalyzer } from '../core/analyzers/TranslationAnalyzer';
import { DependencyAnalyzer } from '../core/analyzers/DependencyAnalyzer';

interface AnalysisState {
  isAnalyzing: boolean;
  analysisMessage: string;
  progress: number;
}

export const useProjectAnalysis = () => {
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    analysisMessage: '',
    progress: 0
  });

  const updateProgress = useCallback((message: string, progress: number) => {
    setState(prev => ({
      ...prev,
      analysisMessage: message,
      progress
    }));
  }, []);

  // 프로젝트 파일 분석
  const analyzeProject = useCallback(async (projectPath: string) => {
    setState({ isAnalyzing: true, analysisMessage: '프로젝트 파일을 스캔하는 중...', progress: 0 });
    
    try {
      updateProgress('파일 목록을 가져오는 중...', 10);
      
      const response = await fetch('/api/files/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: projectPath })
      });
      
      if (!response.ok) {
        throw new Error('파일 스캔 실패');
      }
      
      const files = await response.json();
      updateProgress(`${files.length}개의 파일을 찾았습니다. 분석 중...`, 30);
      
      // 코드 파일 필터링
      const codeFiles = files.filter((file: any) => 
        /\.(js|jsx|ts|tsx|py|java|go|rb|php)$/.test(file.path)
      );
      
      updateProgress('의존성을 분석하는 중...', 50);
      
      // 의존성 분석
      const dependencyAnalyzer = new DependencyAnalyzer();
      const dependencies = await dependencyAnalyzer.analyzeDependencies(codeFiles);
      
      updateProgress('워크플로우를 생성하는 중...', 80);
      
      // 노드와 엣지 생성
      const nodes: any[] = [];
      const edges: any[] = [];
      const fileMap = new Map<string, string>();
      
      // 파일 노드 생성
      codeFiles.forEach((file: any, index: number) => {
        const nodeId = `file-${index}`;
        fileMap.set(file.path, nodeId);
        
        nodes.push({
          id: nodeId,
          type: 'file',
          position: { 
            x: (index % 5) * 200, 
            y: Math.floor(index / 5) * 150 
          },
          data: {
            label: file.name,
            path: file.path,
            language: getLanguageFromExtension(file.path),
            size: file.size,
            lastModified: file.lastModified
          }
        });
      });
      
      // 의존성 엣지 생성
      dependencies.forEach((deps, filePath) => {
        const sourceId = fileMap.get(filePath);
        if (!sourceId) return;
        
        deps.forEach((dep, index) => {
          const targetId = fileMap.get(dep);
          if (targetId) {
            edges.push({
              id: `edge-${sourceId}-${targetId}-${index}`,
              source: sourceId,
              target: targetId,
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#64748b' }
            });
          }
        });
      });
      
      updateProgress('분석 완료!', 100);
      
      return { nodes, edges, files: codeFiles };
    } catch (error) {
      console.error('프로젝트 분석 오류:', error);
      throw error;
    } finally {
      setTimeout(() => {
        setState({ isAnalyzing: false, analysisMessage: '', progress: 0 });
      }, 1000);
    }
  }, [updateProgress]);

  // API 분석
  const analyzeAPIs = useCallback(async (projectPath: string, existingNodes: any[]) => {
    setState({ isAnalyzing: true, analysisMessage: 'API 엔드포인트를 찾는 중...', progress: 0 });
    
    try {
      updateProgress('백엔드 API를 분석하는 중...', 20);
      
      const analyzer = new APIAnalyzer();
      const backendAPIs = await analyzer.findBackendAPIs(projectPath);
      
      updateProgress('프론트엔드 API 호출을 분석하는 중...', 40);
      const frontendAPIs = await analyzer.findFrontendAPICalls(projectPath);
      
      updateProgress('API 매칭 중...', 60);
      const matches = analyzer.matchAPIs(backendAPIs, frontendAPIs);
      
      updateProgress('노드와 연결을 생성하는 중...', 80);
      
      const nodes: any[] = [];
      const edges: any[] = [];
      
      // 백엔드 API 노드 생성
      backendAPIs.forEach((api, index) => {
        nodes.push({
          id: `backend-api-${index}`,
          type: 'api',
          position: { x: 100, y: 100 + index * 100 },
          data: {
            label: api.path,
            method: api.method,
            file: api.filePath,
            line: api.line,
            isBackend: true
          }
        });
      });
      
      // 프론트엔드 API 노드 생성
      frontendAPIs.forEach((api, index) => {
        nodes.push({
          id: `frontend-api-${index}`,
          type: 'api',
          position: { x: 500, y: 100 + index * 100 },
          data: {
            label: api.url,
            method: api.method,
            file: api.filePath,
            line: api.line,
            isBackend: false
          }
        });
      });
      
      // API 매칭 엣지 생성
      matches.forEach((match, index) => {
        const backendNodeId = `backend-api-${backendAPIs.indexOf(match.backend)}`;
        const frontendNodeId = `frontend-api-${frontendAPIs.indexOf(match.frontend)}`;
        
        edges.push({
          id: `api-match-${index}`,
          source: backendNodeId,
          target: frontendNodeId,
          type: 'smoothstep',
          animated: true,
          style: { 
            stroke: match.confidence > 0.8 ? '#10b981' : '#f59e0b',
            strokeWidth: 2
          },
          data: {
            confidence: match.confidence,
            label: `${Math.round(match.confidence * 100)}% 일치`
          }
        });
      });
      
      updateProgress('API 분석 완료!', 100);
      
      return { nodes, edges, apiMatches: matches };
    } catch (error) {
      console.error('API 분석 오류:', error);
      throw error;
    } finally {
      setTimeout(() => {
        setState({ isAnalyzing: false, analysisMessage: '', progress: 0 });
      }, 1000);
    }
  }, [updateProgress]);

  // 번역 분석
  const analyzeTranslations = useCallback(async (projectPath: string) => {
    setState({ isAnalyzing: true, analysisMessage: '번역 파일을 찾는 중...', progress: 0 });
    
    try {
      updateProgress('번역 키를 분석하는 중...', 30);
      
      const analyzer = new TranslationAnalyzer();
      const result = await analyzer.analyzeTranslations(projectPath);
      
      updateProgress('번역 커버리지를 계산하는 중...', 60);
      
      const nodes: any[] = [];
      const edges: any[] = [];
      
      // 번역 파일 노드 생성
      result.translationFiles.forEach((file, index) => {
        nodes.push({
          id: `translation-${index}`,
          type: 'translation',
          position: { x: 100 + index * 200, y: 100 },
          data: {
            label: file.language,
            file: file.file,
            keys: file.keys,
            coverage: file.coverage || 100
          }
        });
      });
      
      // 번역 사용 노드 생성
      result.usageFiles.forEach((usage, index) => {
        const nodeId = `usage-${index}`;
        nodes.push({
          id: nodeId,
          type: 'file',
          position: { x: 100 + index * 150, y: 300 },
          data: {
            label: usage.file.split('/').pop(),
            path: usage.file,
            usedKeys: usage.keys
          }
        });
        
        // 사용하는 번역 파일과 연결
        usage.keys.forEach(key => {
          result.translationFiles.forEach((trans, transIndex) => {
            if (trans.keys.includes(key)) {
              edges.push({
                id: `trans-usage-${nodeId}-${transIndex}-${key}`,
                source: nodeId,
                target: `translation-${transIndex}`,
                type: 'smoothstep',
                animated: false,
                style: { stroke: '#8b5cf6' }
              });
            }
          });
        });
      });
      
      updateProgress('번역 분석 완료!', 100);
      
      const coverage = calculateOverallCoverage(result);
      
      return { 
        nodes, 
        edges, 
        translationData: result,
        coverage 
      };
    } catch (error) {
      console.error('번역 분석 오류:', error);
      throw error;
    } finally {
      setTimeout(() => {
        setState({ isAnalyzing: false, analysisMessage: '', progress: 0 });
      }, 1000);
    }
  }, [updateProgress]);

  return {
    ...state,
    analyzeProject,
    analyzeAPIs,
    analyzeTranslations
  };
};

// 유틸리티 함수들
function getLanguageFromExtension(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    js: 'JavaScript',
    jsx: 'JavaScript',
    ts: 'TypeScript',
    tsx: 'TypeScript',
    py: 'Python',
    java: 'Java',
    go: 'Go',
    rb: 'Ruby',
    php: 'PHP'
  };
  return languageMap[ext || ''] || 'Unknown';
}

function calculateOverallCoverage(translationData: any): number {
  const allKeys = new Set<string>();
  const coveredKeys = new Set<string>();
  
  translationData.usageFiles.forEach((usage: any) => {
    usage.keys.forEach((key: string) => allKeys.add(key));
  });
  
  translationData.translationFiles.forEach((trans: any) => {
    trans.keys.forEach((key: string) => {
      if (allKeys.has(key)) {
        coveredKeys.add(key);
      }
    });
  });
  
  return allKeys.size > 0 ? (coveredKeys.size / allKeys.size) * 100 : 100;
}