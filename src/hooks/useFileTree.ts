import { useState, useCallback } from 'react';
import { FileNode } from '../api/services/FileSystemService';

interface SearchResult {
  node: FileNode;
  path: string;
  matchType: 'name' | 'content';
  preview?: string;
}

export const useFileTree = () => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());

  const toggleNode = useCallback((nodePath: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodePath)) {
        newSet.delete(nodePath);
      } else {
        newSet.add(nodePath);
      }
      return newSet;
    });
  }, []);

  const selectNode = useCallback((nodePath: string, multiSelect = false) => {
    setSelectedNodes(prev => {
      if (multiSelect) {
        const newSet = new Set(prev);
        if (newSet.has(nodePath)) {
          newSet.delete(nodePath);
        } else {
          newSet.add(nodePath);
        }
        return newSet;
      } else {
        return new Set([nodePath]);
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNodes(new Set());
  }, []);

  const searchTree = useCallback((
    tree: FileNode, 
    query: string,
    options = { caseSensitive: false, searchInContent: false }
  ): SearchResult[] => {
    const results: SearchResult[] = [];
    const searchQuery = options.caseSensitive ? query : query.toLowerCase();

    const search = (node: FileNode, path: string[] = []): void => {
      const currentPath = [...path, node.name];
      const nodeName = options.caseSensitive ? node.name : node.name.toLowerCase();

      // Search in file name
      if (nodeName.includes(searchQuery)) {
        results.push({
          node,
          path: currentPath.join('/'),
          matchType: 'name'
        });
      }

      // Search in children if directory
      if (node.type === 'directory' && node.children) {
        node.children.forEach(child => search(child, currentPath));
      }
    };

    search(tree);
    return results;
  }, []);

  const filterTree = useCallback((
    tree: FileNode,
    predicate: (node: FileNode) => boolean
  ): FileNode | null => {
    // If the current node matches, include it with all children
    if (predicate(tree)) {
      return tree;
    }

    // If it's a directory, check children
    if (tree.type === 'directory' && tree.children) {
      const filteredChildren = tree.children
        .map(child => filterTree(child, predicate))
        .filter(Boolean) as FileNode[];

      // If any children match, include this directory
      if (filteredChildren.length > 0) {
        return {
          ...tree,
          children: filteredChildren
        };
      }
    }

    // No match
    return null;
  }, []);

  const getNodeStats = useCallback((tree: FileNode): {
    totalFiles: number;
    totalDirectories: number;
    totalSize: number;
    fileTypes: Record<string, number>;
  } => {
    const stats = {
      totalFiles: 0,
      totalDirectories: 0,
      totalSize: 0,
      fileTypes: {} as Record<string, number>
    };

    const traverse = (node: FileNode): void => {
      if (node.type === 'file') {
        stats.totalFiles++;
        stats.totalSize += node.size || 0;
        
        if (node.extension) {
          stats.fileTypes[node.extension] = (stats.fileTypes[node.extension] || 0) + 1;
        }
      } else if (node.type === 'directory') {
        stats.totalDirectories++;
        node.children?.forEach(traverse);
      }
    };

    traverse(tree);
    return stats;
  }, []);

  const expandAll = useCallback((tree: FileNode) => {
    const paths = new Set<string>();

    const traverse = (node: FileNode, path = ''): void => {
      const currentPath = path ? `${path}/${node.name}` : node.name;
      
      if (node.type === 'directory') {
        paths.add(currentPath);
        node.children?.forEach(child => traverse(child, currentPath));
      }
    };

    traverse(tree);
    setExpandedNodes(paths);
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  const getSelectedFiles = useCallback((tree: FileNode): FileNode[] => {
    const selectedFiles: FileNode[] = [];

    const traverse = (node: FileNode, path = ''): void => {
      const currentPath = path ? `${path}/${node.name}` : node.name;
      
      if (selectedNodes.has(currentPath) && node.type === 'file') {
        selectedFiles.push(node);
      }
      
      if (node.type === 'directory' && node.children) {
        node.children.forEach(child => traverse(child, currentPath));
      }
    };

    traverse(tree);
    return selectedFiles;
  }, [selectedNodes]);

  return {
    expandedNodes,
    selectedNodes,
    toggleNode,
    selectNode,
    clearSelection,
    searchTree,
    filterTree,
    getNodeStats,
    expandAll,
    collapseAll,
    getSelectedFiles
  };
};