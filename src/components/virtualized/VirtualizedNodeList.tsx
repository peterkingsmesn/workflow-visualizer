import React, { memo, useMemo, useCallback, useState } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import './VirtualizedNodeList.css';

// 🎯 노드 타입 정의
interface Node {
  id: string;
  name: string;
  type: string;
  icon?: string;
  description?: string;
  path?: string;
  size?: number;
  modified?: Date;
}

interface VirtualizedNodeListProps {
  nodes: Node[];
  onNodeClick?: (node: Node) => void;
  onNodeDoubleClick?: (node: Node) => void;
  selectedNodes?: string[];
  hoveredNode?: string | null;
  height?: number;
  width?: number;
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

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onNodeClick?.(node);
  }, [node, onNodeClick]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onNodeDoubleClick?.(node);
  }, [node, onNodeDoubleClick]);

  // 🎯 파일 크기 포맷팅
  const formatFileSize = useCallback((bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 10) / 10} ${sizes[i]}`;
  }, []);

  // 🎯 수정 시간 포맷팅
  const formatModified = useCallback((date?: Date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '오늘';
    if (days === 1) return '어제';
    if (days < 7) return `${days}일 전`;
    if (days < 30) return `${Math.floor(days / 7)}주 전`;
    return date.toLocaleDateString();
  }, []);

  return (
    <div
      style={style}
      className={`node-item ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      title={node.description || node.path}
    >
      <div className="node-content">
        <div className="node-icon">
          {node.icon || (node.type === 'file' ? '📄' : '📁')}
        </div>
        
        <div className="node-info">
          <div className="node-name">{node.name}</div>
          {node.description && (
            <div className="node-description">{node.description}</div>
          )}
        </div>
        
        <div className="node-metadata">
          {node.size && (
            <div className="node-size">{formatFileSize(node.size)}</div>
          )}
          {node.modified && (
            <div className="node-modified">{formatModified(node.modified)}</div>
          )}
          <div className="node-type">{node.type}</div>
        </div>
      </div>
    </div>
  );
});

NodeItem.displayName = 'NodeItem';

// 🎯 메인 가상화 노드 리스트 컴포넌트
export const VirtualizedNodeList: React.FC<VirtualizedNodeListProps> = ({
  nodes,
  onNodeClick,
  onNodeDoubleClick,
  selectedNodes = [],
  hoveredNode = null,
  height = 400,
  width = '100%',
  itemHeight = 60,
  overscanCount = 5,
  filterQuery = ''
}) => {
  // 🔍 필터링된 노드 목록
  const filteredNodes = useMemo(() => {
    if (!filterQuery.trim()) return nodes;
    
    const query = filterQuery.toLowerCase();
    return nodes.filter(node => 
      node.name.toLowerCase().includes(query) ||
      node.type.toLowerCase().includes(query) ||
      node.description?.toLowerCase().includes(query) ||
      node.path?.toLowerCase().includes(query)
    );
  }, [nodes, filterQuery]);

  // 🚀 메모이제이션으로 성능 최적화
  const itemData = useMemo(() => ({
    nodes: filteredNodes,
    onNodeClick,
    onNodeDoubleClick,
    selectedNodes,
    hoveredNode
  }), [filteredNodes, onNodeClick, onNodeDoubleClick, selectedNodes, hoveredNode]);

  // 📊 통계 정보
  const stats = useMemo(() => {
    const total = filteredNodes.length;
    const files = filteredNodes.filter(n => n.type === 'file').length;
    const folders = filteredNodes.filter(n => n.type === 'folder').length;
    const selected = selectedNodes.length;
    
    return { total, files, folders, selected };
  }, [filteredNodes, selectedNodes]);

  if (!filteredNodes.length) {
    return (
      <div className="empty-node-list">
        <div className="empty-message">
          <div className="empty-icon">🔍</div>
          <p>
            {filterQuery ? 
              `'${filterQuery}'에 대한 검색 결과가 없습니다` : 
              '표시할 노드가 없습니다'
            }
          </p>
          {filterQuery && (
            <button 
              className="clear-filter-btn"
              onClick={() => {/* 필터 클리어 로직 */}}
            >
              필터 지우기
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="virtualized-node-list">
      {/* 📊 상단 통계 바 */}
      <div className="node-stats">
        <div className="stats-item">
          <span className="stats-label">전체:</span>
          <span className="stats-value">{stats.total}</span>
        </div>
        <div className="stats-item">
          <span className="stats-label">파일:</span>
          <span className="stats-value">{stats.files}</span>
        </div>
        <div className="stats-item">
          <span className="stats-label">폴더:</span>
          <span className="stats-value">{stats.folders}</span>
        </div>
        {stats.selected > 0 && (
          <div className="stats-item selected">
            <span className="stats-label">선택:</span>
            <span className="stats-value">{stats.selected}</span>
          </div>
        )}
      </div>

      {/* 🚀 가상화된 리스트 */}
      <List
        height={height}
        width={width}
        itemCount={filteredNodes.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={overscanCount}
        className="virtual-list"
      >
        {NodeItem}
      </List>
    </div>
  );
};

export default VirtualizedNodeList;