import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { WorkflowState, Node, Edge, WorkflowError } from '../types/workflow.types';
import { localStorage } from '../utils/localStorage';

interface WorkflowStore extends WorkflowState {
  // State
  nodes: Node[];
  edges: Edge[];
  errors: WorkflowError[];
  selectedNode: string | null;
  theme: 'light' | 'dark';
  
  // Actions
  addNode: (node: Node) => void;
  updateNode: (id: string, data: Partial<Node>) => void;
  removeNode: (id: string) => void;
  
  addEdge: (edge: Edge) => void;
  removeEdge: (id: string) => void;
  
  setErrors: (errors: WorkflowError[]) => void;
  clearErrors: () => void;
  
  selectNode: (id: string | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  
  // Persistence
  saveWorkflow: () => void;
  loadWorkflow: (data: any) => void;
  clearWorkflow: () => void;
  
  // Bulk updates
  updateWorkflow: (updates: { nodes?: Node[], edges?: Edge[] }) => void;
}

export const useWorkflowStore = create<WorkflowStore>()(
  immer((set, get) => ({
    // Initial state
    nodes: [],
    edges: [],
    errors: [],
    selectedNode: null,
    theme: 'light',

    // Node actions
    addNode: (node) => set((state) => {
      state.nodes.push(node);
    }),

    updateNode: (id, data) => set((state) => {
      const index = state.nodes.findIndex(n => n.id === id);
      if (index !== -1) {
        state.nodes[index] = { ...state.nodes[index], ...data };
      }
    }),

    removeNode: (id) => set((state) => {
      state.nodes = state.nodes.filter(n => n.id !== id);
      // Also remove connected edges
      state.edges = state.edges.filter(e => e.source !== id && e.target !== id);
    }),

    // Edge actions
    addEdge: (edge) => set((state) => {
      state.edges.push(edge);
    }),

    removeEdge: (id) => set((state) => {
      state.edges = state.edges.filter(e => e.id !== id);
    }),

    // Error handling
    setErrors: (errors) => set((state) => {
      state.errors = errors;
    }),

    clearErrors: () => set((state) => {
      state.errors = [];
    }),

    // UI state
    selectNode: (id) => set((state) => {
      state.selectedNode = id;
    }),

    setTheme: (theme) => set((state) => {
      state.theme = theme;
      localStorage.set('theme', theme);
    }),

    // Persistence
    saveWorkflow: () => {
      const state = get();
      const workflow = {
        nodes: state.nodes,
        edges: state.edges,
        version: '1.0'
      };
      localStorage.set('workflow', workflow);
    },

    loadWorkflow: (data) => set((state) => {
      if (data.nodes) state.nodes = data.nodes;
      if (data.edges) state.edges = data.edges;
    }),

    clearWorkflow: () => set((state) => {
      state.nodes = [];
      state.edges = [];
      state.errors = [];
      state.selectedNode = null;
    }),

    // Bulk update for collaboration
    updateWorkflow: (updates) => set((state) => {
      if (updates.nodes !== undefined) {
        state.nodes = updates.nodes;
      }
      if (updates.edges !== undefined) {
        state.edges = updates.edges;
      }
    })
  }))
);

// Export actions separately for easier testing
export const workflowActions = {
  addNode: useWorkflowStore.getState().addNode,
  updateNode: useWorkflowStore.getState().updateNode,
  removeNode: useWorkflowStore.getState().removeNode,
  addEdge: useWorkflowStore.getState().addEdge,
  removeEdge: useWorkflowStore.getState().removeEdge,
  clearWorkflow: useWorkflowStore.getState().clearWorkflow,
};