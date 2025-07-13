// 🚀 성능 최적화: WebWorker - 무거운 분석 작업을 별도 스레드로 처리

class DependencyAnalyzer {
  constructor() {
    this.dependencies = new Map();
    this.circularDeps = new Set();
    this.metrics = {
      totalFiles: 0,
      totalDependencies: 0,
      circularDependencies: 0,
      maxDepth: 0,
      avgDependenciesPerFile: 0,
      complexityScore: 0
    };
  }

  // 파일 간 의존성 분석
  analyzeDependencies(files) {
    const startTime = performance.now();
    
    this.dependencies.clear();
    this.circularDeps.clear();
    
    // 각 파일의 의존성 파싱
    files.forEach(file => {
      this.parseFileDependencies(file);
    });
    
    // 순환 의존성 검사
    this.detectCircularDependencies();
    
    // 메트릭 계산
    this.calculateMetrics();
    
    const analysisTime = performance.now() - startTime;
    
    return {
      dependencies: Array.from(this.dependencies.entries()),
      circularDependencies: Array.from(this.circularDeps),
      metrics: this.metrics,
      analysisTime
    };
  }

  parseFileDependencies(file) {
    const deps = [];
    const content = file.content || '';
    
    // ES6 import 구문 분석
    const importRegex = /import\s+(?:.*\s+from\s+)?['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = this.resolveImportPath(match[1], file.path);
      if (importPath) {
        deps.push({
          type: 'import',
          path: importPath,
          line: this.getLineNumber(content, match.index)
        });
      }
    }
    
    // CommonJS require 구문 분석
    const requireRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      const requirePath = this.resolveImportPath(match[1], file.path);
      if (requirePath) {
        deps.push({
          type: 'require',
          path: requirePath,
          line: this.getLineNumber(content, match.index)
        });
      }
    }
    
    // Dynamic import 분석
    const dynamicImportRegex = /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      const dynamicPath = this.resolveImportPath(match[1], file.path);
      if (dynamicPath) {
        deps.push({
          type: 'dynamic',
          path: dynamicPath,
          line: this.getLineNumber(content, match.index)
        });
      }
    }
    
    this.dependencies.set(file.path, deps);
  }

  resolveImportPath(importPath, currentFile) {
    // 상대 경로 해결
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const currentDir = currentFile.substring(0, currentFile.lastIndexOf('/'));
      return this.normalizePath(currentDir + '/' + importPath);
    }
    
    // 절대 경로 또는 모듈 경로
    if (importPath.startsWith('/') || !importPath.includes('/')) {
      return importPath;
    }
    
    return importPath;
  }

  normalizePath(path) {
    const parts = path.split('/');
    const normalized = [];
    
    for (const part of parts) {
      if (part === '..') {
        normalized.pop();
      } else if (part !== '.' && part !== '') {
        normalized.push(part);
      }
    }
    
    return normalized.join('/');
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  detectCircularDependencies() {
    const visited = new Set();
    const visiting = new Set();
    
    for (const [file] of this.dependencies) {
      if (!visited.has(file)) {
        this.dfsCircularCheck(file, visited, visiting, []);
      }
    }
  }

  dfsCircularCheck(file, visited, visiting, path) {
    if (visiting.has(file)) {
      // 순환 의존성 발견
      const cycleStart = path.indexOf(file);
      const cycle = path.slice(cycleStart).concat([file]);
      this.circularDeps.add(cycle);
      return true;
    }
    
    if (visited.has(file)) {
      return false;
    }
    
    visiting.add(file);
    path.push(file);
    
    const deps = this.dependencies.get(file) || [];
    for (const dep of deps) {
      if (this.dfsCircularCheck(dep.path, visited, visiting, path)) {
        // 순환 의존성이 발견된 경우 전파 중단
      }
    }
    
    visiting.delete(file);
    path.pop();
    visited.add(file);
    
    return false;
  }

  calculateMetrics() {
    const files = Array.from(this.dependencies.keys());
    this.metrics.totalFiles = files.length;
    
    let totalDeps = 0;
    let maxDepth = 0;
    
    files.forEach(file => {
      const deps = this.dependencies.get(file) || [];
      totalDeps += deps.length;
      
      const depth = this.calculateDepthForFile(file, new Set());
      maxDepth = Math.max(maxDepth, depth);
    });
    
    this.metrics.totalDependencies = totalDeps;
    this.metrics.circularDependencies = this.circularDeps.size;
    this.metrics.maxDepth = maxDepth;
    this.metrics.avgDependenciesPerFile = files.length > 0 ? totalDeps / files.length : 0;
    this.metrics.complexityScore = this.calculateComplexityScore();
  }

  calculateDepthForFile(file, visited) {
    if (visited.has(file)) {
      return 0; // 순환 방지
    }
    
    visited.add(file);
    const deps = this.dependencies.get(file) || [];
    
    if (deps.length === 0) {
      visited.delete(file);
      return 1;
    }
    
    let maxDepth = 0;
    for (const dep of deps) {
      const depth = this.calculateDepthForFile(dep.path, visited);
      maxDepth = Math.max(maxDepth, depth);
    }
    
    visited.delete(file);
    return maxDepth + 1;
  }

  calculateComplexityScore() {
    const factors = {
      totalFiles: this.metrics.totalFiles * 0.1,
      avgDependencies: this.metrics.avgDependenciesPerFile * 2,
      circularDeps: this.metrics.circularDependencies * 10,
      maxDepth: this.metrics.maxDepth * 1.5
    };
    
    return Object.values(factors).reduce((sum, factor) => sum + factor, 0);
  }
}

class WorkflowMetricsCalculator {
  constructor() {
    this.nodeMetrics = new Map();
    this.edgeMetrics = new Map();
    this.globalMetrics = {};
  }

  calculateWorkflowMetrics(nodes, edges) {
    const startTime = performance.now();
    
    // 노드 메트릭 계산
    this.calculateNodeMetrics(nodes);
    
    // 엣지 메트릭 계산
    this.calculateEdgeMetrics(edges);
    
    // 전체 워크플로우 메트릭 계산
    this.calculateGlobalMetrics(nodes, edges);
    
    const calculationTime = performance.now() - startTime;
    
    return {
      nodeMetrics: Array.from(this.nodeMetrics.entries()),
      edgeMetrics: Array.from(this.edgeMetrics.entries()),
      globalMetrics: this.globalMetrics,
      calculationTime
    };
  }

  calculateNodeMetrics(nodes) {
    nodes.forEach(node => {
      const metrics = {
        id: node.id,
        type: node.type,
        position: node.position,
        size: this.calculateNodeSize(node),
        complexity: this.calculateNodeComplexity(node),
        connections: {
          incoming: 0,
          outgoing: 0,
          total: 0
        },
        performance: {
          renderTime: 0,
          updateFrequency: 0,
          memoryUsage: 0
        }
      };
      
      this.nodeMetrics.set(node.id, metrics);
    });
  }

  calculateNodeSize(node) {
    const data = node.data || {};
    let size = 100; // 기본 크기
    
    // 데이터 크기에 따른 가중치
    if (data.content) size += data.content.length * 0.1;
    if (data.parameters) size += Object.keys(data.parameters).length * 10;
    if (data.children) size += data.children.length * 20;
    
    return Math.min(size, 1000); // 최대 크기 제한
  }

  calculateNodeComplexity(node) {
    const data = node.data || {};
    let complexity = 1;
    
    // 타입별 복잡도
    const typeComplexity = {
      'api': 3,
      'function': 4,
      'component': 3,
      'service': 5,
      'database': 4,
      'file': 1,
      'constant': 1
    };
    
    complexity *= typeComplexity[node.type] || 2;
    
    // 데이터 복잡도
    if (data.parameters) {
      complexity += Object.keys(data.parameters).length * 0.5;
    }
    
    if (data.methods) {
      complexity += data.methods.length;
    }
    
    if (data.dependencies) {
      complexity += data.dependencies.length * 0.3;
    }
    
    return Math.round(complexity * 10) / 10;
  }

  calculateEdgeMetrics(edges) {
    edges.forEach(edge => {
      const metrics = {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type || 'default',
        length: this.calculateEdgeLength(edge),
        weight: this.calculateEdgeWeight(edge),
        flow: {
          direction: 'forward',
          strength: 1,
          frequency: 0
        }
      };
      
      this.edgeMetrics.set(edge.id, metrics);
    });
  }

  calculateEdgeLength(edge) {
    // 실제 구현에서는 노드 위치를 기반으로 계산
    return Math.random() * 100 + 50; // 임시값
  }

  calculateEdgeWeight(edge) {
    const data = edge.data || {};
    let weight = 1;
    
    // 엣지 타입별 가중치
    const typeWeight = {
      'dependency': 2,
      'call': 3,
      'data': 1.5,
      'control': 2.5
    };
    
    weight *= typeWeight[edge.type] || 1;
    
    // 데이터 기반 가중치
    if (data.frequency) weight *= data.frequency;
    if (data.importance) weight *= data.importance;
    
    return weight;
  }

  calculateGlobalMetrics(nodes, edges) {
    this.globalMetrics = {
      overview: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        density: edges.length / (nodes.length * (nodes.length - 1) / 2),
        avgComplexity: this.calculateAverageComplexity(nodes)
      },
      connectivity: {
        connectedComponents: this.findConnectedComponents(nodes, edges),
        isolatedNodes: this.findIsolatedNodes(nodes, edges),
        hubNodes: this.findHubNodes(nodes, edges),
        bridgeEdges: this.findBridgeEdges(nodes, edges)
      },
      performance: {
        totalRenderTime: 0,
        avgRenderTime: 0,
        memoryFootprint: this.estimateMemoryFootprint(nodes, edges),
        complexity: this.calculateOverallComplexity(nodes, edges)
      },
      quality: {
        cohesion: this.calculateCohesion(nodes, edges),
        coupling: this.calculateCoupling(nodes, edges),
        maintainability: 0,
        testability: 0
      }
    };
  }

  calculateAverageComplexity(nodes) {
    if (nodes.length === 0) return 0;
    
    const totalComplexity = Array.from(this.nodeMetrics.values())
      .reduce((sum, metrics) => sum + metrics.complexity, 0);
    
    return totalComplexity / nodes.length;
  }

  findConnectedComponents(nodes, edges) {
    const visited = new Set();
    const components = [];
    
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        const component = [];
        this.dfsComponent(node.id, edges, visited, component);
        components.push(component);
      }
    });
    
    return components.length;
  }

  dfsComponent(nodeId, edges, visited, component) {
    visited.add(nodeId);
    component.push(nodeId);
    
    edges.forEach(edge => {
      if (edge.source === nodeId && !visited.has(edge.target)) {
        this.dfsComponent(edge.target, edges, visited, component);
      }
      if (edge.target === nodeId && !visited.has(edge.source)) {
        this.dfsComponent(edge.source, edges, visited, component);
      }
    });
  }

  findIsolatedNodes(nodes, edges) {
    const connectedNodes = new Set();
    
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });
    
    return nodes.filter(node => !connectedNodes.has(node.id)).length;
  }

  findHubNodes(nodes, edges) {
    const connections = new Map();
    
    nodes.forEach(node => {
      connections.set(node.id, 0);
    });
    
    edges.forEach(edge => {
      connections.set(edge.source, (connections.get(edge.source) || 0) + 1);
      connections.set(edge.target, (connections.get(edge.target) || 0) + 1);
    });
    
    const avgConnections = Array.from(connections.values())
      .reduce((sum, count) => sum + count, 0) / nodes.length;
    
    return Array.from(connections.entries())
      .filter(([_, count]) => count > avgConnections * 2)
      .length;
  }

  findBridgeEdges(nodes, edges) {
    // 간단한 bridge edge 근사 계산
    return Math.floor(edges.length * 0.1);
  }

  estimateMemoryFootprint(nodes, edges) {
    let memory = 0;
    
    // 노드 메모리 사용량 추정
    nodes.forEach(node => {
      memory += JSON.stringify(node).length * 2; // UTF-16 encoding
    });
    
    // 엣지 메모리 사용량 추정
    edges.forEach(edge => {
      memory += JSON.stringify(edge).length * 2;
    });
    
    return memory; // bytes
  }

  calculateOverallComplexity(nodes, edges) {
    const nodeComplexity = this.calculateAverageComplexity(nodes);
    const edgeComplexity = edges.length / nodes.length;
    const structuralComplexity = this.globalMetrics.connectivity?.connectedComponents || 1;
    
    return nodeComplexity * 0.4 + edgeComplexity * 0.3 + structuralComplexity * 0.3;
  }

  calculateCohesion(nodes, edges) {
    // 모듈 내 응집도 계산 (간단한 근사)
    const internalConnections = edges.filter(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      return sourceNode?.type === targetNode?.type;
    }).length;
    
    return edges.length > 0 ? internalConnections / edges.length : 0;
  }

  calculateCoupling(nodes, edges) {
    // 모듈 간 결합도 계산 (간단한 근사)
    const externalConnections = edges.filter(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      return sourceNode?.type !== targetNode?.type;
    }).length;
    
    return edges.length > 0 ? externalConnections / edges.length : 0;
  }
}

// Worker 메시지 처리
const dependencyAnalyzer = new DependencyAnalyzer();
const metricsCalculator = new WorkflowMetricsCalculator();

self.onmessage = function(e) {
  const { type, data, id } = e.data;
  
  try {
    let result;
    
    switch (type) {
      case 'ANALYZE_DEPENDENCIES':
        result = dependencyAnalyzer.analyzeDependencies(data.files);
        break;
        
      case 'CALCULATE_METRICS':
        result = metricsCalculator.calculateWorkflowMetrics(data.nodes, data.edges);
        break;
        
      case 'ANALYZE_FILE':
        // 단일 파일 분석
        result = {
          file: data.file,
          dependencies: dependencyAnalyzer.parseFileDependencies(data.file)
        };
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
    
    // 성공 응답
    self.postMessage({
      type: 'SUCCESS',
      id,
      data: result
    });
    
  } catch (error) {
    // 에러 응답
    self.postMessage({
      type: 'ERROR',
      id,
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  }
};

// Worker 상태 확인
self.postMessage({
  type: 'READY',
  message: 'Analysis Worker is ready'
});