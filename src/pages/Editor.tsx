import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { UnifiedWorkflowCanvas } from '../components/canvas/UnifiedWorkflowCanvas';
import { FileTreePanel } from '../components/file-tree/FileTreePanel';
import { ErrorPanel } from '../components/analysis/ErrorPanel';
import { EditorHeader } from '../components/editor/EditorHeader';
import { SettingsModal } from '../components/editor/SettingsModal';
import { AnalyzingOverlay } from '../components/editor/AnalyzingOverlay';
import { useWorkflowStore } from '../store/workflowStore';
import { useWorkflow } from '../hooks/useWorkflow';
import { useEditorLogic } from '../hooks/useEditorLogic';

interface EditorProps {
  projectId?: string;
}

const Editor: React.FC<EditorProps> = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const {
    nodes,
    edges,
    errors,
    workflow,
    analyzeWorkflow,
    saveWorkflow,
    loadWorkflow
  } = useWorkflow();

  const {
    addNode,
    addEdge,
    clearWorkflow
  } = useWorkflowStore();

  const {
    isAnalyzing,
    selectedPath,
    analyzeProject,
    analyzeAPIs,
    analyzeTranslations,
    handleAddNode,
    handleFileSelect
  } = useEditorLogic();

  // 워크플로우 로드
  useEffect(() => {
    const projectPath = searchParams.get('path');
    
    if (projectPath) {
      // 프로젝트 경로가 있으면 분석 시작
      analyzeProject(decodeURIComponent(projectPath));
    } else if (projectId && projectId !== 'new') {
      loadWorkflow(projectId);
    } else {
      // 데모 데이터 추가
      const demoNodes = [
        {
          id: 'file-1',
          type: 'file' as const,
          position: { x: 100, y: 100 },
          data: {
            name: 'App.tsx',
            path: '/src/App.tsx',
            category: 'file',
            imports: ['React', 'WorkflowCanvas', 'FileTreePanel'],
            exports: ['App'],
            aiHints: { 
              purpose: 'Main application entry point',
              patterns: ['SPA routing'],
              complexity: 'medium' as const
            }
          }
        },
        {
          id: 'file-2',
          type: 'file' as const,
          position: { x: 400, y: 100 },
          data: {
            name: 'WorkflowCanvas.tsx',
            path: '/src/components/WorkflowCanvas.tsx',
            category: 'file',
            imports: ['React', 'ReactFlow'],
            exports: ['WorkflowCanvas'],
            aiHints: { 
              purpose: 'Workflow visualization component',
              patterns: ['React component'],
              complexity: 'high' as const
            }
          }
        },
        {
          id: 'api-1',
          type: 'api' as const,
          position: { x: 250, y: 300 },
          data: {
            path: '/api/workflows',
            name: 'API Service',
            category: 'api',
            imports: [],
            exports: [],
            ports: {
              inputs: [{ id: 'in-1', type: 'request', label: 'Request' }],
              outputs: [{ id: 'out-1', type: 'response', label: 'Response' }]
            }
          }
        }
      ];

      const demoEdges = [
        {
          id: 'edge-1',
          source: 'file-1',
          target: 'file-2',
          sourceHandle: 'export-0',
          targetHandle: 'import-0',
          type: 'smoothstep' as const
        },
        {
          id: 'edge-2',
          source: 'file-2',
          target: 'api-1',
          sourceHandle: 'export-0',
          targetHandle: 'in-1',
          type: 'smoothstep' as const
        }
      ];

      demoNodes.forEach(node => addNode(node));
      demoEdges.forEach(edge => addEdge(edge));
    }
  }, [projectId, loadWorkflow, addNode, addEdge, searchParams, analyzeProject]);

  // 워크플로우 저장
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await saveWorkflow();
    } catch (error) {
      console.error('Failed to save workflow:', error);
    } finally {
      setIsSaving(false);
    }
  }, [saveWorkflow]);

  // 워크플로우 내보내기
  const handleExport = useCallback(() => {
    const workflowData = {
      version: '1.1',
      project: {
        id: projectId || 'new-project',
        name: 'Workflow Export',
        timestamp: new Date().toISOString()
      },
      nodes,
      edges,
      analysis: {
        errors: errors.length,
        warnings: 0
      }
    };

    const blob = new Blob([JSON.stringify(workflowData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-${projectId || 'export'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [projectId, nodes, edges, errors]);

  // 워크플로우 가져오기
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        // 워크플로우 데이터 로드
        if (data.nodes) {
          clearWorkflow();
          data.nodes.forEach((node: any) => addNode(node));
        }
        if (data.edges) {
          data.edges.forEach((edge: any) => addEdge(edge));
        }
      } catch (error) {
        console.error('Failed to import workflow:', error);
      }
    };
    input.click();
  }, [clearWorkflow, addNode, addEdge]);

  const styles = {
    container: {
      height: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
      background: 'linear-gradient(45deg, #0f0f23, #1a1a2e, #16213e)',
      backgroundSize: '200% 200%',
      animation: 'gradientAnimation 10s ease infinite',
      color: 'white',
      position: 'relative' as const,
      overflow: 'hidden'
    },
    content: {
      flex: 1,
      display: 'flex',
      overflow: 'hidden',
      position: 'relative' as const,
      zIndex: 1
    },
    sidebar: {
      width: '280px',
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      flexDirection: 'column' as const,
      position: 'relative' as const,
      zIndex: 2
    },
    canvas: {
      flex: 1,
      background: 'rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(10px)',
      position: 'relative' as const,
      overflow: 'hidden'
    },
    propertiesPanel: {
      width: '320px',
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(20px)',
      borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      flexDirection: 'column' as const,
      position: 'relative' as const,
      zIndex: 2
    }
  };

  const projectPath = searchParams.get('path');

  return (
    <div style={styles.container}>
      <EditorHeader
        isAnalyzing={isAnalyzing}
        isSaving={isSaving}
        showSettings={showSettings}
        onNavigateBack={() => navigate('/')}
        onAnalyzeWorkflow={analyzeWorkflow}
        onAnalyzeAPIs={() => analyzeAPIs(projectPath)}
        onAnalyzeTranslations={() => analyzeTranslations(projectPath)}
        onAddNode={handleAddNode}
        onSave={handleSave}
        onExport={handleExport}
        onImport={handleImport}
        onToggleSettings={() => setShowSettings(!showSettings)}
      />

      <div style={styles.content}>
        <aside style={styles.sidebar}>
          <FileTreePanel 
            rootPath={selectedPath || null} 
            onFileSelect={(files) => handleFileSelect(files[0])} 
          />
        </aside>
        
        <main style={styles.canvas}>
          <AnalyzingOverlay show={isAnalyzing} />
          {!isAnalyzing && (
            <UnifiedWorkflowCanvas 
              nodes={nodes}
              edges={edges}
              onUpdate={(updatedNodes, updatedEdges) => {
                console.log('Canvas updated:', updatedNodes.length, 'nodes,', updatedEdges.length, 'edges');
              }}
            />
          )}
        </main>
        
        {errors.length > 0 && (
          <aside style={styles.propertiesPanel}>
            <ErrorPanel errors={errors} />
          </aside>
        )}
      </div>

      <SettingsModal show={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};

export default Editor;