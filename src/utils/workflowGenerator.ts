import { AnalysisResult } from './projectAnalyzer';

interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    language?: string;
    size?: number;
    path?: string;
    dependencies?: number;
    complexity?: number;
  };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  style?: any;
}

interface WorkflowData {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export async function generateWorkflowFromAnalysis(
  analysis: AnalysisResult,
  files: File[],
  fileContents: Map<string, string>
): Promise<WorkflowData> {
  const nodes: WorkflowNode[] = [];
  const edges: WorkflowEdge[] = [];
  
  // 레이아웃 설정
  const layout = new WorkflowLayout();
  
  // 1. 프로젝트 루트 노드
  const rootNode: WorkflowNode = {
    id: 'root',
    type: 'input',
    position: layout.getPosition(0, 0),
    data: {
      label: `📁 ${analysis.projectName}`,
      size: analysis.totalSize,
      dependencies: analysis.dependencies.length
    }
  };
  nodes.push(rootNode);
  
  // 2. 언어별 그룹 노드 생성
  let groupIndex = 0;
  for (const [language, count] of Object.entries(analysis.languages)) {
    const groupNode: WorkflowNode = {
      id: `lang-${language}`,
      type: 'default',
      position: layout.getPosition(1, groupIndex),
      data: {
        label: `${getLanguageEmoji(language)} ${language} (${count})`,
        language,
        size: count
      }
    };
    nodes.push(groupNode);
    
    // 루트에서 언어 그룹으로 연결
    edges.push({
      id: `edge-root-${language}`,
      source: 'root',
      target: `lang-${language}`,
      type: 'smoothstep',
      animated: true,
      style: { stroke: getLanguageColor(language) }
    });
    
    groupIndex++;
  }
  
  // 3. 주요 파일 노드 생성
  const importantFiles = findImportantFiles(files, fileContents);
  let fileIndex = 0;
  
  for (const file of importantFiles) {
    const language = getFileLanguage(file.name);
    const complexity = calculateFileComplexity(file, fileContents.get(file.name) || '');
    
    const fileNode: WorkflowNode = {
      id: `file-${fileIndex}`,
      type: 'default',
      position: layout.getPosition(2, fileIndex),
      data: {
        label: `📄 ${file.name}`,
        language,
        size: file.size,
        path: file.webkitRelativePath || file.name,
        complexity
      }
    };
    nodes.push(fileNode);
    
    // 언어 그룹에서 파일로 연결
    if (language) {
      edges.push({
        id: `edge-lang-file-${fileIndex}`,
        source: `lang-${language}`,
        target: `file-${fileIndex}`,
        type: 'smoothstep'
      });
    }
    
    fileIndex++;
  }
  
  // 4. 의존성 관계 추가
  const dependencies = await analyzeDependencies(files, fileContents);
  for (const [source, targets] of dependencies.entries()) {
    for (const target of targets) {
      const sourceNode = nodes.find(n => n.data.path === source);
      const targetNode = nodes.find(n => n.data.path === target);
      
      if (sourceNode && targetNode) {
        edges.push({
          id: `dep-${sourceNode.id}-${targetNode.id}`,
          source: sourceNode.id,
          target: targetNode.id,
          type: 'smoothstep',
          style: { stroke: '#ff6b6b', strokeDasharray: '5,5' }
        });
      }
    }
  }
  
  // 5. 특수 노드 추가 (API, 데이터베이스 등)
  if (analysis.hasBackend) {
    const apiNode: WorkflowNode = {
      id: 'api-endpoints',
      type: 'output',
      position: layout.getPosition(1, groupIndex++),
      data: {
        label: `🌐 API Endpoints (${analysis.apiEndpoints})`,
        size: analysis.apiEndpoints
      }
    };
    nodes.push(apiNode);
    edges.push({
      id: 'edge-root-api',
      source: 'root',
      target: 'api-endpoints',
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#4ecdc4' }
    });
  }
  
  if (analysis.hasDatabase) {
    const dbNode: WorkflowNode = {
      id: 'database',
      type: 'output',
      position: layout.getPosition(1, groupIndex++),
      data: {
        label: '🗄️ Database'
      }
    };
    nodes.push(dbNode);
    edges.push({
      id: 'edge-root-db',
      source: 'root',
      target: 'database',
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#9b59b6' }
    });
  }
  
  return { nodes, edges };
}

// 레이아웃 관리 클래스
class WorkflowLayout {
  private levelSpacing = 300;
  private nodeSpacing = 150;
  private levelCounts: Map<number, number> = new Map();
  
  getPosition(level: number, index: number): { x: number; y: number } {
    const currentCount = this.levelCounts.get(level) || 0;
    this.levelCounts.set(level, Math.max(currentCount, index + 1));
    
    return {
      x: level * this.levelSpacing,
      y: index * this.nodeSpacing - ((currentCount - 1) * this.nodeSpacing) / 2
    };
  }
}

// 중요 파일 찾기
function findImportantFiles(files: File[], fileContents: Map<string, string>): File[] {
  const importantPatterns = [
    /^(index|main|app)\.(js|jsx|ts|tsx|py|java|go)$/,
    /^(package\.json|requirements\.txt|pom\.xml|go\.mod)$/,
    /^(README|readme)\.(md|txt)$/,
    /\.(config|conf)\.(js|json|yaml|yml)$/
  ];
  
  const important = files.filter(file => 
    importantPatterns.some(pattern => pattern.test(file.name))
  );
  
  // 크기가 큰 파일도 포함 (상위 20개)
  const sortedBySize = files
    .filter(f => !important.includes(f))
    .sort((a, b) => b.size - a.size)
    .slice(0, 20);
  
  return [...important, ...sortedBySize];
}

// 파일 언어 판단
function getFileLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const languageMap: Record<string, string> = {
    js: 'JavaScript',
    jsx: 'JavaScript',
    ts: 'TypeScript',
    tsx: 'TypeScript',
    py: 'Python',
    java: 'Java',
    go: 'Go',
    rb: 'Ruby',
    php: 'PHP',
    cs: 'C#',
    cpp: 'C++',
    c: 'C',
    rs: 'Rust',
    swift: 'Swift',
    kt: 'Kotlin'
  };
  
  return languageMap[ext] || 'Other';
}

// 언어별 색상
function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    JavaScript: '#f7df1e',
    TypeScript: '#3178c6',
    Python: '#3776ab',
    Java: '#007396',
    Go: '#00add8',
    Ruby: '#cc342d',
    PHP: '#777bb4',
    'C++': '#00599c',
    C: '#a8b9cc',
    'C#': '#239120',
    Rust: '#dea584',
    Swift: '#fa7343',
    Kotlin: '#7f52ff'
  };
  
  return colors[language] || '#6b7280';
}

// 언어별 이모지
function getLanguageEmoji(language: string): string {
  const emojis: Record<string, string> = {
    JavaScript: '🟨',
    TypeScript: '🔷',
    Python: '🐍',
    Java: '☕',
    Go: '🐹',
    Ruby: '💎',
    PHP: '🐘',
    'C++': '⚡',
    C: '🔵',
    'C#': '🟦',
    Rust: '🦀',
    Swift: '🦉',
    Kotlin: '🟪',
    HTML: '🌐',
    CSS: '🎨',
    JSON: '📋',
    Markdown: '📝'
  };
  
  return emojis[language] || '📄';
}

// 파일 복잡도 계산
function calculateFileComplexity(file: File, content: string): number {
  if (!content) return 0;
  
  const lines = content.split('\n').length;
  const functions = (content.match(/function\s+\w+|=>\s*{|class\s+\w+/g) || []).length;
  const conditionals = (content.match(/if\s*\(|switch\s*\(|for\s*\(|while\s*\(/g) || []).length;
  
  // 간단한 복잡도 계산
  const complexity = Math.min(100, (functions * 3 + conditionals * 2 + lines / 50));
  
  return Math.round(complexity);
}

// 의존성 분석
async function analyzeDependencies(
  files: File[], 
  fileContents: Map<string, string>
): Promise<Map<string, string[]>> {
  const dependencies = new Map<string, string[]>();
  
  for (const file of files) {
    const content = fileContents.get(file.name);
    if (!content) continue;
    
    const deps: string[] = [];
    const filePath = file.webkitRelativePath || file.name;
    
    // import/require 문 찾기
    const importMatches = content.matchAll(/import\s+.*?from\s+['"](.+?)['"]/g);
    const requireMatches = content.matchAll(/require\s*\(['"](.+?)['"]\)/g);
    
    for (const match of [...importMatches, ...requireMatches]) {
      const importPath = match[1];
      if (importPath.startsWith('.')) {
        // 상대 경로 import
        const resolvedPath = resolvePath(filePath, importPath);
        const targetFile = files.find(f => 
          (f.webkitRelativePath || f.name).includes(resolvedPath)
        );
        if (targetFile) {
          deps.push(targetFile.webkitRelativePath || targetFile.name);
        }
      }
    }
    
    if (deps.length > 0) {
      dependencies.set(filePath, deps);
    }
  }
  
  return dependencies;
}

// 상대 경로 해결
function resolvePath(currentPath: string, relativePath: string): string {
  const parts = currentPath.split('/');
  parts.pop(); // 파일명 제거
  
  const relativeParts = relativePath.split('/');
  for (const part of relativeParts) {
    if (part === '..') {
      parts.pop();
    } else if (part !== '.') {
      parts.push(part);
    }
  }
  
  return parts.join('/');
}