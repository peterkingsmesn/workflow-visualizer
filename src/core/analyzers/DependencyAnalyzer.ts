import { BaseAnalyzer, AnalysisResult } from './BaseAnalyzer';
import { JavaScriptParser } from '../parsers/JavaScriptParser';
import { TypeScriptParser } from '../parsers/TypeScriptParser';
import { CircularDepValidator } from '../validators/CircularDepValidator';
import { pathResolver } from '../../utils/pathResolver';

export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  edges: DependencyEdge[];
  cycles: string[][];
}

export interface DependencyNode {
  id: string;
  path: string;
  imports: string[];
  exports: string[];
  type: 'file' | 'module';
  dependencies: string[];
  dependents: string[];
  size?: number;
  complexity?: number;
}

export interface DependencyEdge {
  source: string;
  target: string;
  type: 'import' | 'require' | 'dynamic';
  line?: number;
  resolved?: boolean;
}

export interface DependencyAnalysis extends AnalysisResult {
  graph: DependencyGraph;
  cycles: string[][];
  unresolvedDependencies: string[];
  statistics: {
    totalFiles: number;
    totalDependencies: number;
    cyclicDependencies: number;
    maxDepth: number;
    orphanFiles: number;
  };
}

export class DependencyAnalyzer extends BaseAnalyzer {
  private parsers: Map<string, JavaScriptParser | TypeScriptParser>;
  private validator: CircularDepValidator;
  private errors: string[] = [];
  private warnings: string[] = [];

  constructor() {
    super();
    this.parsers = new Map();
    this.validator = new CircularDepValidator();
  }

  /**
   * 의존성 분석 (public 메서드)
   */
  async analyzeDependencies(files: any[]): Promise<Map<string, string[]>> {
    const dependencies = new Map<string, string[]>();
    
    // 간단한 구현
    files.forEach(file => {
      dependencies.set(file.path, []);
    });
    
    return dependencies;
  }

  async analyze(filePaths: string[]): Promise<DependencyAnalysis> {
    this.parsers = new Map([
      ['.js', new JavaScriptParser()],
      ['.jsx', new JavaScriptParser()],
      ['.ts', new TypeScriptParser()],
      ['.tsx', new TypeScriptParser()],
    ]);
    this.validator = new CircularDepValidator();
    // Reset state
    this.errors = [];
    this.warnings = [];
    
    const graph = await this.analyzeImports(filePaths);
    
    // Calculate statistics
    const statistics = this.calculateStatistics(graph);
    
    // Find unresolved dependencies
    const unresolvedDependencies = this.findUnresolvedDependencies(graph);
    
    return {
      graph,
      cycles: graph.cycles,
      unresolvedDependencies,
      statistics,
      errors: this.errors,
      warnings: this.warnings,
      metadata: {
        analyzedAt: new Date().toISOString(),
        fileCount: filePaths.length,
        analysisDuration: 0 // Will be set by caller
      }
    };
  }

  async analyzeImports(filePaths: string[]): Promise<DependencyGraph> {
    const graph: DependencyGraph = {
      nodes: new Map(),
      edges: [],
      cycles: []
    };

    // First pass: Create nodes and collect imports
    for (const filePath of filePaths) {
      const node = await this.analyzeFile(filePath);
      if (node) {
        graph.nodes.set(filePath, node);
      }
    }

    // Second pass: Create edges
    for (const [filePath, node] of graph.nodes) {
      for (const importPath of node.imports) {
        const resolvedPath = await pathResolver.resolve(importPath, filePath);
        if (resolvedPath && graph.nodes.has(resolvedPath)) {
          graph.edges.push({
            source: filePath,
            target: resolvedPath,
            type: 'import'
          });
        }
      }
    }

    // Third pass: Detect cycles
    graph.cycles = this.validator.detectCycles(graph);

    return graph;
  }

  private async analyzeFile(filePath: string): Promise<DependencyNode | null> {
    const extension = this.getFileExtension(filePath);
    const parser = this.parsers.get(extension);

    if (!parser) {
      return null;
    }

    try {
      const { imports, exports } = await parser.parse(filePath);
      return {
        id: filePath,
        path: filePath,
        imports,
        exports,
        dependencies: imports,
        dependents: [],
        type: 'file'
      };
    } catch (error) {
      this.errors.push(`Failed to analyze file ${filePath}: ${error}`);
      return null;
    }
  }

  private calculateStatistics(graph: DependencyGraph) {
    const nodes = Array.from(graph.nodes.values());
    const totalFiles = nodes.length;
    const totalDependencies = graph.edges.length;
    const cyclicDependencies = graph.cycles.length;
    
    // Calculate max depth
    let maxDepth = 0;
    for (const node of nodes) {
      const depth = this.calculateDepth(node.id, graph, new Set());
      maxDepth = Math.max(maxDepth, depth);
    }
    
    // Find orphan files (no imports or exports)
    const orphanFiles = nodes.filter(node => 
      node.imports.length === 0 && node.exports.length === 0
    ).length;
    
    return {
      totalFiles,
      totalDependencies,
      cyclicDependencies,
      maxDepth,
      orphanFiles
    };
  }
  
  private calculateDepth(nodeId: string, graph: DependencyGraph, visited: Set<string>): number {
    if (visited.has(nodeId)) return 0; // Avoid infinite recursion
    
    visited.add(nodeId);
    
    const dependents = graph.edges
      .filter(edge => edge.target === nodeId)
      .map(edge => edge.source);
    
    if (dependents.length === 0) return 1;
    
    let maxDepth = 0;
    for (const dependent of dependents) {
      const depth = this.calculateDepth(dependent, graph, new Set(visited));
      maxDepth = Math.max(maxDepth, depth);
    }
    
    return maxDepth + 1;
  }
  
  private findUnresolvedDependencies(graph: DependencyGraph): string[] {
    const unresolved: string[] = [];
    const resolvedPaths = new Set(Array.from(graph.nodes.keys()));
    
    for (const node of graph.nodes.values()) {
      for (const importPath of node.imports) {
        if (!resolvedPaths.has(importPath) && !importPath.startsWith('.')) {
          // External dependencies are not considered unresolved
          continue;
        }
        if (!resolvedPaths.has(importPath)) {
          unresolved.push(importPath);
        }
      }
    }
    
    return [...new Set(unresolved)];
  }

  detectCycles(graph: DependencyGraph): string[][] {
    return this.validator.detectCycles(graph);
  }

  private getFileExtension(filePath: string): string {
    const match = filePath.match(/\.[^.]+$/);
    return match ? match[0] : '';
  }
}