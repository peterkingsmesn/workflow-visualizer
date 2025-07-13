import React, { useCallback, useState, useEffect, useMemo, memo, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
  Panel,
  NodeTypes,
  ReactFlowInstance,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './WorkflowCanvas.css';

// 노드 타입들
import FileNode from '../nodes/FileNode';
import APINode from '../nodes/APINode';
import FunctionNode from '../nodes/FunctionNode';
import TranslationNode from '../nodes/TranslationNode';

// 공통 노드 타입 정의
const commonNodeTypes: NodeTypes = {
  file: FileNode,
  api: APINode,
  'api-node': APINode,
  function: FunctionNode,
  translation: TranslationNode,
  'translation-coverage': TranslationNode,
  'translation-missing': TranslationNode,
  'translation-unused': TranslationNode,
};

// 공통 Props 인터페이스
export interface BaseCanvasProps {
  nodes?: Node[];
  edges?: Edge[];
  onUpdate?: (nodes: Node[], edges: Edge[]) => void;
  onNodesChange?: OnNodesChange;
  onEdgesChange?: OnEdgesChange;
  onConnect?: OnConnect;
  fitViewOnInit?: boolean;
  minZoom?: number;
  maxZoom?: number;
  defaultZoom?: number;
  nodeTypes?: NodeTypes;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  showMiniMap?: boolean;
  showControls?: boolean;
  showBackground?: boolean;
  backgroundVariant?: any; // ReactFlow BackgroundVariant type
  deleteKeyCode?: string | string[] | null;
  selectionKeyCode?: string | string[] | null;
}

// 공통 Canvas 로직을 담은 Hook
export const useBaseCanvas = (props: BaseCanvasProps) => {
  const {
    nodes: initialNodes = [],
    edges: initialEdges = [],
    onUpdate,
    onNodesChange: externalOnNodesChange,
    onEdgesChange: externalOnEdgesChange,
    onConnect: externalOnConnect,
    fitViewOnInit = true,
    nodeTypes = commonNodeTypes,
  } = props;

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  // 외부 props 업데이트 시 내부 상태 업데이트
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // 노드 변경 핸들러
  const handleNodesChange = useCallback<OnNodesChange>(
    (changes) => {
      onNodesChange(changes);
      externalOnNodesChange?.(changes);
    },
    [onNodesChange, externalOnNodesChange]
  );

  // 엣지 변경 핸들러
  const handleEdgesChange = useCallback<OnEdgesChange>(
    (changes) => {
      onEdgesChange(changes);
      externalOnEdgesChange?.(changes);
    },
    [onEdgesChange, externalOnEdgesChange]
  );

  // 연결 핸들러
  const handleConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        id: `${params.source}-${params.target}`,
        type: 'smoothstep',
        animated: true,
      } as Edge;
      
      setEdges((eds) => addEdge(newEdge, eds));
      externalOnConnect?.(params);
    },
    [setEdges, externalOnConnect]
  );

  // ReactFlow 초기화
  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
    if (fitViewOnInit) {
      setTimeout(() => {
        instance.fitView({ padding: 0.2 });
      }, 50);
    }
  }, [fitViewOnInit]);

  // 상태 업데이트 알림
  useEffect(() => {
    onUpdate?.(nodes, edges);
  }, [nodes, edges, onUpdate]);

  return {
    nodes,
    edges,
    nodeTypes,
    onNodesChange: handleNodesChange,
    onEdgesChange: handleEdgesChange,
    onConnect: handleConnect,
    onInit,
    reactFlowInstance: reactFlowInstance.current,
  };
};

// 기본 Canvas 컴포넌트
export const BaseCanvas: React.FC<BaseCanvasProps> = memo((props) => {
  const {
    className = '',
    style,
    children,
    showMiniMap = true,
    showControls = true,
    showBackground = true,
    backgroundVariant = 'dots',
    deleteKeyCode = 'Delete',
    selectionKeyCode = 'Shift',
    minZoom = 0.1,
    maxZoom = 2,
    defaultZoom = 1,
  } = props;

  const {
    nodes,
    edges,
    nodeTypes,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onInit,
  } = useBaseCanvas(props);

  return (
    <div className={`workflow-canvas ${className}`} style={{ width: '100%', height: '100%', ...style }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        minZoom={minZoom}
        maxZoom={maxZoom}
        defaultViewport={{ x: 0, y: 0, zoom: defaultZoom }}
        deleteKeyCode={deleteKeyCode}
        selectionKeyCode={selectionKeyCode}
        multiSelectionKeyCode="Shift"
        panOnScroll
        selectNodesOnDrag={false}
        elevateNodesOnSelect
      >
        {showBackground && <Background variant={backgroundVariant} gap={16} />}
        {showMiniMap && (
          <MiniMap
            nodeColor={(node) => {
              switch (node.type) {
                case 'api':
                case 'api-node':
                  return '#3b82f6';
                case 'file':
                  return '#10b981';
                case 'function':
                  return '#f59e0b';
                case 'translation':
                case 'translation-coverage':
                  return '#8b5cf6';
                case 'translation-missing':
                  return '#ef4444';
                case 'translation-unused':
                  return '#f59e0b';
                default:
                  return '#6b7280';
              }
            }}
            maskColor="rgba(0, 0, 0, 0.8)"
            pannable
            zoomable
          />
        )}
        {showControls && <Controls />}
        {children}
      </ReactFlow>
    </div>
  );
});

BaseCanvas.displayName = 'BaseCanvas';

export default BaseCanvas;