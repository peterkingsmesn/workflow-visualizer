import React, { useState, memo, useCallback, useMemo } from 'react';

interface TreeNodeProps {
  node: any;
  depth?: number;
  onNodeClick: (node: any) => void;
  searchQuery?: string;
}

const getNodeIcon = (node: any) => {
  if (node.type === 'directory') {
    const folderIcons: Record<string, string> = {
      src: '📦',
      components: '🧩',
      api: '🌐',
      utils: '🔧',
      assets: '🎨',
      tests: '🧪',
      node_modules: '📚',
    };
    return folderIcons[node.name] || '📁';
  }
  
  const fileIcons: Record<string, string> = {
    '.js': '📜',
    '.jsx': '⚛️',
    '.ts': '📘',
    '.tsx': '⚛️',
    '.css': '🎨',
    '.scss': '🎨',
    '.json': '📋',
    '.md': '📝',
    '.png': '🖼️',
    '.jpg': '🖼️',
    '.svg': '🎯',
  };
  
  return fileIcons[node.extension] || '📄';
};

export const TreeNode: React.FC<TreeNodeProps> = memo(({ 
  node, 
  depth = 0, 
  onNodeClick,
  searchQuery 
}) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  
  // 🚀 성능 최적화: 스타일 계산 메모이제이션
  const indent = useMemo(() => depth * 20, [depth]);
  const icon = useMemo(() => getNodeIcon(node), [node]);
  
  // 🚀 성능 최적화: 이벤트 핸들러 메모이제이션
  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  }, [isExpanded]);
  
  const handleClick = useCallback(() => {
    onNodeClick(node);
  }, [onNodeClick, node]);
  
  // 🚀 성능 최적화: 검색 매칭 계산 메모이제이션
  const isMatched = useMemo(() => 
    searchQuery && 
    node.name.toLowerCase().includes(searchQuery.toLowerCase()),
    [searchQuery, node.name]
  );

  // 🚀 성능 최적화: 스타일 객체 메모이제이션
  const nodeStyle = useMemo(() => ({ 
    paddingLeft: `${indent}px` 
  }), [indent]);
  
  return (
    <div className="tree-node-wrapper">
      <div 
        className={`tree-node ${isMatched ? 'matched' : ''}`}
        style={nodeStyle}
        onClick={handleClick}
      >
        {node.type === 'directory' && (
          <button 
            className="expand-btn"
            onClick={handleToggle}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}
        
        <span className="node-icon">{icon}</span>
        <span className="node-name">{node.name}</span>
        
        {node.type === 'file' && node.size && (
          <span className="file-size">
            {formatFileSize(node.size)}
          </span>
        )}
        
        {node.type === 'directory' && node.children && (
          <span className="child-count">
            {node.children.length}
          </span>
        )}
      </div>
      
      {node.type === 'directory' && isExpanded && node.children && (
        <div className="tree-children">
          {node.children.map((child: any, index: number) => (
            <TreeNode
              key={`${child.path}-${index}`}
              node={child}
              depth={depth + 1}
              onNodeClick={onNodeClick}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
});

TreeNode.displayName = 'TreeNode';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}