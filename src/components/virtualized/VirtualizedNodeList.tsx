import React, { memo, useMemo, useCallback, forwardRef } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { Node } from 'reactflow';
import { useWorkflowState, useSelection } from '../../contexts/WorkflowStateContext';
import './VirtualizedNodeList.css';

// 🚀 성능 최적화: 가상화된 노드 리스트로 대용량 데이터 처리

interface VirtualizedNodeListProps {
  height: number;
  width: number;
  onNodeClick?: (node: Node) => void;
  onNodeDoubleClick?: (node: Node) => void;
  className?: string;
  itemHeight?: number;
  overscanCount?: number;
  filterQuery?: string;
}

interface NodeItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    nodes: Node[];
    onNodeClick?: (node: Node) => void;
    onNodeDoubleClick?: (node: Node) => void;
    selectedNodes: string[];
    hoveredNode: string | null;
  };
}

// 🚀 성능 최적화: 개별 노드 아이템 컴포넌트 메모이제이션
const NodeItem = memo<NodeItemProps>(({ index, style, data }) => {
  const { nodes, onNodeClick, onNodeDoubleClick, selectedNodes, hoveredNode } = data;
  const node = nodes[index];
  
  if (!node) return null;

  const isSelected = selectedNodes.includes(node.id);
  const isHovered = hoveredNode === node.id;

  // 🚀 성능 최적화: 클릭 핸들러 메모이제이션
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onNodeClick?.(node);
  }, [node, onNodeClick]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onNodeDoubleClick?.(node);
  }, [node, onNodeDoubleClick]);

  // 🚀 성능 최적화: 노드 타입별 아이콘 메모이제이션
  const nodeIcon = useMemo(() => {
    const iconMap: Record<string, string> = {
      'api': '🌐',
      'file': '📄',
      'function': '⚙️',
      'translation': '🌍',
      'graphql': '🔗',
      'websocket': '🔌',
      'database': '🗄️',
      'service': '🏢',
      'component': '🧩',
      'hook': '🪝',
      'utility': '🔧',
      'constant': '📋',
      'type': '📘',
      'interface': '📝',
      'enum': '🎯',
      'class': '🏗️',
      'test': '🧪',
      'config': '⚙️',
      'default': '📦'
    };
    return iconMap[node.type] || iconMap['default'];
  }, [node.type]);

  // 🚀 성능 최적화: 노드 데이터 메모이제이션
  const nodeData = useMemo(() => {
    const data = node.data;
    return {
      title: data?.name || data?.label || node.id,
      subtitle: data?.path || data?.file || '',
      method: data?.method || '',
      category: data?.category || '',
      status: data?.matched ? 'matched' : 'unmatched'
    };
  }, [node.data, node.id]);

  // 🚀 성능 최적화: CSS 클래스 메모이제이션
  const className = useMemo(() => {
    const classes = ['virtualized-node-item'];
    if (isSelected) classes.push('selected');
    if (isHovered) classes.push('hovered');
    if (nodeData.status === 'matched') classes.push('matched');
    if (nodeData.method) classes.push(`method-${nodeData.method.toLowerCase()}`);
    return classes.join(' ');
  }, [isSelected, isHovered, nodeData.status, nodeData.method]);

  return (
    <div
      style={style}
      className={className}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      aria-label={`${nodeData.title} ${nodeData.subtitle}`}
    >
      <div className="node-icon" aria-hidden="true">
        {nodeIcon}
      </div>
      
      <div className="node-content">
        <div className="node-title">
          {nodeData.title}
          {nodeData.method && (
            <span className="method-badge">
              {nodeData.method}
            </span>
          )}
        </div>
        
        {nodeData.subtitle && (
          <div className="node-subtitle">
            {nodeData.subtitle}
          </div>
        )}
        
        {nodeData.category && (
          <div className="node-category">
            {nodeData.category}
          </div>
        )}
      </div>
      
      <div className="node-actions">
        <div className={`status-indicator ${nodeData.status}`} />
      </div>
    </div>
  );
});

NodeItem.displayName = 'NodeItem';

// 🚀 성능 최적화: 가상화된 노드 리스트 컴포넌트
export const VirtualizedNodeList: React.FC<VirtualizedNodeListProps> = memo(({
  height,
  width,
  onNodeClick,
  onNodeDoubleClick,
  className = '',
  itemHeight = 80,
  overscanCount = 5,
  filterQuery = ''
}) => {
  const { nodes } = useWorkflowState();
  const { selection } = useSelection();

  // 🚀 성능 최적화: 필터링된 노드 메모이제이션
  const filteredNodes = useMemo(() => {
    if (!filterQuery) return nodes;
    
    const query = filterQuery.toLowerCase();
    return nodes.filter(node => {
      const data: any = node.data;
      const searchFields = [
        data?.name,
        data?.label,
        data?.path,
        data?.file,
        data?.method,
        data?.category,
        node.id,
        node.type
      ];
      
      return searchFields.some(field => 
        field && String(field).toLowerCase().includes(query)
      );
    });
  }, [nodes, filterQuery]);

  // 🚀 성능 최적화: 리스트 아이템 데이터 메모이제이션
  const itemData = useMemo(() => ({
    nodes: filteredNodes,
    onNodeClick,
    onNodeDoubleClick,
    selectedNodes: selection.selectedNodes,
    hoveredNode: selection.hoveredNode
  }), [
    filteredNodes,
    onNodeClick,
    onNodeDoubleClick,
    selection.selectedNodes,
    selection.hoveredNode
  ]);

  // 🚀 성능 최적화: 노드 카운트 메모이제이션
  const nodeCount = useMemo(() => filteredNodes.length, [filteredNodes.length]);

  // 🚀 성능 최적화: 빈 상태 컴포넌트 메모이제이션
  const EmptyState = useMemo(() => (
    <div className="virtualized-empty-state">
      <div className="empty-icon">📭</div>
      <h3>노드가 없습니다</h3>
      <p>
        {filterQuery 
          ? `"${filterQuery}"와 일치하는 노드가 없습니다`
          : '워크플로우에 노드를 추가하세요'
        }
      </p>
    </div>
  ), [filterQuery]);

  if (nodeCount === 0) {
    return (
      <div className={`virtualized-node-list empty ${className}`}>
        {EmptyState}
      </div>
    );
  }

  return (
    <div className={`virtualized-node-list ${className}`}>
      <div className="list-header">
        <div className="list-info">
          <span className="node-count">{nodeCount}개 노드</span>
          {filterQuery && (
            <span className="filter-info">
              "{filterQuery}" 필터링됨
            </span>
          )}
        </div>
      </div>
      
      <List
        height={height - 40} // 헤더 높이 제외
        width={width}
        itemCount={nodeCount}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={overscanCount}
        className="virtualized-list"
      >
        {NodeItem}
      </List>
    </div>
  );
});

VirtualizedNodeList.displayName = 'VirtualizedNodeList';

// 🚀 성능 최적화: 무한 스크롤 지원 가상화 리스트
interface InfiniteVirtualizedNodeListProps extends VirtualizedNodeListProps {
  hasNextPage: boolean;
  isNextPageLoading: boolean;
  loadNextPage: () => Promise<void>;
}

export const InfiniteVirtualizedNodeList: React.FC<InfiniteVirtualizedNodeListProps> = memo(({
  height,
  width,
  onNodeClick,
  onNodeDoubleClick,
  className = '',
  itemHeight = 80,
  overscanCount = 5,
  filterQuery = '',
  hasNextPage,
  isNextPageLoading,
  loadNextPage
}) => {
  const { nodes } = useWorkflowState();
  const { selection } = useSelection();

  // 🚀 성능 최적화: 필터링된 노드 메모이제이션
  const filteredNodes = useMemo(() => {
    if (!filterQuery) return nodes;
    
    const query = filterQuery.toLowerCase();
    return nodes.filter(node => {
      const data: any = node.data;
      const searchFields = [
        data?.name,
        data?.label,
        data?.path,
        data?.file,
        data?.method,
        data?.category,
        node.id,
        node.type
      ];
      
      return searchFields.some(field => 
        field && String(field).toLowerCase().includes(query)
      );
    });
  }, [nodes, filterQuery]);

  // 🚀 성능 최적화: 아이템 로딩 상태 확인
  const isItemLoaded = useCallback((index: number) => {
    return !!filteredNodes[index];
  }, [filteredNodes]);

  // 🚀 성능 최적화: 리스트 아이템 데이터 메모이제이션
  const itemData = useMemo(() => ({
    nodes: filteredNodes,
    onNodeClick,
    onNodeDoubleClick,
    selectedNodes: selection.selectedNodes,
    hoveredNode: selection.hoveredNode
  }), [
    filteredNodes,
    onNodeClick,
    onNodeDoubleClick,
    selection.selectedNodes,
    selection.hoveredNode
  ]);

  const nodeCount = filteredNodes.length;
  const totalItemCount = hasNextPage ? nodeCount + 1 : nodeCount;

  if (nodeCount === 0) {
    return (
      <div className={`virtualized-node-list empty ${className}`}>
        <div className="virtualized-empty-state">
          <div className="empty-icon">📭</div>
          <h3>노드가 없습니다</h3>
          <p>
            {filterQuery 
              ? `"${filterQuery}"와 일치하는 노드가 없습니다`
              : '워크플로우에 노드를 추가하세요'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`virtualized-node-list infinite ${className}`}>
      <div className="list-header">
        <div className="list-info">
          <span className="node-count">{nodeCount}개 노드</span>
          {filterQuery && (
            <span className="filter-info">
              "{filterQuery}" 필터링됨
            </span>
          )}
          {isNextPageLoading && (
            <span className="loading-info">로딩 중...</span>
          )}
        </div>
      </div>
      
      <List
        height={height - 40}
        width={width}
        itemCount={totalItemCount}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={overscanCount}
        className="virtualized-list infinite"
        onItemsRendered={({ visibleStartIndex, visibleStopIndex }) => {
          // 🚀 성능 최적화: 스크롤 임계점에서 다음 페이지 로드
          if (
            hasNextPage &&
            !isNextPageLoading &&
            visibleStopIndex >= nodeCount - 5
          ) {
            loadNextPage();
          }
        }}
      >
        {NodeItem}
      </List>
    </div>
  );
});

InfiniteVirtualizedNodeList.displayName = 'InfiniteVirtualizedNodeList';

export default VirtualizedNodeList;