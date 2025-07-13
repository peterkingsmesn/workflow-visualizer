import React, { useState, useCallback, useEffect, memo } from 'react';
import { Node, Edge, Panel, useReactFlow, Viewport } from 'reactflow';
import BaseCanvas, { BaseCanvasProps, useBaseCanvas } from './BaseCanvas';
import { ErrorDetailModal } from '../nodes/ErrorDetailModal';

// Canvas 모드 타입
export type CanvasMode = 'standard' | 'optimized' | 'performance' | 'detailed' | 'filetree';

// 확장된 Props
export interface UnifiedWorkflowCanvasProps extends BaseCanvasProps {
  mode?: CanvasMode;
  analysisResults?: any;
  projectName?: string;
  showInfoPanel?: boolean;
  enableClustering?: boolean;
  clusterThreshold?: number;
  detailThreshold?: number;
}

// 줌 레벨에 따른 노드 표시 제어
const useZoomBasedRendering = (
  nodes: Node[],
  enableClustering: boolean,
  clusterThreshold: number,
  detailThreshold: number
) => {
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [visibleNodes, setVisibleNodes] = useState<Node[]>(nodes);

  useEffect(() => {
    if (!enableClustering) {
      setVisibleNodes(nodes);
      return;
    }

    const zoom = viewport.zoom;
    
    if (zoom < clusterThreshold) {
      // 클러스터링 모드
      const clustered = clusterNodes(nodes);
      setVisibleNodes(clustered);
    } else if (zoom < detailThreshold) {
      // 기본 모드
      setVisibleNodes(nodes.map(node => ({
        ...node,
        data: { ...node.data, simplified: true }
      })));
    } else {
      // 상세 모드
      setVisibleNodes(nodes);
    }
  }, [nodes, viewport, enableClustering, clusterThreshold, detailThreshold]);

  return { visibleNodes, setViewport };
};

// 노드 클러스터링 함수
const clusterNodes = (nodes: Node[]): Node[] => {
  // 폴더별로 그룹화
  const groups = new Map<string, Node[]>();
  
  nodes.forEach(node => {
    if (node.data.path) {
      const folder = node.data.path.split('/').slice(0, -1).join('/');
      const group = groups.get(folder) || [];
      group.push(node);
      groups.set(folder, group);
    }
  });

  // 클러스터 노드 생성
  const clusterNodes: Node[] = [];
  groups.forEach((groupNodes, folder) => {
    if (groupNodes.length > 3) {
      // 3개 이상이면 클러스터로 만듦
      const avgX = groupNodes.reduce((sum, n) => sum + n.position.x, 0) / groupNodes.length;
      const avgY = groupNodes.reduce((sum, n) => sum + n.position.y, 0) / groupNodes.length;
      
      clusterNodes.push({
        id: `cluster-${folder}`,
        type: 'cluster',
        position: { x: avgX, y: avgY },
        data: {
          label: folder.split('/').pop() || 'Cluster',
          count: groupNodes.length,
          nodes: groupNodes,
        }
      });
    } else {
      // 3개 이하면 그대로 표시
      clusterNodes.push(...groupNodes);
    }
  });

  return clusterNodes;
};

// 정보 패널 컴포넌트
const InfoPanel: React.FC<{ nodes: Node[], edges: Edge[], projectName?: string }> = ({ 
  nodes, 
  edges, 
  projectName 
}) => {
  const stats = {
    totalNodes: nodes.length,
    fileNodes: nodes.filter(n => n.type === 'file').length,
    apiNodes: nodes.filter(n => n.type === 'api' || n.type === 'api-node').length,
    functionNodes: nodes.filter(n => n.type === 'function').length,
    translationNodes: nodes.filter(n => n.type?.includes('translation')).length,
    totalEdges: edges.length,
  };

  return (
    <Panel position="top-left" className="workflow-info-panel">
      <h3>{projectName || 'Workflow'}</h3>
      <div className="info-stats">
        <div>총 노드: {stats.totalNodes}</div>
        <div>파일: {stats.fileNodes}</div>
        <div>API: {stats.apiNodes}</div>
        <div>함수: {stats.functionNodes}</div>
        <div>번역: {stats.translationNodes}</div>
        <div>연결: {stats.totalEdges}</div>
      </div>
    </Panel>
  );
};

// 통합 Canvas 컴포넌트
export const UnifiedWorkflowCanvas: React.FC<UnifiedWorkflowCanvasProps> = memo((props) => {
  const {
    mode = 'standard',
    analysisResults,
    projectName,
    showInfoPanel = true,
    enableClustering = mode === 'performance',
    clusterThreshold = 0.3,
    detailThreshold = 0.5,
    ...baseProps
  } = props;

  const [selectedError, setSelectedError] = useState<any>(null);

  // 모드별 설정
  const modeConfig = {
    standard: {
      minZoom: 0.1,
      maxZoom: 2,
      showMiniMap: true,
      showControls: true,
    },
    optimized: {
      minZoom: 0.1,
      maxZoom: 2,
      showMiniMap: true,
      showControls: true,
    },
    performance: {
      minZoom: 0.05,
      maxZoom: 3,
      showMiniMap: true,
      showControls: true,
    },
    detailed: {
      minZoom: 0.1,
      maxZoom: 4,
      showMiniMap: true,
      showControls: true,
    },
    filetree: {
      minZoom: 0.05,
      maxZoom: 2,
      showMiniMap: false,
      showControls: true,
    },
  };

  const config = modeConfig[mode];

  // 줌 기반 렌더링 (performance 모드에서만)
  const { visibleNodes, setViewport } = useZoomBasedRendering(
    baseProps.nodes || [],
    enableClustering,
    clusterThreshold,
    detailThreshold
  );

  // 노드 클릭 핸들러
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.data.errors?.length > 0) {
      setSelectedError({
        nodeId: node.id,
        errors: node.data.errors,
        nodeName: node.data.label || node.data.name,
      });
    }
  }, []);

  // BaseCanvas에 전달할 props
  const canvasProps: BaseCanvasProps = {
    ...baseProps,
    ...config,
    nodes: enableClustering ? visibleNodes : baseProps.nodes,
    className: `unified-canvas mode-${mode}`,
  };

  return (
    <>
      <BaseCanvas {...canvasProps}>
        {showInfoPanel && (
          <InfoPanel 
            nodes={baseProps.nodes || []} 
            edges={baseProps.edges || []} 
            projectName={projectName}
          />
        )}
        
        {mode === 'performance' && (
          <Panel position="top-right">
            <div className="performance-info">
              렌더링: {visibleNodes.length}/{baseProps.nodes?.length || 0} 노드
            </div>
          </Panel>
        )}
      </BaseCanvas>

      {selectedError && (
        <ErrorDetailModal
          isOpen={true}
          detail={{
            fileName: selectedError.nodeName,
            filePath: '',
            errors: selectedError.errors,
            warnings: []
          }}
          onClose={() => setSelectedError(null)}
        />
      )}
    </>
  );
});

UnifiedWorkflowCanvas.displayName = 'UnifiedWorkflowCanvas';

// 기존 컴포넌트와의 호환성을 위한 export
export const WorkflowCanvas: React.FC<BaseCanvasProps> = (props) => (
  <UnifiedWorkflowCanvas {...props} mode="standard" />
);

export const OptimizedWorkflowCanvas: React.FC<BaseCanvasProps> = (props) => (
  <UnifiedWorkflowCanvas {...props} mode="optimized" />
);

export const PerformanceOptimizedCanvas: React.FC<UnifiedWorkflowCanvasProps> = (props) => (
  <UnifiedWorkflowCanvas {...props} mode="performance" />
);

export const DetailedWorkflowCanvas: React.FC<BaseCanvasProps> = (props) => (
  <UnifiedWorkflowCanvas {...props} mode="detailed" />
);

export const FileTreeCanvas: React.FC<UnifiedWorkflowCanvasProps> = (props) => (
  <UnifiedWorkflowCanvas {...props} mode="filetree" />
);

export default UnifiedWorkflowCanvas;