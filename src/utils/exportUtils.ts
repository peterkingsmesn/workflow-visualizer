import { Node, Edge, WorkflowAnalysis } from '../types/workflow.types';

/**
 * 워크플로우 내보내기 관련 유틸리티 함수들
 */

export interface ExportOptions {
  format: 'json' | 'yaml' | 'xml' | 'csv' | 'markdown' | 'pdf' | 'png' | 'svg';
  includeAnalysis?: boolean;
  includeMetadata?: boolean;
  compress?: boolean;
  prettify?: boolean;
}

export interface WorkflowExport {
  version: string;
  timestamp: string;
  project: {
    name: string;
    description?: string;
    id?: string;
  };
  nodes: Node[];
  edges: Edge[];
  analysis?: WorkflowAnalysis;
  metadata?: {
    totalNodes: number;
    totalEdges: number;
    exportedAt: string;
    exportedBy?: string;
    fileSize?: number;
  };
}

/**
 * 워크플로우를 JSON으로 내보내기
 */
export function exportToJSON(
  nodes: Node[],
  edges: Edge[],
  options: ExportOptions & { projectName?: string; analysis?: WorkflowAnalysis }
): string {
  const exportData: WorkflowExport = {
    version: '1.1',
    timestamp: new Date().toISOString(),
    project: {
      name: options.projectName || 'Workflow Export',
      id: `export-${Date.now()}`
    },
    nodes,
    edges
  };

  if (options.includeAnalysis && options.analysis) {
    exportData.analysis = options.analysis;
  }

  if (options.includeMetadata) {
    exportData.metadata = {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      exportedAt: new Date().toISOString(),
      exportedBy: localStorage.getItem('userName') || 'Unknown'
    };
  }

  const jsonString = options.prettify 
    ? JSON.stringify(exportData, null, 2)
    : JSON.stringify(exportData);

  if (options.includeMetadata && exportData.metadata) {
    exportData.metadata.fileSize = new Blob([jsonString]).size;
  }

  return jsonString;
}

/**
 * 워크플로우를 YAML로 내보내기
 */
export function exportToYAML(
  nodes: Node[],
  edges: Edge[],
  options: ExportOptions & { projectName?: string; analysis?: WorkflowAnalysis }
): string {
  // 간단한 YAML 생성 (실제로는 yaml 라이브러리 사용 권장)
  const exportData = {
    version: '1.1',
    timestamp: new Date().toISOString(),
    project: {
      name: options.projectName || 'Workflow Export',
      id: `export-${Date.now()}`
    },
    nodes,
    edges,
    ...(options.includeAnalysis && options.analysis ? { analysis: options.analysis } : {}),
    ...(options.includeMetadata ? {
      metadata: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        exportedAt: new Date().toISOString(),
        exportedBy: localStorage.getItem('userName') || 'Unknown'
      }
    } : {})
  };

  return convertToYAML(exportData);
}

/**
 * 워크플로우를 마크다운으로 내보내기
 */
export function exportToMarkdown(
  nodes: Node[],
  edges: Edge[],
  options: ExportOptions & { projectName?: string; analysis?: WorkflowAnalysis }
): string {
  let markdown = `# ${options.projectName || 'Workflow Documentation'}\n\n`;
  
  markdown += `생성일시: ${new Date().toLocaleString()}\n\n`;

  // 개요
  markdown += `## 📊 개요\n\n`;
  markdown += `- 총 노드 수: ${nodes.length}\n`;
  markdown += `- 총 연결 수: ${edges.length}\n`;

  // 노드 타입별 통계
  const nodeTypes = nodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  markdown += `- 노드 타입별 분포:\n`;
  Object.entries(nodeTypes).forEach(([type, count]) => {
    markdown += `  - ${type}: ${count}개\n`;
  });
  markdown += '\n';

  // 노드 목록
  markdown += `## 📋 노드 목록\n\n`;
  nodes.forEach((node, index) => {
    markdown += `### ${index + 1}. ${node.data.name}\n\n`;
    markdown += `- **타입**: ${node.type}\n`;
    markdown += `- **경로**: ${node.data.path}\n`;
    markdown += `- **카테고리**: ${node.data.category}\n`;
    
    if (node.data.imports && node.data.imports.length > 0) {
      markdown += `- **임포트**: ${node.data.imports.join(', ')}\n`;
    }
    
    if (node.data.exports && node.data.exports.length > 0) {
      markdown += `- **익스포트**: ${node.data.exports.join(', ')}\n`;
    }
    
    markdown += '\n';
  });

  // 연결 관계
  markdown += `## 🔗 연결 관계\n\n`;
  edges.forEach((edge, index) => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    markdown += `${index + 1}. **${sourceNode?.data.name || edge.source}** → **${targetNode?.data.name || edge.target}**\n`;
    markdown += `   - 연결 타입: ${edge.type}\n`;
    if (edge.data?.dataType) {
      markdown += `   - 데이터 타입: ${edge.data.dataType}\n`;
    }
    markdown += '\n';
  });

  // 분석 결과
  if (options.includeAnalysis && options.analysis) {
    markdown += `## 🔍 분석 결과\n\n`;
    
    if (options.analysis.errors.length > 0) {
      markdown += `### ❌ 오류 (${options.analysis.errors.length}개)\n\n`;
      options.analysis.errors.forEach((error, index) => {
        markdown += `${index + 1}. **${error.type}**: ${error.message}\n`;
        if (error.suggestion) {
          markdown += `   - 💡 제안: ${error.suggestion}\n`;
        }
        markdown += '\n';
      });
    }

    if (options.analysis.warnings.length > 0) {
      markdown += `### ⚠️ 경고 (${options.analysis.warnings.length}개)\n\n`;
      options.analysis.warnings.forEach((warning, index) => {
        markdown += `${index + 1}. ${warning.message}\n`;
      });
      markdown += '\n';
    }

    if (options.analysis.suggestions.length > 0) {
      markdown += `### 💡 개선 제안\n\n`;
      options.analysis.suggestions.forEach((suggestion, index) => {
        markdown += `${index + 1}. ${suggestion}\n`;
      });
      markdown += '\n';
    }

    // 메트릭
    markdown += `### 📈 메트릭\n\n`;
    markdown += `- 복잡도: ${options.analysis.metrics.complexity}\n`;
    markdown += `- 응집도: ${options.analysis.metrics.cohesion}\n`;
    markdown += `- 결합도: ${options.analysis.metrics.coupling}\n`;
  }

  return markdown;
}

/**
 * 워크플로우를 CSV로 내보내기
 */
export function exportToCSV(
  nodes: Node[],
  edges: Edge[],
  options: ExportOptions
): string {
  let csv = '';

  // 노드 CSV
  csv += 'Type,Data\n';
  csv += 'NODES,\n';
  csv += 'ID,Type,Name,Path,Category,Position X,Position Y\n';
  
  nodes.forEach(node => {
    csv += `"${node.id}","${node.type}","${node.data.name}","${node.data.path}","${node.data.category}",${node.position.x},${node.position.y}\n`;
  });

  csv += '\n';
  csv += 'EDGES,\n';
  csv += 'ID,Source,Target,Type,Data Type\n';
  
  edges.forEach(edge => {
    csv += `"${edge.id}","${edge.source}","${edge.target}","${edge.type}","${edge.data?.dataType || ''}"\n`;
  });

  return csv;
}

/**
 * 워크플로우를 XML로 내보내기
 */
export function exportToXML(
  nodes: Node[],
  edges: Edge[],
  options: ExportOptions & { projectName?: string }
): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<workflow>\n';
  xml += `  <metadata>\n`;
  xml += `    <version>1.1</version>\n`;
  xml += `    <timestamp>${new Date().toISOString()}</timestamp>\n`;
  xml += `    <project>${escapeXML(options.projectName || 'Workflow Export')}</project>\n`;
  xml += `  </metadata>\n`;
  
  xml += '  <nodes>\n';
  nodes.forEach(node => {
    xml += `    <node id="${escapeXML(node.id)}" type="${escapeXML(node.type)}">\n`;
    xml += `      <name>${escapeXML(node.data.name)}</name>\n`;
    xml += `      <path>${escapeXML(node.data.path)}</path>\n`;
    xml += `      <category>${escapeXML(node.data.category)}</category>\n`;
    xml += `      <position x="${node.position.x}" y="${node.position.y}" />\n`;
    xml += `    </node>\n`;
  });
  xml += '  </nodes>\n';
  
  xml += '  <edges>\n';
  edges.forEach(edge => {
    xml += `    <edge id="${escapeXML(edge.id)}" type="${escapeXML(edge.type)}">\n`;
    xml += `      <source>${escapeXML(edge.source)}</source>\n`;
    xml += `      <target>${escapeXML(edge.target)}</target>\n`;
    if (edge.data?.dataType) {
      xml += `      <dataType>${escapeXML(edge.data.dataType)}</dataType>\n`;
    }
    xml += `    </edge>\n`;
  });
  xml += '  </edges>\n';
  
  xml += '</workflow>\n';
  return xml;
}

/**
 * DOT 형식으로 내보내기 (Graphviz용)
 */
export function exportToDOT(
  nodes: Node[],
  edges: Edge[],
  options: { directed?: boolean } = {}
): string {
  const graphType = options.directed !== false ? 'digraph' : 'graph';
  const edgeOperator = options.directed !== false ? '->' : '--';
  
  let dot = `${graphType} workflow {\n`;
  dot += '  node [shape=box, style=rounded];\n';
  dot += '  rankdir=TB;\n\n';
  
  // 노드 정의
  nodes.forEach(node => {
    const label = `${node.data.name}\\n(${node.type})`;
    const color = getNodeColorForDOT(node.type);
    dot += `  "${node.id}" [label="${label}", fillcolor="${color}", style=filled];\n`;
  });
  
  dot += '\n';
  
  // 엣지 정의
  edges.forEach(edge => {
    const edgeColor = getEdgeColorForDOT(edge.type);
    dot += `  "${edge.source}" ${edgeOperator} "${edge.target}" [color="${edgeColor}", label="${edge.type}"];\n`;
  });
  
  dot += '}\n';
  return dot;
}

/**
 * 파일 다운로드 트리거
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
}

/**
 * 워크플로우 내보내기 (통합 함수)
 */
export function exportWorkflow(
  nodes: Node[],
  edges: Edge[],
  options: ExportOptions & { 
    projectName?: string; 
    analysis?: WorkflowAnalysis;
    filename?: string;
  }
): void {
  let content: string;
  let mimeType: string;
  let extension: string;

  switch (options.format) {
    case 'json':
      content = exportToJSON(nodes, edges, options);
      mimeType = 'application/json';
      extension = 'json';
      break;
    
    case 'yaml':
      content = exportToYAML(nodes, edges, options);
      mimeType = 'text/yaml';
      extension = 'yml';
      break;
    
    case 'xml':
      content = exportToXML(nodes, edges, options);
      mimeType = 'application/xml';
      extension = 'xml';
      break;
    
    case 'csv':
      content = exportToCSV(nodes, edges, options);
      mimeType = 'text/csv';
      extension = 'csv';
      break;
    
    case 'markdown':
      content = exportToMarkdown(nodes, edges, options);
      mimeType = 'text/markdown';
      extension = 'md';
      break;
    
    default:
      throw new Error(`지원하지 않는 형식: ${options.format}`);
  }

  const filename = options.filename || 
    `${options.projectName || 'workflow'}-${new Date().toISOString().split('T')[0]}.${extension}`;
  
  downloadFile(content, filename, mimeType);
}

/**
 * 캔버스를 이미지로 내보내기
 */
export async function exportCanvasAsImage(
  canvasElement: HTMLElement,
  options: { 
    format: 'png' | 'svg' | 'jpeg';
    quality?: number;
    width?: number;
    height?: number;
    filename?: string;
  }
): Promise<void> {
  // HTML2Canvas 또는 유사한 라이브러리 필요
  // 실제 구현에서는 react-flow의 내장 export 기능 사용 권장
  
  if (options.format === 'svg') {
    // SVG 내보내기 로직
    console.log('SVG export not implemented');
  } else {
    // Canvas/PNG/JPEG 내보내기 로직
    console.log('Canvas export not implemented');
  }
}

/**
 * 워크플로우 가져오기
 */
export function importWorkflow(fileContent: string, format: string): {
  nodes: Node[];
  edges: Edge[];
  metadata?: any;
} {
  switch (format) {
    case 'json':
      return importFromJSON(fileContent);
    case 'yaml':
      return importFromYAML(fileContent);
    case 'xml':
      return importFromXML(fileContent);
    default:
      throw new Error(`지원하지 않는 가져오기 형식: ${format}`);
  }
}

// Helper functions

function convertToYAML(obj: any, indent: number = 0): string {
  const spaces = '  '.repeat(indent);
  let yaml = '';
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      yaml += `${spaces}${key}: null\n`;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      yaml += `${spaces}${key}:\n`;
      yaml += convertToYAML(value, indent + 1);
    } else if (Array.isArray(value)) {
      yaml += `${spaces}${key}:\n`;
      value.forEach(item => {
        if (typeof item === 'object') {
          yaml += `${spaces}  -\n`;
          yaml += convertToYAML(item, indent + 2);
        } else {
          yaml += `${spaces}  - ${item}\n`;
        }
      });
    } else {
      yaml += `${spaces}${key}: ${value}\n`;
    }
  }
  
  return yaml;
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getNodeColorForDOT(nodeType: string): string {
  const colors: Record<string, string> = {
    file: 'lightblue',
    api: 'lightgreen',
    function: 'lightyellow',
    translation: 'lightpink',
    websocket: 'lightcoral',
    graphql: 'lightsalmon',
    service: 'lightcyan',
    store: 'lightgray'
  };
  return colors[nodeType] || 'white';
}

function getEdgeColorForDOT(edgeType: string): string {
  const colors: Record<string, string> = {
    import: 'black',
    'data-flow': 'blue',
    'api-call': 'green',
    websocket: 'red',
    action: 'orange'
  };
  return colors[edgeType] || 'black';
}

function importFromJSON(content: string): { nodes: Node[]; edges: Edge[]; metadata?: any } {
  const data = JSON.parse(content);
  return {
    nodes: data.nodes || [],
    edges: data.edges || [],
    metadata: data.metadata
  };
}

function importFromYAML(content: string): { nodes: Node[]; edges: Edge[]; metadata?: any } {
  // 실제 구현에서는 yaml 파서 사용
  throw new Error('YAML import not implemented');
}

function importFromXML(content: string): { nodes: Node[]; edges: Edge[]; metadata?: any } {
  // 실제 구현에서는 XML 파서 사용
  throw new Error('XML import not implemented');
}