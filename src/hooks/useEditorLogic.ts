import { useState, useCallback } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import { FileSystemService } from '../api/services/FileSystemService';
import { resolveImportPath } from '../utils/editorPathResolver';
import { 
  createFileNode, 
  createApiNode, 
  createTranslationNode,
  createNewNode 
} from '../utils/nodeFactory';

export const useEditorLogic = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string>('');
  
  const {
    nodes,
    addNode,
    addEdge,
    clearWorkflow
  } = useWorkflowStore();
  
  const fileSystemService = new FileSystemService();

  // 프로젝트 분석 및 노드 생성
  const analyzeProject = useCallback(async (projectPath: string) => {
    setIsAnalyzing(true);
    try {
      const fileService = new FileSystemService();
      
      // 1. 파일 트리 가져오기
      const tree = await fileService.scanDirectory(projectPath);
      setSelectedPath(projectPath);
      
      // 2. 모든 코드 파일 찾기
      const codeFiles: string[] = [];
      const findCodeFiles = (node: any) => {
        if (node.type === 'file' && 
            ['.js', '.jsx', '.ts', '.tsx', '.json'].includes(node.extension || '')) {
          codeFiles.push(node.path);
        }
        if (node.children) {
          node.children.forEach(findCodeFiles);
        }
      };
      findCodeFiles(tree);
      
      // 3. 파일 의존성 분석
      const response = await fetch('/api/analysis/dependencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePaths: codeFiles.slice(0, 50) }) // 처음 50개만
      });
      
      if (!response.ok) throw new Error('의존성 분석 실패');
      
      const { dependencies } = await response.json();
      
      // 4. 노드와 엣지 생성
      clearWorkflow();
      
      // 노드 생성
      Object.entries(dependencies).forEach(([filePath, fileData]: [string, any], index) => {
        const node = createFileNode(filePath, fileData, index);
        addNode(node);
      });
      
      // 엣지 생성 (import 관계)
      const filePathArray = Object.keys(dependencies);
      Object.entries(dependencies).forEach(([filePath, fileData]: [string, any], sourceIndex) => {
        if (fileData.imports) {
          fileData.imports.forEach((imp: any) => {
            const targetPath = resolveImportPath(imp.source, filePath, filePathArray);
            const targetIndex = filePathArray.findIndex(p => p === targetPath);
            
            if (targetIndex !== -1) {
              addEdge({
                id: `edge-${sourceIndex}-${targetIndex}`,
                source: `file-${sourceIndex}`,
                target: `file-${targetIndex}`,
                type: 'smoothstep',
                animated: true
              });
            }
          });
        }
      });
      
    } catch (error) {
      console.error('프로젝트 분석 오류:', error);
      alert('프로젝트 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [clearWorkflow, addNode, addEdge]);

  // API 분석 실행
  const analyzeAPIs = useCallback(async (projectPath: string | null) => {
    if (!projectPath) {
      alert('프로젝트 경로가 없습니다.');
      return;
    }
    
    setIsAnalyzing(true);
    try {
      const fileService = new FileSystemService();
      
      // 1. 파일 트리 가져오기
      const tree = await fileService.scanDirectory(decodeURIComponent(projectPath));
      
      // 2. 모든 코드 파일 찾기
      const codeFiles: string[] = [];
      const findCodeFiles = (node: any) => {
        if (node.type === 'file' && 
            ['.js', '.jsx', '.ts', '.tsx', '.json'].includes(node.extension || '')) {
          codeFiles.push(node.path);
        }
        if (node.children) {
          node.children.forEach(findCodeFiles);
        }
      };
      findCodeFiles(tree);
      
      // 3. API 엔드포인트 분석
      const response = await fetch('/api/analysis/api-endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePaths: codeFiles.slice(0, 50) })
      });
      
      if (!response.ok) throw new Error('API 분석 실패');
      
      const { endpoints, matches } = await response.json();
      
      // 4. API 노드 생성
      endpoints.backend.forEach((endpoint: any, index: number) => {
        const node = createApiNode(endpoint, index, true);
        node.data.matched = matches.matched.some((m: any) => 
          m.backend.method === endpoint.method && 
          m.backend.path === endpoint.path
        );
        addNode(node);
      });
      
      endpoints.frontend.forEach((call: any, index: number) => {
        const node = createApiNode(call, index, false);
        node.data.matched = matches.matched.some((m: any) => 
          m.frontend.method === call.method && 
          m.frontend.path === call.path
        );
        addNode(node);
      });
      
      // 5. 매칭된 API 연결
      matches.matched.forEach((match: any, index: number) => {
        const backendIndex = endpoints.backend.findIndex((e: any) => 
          e.method === match.backend.method && e.path === match.backend.path
        );
        const frontendIndex = endpoints.frontend.findIndex((e: any) => 
          e.method === match.frontend.method && e.path === match.frontend.path
        );
        
        if (backendIndex !== -1 && frontendIndex !== -1) {
          addEdge({
            id: `api-match-${index}`,
            source: `backend-api-${backendIndex}`,
            target: `frontend-api-${frontendIndex}`,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#10b981', strokeWidth: 3 }
          });
        }
      });
      
    } catch (error) {
      console.error('API 분석 오류:', error);
      alert('API 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [addNode, addEdge]);

  // 번역 키 분석 실행
  const analyzeTranslations = useCallback(async (projectPath: string | null) => {
    if (!projectPath) {
      alert('프로젝트 경로가 없습니다.');
      return;
    }
    
    setIsAnalyzing(true);
    try {
      const fileService = new FileSystemService();
      
      // 1. 파일 트리 가져오기
      const tree = await fileService.scanDirectory(decodeURIComponent(projectPath));
      
      // 2. 코드 파일과 번역 파일 분리
      const codeFiles: string[] = [];
      const translationFiles: string[] = [];
      
      const findFiles = (node: any) => {
        if (node.type === 'file') {
          const ext = node.extension || '';
          const fileName = node.name.toLowerCase();
          
          // 번역 파일 감지
          if (ext === '.json' && (
            fileName.includes('locale') || 
            fileName.includes('i18n') || 
            fileName.includes('lang') ||
            fileName.includes('translation') ||
            /^(en|ko|ja|zh|fr|de|es|it|pt|ru)\.json$/.test(fileName) ||
            /\.(en|ko|ja|zh|fr|de|es|it|pt|ru)\.json$/.test(fileName)
          )) {
            translationFiles.push(node.path);
          }
          // 코드 파일
          else if (['.js', '.jsx', '.ts', '.tsx', '.vue'].includes(ext)) {
            codeFiles.push(node.path);
          }
        }
        if (node.children) {
          node.children.forEach(findFiles);
        }
      };
      findFiles(tree);
      
      // 3. 번역 키 분석
      const response = await fetch('/api/analysis/translation-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          filePaths: codeFiles.slice(0, 100),
          translationFiles: translationFiles
        })
      });
      
      if (!response.ok) throw new Error('번역 분석 실패');
      
      const { translationKeys } = await response.json();
      
      // 4. 번역 노드 생성
      Object.entries(translationKeys.coverage).forEach(([language, coverage]: [string, any], index) => {
        const node = createTranslationNode(language, coverage, index);
        addNode(node);
      });
      
      // 5. 누락된 키 노드 (문제가 있는 경우에만)
      if (translationKeys.missing.length > 0) {
        const missingNode = {
          id: 'missing-translations',
          type: 'translation-missing' as const,
          position: { 
            x: 100 + translationFiles.length * 250, 
            y: 800 
          },
          data: {
            path: 'src/i18n/missing.json',
            name: `누락된 번역 키 (${translationKeys.missing.length})`,
            category: 'translation-missing',
            imports: [],
            exports: [],
            missing: translationKeys.missing,
            status: 'error'
          }
        };
        
        addNode(missingNode);
      }
      
      // 6. 사용되지 않는 키 노드 (문제가 있는 경우에만)
      if (translationKeys.unused.length > 0) {
        const unusedNode = {
          id: 'unused-translations',
          type: 'translation-unused' as const,
          position: { 
            x: 100 + (translationFiles.length + 1) * 250, 
            y: 800 
          },
          data: {
            path: 'src/i18n/unused.json',
            name: `사용되지 않는 키 (${translationKeys.unused.length})`,
            category: 'translation-unused',
            imports: [],
            exports: [],
            unused: translationKeys.unused,
            status: 'warning'
          }
        };
        
        addNode(unusedNode);
      }
      
    } catch (error) {
      console.error('번역 분석 오류:', error);
      alert('번역 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [addNode]);

  // 새 노드 추가
  const handleAddNode = useCallback((type: string) => {
    const node = createNewNode(type);
    if (node) {
      addNode(node);
    }
  }, [addNode]);

  // 파일 선택 핸들러
  const handleFileSelect = useCallback(async (filePath: string) => {
    setSelectedPath(filePath);
    
    // 이미 노드가 있는지 확인
    const existingNode = nodes.find(node => 
      node.type === 'file' && node.data.path === filePath
    );
    
    if (!existingNode) {
      // 새 노드 생성
      const position = {
        x: Math.random() * 500 + 100,
        y: Math.random() * 300 + 100
      };
      
      addNode({
        id: `file-${Date.now()}`,
        type: 'file',
        position,
        data: {
          name: filePath.split('/').pop() || 'Unknown',
          path: filePath,
          category: 'file',
          imports: [],
          exports: [],
          errors: []
        }
      });
    }
  }, [nodes, addNode]);

  return {
    isAnalyzing,
    selectedPath,
    analyzeProject,
    analyzeAPIs,
    analyzeTranslations,
    handleAddNode,
    handleFileSelect
  };
};