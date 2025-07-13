import React, { memo, useMemo, useCallback } from 'react';
import { VariableSizeList as List, ListChildComponentProps } from 'react-window';
import './DynamicVirtualizedCanvas.css';

// 🎯 성능 최적화: 아이템 데이터 타입
interface ItemData {
  items: any[];
  onNodeClick?: (node: any) => void;
  onNodeDoubleClick?: (node: any) => void;
  onGroupToggle?: (groupId: string) => void;
  selectedNodes: string[];
  hoveredNode: string | null;
  enableMultiSelect: boolean;
}

interface DynamicItemProps {
  index: number;
  style: React.CSSProperties;
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

  const isSelected = selectedNodes.includes(item.id);
  const isHovered = hoveredNode === item.id;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (enableMultiSelect && e.ctrlKey) {
      // Multi-select logic
    }
    onNodeClick?.(item);
  }, [item, onNodeClick, enableMultiSelect]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onNodeDoubleClick?.(item);
  }, [item, onNodeDoubleClick]);

  return (
    <div
      style={style}
      className={`virtualized-item ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <div className="item-content">
        <div className="item-icon">{item.icon || '📄'}</div>
        <div className="item-label">{item.name || item.label}</div>
        {item.type && <div className="item-type">{item.type}</div>}
      </div>
    </div>
  );
});

DynamicItem.displayName = 'DynamicItem';

// 🎯 메인 가상화 캔버스 컴포넌트
interface DynamicVirtualizedCanvasProps {
  items: any[];
  height?: number;
  width?: number;
  itemSize?: (index: number) => number;
  onNodeClick?: (node: any) => void;
  onNodeDoubleClick?: (node: any) => void;
  onGroupToggle?: (groupId: string) => void;
  selectedNodes?: string[];
  hoveredNode?: string | null;
  enableMultiSelect?: boolean;
  overscanCount?: number;
}

export const DynamicVirtualizedCanvas: React.FC<DynamicVirtualizedCanvasProps> = ({
  items,
  height = 600,
  width = '100%',
  itemSize = () => 50,
  onNodeClick,
  onNodeDoubleClick,
  onGroupToggle,
  selectedNodes = [],
  hoveredNode = null,
  enableMultiSelect = false,
  overscanCount = 5
}) => {
  // 🚀 메모이제이션으로 성능 최적화
  const itemData = useMemo(() => ({
    items,
    onNodeClick,
    onNodeDoubleClick,
    onGroupToggle,
    selectedNodes,
    hoveredNode,
    enableMultiSelect
  }), [items, onNodeClick, onNodeDoubleClick, onGroupToggle, selectedNodes, hoveredNode, enableMultiSelect]);

  // 🎯 아이템 크기 계산 최적화
  const getItemSize = useCallback((index: number) => {
    const item = items[index];
    if (!item) return 50;
    
    // 동적 크기 계산
    if (item.type === 'group') return 60;
    if (item.type === 'file') return 45;
    if (item.description) return 70;
    
    return itemSize(index);
  }, [items, itemSize]);

  if (!items.length) {
    return (
      <div className="empty-canvas">
        <div className="empty-message">
          <div className="empty-icon">📁</div>
          <p>표시할 항목이 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dynamic-virtualized-canvas">
      <List
        height={height}
        width={width}
        itemCount={items.length}
        itemSize={getItemSize}
        itemData={itemData}
        overscanCount={overscanCount}
        className="virtualized-list"
      >
        {DynamicItem}
      </List>
    </div>
  );
};

export default DynamicVirtualizedCanvas;