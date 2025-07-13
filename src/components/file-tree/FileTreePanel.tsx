import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { TreeNode } from './TreeNode';
import { SearchBar } from './SearchBar';
import { useFileTree } from '../../hooks/useFileTree';
import { FileSystemService, FileNode } from '../../api/services/FileSystemService';

interface FileTreePanelProps {
  rootPath: string | null;
  onFileSelect: (files: string[]) => void;
}

const FileTreePanelComponent: React.FC<FileTreePanelProps> = ({ rootPath, onFileSelect }) => {
  const [treeData, setTreeData] = useState<FileNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const { filterTree, searchTree } = useFileTree();

  // 🚀 성능 최적화: 파일 트리 로드 함수 메모이제이션
  const loadFileTree = useCallback(async (path: string) => {
    setLoading(true);
    try {
      const fileService = new FileSystemService();
      const tree = await fileService.scanDirectory(path);
      setTreeData(tree);
    } catch (error) {
      console.error('Failed to load file tree:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (rootPath) {
      loadFileTree(rootPath);
    }
  }, [rootPath, loadFileTree]);

  // 🚀 성능 최적화: 노드 클릭 핸들러 메모이제이션
  const handleNodeClick = useCallback((node: any) => {
    if (node.type === 'file') {
      onFileSelect([node.path]);
    }
  }, [onFileSelect]);

  // 🚀 성능 최적화: 검색 핸들러 메모이제이션
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (treeData) {
      const filtered = searchTree(treeData, query);
      // Update UI with search results
    }
  }, [treeData, searchTree]);

  // 🚀 성능 최적화: 새로고침 핸들러 메모이제이션
  const handleRefresh = useCallback(() => {
    if (rootPath) {
      loadFileTree(rootPath);
    }
  }, [rootPath, loadFileTree]);

  if (!rootPath) {
    return (
      <div className="file-tree-panel empty">
        <p>드래그하여 프로젝트 폴더를 선택하세요</p>
      </div>
    );
  }

  return (
    <div className="file-tree-panel">
      <div className="tree-header">
        <h3>📁 프로젝트 구조</h3>
        <button className="btn-icon" onClick={handleRefresh}>
          🔄
        </button>
      </div>

      <SearchBar 
        value={searchQuery}
        onChange={handleSearch}
        placeholder="파일 검색..."
      />

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : (
        <div className="tree-content">
          {treeData && (
            <TreeNode 
              node={treeData}
              onNodeClick={handleNodeClick}
              searchQuery={searchQuery}
            />
          )}
        </div>
      )}
    </div>
  );
};

export const FileTreePanel = memo(FileTreePanelComponent);
export default FileTreePanel;