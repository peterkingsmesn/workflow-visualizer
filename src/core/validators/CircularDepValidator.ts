import { DependencyGraph } from '../analyzers/DependencyAnalyzer';

export class CircularDepValidator {
  detectCycles(graph: DependencyGraph): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    // Build adjacency list from edges
    const adjacencyList = new Map<string, string[]>();
    for (const edge of graph.edges) {
      if (!adjacencyList.has(edge.source)) {
        adjacencyList.set(edge.source, []);
      }
      adjacencyList.get(edge.source)!.push(edge.target);
    }

    // DFS to detect cycles
    const dfs = (node: string): void => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = adjacencyList.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        } else if (recursionStack.has(neighbor)) {
          // Cycle detected
          const cycleStartIndex = path.indexOf(neighbor);
          const cycle = path.slice(cycleStartIndex);
          cycle.push(neighbor); // Complete the cycle
          cycles.push(cycle);
        }
      }

      path.pop();
      recursionStack.delete(node);
    };

    // Check all nodes
    for (const node of graph.nodes.keys()) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }

    return this.removeDuplicateCycles(cycles);
  }

  private removeDuplicateCycles(cycles: string[][]): string[][] {
    const uniqueCycles: string[][] = [];
    const cycleSignatures = new Set<string>();

    for (const cycle of cycles) {
      // Normalize cycle by starting from the lexicographically smallest node
      const normalized = this.normalizeCycle(cycle);
      const signature = normalized.join('->');
      
      if (!cycleSignatures.has(signature)) {
        cycleSignatures.add(signature);
        uniqueCycles.push(cycle);
      }
    }

    return uniqueCycles;
  }

  private normalizeCycle(cycle: string[]): string[] {
    if (cycle.length === 0) return cycle;

    // Remove the duplicate last element if present
    const cleanCycle = cycle[cycle.length - 1] === cycle[0] 
      ? cycle.slice(0, -1) 
      : cycle;

    // Find the index of the smallest element
    let minIndex = 0;
    for (let i = 1; i < cleanCycle.length; i++) {
      if (cleanCycle[i] < cleanCycle[minIndex]) {
        minIndex = i;
      }
    }

    // Rotate the cycle to start from the smallest element
    return [
      ...cleanCycle.slice(minIndex),
      ...cleanCycle.slice(0, minIndex)
    ];
  }

  validateConnection(source: string, target: string, graph: DependencyGraph): boolean {
    // Check if adding this connection would create a cycle
    const tempGraph = this.cloneGraph(graph);
    tempGraph.edges.push({ source, target, type: 'import' });
    
    const cycles = this.detectCycles(tempGraph);
    return cycles.length === 0;
  }

  private cloneGraph(graph: DependencyGraph): DependencyGraph {
    return {
      nodes: new Map(graph.nodes),
      edges: [...graph.edges],
      cycles: [...graph.cycles]
    };
  }

  findAllPaths(graph: DependencyGraph, start: string, end: string): string[][] {
    const paths: string[][] = [];
    const visited = new Set<string>();
    const currentPath: string[] = [];

    // Build adjacency list
    const adjacencyList = new Map<string, string[]>();
    for (const edge of graph.edges) {
      if (!adjacencyList.has(edge.source)) {
        adjacencyList.set(edge.source, []);
      }
      adjacencyList.get(edge.source)!.push(edge.target);
    }

    const dfs = (node: string): void => {
      visited.add(node);
      currentPath.push(node);

      if (node === end) {
        paths.push([...currentPath]);
      } else {
        const neighbors = adjacencyList.get(node) || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            dfs(neighbor);
          }
        }
      }

      currentPath.pop();
      visited.delete(node);
    };

    if (graph.nodes.has(start) && graph.nodes.has(end)) {
      dfs(start);
    }

    return paths;
  }
}