export interface AnalysisResult {
  projectName: string;
  totalFiles: number;
  totalSize: number;
  languages: Record<string, number>;
  frameworks: string[];
  apiEndpoints: number;
  components: number;
  services: number;
  tests: number;
  hasBackend: boolean;
  hasFrontend: boolean;
  hasDatabase: boolean;
  hasDocker: boolean;
  hasCI: boolean;
  dependencies: string[];
}

// 언어 매핑
const LANGUAGE_MAP: Record<string, string> = {
  js: 'JavaScript',
  jsx: 'JavaScript',
  ts: 'TypeScript',
  tsx: 'TypeScript',
  py: 'Python',
  java: 'Java',
  cpp: 'C++',
  c: 'C',
  cs: 'C#',
  rb: 'Ruby',
  go: 'Go',
  rs: 'Rust',
  php: 'PHP',
  swift: 'Swift',
  kt: 'Kotlin',
  scala: 'Scala',
  r: 'R',
  m: 'Objective-C',
  mm: 'Objective-C++',
  vue: 'Vue',
  svelte: 'Svelte',
  html: 'HTML',
  htm: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  sass: 'Sass',
  less: 'Less',
  json: 'JSON',
  xml: 'XML',
  yaml: 'YAML',
  yml: 'YAML',
  md: 'Markdown',
  sql: 'SQL',
  sh: 'Shell',
  bash: 'Shell',
  ps1: 'PowerShell',
  dockerfile: 'Docker',
  makefile: 'Makefile',
  cmake: 'CMake'
};

// 프레임워크 감지 패턴
const FRAMEWORK_PATTERNS: Record<string, string[]> = {
  React: ['package.json', 'react'],
  Vue: ['package.json', 'vue'],
  Angular: ['angular.json', '@angular'],
  Next: ['next.config.js', 'next.config.ts'],
  Nuxt: ['nuxt.config.js', 'nuxt.config.ts'],
  Express: ['package.json', 'express'],
  Django: ['manage.py', 'django'],
  Flask: ['app.py', 'flask'],
  Spring: ['pom.xml', 'spring'],
  Rails: ['Gemfile', 'rails'],
  Laravel: ['artisan', 'laravel'],
  FastAPI: ['main.py', 'fastapi']
};

export async function analyzeProject(
  files: File[],
  projectName: string
): Promise<AnalysisResult> {
  const result: AnalysisResult = {
    projectName,
    totalFiles: files.length,
    totalSize: files.reduce((sum, file) => sum + file.size, 0),
    languages: {},
    frameworks: [],
    apiEndpoints: 0,
    components: 0,
    services: 0,
    tests: 0,
    hasBackend: false,
    hasFrontend: false,
    hasDatabase: false,
    hasDocker: false,
    hasCI: false,
    dependencies: []
  };

  // 파일 분석
  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const language = LANGUAGE_MAP[ext];
    
    if (language) {
      result.languages[language] = (result.languages[language] || 0) + 1;
    }

    // 특정 파일 패턴 감지
    if (file.name.includes('.test.') || file.name.includes('.spec.')) {
      result.tests++;
    }
    
    if (file.name.includes('component') || file.name.includes('Component')) {
      result.components++;
    }
    
    if (file.name.includes('service') || file.name.includes('Service')) {
      result.services++;
    }
    
    if (file.name.includes('api') || file.name.includes('route')) {
      result.apiEndpoints++;
    }

    // 인프라 관련 파일 감지
    if (file.name === 'Dockerfile' || file.name === 'docker-compose.yml') {
      result.hasDocker = true;
    }
    
    if (file.name === '.gitlab-ci.yml' || file.name === '.github/workflows') {
      result.hasCI = true;
    }
    
    if (file.name.includes('schema.sql') || file.name.includes('migration')) {
      result.hasDatabase = true;
    }
  }

  // 프레임워크 감지
  const fileNames = files.map(f => f.name);
  for (const [framework, patterns] of Object.entries(FRAMEWORK_PATTERNS)) {
    if (patterns.some(pattern => 
      fileNames.some(name => name.includes(pattern))
    )) {
      result.frameworks.push(framework);
    }
  }

  // 프론트엔드/백엔드 판단
  const frontendLangs = ['JavaScript', 'TypeScript', 'HTML', 'CSS', 'Vue', 'Svelte'];
  const backendLangs = ['Python', 'Java', 'C#', 'Ruby', 'Go', 'PHP'];
  
  result.hasFrontend = Object.keys(result.languages).some(lang => 
    frontendLangs.includes(lang)
  );
  
  result.hasBackend = Object.keys(result.languages).some(lang => 
    backendLangs.includes(lang)
  );

  return result;
}