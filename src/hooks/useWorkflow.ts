import { useCallback, useEffect, useState } from 'react';
import { Connection } from 'reactflow';
import { useWorkflowStore } from '../store/workflowStore';
import { DependencyAnalyzer } from '../core/analyzers/DependencyAnalyzer';
import { WorkflowError } from '../types/workflow.types';

export const useWorkflow = () => {
  const {
    nodes,
    edges,
    errors,
    addNode,
    updateNode,
    removeNode,
    addEdge,
    removeEdge,
    setErrors,
    saveWorkflow,
    loadWorkflow,
    clearWorkflow
  } = useWorkflowStore();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analyzer = new DependencyAnalyzer();

  const analyzeWorkflow = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      // Get all file paths from nodes
      const filePaths = nodes
        .filter(node => node.type === 'file')
        .map(node => node.data.path);

      // Analyze dependencies
      const dependencyGraph = await analyzer.analyzeImports(filePaths);
      
      // Check for circular dependencies
      const cycles = dependencyGraph.cycles;
      const newErrors: WorkflowError[] = [];

      if (cycles.length > 0) {
        cycles.forEach((cycle, index) => {
          newErrors.push({
            id: `circular-${index}`,
            name: 'CircularDependencyError',
            type: 'circular_dependency',
            severity: 'error',
            message: `Circular dependency detected: ${cycle.join(' → ')}`,
            suggestion: 'Consider refactoring to break the circular dependency'
          });
        });
      }

      setErrors(newErrors);
    } catch (error) {
      console.error('Failed to analyze workflow:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [nodes, analyzer, setErrors]);

  const validateConnection = useCallback((connection: Connection): boolean => {
    if (!connection.source || !connection.target) return false;
    
    // Don't allow self-connections
    if (connection.source === connection.target) return false;
    
    // Check if connection already exists
    const exists = edges.some(
      edge => edge.source === connection.source && edge.target === connection.target
    );
    if (exists) return false;
    
    // TODO: Add more validation rules (type compatibility, etc.)
    
    return true;
  }, [edges]);

  const createNodeFromFile = useCallback((filePath: string, position = { x: 100, y: 100 }) => {
    const nodeId = `file-${Date.now()}`;
    const fileName = filePath.split('/').pop() || 'Unknown';
    
    addNode({
      id: nodeId,
      type: 'file',
      position,
      data: {
        path: filePath,
        name: fileName,
        category: 'file',
        imports: [],
        exports: []
      }
    });
    
    return nodeId;
  }, [addNode]);

  const updateWorkflow = useCallback((newNodes?: any[], newEdges?: any[]) => {
    console.log('🔧 updateWorkflow called with:', { 
      newNodes: newNodes?.length, 
      newEdges: newEdges?.length,
      currentNodes: nodes.length,
      currentEdges: edges.length 
    });
    
    // 직접적으로 상태를 업데이트하는 새로운 방식
    const store = useWorkflowStore.getState();
    
    console.log('🧹 Clearing and updating workflow...');
    
    // 한 번에 모든 상태를 업데이트
    useWorkflowStore.setState((state) => {
      // 기존 상태 클리어
      state.nodes = [];
      state.edges = [];
      state.errors = [];
      state.selectedNode = null;
      
      // 새로운 노드들 추가
      if (newNodes && Array.isArray(newNodes)) {
        console.log('🔄 Adding nodes:', newNodes.length);
        newNodes.forEach((node: any) => {
          console.log('➕ Adding node:', node.id, node.data?.label);
          state.nodes.push(node);
        });
      }
      
      // 새로운 엣지들 추가
      if (newEdges && Array.isArray(newEdges)) {
        console.log('🔄 Adding edges:', newEdges.length);
        newEdges.forEach((edge: any) => {
          console.log('➕ Adding edge:', edge.id, edge.source, '->', edge.target);
          state.edges.push(edge);
        });
      }
    });
    
    console.log('💾 Saving new workflow...');
    store.saveWorkflow();
    
    // 최종 상태 확인
    setTimeout(() => {
      const finalState = useWorkflowStore.getState();
      console.log('✅ Final workflow state:', {
        nodes: finalState.nodes.length,
        edges: finalState.edges.length
      });
    }, 100);
    
  }, [nodes.length, edges.length]);

  // Auto-save workflow on changes
  useEffect(() => {
    const timer = setTimeout(() => {
      saveWorkflow();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [nodes, edges, saveWorkflow]);

  return {
    nodes,
    edges,
    errors,
    workflow: { nodes, edges },
    isAnalyzing,
    analyzeWorkflow,
    validateConnection,
    createNodeFromFile,
    updateWorkflow,
    saveWorkflow,
    loadWorkflow
  };
};