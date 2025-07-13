/**
 * 프로젝트 진단 서비스
 * complete_diagnose.py의 결과를 워크플로우 시각화에 통합
 */

export interface DiagnosticResult {
  project_name: string;
  project_path: string;
  scan_time: string;
  duration_seconds: number;
  system_info: {
    platform: string;
    node_version: string;
    python_version: string;
  };
  file_statistics: {
    total_files: number;
    by_extension: Record<string, number>;
  };
  imports: string[];
  api_endpoints: Array<{
    method: string;
    path: string;
    function: string;
  }>;
  api_calls: Array<[string, string]>; // [파일명, API URL]
  data_sources: Record<string, string[]>;
  errors: string[];
  warnings: string[];
  workflow_mismatches: string[];
}

export interface WorkflowNode {
  id: string;
  type: 'file' | 'api' | 'data' | 'error';
  position: { x: number; y: number };
  data: {
    label: string;
    file?: string;
    errors?: string[];
    warnings?: string[];
    apiEndpoint?: string;
    dataSource?: string;
    status?: 'error' | 'warning' | 'normal';
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: 'api' | 'data' | 'import';
  animated?: boolean;
  style?: {
    stroke: string;
    strokeWidth: number;
  };
}

export class DiagnoseService {
  /**
   * 진단 실행
   */
  static async runDiagnosis(targetDir: string): Promise<DiagnosticResult> {
    const response = await fetch('/api/diagnose/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetDir })
    });

    if (!response.ok) {
      throw new Error('진단 실행 실패');
    }

    const result = await response.json();
    
    // JSON 결과 파일 읽기
    const jsonPath = `${targetDir}/diagnostic_results.json`;
    const jsonResponse = await fetch(`/api/files/read?path=${encodeURIComponent(jsonPath)}`);
    
    if (!jsonResponse.ok) {
      throw new Error('진단 결과 파일을 읽을 수 없습니다');
    }

    return await jsonResponse.json();
  }

  /**
   * 진단 결과를 워크플로우 노드/엣지로 변환
   */
  static convertToWorkflow(diagnostic: DiagnosticResult): {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  } {
    const nodes: WorkflowNode[] = [];
    const edges: WorkflowEdge[] = [];
    const nodeMap = new Map<string, string>();

    // 1. API 엔드포인트 노드 생성
    diagnostic.api_endpoints.forEach((endpoint, index) => {
      const nodeId = `api-backend-${index}`;
      nodes.push({
        id: nodeId,
        type: 'api',
        position: { x: 100 + (index % 5) * 200, y: 100 + Math.floor(index / 5) * 150 },
        data: {
          label: endpoint.path,
          apiEndpoint: `${endpoint.method} ${endpoint.path}`,
          file: endpoint.function,
          status: 'normal'
        }
      });
      nodeMap.set(endpoint.path, nodeId);
    });

    // 2. API 호출 노드 및 연결 생성
    diagnostic.api_calls.forEach(([file, apiCall], index) => {
      const nodeId = `api-call-${index}`;
      
      // API 호출 노드 생성
      nodes.push({
        id: nodeId,
        type: 'api',
        position: { x: 600 + (index % 5) * 200, y: 100 + Math.floor(index / 5) * 150 },
        data: {
          label: apiCall,
          file: file,
          status: 'normal'
        }
      });

      // 매칭되는 백엔드 API 찾기
      const matchedEndpoint = diagnostic.api_endpoints.find(ep => 
        apiCall.includes(ep.path) || ep.path.includes(apiCall.split('/').pop() || '')
      );

      if (matchedEndpoint) {
        const backendNodeId = nodeMap.get(matchedEndpoint.path);
        if (backendNodeId) {
          edges.push({
            id: `edge-api-${index}`,
            source: nodeId,
            target: backendNodeId,
            type: 'api',
            animated: true,
            style: {
              stroke: '#3b82f6',
              strokeWidth: 2
            }
          });
        }
      }
    });

    // 3. 데이터 소스 노드 생성
    let dataNodeIndex = 0;
    Object.entries(diagnostic.data_sources).forEach(([source, files]) => {
      const nodeId = `data-${dataNodeIndex}`;
      nodes.push({
        id: nodeId,
        type: 'data',
        position: { x: 1100, y: 100 + dataNodeIndex * 150 },
        data: {
          label: source,
          dataSource: source,
          file: files.join(', '),
          status: 'normal'
        }
      });

      // 데이터 소스를 사용하는 파일과 연결
      files.forEach((file, fileIndex) => {
        edges.push({
          id: `edge-data-${dataNodeIndex}-${fileIndex}`,
          source: nodeId,
          target: `file-${file}`,
          type: 'data',
          animated: true,
          style: {
            stroke: '#10b981',
            strokeWidth: 2
          }
        });
      });

      dataNodeIndex++;
    });

    // 4. 오류/경고 노드 추가
    if (diagnostic.errors.length > 0 || diagnostic.warnings.length > 0) {
      const errorNodeId = 'error-summary';
      nodes.push({
        id: errorNodeId,
        type: 'error',
        position: { x: 400, y: 500 },
        data: {
          label: `오류: ${diagnostic.errors.length}, 경고: ${diagnostic.warnings.length}`,
          errors: diagnostic.errors,
          warnings: diagnostic.warnings,
          status: diagnostic.errors.length > 0 ? 'error' : 'warning'
        }
      });
    }

    // 5. 워크플로우 불일치 표시
    diagnostic.workflow_mismatches.forEach((mismatch, index) => {
      const nodeId = `mismatch-${index}`;
      nodes.push({
        id: nodeId,
        type: 'error',
        position: { x: 400, y: 600 + index * 100 },
        data: {
          label: '워크플로우 불일치',
          warnings: [mismatch],
          status: 'warning'
        }
      });
    });

    return { nodes, edges };
  }

  /**
   * 오류가 있는 노드 하이라이트
   */
  static highlightErrorNodes(nodes: WorkflowNode[], errors: string[], warnings: string[]): WorkflowNode[] {
    return nodes.map(node => {
      const hasError = errors.some(error => 
        error.includes(node.data.file || '') || 
        error.includes(node.data.label)
      );
      
      const hasWarning = warnings.some(warning => 
        warning.includes(node.data.file || '') || 
        warning.includes(node.data.label)
      );

      if (hasError) {
        return {
          ...node,
          data: {
            ...node.data,
            status: 'error',
            errors: errors.filter(e => 
              e.includes(node.data.file || '') || 
              e.includes(node.data.label)
            )
          }
        };
      } else if (hasWarning) {
        return {
          ...node,
          data: {
            ...node.data,
            status: 'warning',
            warnings: warnings.filter(w => 
              w.includes(node.data.file || '') || 
              w.includes(node.data.label)
            )
          }
        };
      }

      return node;
    });
  }
}