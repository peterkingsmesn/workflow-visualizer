/**
 * 노드 생성을 위한 팩토리 함수들
 */

export function createFileNode(
  filePath: string,
  fileData: any,
  index: number,
  cols: number = 5,
  spacing: number = 250,
  startX: number = 100,
  startY: number = 100
) {
  const row = Math.floor(index / cols);
  const col = index % cols;
  
  return {
    id: `file-${index}`,
    type: 'file' as const,
    position: { 
      x: startX + col * spacing, 
      y: startY + row * spacing 
    },
    data: {
      name: fileData.name,
      path: filePath,
      category: 'file',
      imports: fileData.imports || [],
      exports: fileData.exports || [],
      errors: fileData.error ? [fileData.error] : []
    }
  };
}

export function createApiNode(
  endpoint: any,
  index: number,
  isBackend: boolean,
  cols: number = 3,
  spacing: number = 300,
  startX: number = 100,
  startY: number = 500
) {
  const row = Math.floor(index / cols);
  const col = index % cols;
  const xOffset = isBackend ? 0 : 600;
  
  return {
    id: `${isBackend ? 'backend' : 'frontend'}-api-${index}`,
    type: 'api-node' as const,
    position: { 
      x: startX + col * spacing + xOffset, 
      y: startY + row * 150 
    },
    data: {
      path: endpoint.file || 'unknown',
      name: `${endpoint.method} ${endpoint.path}`,
      category: `${isBackend ? 'backend' : 'frontend'}-api`,
      imports: [],
      exports: [],
      method: endpoint.method,
      file: endpoint.file,
      line: endpoint.line,
      apiType: endpoint.type,
      matched: false
    }
  };
}

export function createTranslationNode(
  language: string,
  coverage: any,
  index: number,
  cols: number = 4,
  spacing: number = 250,
  startX: number = 100,
  startY: number = 800
) {
  const row = Math.floor(index / cols);
  const col = index % cols;
  
  return {
    id: `translation-${language}`,
    type: 'translation-coverage' as const,
    position: { 
      x: startX + col * spacing, 
      y: startY + row * 120 
    },
    data: {
      path: `src/i18n/${language}.json`,
      name: `${language.toUpperCase()} 번역`,
      category: 'translation',
      imports: [],
      exports: [],
      language: language,
      coverage: coverage,
      total: coverage.total,
      covered: coverage.covered,
      percentage: coverage.percentage,
      status: coverage.percentage >= 80 ? 'good' : coverage.percentage >= 50 ? 'warning' : 'error'
    }
  };
}

export function createNewNode(type: string) {
  const position = {
    x: Math.random() * 500 + 100,
    y: Math.random() * 300 + 100
  };

  let nodeData;
  switch (type) {
    case 'api':
      nodeData = {
        path: '/api/endpoint',
        name: 'New API Endpoint',
        category: 'api',
        imports: [],
        exports: [],
        method: 'GET',
        responseType: 'json'
      };
      break;
    case 'function':
      nodeData = {
        path: 'src/utils/newFunction.ts',
        name: 'New Function',
        category: 'function',
        imports: [],
        exports: [],
        parameters: [],
        returnType: 'void'
      };
      break;
    case 'translation':
      nodeData = {
        path: 'src/i18n/translations.json',
        name: 'Translation Keys',
        category: 'translation',
        imports: [],
        exports: [],
        keys: [],
        languages: ['en', 'ko']
      };
      break;
    default:
      return null;
  }

  return {
    id: `${type}-${Date.now()}`,
    type,
    position,
    data: nodeData
  };
}