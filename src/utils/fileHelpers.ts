import * as path from 'path';

/**
 * 파일 관련 유틸리티 함수들
 */

export interface FileInfo {
  name: string;
  extension: string;
  size: number;
  path: string;
  isDirectory: boolean;
  lastModified: Date;
}

/**
 * 파일 확장자 추출
 */
export function getFileExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

/**
 * 파일명 (확장자 제외) 추출
 */
export function getFileNameWithoutExtension(filePath: string): string {
  return path.basename(filePath, path.extname(filePath));
}

/**
 * 파일 타입 판단
 */
export function getFileType(filePath: string): string {
  const ext = getFileExtension(filePath);
  
  const typeMap: Record<string, string> = {
    // JavaScript/TypeScript
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    
    // 스타일시트
    '.css': 'stylesheet',
    '.scss': 'stylesheet',
    '.sass': 'stylesheet',
    '.less': 'stylesheet',
    '.styl': 'stylesheet',
    
    // 마크업
    '.html': 'markup',
    '.htm': 'markup',
    '.xml': 'markup',
    '.svg': 'markup',
    '.vue': 'markup',
    
    // 설정 파일
    '.json': 'config',
    '.yaml': 'config',
    '.yml': 'config',
    '.toml': 'config',
    '.ini': 'config',
    '.env': 'config',
    '.config': 'config',
    
    // 이미지
    '.png': 'image',
    '.jpg': 'image',
    '.jpeg': 'image',
    '.gif': 'image',
    '.webp': 'image',
    '.ico': 'image',
    
    // 문서
    '.md': 'document',
    '.txt': 'document',
    '.pdf': 'document',
    '.doc': 'document',
    '.docx': 'document',
    
    // 압축
    '.zip': 'archive',
    '.tar': 'archive',
    '.gz': 'archive',
    '.rar': 'archive',
    
    // 데이터베이스
    '.sql': 'database',
    '.db': 'database',
    '.sqlite': 'database',
    
    // 기타
    '.gitignore': 'config',
    '.gitattributes': 'config',
    '.editorconfig': 'config',
    '.npmrc': 'config',
    '.nvmrc': 'config'
  };
  
  return typeMap[ext] || 'unknown';
}

/**
 * 파일 크기를 읽기 쉬운 형태로 변환
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

/**
 * 상대 경로를 절대 경로로 변환
 */
export function resolveRelativePath(basePath: string, relativePath: string): string {
  return path.resolve(basePath, relativePath);
}

/**
 * 두 경로 간의 상대 경로 계산
 */
export function getRelativePath(from: string, to: string): string {
  return path.relative(from, to);
}

/**
 * 경로 정규화
 */
export function normalizePath(filePath: string): string {
  return path.normalize(filePath).replace(/\\/g, '/');
}

/**
 * 파일이 특정 패턴과 일치하는지 확인
 */
export function matchesPattern(filePath: string, patterns: string[]): boolean {
  const fileName = path.basename(filePath);
  const dirName = path.dirname(filePath);
  
  return patterns.some(pattern => {
    // 간단한 glob 패턴 지원
    if (pattern.includes('*')) {
      const regex = new RegExp(
        pattern
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.')
          .replace(/\./g, '\\.')
      );
      return regex.test(fileName) || regex.test(filePath);
    }
    
    // 정확한 일치
    return fileName === pattern || 
           filePath.includes(pattern) || 
           dirName.includes(pattern);
  });
}

/**
 * 파일 경로에서 프로젝트 루트 기준 상대 경로 추출
 */
export function getProjectRelativePath(filePath: string, projectRoot: string): string {
  return path.relative(projectRoot, filePath);
}

/**
 * 디렉토리 깊이 계산
 */
export function getDirectoryDepth(filePath: string): number {
  return filePath.split(path.sep).length - 1;
}

/**
 * 파일명이 숨김 파일인지 확인
 */
export function isHiddenFile(filePath: string): boolean {
  const fileName = path.basename(filePath);
  return fileName.startsWith('.') && fileName !== '.' && fileName !== '..';
}

/**
 * 파일이 바이너리인지 확인 (확장자 기반)
 */
export function isBinaryFile(filePath: string): boolean {
  const binaryExtensions = [
    '.exe', '.dll', '.so', '.dylib', '.bin', '.dat',
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp',
    '.mp3', '.wav', '.ogg', '.mp4', '.avi', '.mov', '.wmv',
    '.zip', '.tar', '.gz', '.rar', '.7z',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.db', '.sqlite', '.mdb',
    '.ttf', '.otf', '.woff', '.woff2', '.eot'
  ];
  
  const ext = getFileExtension(filePath);
  return binaryExtensions.includes(ext);
}

/**
 * 텍스트 파일인지 확인
 */
export function isTextFile(filePath: string): boolean {
  const textExtensions = [
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
    '.css', '.scss', '.sass', '.less', '.styl',
    '.html', '.htm', '.xml', '.svg', '.vue',
    '.json', '.yaml', '.yml', '.toml', '.ini', '.env',
    '.md', '.txt', '.log', '.csv',
    '.sql', '.graphql', '.gql',
    '.py', '.rb', '.php', '.java', '.c', '.cpp', '.h', '.hpp',
    '.go', '.rs', '.swift', '.kt', '.dart',
    '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd'
  ];
  
  const ext = getFileExtension(filePath);
  return textExtensions.includes(ext);
}

/**
 * 코드 파일인지 확인
 */
export function isCodeFile(filePath: string): boolean {
  const codeExtensions = [
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
    '.py', '.rb', '.php', '.java', '.c', '.cpp', '.h', '.hpp',
    '.go', '.rs', '.swift', '.kt', '.dart',
    '.vue', '.svelte', '.elm', '.clj', '.cljs', '.hs',
    '.scala', '.ml', '.fs', '.fsx', '.vb', '.cs',
    '.r', '.R', '.m', '.mm', '.pl', '.pm'
  ];
  
  const ext = getFileExtension(filePath);
  return codeExtensions.includes(ext);
}

/**
 * 설정 파일인지 확인
 */
export function isConfigFile(filePath: string): boolean {
  const fileName = path.basename(filePath);
  const ext = getFileExtension(filePath);
  
  const configExtensions = ['.json', '.yaml', '.yml', '.toml', '.ini', '.env', '.config'];
  const configFiles = [
    'package.json', 'tsconfig.json', 'jsconfig.json', 'webpack.config.js',
    'vite.config.js', 'rollup.config.js', 'babel.config.js', '.babelrc',
    '.eslintrc', '.prettierrc', '.editorconfig', '.gitignore', '.gitattributes',
    'Dockerfile', 'docker-compose.yml', '.dockerignore',
    'Makefile', 'CMakeLists.txt', 'build.gradle', 'pom.xml',
    '.nvmrc', '.npmrc', '.yarnrc', 'yarn.lock', 'package-lock.json',
    'requirements.txt', 'Pipfile', 'poetry.lock', 'Cargo.toml'
  ];
  
  return configExtensions.includes(ext) || configFiles.includes(fileName);
}

/**
 * 테스트 파일인지 확인
 */
export function isTestFile(filePath: string): boolean {
  const fileName = path.basename(filePath).toLowerCase();
  const testPatterns = [
    '.test.', '.spec.', '_test.', '_spec.',
    '.e2e.', '.integration.', '.unit.',
    '__tests__', 'test/', 'tests/', 'spec/', 'specs/'
  ];
  
  return testPatterns.some(pattern => 
    fileName.includes(pattern) || filePath.includes(pattern)
  );
}

/**
 * 파일 경로에서 언어 정보 추출 (i18n)
 */
export function extractLanguageFromPath(filePath: string): string | null {
  const patterns = [
    /\/(?:locales?|i18n|lang|languages?)\/([a-z]{2}(?:-[A-Z]{2})?)\//i,
    /\/([a-z]{2}(?:-[A-Z]{2})?)\.(?:json|ya?ml|po|properties)$/i,
    /\/messages[._]([a-z]{2}(?:-[A-Z]{2})?)\./i,
    /_([a-z]{2}(?:-[A-Z]{2})?)\.(?:json|ya?ml)$/i
  ];
  
  for (const pattern of patterns) {
    const match = filePath.match(pattern);
    if (match) {
      return match[1].toLowerCase();
    }
  }
  
  return null;
}

/**
 * 파일 경로 구성 요소 분리
 */
export function parseFilePath(filePath: string): {
  dir: string;
  name: string;
  ext: string;
  base: string;
  root: string;
} {
  const parsed = path.parse(filePath);
  return {
    dir: parsed.dir,
    name: parsed.name,
    ext: parsed.ext,
    base: parsed.base,
    root: parsed.root
  };
}

/**
 * 안전한 파일명 생성 (특수문자 제거)
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[<>:"/\\|?*]/g, '_')  // 금지된 문자들을 언더스코어로 변경
    .replace(/\s+/g, '_')           // 공백을 언더스코어로 변경
    .replace(/_+/g, '_')            // 연속된 언더스코어를 하나로 합침
    .replace(/^_+|_+$/g, '');       // 시작과 끝의 언더스코어 제거
}

/**
 * 파일 경로 유효성 검사
 */
export function isValidFilePath(filePath: string): boolean {
  try {
    path.parse(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 파일 트리에서 특정 파일 찾기
 */
export function findFileInTree(
  tree: any, 
  predicate: (node: any) => boolean
): any | null {
  if (predicate(tree)) {
    return tree;
  }
  
  if (tree.children && Array.isArray(tree.children)) {
    for (const child of tree.children) {
      const found = findFileInTree(child, predicate);
      if (found) {
        return found;
      }
    }
  }
  
  return null;
}

/**
 * 파일 트리 통계 계산
 */
export function calculateTreeStats(tree: any): {
  totalFiles: number;
  totalDirectories: number;
  totalSize: number;
  filesByType: Record<string, number>;
  largestFile: { name: string; size: number } | null;
} {
  const stats = {
    totalFiles: 0,
    totalDirectories: 0,
    totalSize: 0,
    filesByType: {} as Record<string, number>,
    largestFile: null as { name: string; size: number } | null
  };
  
  function traverse(node: any): void {
    if (node.type === 'file') {
      stats.totalFiles++;
      stats.totalSize += node.size || 0;
      
      const fileType = getFileType(node.name);
      stats.filesByType[fileType] = (stats.filesByType[fileType] || 0) + 1;
      
      if (!stats.largestFile || (node.size || 0) > stats.largestFile.size) {
        stats.largestFile = { name: node.name, size: node.size || 0 };
      }
    } else if (node.type === 'directory') {
      stats.totalDirectories++;
    }
    
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(traverse);
    }
  }
  
  traverse(tree);
  return stats;
}

/**
 * 중복 파일명 처리
 */
export function handleDuplicateFileName(
  fileName: string, 
  existingNames: string[]
): string {
  if (!existingNames.includes(fileName)) {
    return fileName;
  }
  
  const { name, ext } = parseFilePath(fileName);
  let counter = 1;
  let newFileName: string;
  
  do {
    newFileName = `${name} (${counter})${ext}`;
    counter++;
  } while (existingNames.includes(newFileName));
  
  return newFileName;
}

/**
 * 파일 경로 압축 (긴 경로를 줄여서 표시)
 */
export function compressPath(filePath: string, maxLength: number = 50): string {
  if (filePath.length <= maxLength) {
    return filePath;
  }
  
  const parts = filePath.split('/');
  if (parts.length <= 2) {
    return filePath;
  }
  
  const fileName = parts[parts.length - 1];
  const firstDir = parts[0];
  
  if (firstDir.length + fileName.length + 5 <= maxLength) {
    return `${firstDir}/.../${fileName}`;
  }
  
  return `.../${fileName}`;
}