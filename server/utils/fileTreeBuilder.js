/**
 * 완전한 파일 트리 구축
 * @param {Array} files - 파일 목록
 * @returns {Object} 파일 트리
 */
function buildCompleteFileTree(files) {
  const root = {
    name: 'root',
    type: 'folder',
    path: '',
    children: {},
    files: []
  };
  
  files.forEach(file => {
    const pathParts = (file.path || file.name).split('/').filter(Boolean);
    let current = root;
    let currentPath = '';
    
    // 모든 중간 폴더 생성
    for (let i = 0; i < pathParts.length - 1; i++) {
      const folderName = pathParts[i];
      currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;
      
      if (!current.children[folderName]) {
        current.children[folderName] = {
          name: folderName,
          type: 'folder',
          path: currentPath,
          children: {},
          files: []
        };
      }
      current = current.children[folderName];
    }
    
    // 파일 추가
    if (pathParts.length > 0) {
      current.files.push({
        name: pathParts[pathParts.length - 1],
        path: file.path || file.name,
        size: file.size,
        type: file.type,
        content: file.content
      });
    }
  });
  
  return root;
}

/**
 * 트리 깊이 계산
 * @param {Object} node - 트리 노드
 * @param {number} depth - 현재 깊이
 * @returns {number} 최대 깊이
 */
function calculateTreeDepth(node, depth = 0) {
  if (!node.children || Object.keys(node.children).length === 0) {
    return depth;
  }
  
  let maxDepth = depth;
  for (const child of Object.values(node.children)) {
    maxDepth = Math.max(maxDepth, calculateTreeDepth(child, depth + 1));
  }
  return maxDepth;
}

/**
 * 전체 폴더 수 계산
 * @param {Object} node - 트리 노드
 * @returns {number} 폴더 수
 */
function countFolders(node) {
  let count = node.type === 'folder' ? 1 : 0;
  
  if (node.children) {
    for (const child of Object.values(node.children)) {
      count += countFolders(child);
    }
  }
  
  return count;
}

/**
 * 순환 의존성 찾기
 * @param {Array} connections - 연결 목록
 * @returns {Array} 순환 의존성 목록
 */
function findCircularDependencies(connections) {
  const graph = {};
  const visited = new Set();
  const stack = new Set();
  const cycles = [];
  
  // 그래프 구축
  connections.forEach(conn => {
    if (!graph[conn.source]) graph[conn.source] = [];
    graph[conn.source].push(conn.target);
  });
  
  function dfs(node, path = []) {
    if (stack.has(node)) {
      const cycleStart = path.indexOf(node);
      cycles.push(path.slice(cycleStart));
      return;
    }
    
    if (visited.has(node)) return;
    
    visited.add(node);
    stack.add(node);
    
    if (graph[node]) {
      graph[node].forEach(neighbor => {
        dfs(neighbor, [...path, node]);
      });
    }
    
    stack.delete(node);
  }
  
  Object.keys(graph).forEach(node => {
    if (!visited.has(node)) {
      dfs(node);
    }
  });
  
  return cycles;
}

/**
 * 사용되지 않는 export 찾기
 * @param {Array} files - 파일 목록
 * @param {Array} connections - 연결 목록
 * @returns {Array} 사용되지 않는 export 목록
 */
function findUnusedExports(files, connections) {
  const allExports = new Map();
  const usedExports = new Set();
  
  // 모든 export 수집 (간단 버전)
  files.forEach(file => {
    if (file.content && file.content.includes('export')) {
      allExports.set(file.path, true);
    }
  });
  
  // 사용된 export 표시
  connections.forEach(conn => {
    usedExports.add(conn.target);
  });
  
  const unused = [];
  allExports.forEach((_, path) => {
    if (!usedExports.has(path)) {
      unused.push(path);
    }
  });
  
  return unused;
}

/**
 * 중복 import 찾기
 * @param {Array} connections - 연결 목록
 * @returns {Array} 중복 import 목록
 */
function findDuplicateImports(connections) {
  const importMap = new Map();
  const duplicates = [];
  
  connections.forEach(conn => {
    const key = `${conn.source}-${conn.target}`;
    if (importMap.has(key)) {
      duplicates.push({
        source: conn.source,
        target: conn.target,
        count: importMap.get(key) + 1
      });
    }
    importMap.set(key, (importMap.get(key) || 0) + 1);
  });
  
  return duplicates;
}

module.exports = {
  buildCompleteFileTree,
  calculateTreeDepth,
  countFolders,
  findCircularDependencies,
  findUnusedExports,
  findDuplicateImports
};