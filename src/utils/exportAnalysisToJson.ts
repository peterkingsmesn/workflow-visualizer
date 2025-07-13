/**
 * 분석 결과를 JSON으로 변환하는 유틸리티
 */

export interface AnalysisExportData {
  metadata: {
    projectName: string;
    projectPath: string;
    analysisDate: string;
    totalFiles: number;
    totalSize: number;
  };
  fileStructure: any;
  fileTypes: Record<string, number>;
  languages: Record<string, number>;
  frameworks: string[];
  errors: Array<{
    file: string;
    path: string;
    line?: number;
    type: string;
    message: string;
    severity: 'error' | 'warning';
    suggestion?: string;
  }>;
  warnings: Array<{
    file: string;
    path: string;
    line?: number;
    type: string;
    message: string;
    severity: 'warning';
    suggestion?: string;
  }>;
  dataFlow: {
    imports: Array<{
      source: string;
      target: string;
      type: 'component' | 'service' | 'utility' | 'api' | 'general';
    }>;
    apiEndpoints: Array<{
      method: string;
      path: string;
      file: string;
      line?: number;
      connected: boolean;
    }>;
    apiCalls: Array<{
      url: string;
      method: string;
      file: string;
      line?: number;
      matchedEndpoint?: string;
    }>;
  };
  dependencies: {
    direct: string[];
    dev: string[];
    missing: string[];
    unused: string[];
  };
  largeFiles: Array<{
    name: string;
    path: string;
    size: number;
  }>;
  codeMetrics: {
    totalLines: number;
    totalClasses: number;
    totalFunctions: number;
    totalComponents: number;
    complexity?: number;
  };
}

export function convertAnalysisToExportFormat(
  analysisResults: any,
  fileStructure: any,
  projectName: string,
  errors: any[] = [],
  warnings: any[] = []
): AnalysisExportData {
  // 오류와 경고를 파일별로 정리
  const processedErrors = errors.map(error => ({
    file: error.file || error.path?.split('/').pop() || 'unknown',
    path: error.path || '',
    line: error.line,
    type: error.type || 'general_error',
    message: error.message || error.toString(),
    severity: 'error' as const,
    suggestion: error.suggestion
  }));

  const processedWarnings = warnings.map(warning => ({
    file: warning.file || warning.path?.split('/').pop() || 'unknown',
    path: warning.path || '',
    line: warning.line,
    type: warning.type || 'general_warning',
    message: warning.message || warning.toString(),
    severity: 'warning' as const,
    suggestion: warning.suggestion
  }));

  // import 관계 추출
  const imports: any[] = [];
  if (analysisResults.importConnections) {
    analysisResults.importConnections.forEach((conn: any) => {
      imports.push({
        source: conn.source,
        target: conn.target,
        type: detectImportType(conn.target)
      });
    });
  }

  // API 정보 추출
  const apiEndpoints: any[] = [];
  const apiCalls: any[] = [];
  
  if (analysisResults.apiEndpoints) {
    analysisResults.apiEndpoints.forEach((endpoint: any) => {
      apiEndpoints.push({
        method: endpoint.method,
        path: endpoint.path,
        file: endpoint.file || endpoint.function,
        line: endpoint.line,
        connected: checkIfConnected(endpoint, analysisResults.apiCalls)
      });
    });
  }

  if (analysisResults.apiCalls) {
    analysisResults.apiCalls.forEach((call: any) => {
      const [file, url] = Array.isArray(call) ? call : [call.file, call.url];
      apiCalls.push({
        url: url,
        method: call.method || 'GET',
        file: file,
        line: call.line,
        matchedEndpoint: findMatchedEndpoint(url, apiEndpoints)
      });
    });
  }

  return {
    metadata: {
      projectName: projectName,
      projectPath: analysisResults.projectPath || '',
      analysisDate: new Date().toISOString(),
      totalFiles: analysisResults.totalFiles || 0,
      totalSize: analysisResults.totalSize || 0
    },
    fileStructure: fileStructure,
    fileTypes: analysisResults.fileTypes || {},
    languages: analysisResults.languages || {},
    frameworks: analysisResults.frameworks || [],
    errors: processedErrors,
    warnings: processedWarnings,
    dataFlow: {
      imports: imports,
      apiEndpoints: apiEndpoints,
      apiCalls: apiCalls
    },
    dependencies: {
      direct: analysisResults.dependencies?.direct || [],
      dev: analysisResults.dependencies?.dev || [],
      missing: analysisResults.dependencies?.missing || [],
      unused: analysisResults.dependencies?.unused || []
    },
    largeFiles: analysisResults.largeFiles || [],
    codeMetrics: {
      totalLines: analysisResults.totalLines || 0,
      totalClasses: analysisResults.totalClasses || 0,
      totalFunctions: analysisResults.totalFunctions || 0,
      totalComponents: analysisResults.totalComponents || 0,
      complexity: analysisResults.complexity
    }
  };
}

function detectImportType(importPath: string): 'component' | 'service' | 'utility' | 'api' | 'general' {
  const lowerPath = importPath.toLowerCase();
  if (lowerPath.includes('component') || lowerPath.includes('.tsx') || lowerPath.includes('.jsx')) {
    return 'component';
  } else if (lowerPath.includes('service') || lowerPath.includes('api')) {
    return 'service';
  } else if (lowerPath.includes('util') || lowerPath.includes('helper')) {
    return 'utility';
  } else if (lowerPath.includes('/api/') || lowerPath.includes('endpoint')) {
    return 'api';
  }
  return 'general';
}

function checkIfConnected(endpoint: any, apiCalls: any[]): boolean {
  if (!apiCalls) return false;
  return apiCalls.some(call => {
    const url = Array.isArray(call) ? call[1] : call.url;
    return url && url.includes(endpoint.path);
  });
}

function findMatchedEndpoint(url: string, endpoints: any[]): string | undefined {
  const matched = endpoints.find(ep => url.includes(ep.path));
  return matched ? `${matched.method} ${matched.path}` : undefined;
}

export function downloadJson(data: any, filename: string) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}