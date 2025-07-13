import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import { Node, Edge, WorkflowError } from '../types/workflow.types';

// 🚀 성능 최적화: 상태를 여러 컨텍스트로 분리하여 불필요한 리렌더링 방지

// ============================================================================
// 1. 워크플로우 상태 컨텍스트 (읽기 전용)
// ============================================================================

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  errors: WorkflowError[];
  theme: 'light' | 'dark';
  isLoading: boolean;
  lastModified: number;
}

interface WorkflowStateContextValue {
  state: WorkflowState;
}

const WorkflowStateContext = createContext<WorkflowStateContextValue | null>(null);

// ============================================================================
// 2. 워크플로우 액션 컨텍스트 (액션 함수들)
// ============================================================================

interface WorkflowActions {
  addNode: (node: Node) => void;
  updateNode: (id: string, data: Partial<Node>) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: Edge) => void;
  removeEdge: (id: string) => void;
  setErrors: (errors: WorkflowError[]) => void;
  clearErrors: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  saveWorkflow: () => void;
  loadWorkflow: (data: any) => void;
  clearWorkflow: () => void;
  setLoading: (loading: boolean) => void;
}

const WorkflowActionsContext = createContext<WorkflowActions | null>(null);

// ============================================================================
// 3. 선택 상태 컨텍스트 (선택된 노드/엣지 상태)
// ============================================================================

interface SelectionState {
  selectedNodes: string[];
  selectedEdges: string[];
  hoveredNode: string | null;
  focusedNode: string | null;
}

interface SelectionActions {
  selectNode: (id: string) => void;
  selectNodes: (ids: string[]) => void;
  deselectNode: (id: string) => void;
  clearSelection: () => void;
  setHoveredNode: (id: string | null) => void;
  setFocusedNode: (id: string | null) => void;
}

interface SelectionContextValue {
  selection: SelectionState;
  actions: SelectionActions;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

// ============================================================================
// 4. 리듀서 정의
// ============================================================================

type WorkflowAction = 
  | { type: 'ADD_NODE'; payload: Node }
  | { type: 'UPDATE_NODE'; payload: { id: string; data: Partial<Node> } }
  | { type: 'REMOVE_NODE'; payload: string }
  | { type: 'ADD_EDGE'; payload: Edge }
  | { type: 'REMOVE_EDGE'; payload: string }
  | { type: 'SET_ERRORS'; payload: WorkflowError[] }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'LOAD_WORKFLOW'; payload: any }
  | { type: 'CLEAR_WORKFLOW' }
  | { type: 'SET_LOADING'; payload: boolean };

type SelectionAction =
  | { type: 'SELECT_NODE'; payload: string }
  | { type: 'SELECT_NODES'; payload: string[] }
  | { type: 'DESELECT_NODE'; payload: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_HOVERED_NODE'; payload: string | null }
  | { type: 'SET_FOCUSED_NODE'; payload: string | null };

const workflowReducer = (state: WorkflowState, action: WorkflowAction): WorkflowState => {
  switch (action.type) {
    case 'ADD_NODE':
      return {
        ...state,
        nodes: [...state.nodes, action.payload],
        lastModified: Date.now()
      };
    
    case 'UPDATE_NODE':
      return {
        ...state,
        nodes: state.nodes.map(node => 
          node.id === action.payload.id 
            ? { ...node, ...action.payload.data }
            : node
        ),
        lastModified: Date.now()
      };
    
    case 'REMOVE_NODE':
      return {
        ...state,
        nodes: state.nodes.filter(node => node.id !== action.payload),
        edges: state.edges.filter(edge => 
          edge.source !== action.payload && edge.target !== action.payload
        ),
        lastModified: Date.now()
      };
    
    case 'ADD_EDGE':
      return {
        ...state,
        edges: [...state.edges, action.payload],
        lastModified: Date.now()
      };
    
    case 'REMOVE_EDGE':
      return {
        ...state,
        edges: state.edges.filter(edge => edge.id !== action.payload),
        lastModified: Date.now()
      };
    
    case 'SET_ERRORS':
      return { ...state, errors: action.payload };
    
    case 'CLEAR_ERRORS':
      return { ...state, errors: [] };
    
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    
    case 'LOAD_WORKFLOW':
      return {
        ...state,
        nodes: action.payload.nodes || [],
        edges: action.payload.edges || [],
        lastModified: Date.now()
      };
    
    case 'CLEAR_WORKFLOW':
      return {
        ...state,
        nodes: [],
        edges: [],
        errors: [],
        lastModified: Date.now()
      };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    default:
      return state;
  }
};

const selectionReducer = (state: SelectionState, action: SelectionAction): SelectionState => {
  switch (action.type) {
    case 'SELECT_NODE':
      return {
        ...state,
        selectedNodes: state.selectedNodes.includes(action.payload)
          ? state.selectedNodes
          : [...state.selectedNodes, action.payload]
      };
    
    case 'SELECT_NODES':
      return { ...state, selectedNodes: action.payload };
    
    case 'DESELECT_NODE':
      return {
        ...state,
        selectedNodes: state.selectedNodes.filter(id => id !== action.payload)
      };
    
    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedNodes: [],
        selectedEdges: []
      };
    
    case 'SET_HOVERED_NODE':
      return { ...state, hoveredNode: action.payload };
    
    case 'SET_FOCUSED_NODE':
      return { ...state, focusedNode: action.payload };
    
    default:
      return state;
  }
};

// ============================================================================
// 5. 프로바이더 컴포넌트
// ============================================================================

interface WorkflowProviderProps {
  children: React.ReactNode;
}

export const WorkflowProvider: React.FC<WorkflowProviderProps> = ({ children }) => {
  const [workflowState, dispatchWorkflow] = useReducer(workflowReducer, {
    nodes: [],
    edges: [],
    errors: [],
    theme: 'light',
    isLoading: false,
    lastModified: Date.now()
  });

  const [selectionState, dispatchSelection] = useReducer(selectionReducer, {
    selectedNodes: [],
    selectedEdges: [],
    hoveredNode: null,
    focusedNode: null
  });

  // 🚀 성능 최적화: 액션 함수들을 useCallback으로 메모이제이션
  // workflow actions 개별 정의
  const addNode = useCallback((node: Node) => {
    dispatchWorkflow({ type: 'ADD_NODE', payload: node });
  }, []);

  const updateNode = useCallback((id: string, data: Partial<Node>) => {
    dispatchWorkflow({ type: 'UPDATE_NODE', payload: { id, data } });
  }, []);

  const removeNode = useCallback((id: string) => {
    dispatchWorkflow({ type: 'REMOVE_NODE', payload: id });
    dispatchSelection({ type: 'DESELECT_NODE', payload: id });
  }, []);

  const addEdge = useCallback((edge: Edge) => {
    dispatchWorkflow({ type: 'ADD_EDGE', payload: edge });
  }, []);

  const removeEdge = useCallback((id: string) => {
    dispatchWorkflow({ type: 'REMOVE_EDGE', payload: id });
  }, []);

  const setErrors = useCallback((errors: WorkflowError[]) => {
    dispatchWorkflow({ type: 'SET_ERRORS', payload: errors });
  }, []);

  const clearErrors = useCallback(() => {
    dispatchWorkflow({ type: 'CLEAR_ERRORS' });
  }, []);

  const setTheme = useCallback((theme: 'light' | 'dark') => {
    dispatchWorkflow({ type: 'SET_THEME', payload: theme });
  }, []);

  const saveWorkflow = useCallback(() => {
    const workflow = {
      nodes: workflowState.nodes,
      edges: workflowState.edges,
      version: '1.0'
    };
    localStorage.setItem('workflow', JSON.stringify(workflow));
  }, [workflowState.nodes, workflowState.edges]);

  const loadWorkflow = useCallback((data: any) => {
    dispatchWorkflow({ type: 'LOAD_WORKFLOW', payload: data });
  }, []);

  const clearWorkflow = useCallback(() => {
    dispatchWorkflow({ type: 'CLEAR_WORKFLOW' });
    dispatchSelection({ type: 'CLEAR_SELECTION' });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatchWorkflow({ type: 'SET_LOADING', payload: loading });
  }, []);

  const workflowActions = useMemo<WorkflowActions>(() => ({
    addNode,
    updateNode,
    removeNode,
    addEdge,
    removeEdge,
    setErrors,
    clearErrors,
    setTheme,
    saveWorkflow,
    loadWorkflow,
    clearWorkflow,
    setLoading
  }), [addNode, updateNode, removeNode, addEdge, removeEdge, setErrors, clearErrors, setTheme, saveWorkflow, loadWorkflow, clearWorkflow, setLoading]);

  // selection actions 개별 정의
  const selectNode = useCallback((id: string) => {
    dispatchSelection({ type: 'SELECT_NODE', payload: id });
  }, []);

  const selectNodes = useCallback((ids: string[]) => {
    dispatchSelection({ type: 'SELECT_NODES', payload: ids });
  }, []);

  const deselectNode = useCallback((id: string) => {
    dispatchSelection({ type: 'DESELECT_NODE', payload: id });
  }, []);

  const clearSelection = useCallback(() => {
    dispatchSelection({ type: 'CLEAR_SELECTION' });
  }, []);

  const setHoveredNode = useCallback((id: string | null) => {
    dispatchSelection({ type: 'SET_HOVERED_NODE', payload: id });
  }, []);

  const setFocusedNode = useCallback((id: string | null) => {
    dispatchSelection({ type: 'SET_FOCUSED_NODE', payload: id });
  }, []);

  const selectionActions = useMemo<SelectionActions>(() => ({
    selectNode,
    selectNodes,
    deselectNode,
    clearSelection,
    setHoveredNode,
    setFocusedNode
  }), [selectNode, selectNodes, deselectNode, clearSelection, setHoveredNode, setFocusedNode]);

  // 🚀 성능 최적화: 컨텍스트 값들을 useMemo로 메모이제이션
  const workflowStateValue = useMemo(() => ({
    state: workflowState
  }), [workflowState]);

  const selectionValue = useMemo(() => ({
    selection: selectionState,
    actions: selectionActions
  }), [selectionState, selectionActions]);

  return (
    <WorkflowStateContext.Provider value={workflowStateValue}>
      <WorkflowActionsContext.Provider value={workflowActions}>
        <SelectionContext.Provider value={selectionValue}>
          {children}
        </SelectionContext.Provider>
      </WorkflowActionsContext.Provider>
    </WorkflowStateContext.Provider>
  );
};

// ============================================================================
// 6. 커스텀 훅들
// ============================================================================

// 🚀 성능 최적화: 상태만 필요한 컴포넌트용 훅
export const useWorkflowState = () => {
  const context = useContext(WorkflowStateContext);
  if (!context) {
    throw new Error('useWorkflowState must be used within a WorkflowProvider');
  }
  return context.state;
};

// 🚀 성능 최적화: 액션만 필요한 컴포넌트용 훅
export const useWorkflowActions = () => {
  const context = useContext(WorkflowActionsContext);
  if (!context) {
    throw new Error('useWorkflowActions must be used within a WorkflowProvider');
  }
  return context;
};

// 🚀 성능 최적화: 선택 상태만 필요한 컴포넌트용 훅
export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within a WorkflowProvider');
  }
  return context;
};

// 🚀 성능 최적화: 특정 노드 상태만 필요한 컴포넌트용 훅
export const useNodeById = (nodeId: string) => {
  const { nodes } = useWorkflowState();
  const foundNode = useMemo(() => 
    nodes.find(node => node.id === nodeId), 
    [nodes, nodeId]
  );
  return foundNode;
};

// 🚀 성능 최적화: 특정 노드 선택 상태만 필요한 컴포넌트용 훅
export const useNodeSelection = (nodeId: string) => {
  const { selection } = useSelection();
  const selectionState = useMemo(() => ({
    isSelected: selection.selectedNodes.includes(nodeId),
    isHovered: selection.hoveredNode === nodeId,
    isFocused: selection.focusedNode === nodeId
  }), [selection, nodeId]);
  return selectionState;
};

// 🚀 성능 최적화: 노드 카운트만 필요한 컴포넌트용 훅
export const useNodeCount = () => {
  const { nodes } = useWorkflowState();
  const nodeCount = useMemo(() => nodes.length, [nodes.length]);
  return nodeCount;
};

// 🚀 성능 최적화: 엣지 카운트만 필요한 컴포넌트용 훅
export const useEdgeCount = () => {
  const { edges } = useWorkflowState();
  const edgeCount = useMemo(() => edges.length, [edges.length]);
  return edgeCount;
};

// 🚀 성능 최적화: 에러 상태만 필요한 컴포넌트용 훅
export const useWorkflowErrors = () => {
  const { errors } = useWorkflowState();
  const errorState = useMemo(() => ({
    errors,
    hasErrors: errors.length > 0,
    errorCount: errors.length
  }), [errors]);
  return errorState;
};

// 🚀 성능 최적화: 테마 상태만 필요한 컴포넌트용 훅
export const useWorkflowTheme = () => {
  const { theme } = useWorkflowState();
  const { setTheme } = useWorkflowActions();
  const themeState = useMemo(() => ({
    theme,
    setTheme
  }), [theme, setTheme]);
  return themeState;
};