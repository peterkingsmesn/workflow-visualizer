export interface Node {
  id: string;
  type: 'file' | 'component' | 'service' | 'api' | 'store' | 'function' | 'websocket' | 'graphql' | 'translation' | 'api-node' | 'translation-coverage' | 'translation-missing' | 'translation-unused';
  position: { x: number; y: number };
  data: NodeData;
}

export interface NodeData {
  path: string;
  name: string;
  category: string;
  imports: string[];
  exports: string[];
  errors?: WorkflowError[];
  warnings?: Warning[];
  ports?: {
    inputs: Port[];
    outputs: Port[];
  };
  aiHints?: {
    purpose: string;
    patterns: string[];
    complexity: 'low' | 'medium' | 'high';
  };
  // API 노드 전용 속성들
  method?: string;
  file?: string;
  line?: number;
  apiType?: 'rest' | 'websocket';
  matched?: boolean;
  // 번역 노드 전용 속성들
  language?: string;
  coverage?: number;
  total?: number;
  covered?: number;
  percentage?: number;
  missing?: string[];
  unused?: string[];
  status?: string;
  // 기타 확장 속성들
  responseType?: string;
  parameters?: any[];
  returnType?: string;
  keys?: string[];
  languages?: string[];
}

export interface Port {
  id: string;
  type: string;
  label: string;
  multiple?: boolean;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type: 'import' | 'data-flow' | 'api-call' | 'websocket' | 'action' | 'smoothstep';
  data?: EdgeData;
  animated?: boolean;
  style?: {
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
  };
}

export interface EdgeData {
  importType?: string;
  dataType?: string;
  trigger?: string;
  action?: string;
  bidirectional?: boolean;
  events?: string[];
}

export interface WorkflowError extends Error {
  id: string;
  name: string;
  type: 'missing_import' | 'circular_dependency' | 'type_mismatch' | 'api_mismatch';
  severity: 'error' | 'warning';
  message: string;
  node?: string;
  suggestion?: string;
}

export interface Warning {
  id: string;
  type: string;
  message: string;
  node?: string;
}

export interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  errors: WorkflowError[];
  selectedNode: string | null;
}

export interface WorkflowAnalysis {
  errors: WorkflowError[];
  warnings: Warning[];
  metrics: {
    totalNodes: number;
    totalEdges: number;
    nodeTypes: Record<string, number>;
    complexity: 'low' | 'medium' | 'high';
    cohesion: 'low' | 'medium' | 'high';
    coupling: 'low' | 'medium' | 'high';
  };
  suggestions: string[];
}

// WebSocket 관련 타입들
export interface WebSocketData extends NodeData {
  url?: string;
  type: 'server' | 'client' | 'native';
  events?: WebSocketEvent[];
  rooms?: string[];
  namespaces?: string[];
  middlewares?: string[];
}

export interface WebSocketEvent {
  id: string;
  name: string;
  type: 'listener' | 'emit';
  filePath: string;
  line: number;
  validation?: boolean;
}

export interface WebSocketConnection {
  id: string;
  type: 'server' | 'client' | 'native';
  name: string;
  url?: string;
  filePath: string;
  line: number;
}

// GraphQL 관련 타입들
export interface GraphQLData extends NodeData {
  schemaPath?: string;
  endpoint?: string;
  queries?: string[];
  mutations?: string[];
  subscriptions?: string[];
  types?: GraphQLType[];
  graphqlErrors?: string[];
  // errors는 NodeData의 WorkflowError[] 타입 유지
}

export interface GraphQLType {
  id: string;
  name: string;
  kind: 'OBJECT' | 'INTERFACE' | 'UNION' | 'ENUM' | 'SCALAR';
  fields?: Array<{ name: string; type: string; args?: any[] }>;
  enumValues?: string[];
  possibleTypes?: string[];
  filePath: string;
  line: number;
}

export interface GraphQLSchema {
  id: string;
  name: string;
  filePath: string;
  line: number;
}

export interface GraphQLResolver {
  id: string;
  name: string;
  filePath: string;
  line: number;
}

// Translation 관련 타입들
export interface TranslationData extends Omit<NodeData, 'keys'> {
  keys: TranslationKey[];
  languages: string[];
  coverage?: number;
}

export interface TranslationKey {
  id: string;
  key: string;
  translations: Record<string, string>;
  filePath?: string;
  line?: number;
}

// API 분석 관련 타입들
export interface APIEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler?: string;
  filePath: string;
  line: number;
  parameters?: APIParameter[];
  responses?: APIResponse[];
}

export interface APIParameter {
  name: string;
  type: string;
  required: boolean;
  location: 'query' | 'body' | 'path' | 'header';
}

export interface APIResponse {
  status: number;
  description?: string;
  schema?: any;
}

export interface APICall {
  id: string;
  method: string;
  url: string;
  filePath: string;
  line: number;
}

export interface APIMatch {
  endpoint: APIEndpoint;
  calls: APICall[];
  matched: boolean;
  backend?: APIEndpoint;
  frontend?: APICall;
  confidence?: number;
}

// 의존성 그래프 타입들
export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  cycles: string[][];
}

export interface DependencyNode {
  id: string;
  path: string;
  name: string;
  type: string;
}

export interface DependencyEdge {
  source: string;
  target: string;
  type: 'import' | 'require' | 'dynamic';
}

// AI 컨텍스트 타입들
export interface AIContext {
  projectType: string;
  architecture: string;
  mainFrameworks: string[];
  patterns: string[];
  conventions: {
    naming: string;
    fileStructure: string;
    stateManagement: string;
    styling: string;
  };
  dependencies: Record<string, string[]>;
}

export interface AIPrompt {
  context: AIContext;
  analysis: WorkflowAnalysis;
  userIntent: string;
  suggestions: string[];
}