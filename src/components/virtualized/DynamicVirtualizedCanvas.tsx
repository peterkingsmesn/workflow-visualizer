import React, { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { VariableSizeList as List, ListChildComponentProps } from 'react-window';
import { Node, Edge } from 'reactflow';
import { useWorkflowState, useSelection } from '../../contexts/WorkflowStateContext';
import './DynamicVirtualizedCanvas.css';

// 🚀 성능 최적화: 동적 크기 지원 가상화 캔버스

interface DynamicVirtualizedCanvasProps {
  height: number;
  width: number;
  onNodeClick?: (node: Node) => void;
  onNodeDoubleClick?: (node: Node) => void;
  onNodeSelect?: (nodeIds: string[]) => void;
  className?: string;
  minItemHeight?: number;
  maxItemHeight?: number;
  overscanCount?: number;
  groupBy?: 'type' | 'category' | 'file' | 'none';
  sortBy?: 'name' | 'type' | 'modified' | 'size';
  filterQuery?: string;
  showMiniMap?: boolean;
  enableMultiSelect?: boolean;
}

interface GroupedNode {
  type: 'group' | 'node';
  id: string;
  title?: string;
  node?: Node;
  children?: Node[];
  isExpanded?: boolean;
  level: number;
}

interface ItemData {
  items: GroupedNode[];
  onNodeClick?: (node: Node) => void;
  onNodeDoubleClick?: (node: Node) => void;
  onGroupToggle?: (groupId: string) => void;
  selectedNodes: string[];
  hoveredNode: string | null;
  enableMultiSelect: boolean;
}

interface DynamicItemProps extends ListChildComponentProps {
  data: ItemData;
}

// 🚀 성능 최적화: 동적 크기 아이템 컴포넌트
const DynamicItem = memo<DynamicItemProps>(({ index, style, data }) => {
  const { 
    items, 
    onNodeClick, 
    onNodeDoubleClick, 
    onGroupToggle, 
    selectedNodes, 
    hoveredNode, 
    enableMultiSelect 
  } = data;
  
  const item = items[index];
  
  if (!item) return null;

  if (item.type === 'group') {
    return (
      <div
        style={style}
        className={`dynamic-group-item level-${item.level}`}
        onClick={() => onGroupToggle?.(item.id)}
        role="button"
        tabIndex={0}
        aria-expanded={item.isExpanded}
        aria-label={`${item.title} 그룹 ${item.isExpanded ? '접기' : '펼치기'}`}
      >
        <div className="group-content">
          <div className="group-icon">
            {item.isExpanded ? '📂' : '📁'}
          </div>
          <div className="group-title">{item.title}</div>
          <div className="group-count">
            {item.children?.length || 0}개
          </div>
          <div className="group-toggle">
            {item.isExpanded ? '▼' : '▶'}
          </div>
        </div>
      </div>
    );
  }

  // 노드 아이템 렌더링
  const node = item.node!;
  const isSelected = selectedNodes.includes(node.id);
  const isHovered = hoveredNode === node.id;

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (enableMultiSelect && e.ctrlKey) {
      e.preventDefault();
      // 멀티 선택 로직은 부모 컴포넌트에서 처리
      onNodeClick?.(node);
    } else {
      onNodeClick?.(node);
    }
  }, [node, onNodeClick, enableMultiSelect]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onNodeDoubleClick?.(node);
  }, [node, onNodeDoubleClick]);

  // 🚀 성능 최적화: 노드 정보 메모이제이션
  const nodeInfo = useMemo(() => {
    const data = node.data || {};
    return {
      title: data.name || data.label || node.id,
      subtitle: data.path || data.file || '',
      description: data.description || '',
      method: data.method || '',
      category: data.category || '',
      type: node.type || 'default',
      status: data.matched ? 'matched' : 'unmatched',
      size: data.size || 0,
      modified: data.lastModified || data.modified || 0,
      complexity: data.complexity || 0
    };
  }, [node]);

  // 🚀 성능 최적화: 노드 메타데이터 메모이제이션
  const nodeMetadata = useMemo(() => {
    const metadata = [];
    
    if (nodeInfo.method) {
      metadata.push({ label: 'Method', value: nodeInfo.method, type: 'method' });
    }
    
    if (nodeInfo.category) {
      metadata.push({ label: 'Category', value: nodeInfo.category, type: 'category' });
    }
    
    if (nodeInfo.size > 0) {
      metadata.push({ 
        label: 'Size', 
        value: formatFileSize(nodeInfo.size), 
        type: 'size' 
      });
    }
    
    if (nodeInfo.complexity > 0) {
      metadata.push({ 
        label: 'Complexity', 
        value: nodeInfo.complexity.toString(), 
        type: 'complexity' 
      });
    }
    
    if (nodeInfo.modified > 0) {
      metadata.push({ 
        label: 'Modified', 
        value: formatDate(nodeInfo.modified), 
        type: 'date' 
      });
    }
    
    return metadata;
  }, [nodeInfo]);

  // 🚀 성능 최적화: 아이템 높이 계산
  const itemHeight = useMemo(() => {
    let height = 60; // 기본 높이
    
    if (nodeInfo.description) height += 20;
    if (nodeMetadata.length > 0) height += Math.ceil(nodeMetadata.length / 3) * 24;
    
    return Math.min(Math.max(height, 60), 200);
  }, [nodeInfo.description, nodeMetadata.length]);

  return (
    <div
      style={{ ...style, height: itemHeight }}
      className={`dynamic-node-item level-${item.level} ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${nodeInfo.status}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      aria-label={`${nodeInfo.title} 노드`}
    >
      <div className="node-main">
        <div className="node-icon">
          {getNodeIcon(nodeInfo.type, nodeInfo.method)}
        </div>
        
        <div className="node-content">
          <div className="node-header">
            <div className="node-title">{nodeInfo.title}</div>
            <div className="node-status">
              <div className={`status-dot ${nodeInfo.status}`} />
            </div>
          </div>
          
          {nodeInfo.subtitle && (
            <div className="node-subtitle">{nodeInfo.subtitle}</div>
          )}
          
          {nodeInfo.description && (
            <div className="node-description">{nodeInfo.description}</div>
          )}
          
          {nodeMetadata.length > 0 && (
            <div className="node-metadata">
              {nodeMetadata.map((meta, idx) => (
                <div key={idx} className={`metadata-item ${meta.type}`}>
                  <span className="metadata-label">{meta.label}:</span>
                  <span className="metadata-value">{meta.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

DynamicItem.displayName = 'DynamicItem';

// 🚀 성능 최적화: 동적 가상화 캔버스 컴포넌트
export const DynamicVirtualizedCanvas: React.FC<DynamicVirtualizedCanvasProps> = memo(({
  height,
  width,
  onNodeClick,
  onNodeDoubleClick,
  onNodeSelect,
  className = '',
  minItemHeight = 60,
  maxItemHeight = 200,
  overscanCount = 5,
  groupBy = 'type',
  sortBy = 'name',
  filterQuery = '',
  showMiniMap = false,
  enableMultiSelect = false
}) => {
  const { nodes } = useWorkflowState();
  const { selection } = useSelection();
  const listRef = useRef<List>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // 🚀 성능 최적화: 노드 필터링 및 정렬
  const filteredAndSortedNodes = useMemo(() => {
    let filteredNodes = nodes;
    
    // 필터링
    if (filterQuery) {
      const query = filterQuery.toLowerCase();
      filteredNodes = nodes.filter(node => {
        const data: any = node.data || {};
        const searchFields = [
          data.name, data.label, data.path, data.file,
          data.method, data.category, data.description,
          node.id, node.type
        ];
        
        return searchFields.some(field => 
          field && String(field).toLowerCase().includes(query)
        );
      });
    }
    
    // 정렬
    return filteredNodes.sort((a, b) => {
      const aData: any = a.data || {};
      const bData: any = b.data || {};
      
      switch (sortBy) {
        case 'name':
          return (aData.name || a.id).localeCompare(bData.name || b.id);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'modified':
          return (bData.lastModified || 0) - (aData.lastModified || 0);
        case 'size':
          return (bData.size || 0) - (aData.size || 0);
        default:
          return 0;
      }
    });
  }, [nodes, filterQuery, sortBy]);

  // 🚀 성능 최적화: 노드 그룹화
  const groupedItems = useMemo(() => {
    if (groupBy === 'none') {
      return filteredAndSortedNodes.map(node => ({
        type: 'node' as const,
        id: node.id,
        node,
        level: 0
      }));
    }

    const groups: Record<string, Node[]> = {};
    
    filteredAndSortedNodes.forEach(node => {
      const data: any = node.data || {};
      let groupKey = '';
      
      switch (groupBy) {
        case 'type':
          groupKey = node.type;
          break;
        case 'category':
          groupKey = data.category || 'uncategorized';
          break;
        case 'file':
          groupKey = data.file || 'unknown';
          break;
        default:
          groupKey = 'default';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(node);
    });

    const items: GroupedNode[] = [];
    
    Object.entries(groups).forEach(([groupKey, groupNodes]) => {
      const groupId = `group-${groupKey}`;
      const isExpanded = expandedGroups.has(groupId);
      
      items.push({
        type: 'group',
        id: groupId,
        title: groupKey,
        children: groupNodes,
        isExpanded,
        level: 0
      });
      
      if (isExpanded) {
        groupNodes.forEach(node => {
          items.push({
            type: 'node',
            id: node.id,
            node,
            level: 1
          });
        });
      }
    });
    
    return items;
  }, [filteredAndSortedNodes, groupBy, expandedGroups]);

  // 🚀 성능 최적화: 그룹 토글 핸들러
  const handleGroupToggle = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  // 🚀 성능 최적화: 아이템 크기 계산
  const getItemSize = useCallback((index: number) => {
    const item = groupedItems[index];
    if (!item) return minItemHeight;
    
    if (item.type === 'group') {
      return 48; // 그룹 헤더 높이
    }
    
    const node = item.node!;
    const data = node.data || {};
    
    let height = 60; // 기본 높이
    
    if (data.description) height += 20;
    
    // 메타데이터 개수에 따른 높이 증가
    let metadataCount = 0;
    if (data.method) metadataCount++;
    if (data.category) metadataCount++;
    if (data.size) metadataCount++;
    if (data.complexity) metadataCount++;
    if (data.lastModified) metadataCount++;
    
    if (metadataCount > 0) {
      height += Math.ceil(metadataCount / 3) * 24;
    }
    
    return Math.min(Math.max(height, minItemHeight), maxItemHeight);
  }, [groupedItems, minItemHeight, maxItemHeight]);

  // 🚀 성능 최적화: 아이템 데이터 메모이제이션
  const itemData = useMemo<ItemData>(() => ({
    items: groupedItems,
    onNodeClick,
    onNodeDoubleClick,
    onGroupToggle: handleGroupToggle,
    selectedNodes: selection.selectedNodes,
    hoveredNode: selection.hoveredNode,
    enableMultiSelect
  }), [
    groupedItems,
    onNodeClick,
    onNodeDoubleClick,
    handleGroupToggle,
    selection.selectedNodes,
    selection.hoveredNode,
    enableMultiSelect
  ]);

  // 🚀 성능 최적화: 크기 변경 시 리스트 업데이트
  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [groupedItems, groupBy]);

  const itemCount = groupedItems.length;

  if (itemCount === 0) {
    return (
      <div className={`dynamic-virtualized-canvas empty ${className}`}>
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>노드를 찾을 수 없습니다</h3>
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
    <div className={`dynamic-virtualized-canvas ${className}`}>
      <div className="canvas-header">
        <div className="canvas-info">
          <span className="item-count">{itemCount}개 항목</span>
          <span className="group-info">
            그룹: {groupBy}, 정렬: {sortBy}
          </span>
        </div>
        
        {showMiniMap && (
          <div className="mini-map">
            <div className="mini-map-content">
              {/* 미니맵 구현 */}
            </div>
          </div>
        )}
      </div>
      
      <List
        ref={listRef}
        height={height - 40}
        width={width}
        itemCount={itemCount}
        itemSize={getItemSize}
        itemData={itemData}
        overscanCount={overscanCount}
        className="dynamic-virtualized-list"
      >
        {DynamicItem}
      </List>
    </div>
  );
});

DynamicVirtualizedCanvas.displayName = 'DynamicVirtualizedCanvas';

// 🚀 성능 최적화: 유틸리티 함수들
function getNodeIcon(type: string, method?: string): string {
  const iconMap: Record<string, string> = {
    'api': method === 'GET' ? '🔍' : method === 'POST' ? '📤' : method === 'PUT' ? '✏️' : method === 'DELETE' ? '🗑️' : '🌐',
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
  
  return iconMap[type] || iconMap['default'];
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export default DynamicVirtualizedCanvas;