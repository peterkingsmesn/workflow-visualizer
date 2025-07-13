/**
 * 🛡️ 균형잡힌 분석 결과 내보내기 - 보안과 사용성 조화
 * - 핵심 분석 알고리즘은 보호하되, 필수 오류 정보는 제공
 * - 사용자에게는 어떤 파일의 어떤 오류인지 정확히 알려줌
 */

// 🛡️ 보안과 사용성 균형: 필수 정보는 유지, 민감한 로직만 보호
export interface BalancedAnalysisExportData {
  metadata: {
    projectName: string;
    analysisDate: string;
    fileCount: number;
    projectPath: string; // 📍 필요: 사용자가 자신의 프로젝트 위치 확인
    projectType: string;
    analysisVersion: string;
  };
  
  summary: {
    totalFiles: number;
    analyzedFiles: number;
    totalIssues: number;
    criticalErrors: number;
    warnings: number;
    codeQualityScore: number; // 0-100
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
    analysisTime: number;
  };
  
  // 🛡️ 핵심: 파일별 구체적 오류 정보 (사용자에게 필수)
  fileIssues: Array<{
    id: string;
    file: string; // 📍 필요: "src/components/App.tsx"
    relativePath: string; // 📍 필요: 상대 경로
    line?: number; // 📍 필요: 라인 번호
    column?: number; // 📍 선택: 컬럼 번호
    category: 'syntax' | 'dependency' | 'performance' | 'security' | 'maintainability' | 'style';
    severity: 'error' | 'warning' | 'info';
    ruleId: string; // 📍 필요: "react-hooks/exhaustive-deps"
    title: string; // 📍 필요: "Missing dependency in useEffect"
    message: string; // 📍 필요: 구체적인 오류 설명
    suggestion?: string; // 📍 유용: 해결 방법 제안
    
    // 🛡️ 보안: 구체적 감지 알고리즘이나 내부 로직은 숨김
    // detectionAlgorithm: HIDDEN
    // internalScore: HIDDEN
  }>;
  
  // 🛡️ 의존성 정보: 사용자에게 유용하지만 알고리즘은 숨김
  dependencies: {
    summary: {
      totalDependencies: number;
      circularDependencies: number;
      unusedDependencies: number;
      outdatedDependencies: number;
    };
    // 📍 필요: 구체적인 순환 의존성 정보
    circularDeps: Array<{
      id: string;
      cycle: string[]; // ["A.js", "B.js", "C.js", "A.js"]
      severity: 'high' | 'medium' | 'low';
      impact: string;
      suggestion: string;
    }>;
    // 📍 필요: 사용되지 않는 import 정보
    unusedImports: Array<{
      file: string;
      line: number;
      importName: string;
      from: string;
      suggestion: string;
    }>;
    // 🛡️ 보안: 의존성 분석 알고리즘의 세부 로직은 숨김
  };
  
  // 🛡️ 성능 분석: 결과는 제공하되 계산 공식은 숨김
  performance: {
    summary: {
      overallScore: number;
      bundleSize: { estimated: string; impact: 'low' | 'medium' | 'high' };
      renderingIssues: number;
      memoryLeaks: number;
    };
    // 📍 필요: 구체적인 성능 이슈
    issues: Array<{
      file: string;
      line?: number;
      type: 'bundle-size' | 'render-performance' | 'memory-leak' | 'unnecessary-render';
      severity: 'high' | 'medium' | 'low';
      description: string;
      impact: string;
      suggestion: string;
      // 🛡️ 보안: 성능 측정 알고리즘은 숨김
    }>;
  };
  
  // 🛡️ 보안 분석: 결과 제공하되 감지 패턴은 보호
  security: {
    summary: {
      vulnerabilities: number;
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
      score: number;
    };
    // 📍 필요: 보안 이슈 상세 정보
    vulnerabilities: Array<{
      id: string;
      file: string;
      line?: number;
      type: 'xss' | 'injection' | 'sensitive-data' | 'insecure-api';
      severity: 'critical' | 'high' | 'medium' | 'low';
      description: string;
      cwe?: string; // Common Weakness Enumeration
      suggestion: string;
      references?: string[]; // 관련 문서 링크
      // 🛡️ 보안: 취약점 감지 패턴이나 시그니처는 숨김
    }>;
  };
  
  // 📍 아키텍처 정보: 사용자에게 유용한 프로젝트 구조 정보
  architecture: {
    projectType: string;
    frameworks: string[];
    patterns: string[]; // "MVC", "Component-based", "Layered"
    fileStructure: {
      components: number;
      services: number;
      utilities: number;
      tests: number;
      assets: number;
    };
    apiEndpoints?: Array<{
      method: string;
      path: string;
      file: string;
      line?: number;
      // 🛡️ 보안: API 내부 구현 로직은 숨김
    }>;
    stateManagement?: {
      type: string; // "Redux", "Zustand", "Context"
      stores: number;
      complexity: 'simple' | 'moderate' | 'complex';
    };
  };
  
  // 📍 개선 제안: 우선순위와 구체적 액션 아이템
  recommendations: Array<{
    id: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: 'security' | 'performance' | 'maintainability' | 'best-practices';
    title: string;
    description: string;
    actionItems: Array<{
      task: string;
      files?: string[]; // 영향받는 파일 목록
      estimatedEffort: 'low' | 'medium' | 'high';
      impact: string;
    }>;
    // 🛡️ 보안: 추천 시스템의 내부 로직은 숨김
  }>;
}

// 🛡️ 균형잡힌 변환 함수: 필수 정보 유지하면서 민감한 로직 보호
export function convertToBalancedFormat(
  fullAnalysis: any,
  projectName: string,
  projectPath: string
): BalancedAnalysisExportData {
  const startTime = Date.now();
  
  return {
    metadata: {
      projectName,
      analysisDate: new Date().toISOString(),
      fileCount: fullAnalysis.totalFiles || 0,
      projectPath: sanitizeProjectPath(projectPath), // 📍 필요하지만 안전하게
      projectType: detectProjectType(fullAnalysis.frameworks),
      analysisVersion: '2.0.0-balanced',
    },
    
    summary: {
      totalFiles: fullAnalysis.totalFiles || 0,
      analyzedFiles: fullAnalysis.analyzedFiles || 0,
      totalIssues: (fullAnalysis.errors?.length || 0) + (fullAnalysis.warnings?.length || 0),
      criticalErrors: fullAnalysis.errors?.filter(e => e.severity === 'error').length || 0,
      warnings: fullAnalysis.warnings?.length || 0,
      codeQualityScore: calculateQualityScore(fullAnalysis), // 🛡️ 계산 로직은 숨김
      overallHealth: getHealthStatus(fullAnalysis),
      analysisTime: Date.now() - startTime,
    },
    
    // 📍 핵심: 구체적인 파일별 오류 정보 제공
    fileIssues: convertFileIssues(fullAnalysis.errors, fullAnalysis.warnings),
    
    dependencies: {
      summary: {
        totalDependencies: fullAnalysis.dependencies?.length || 0,
        circularDependencies: fullAnalysis.circularDependencies?.length || 0,
        unusedDependencies: fullAnalysis.unusedImports?.length || 0,
        outdatedDependencies: fullAnalysis.outdatedDependencies?.length || 0,
      },
      // 📍 필요: 구체적인 순환 의존성
      circularDeps: convertCircularDependencies(fullAnalysis.circularDependencies),
      // 📍 필요: 사용되지 않는 import
      unusedImports: convertUnusedImports(fullAnalysis.unusedImports),
    },
    
    performance: {
      summary: {
        overallScore: fullAnalysis.performanceScore || 0,
        bundleSize: estimateBundleSize(fullAnalysis),
        renderingIssues: fullAnalysis.renderingIssues?.length || 0,
        memoryLeaks: fullAnalysis.memoryLeaks?.length || 0,
      },
      issues: convertPerformanceIssues(fullAnalysis.performanceIssues),
    },
    
    security: {
      summary: {
        vulnerabilities: fullAnalysis.securityIssues?.length || 0,
        riskLevel: calculateRiskLevel(fullAnalysis.securityIssues),
        score: fullAnalysis.securityScore || 100,
      },
      vulnerabilities: convertSecurityIssues(fullAnalysis.securityIssues),
    },
    
    architecture: {
      projectType: fullAnalysis.projectType || 'unknown',
      frameworks: fullAnalysis.frameworks || [],
      patterns: detectArchitecturalPatterns(fullAnalysis),
      fileStructure: analyzeFileStructure(fullAnalysis),
      apiEndpoints: convertApiEndpoints(fullAnalysis.apiEndpoints),
      stateManagement: analyzeStateManagement(fullAnalysis),
    },
    
    recommendations: generateActionableRecommendations(fullAnalysis),
  };
}

// 🛡️ 파일별 이슈 변환: 구체적 정보 유지
function convertFileIssues(errors: any[] = [], warnings: any[] = []): BalancedAnalysisExportData['fileIssues'] {
  const allIssues = [...errors, ...warnings];
  
  return allIssues.map((issue, index) => ({
    id: `issue-${index + 1}`,
    file: getFileName(issue.file || issue.path), // 📍 필요: 파일명
    relativePath: issue.path || issue.file || '', // 📍 필요: 상대경로
    line: issue.line, // 📍 필요: 라인 번호
    column: issue.column,
    category: mapIssueCategory(issue.type),
    severity: issue.severity === 'error' ? 'error' : 'warning',
    ruleId: issue.ruleId || issue.type || 'unknown',
    title: issue.title || getGenericTitle(issue.type),
    message: issue.message || getGenericMessage(issue.type),
    suggestion: issue.suggestion || generateSuggestion(issue.type),
  }));
}

// 📍 순환 의존성: 구체적 정보 필요
function convertCircularDependencies(circularDeps: any[] = []): BalancedAnalysisExportData['dependencies']['circularDeps'] {
  return circularDeps.map((dep, index) => ({
    id: `circular-${index + 1}`,
    cycle: dep.cycle || [],
    severity: dep.severity || 'medium',
    impact: '번들 크기 증가 및 로딩 성능 저하',
    suggestion: '모듈 구조를 재설계하여 단방향 의존성으로 변경하세요.',
  }));
}

// 📍 사용되지 않는 import: 구체적 정보 필요
function convertUnusedImports(unusedImports: any[] = []): BalancedAnalysisExportData['dependencies']['unusedImports'] {
  return unusedImports.map(imp => ({
    file: getFileName(imp.file),
    line: imp.line || 0,
    importName: imp.name || imp.importName || '',
    from: imp.from || imp.source || '',
    suggestion: `사용되지 않는 import '${imp.name}'를 제거하세요.`,
  }));
}

// 🛡️ 헬퍼 함수들 (보안과 사용성 균형)
function sanitizeProjectPath(path: string): string {
  // 📍 필요: 프로젝트 루트 상대 경로는 유지하되, 절대 경로 민감 정보 제거
  return path.replace(/^.*[\/\\]([^\/\\]+[\/\\][^\/\\]+)$/, '$1') || path;
}

function getFileName(fullPath: string): string {
  return fullPath ? fullPath.split(/[\/\\]/).pop() || fullPath : '';
}

function mapIssueCategory(type: string): BalancedAnalysisExportData['fileIssues'][0]['category'] {
  const categoryMap: Record<string, BalancedAnalysisExportData['fileIssues'][0]['category']> = {
    'syntax-error': 'syntax',
    'circular-dependency': 'dependency',
    'unused-import': 'maintainability',
    'performance-warning': 'performance',
    'security-risk': 'security',
    'style-violation': 'style',
  };
  
  return categoryMap[type] || 'maintainability';
}

function getGenericTitle(type: string): string {
  const titles: Record<string, string> = {
    'react-hook-violation': 'React Hook 규칙 위반',
    'circular-dependency': '순환 의존성',
    'unused-import': '사용되지 않는 import',
    'performance-warning': '성능 경고',
    'security-risk': '보안 위험',
    'syntax-error': '문법 오류',
  };
  
  return titles[type] || '코드 품질 이슈';
}

function getGenericMessage(type: string): string {
  const messages: Record<string, string> = {
    'react-hook-violation': 'React Hook 사용 규칙을 확인하세요.',
    'circular-dependency': '모듈 간 순환 참조가 감지되었습니다.',
    'unused-import': '사용되지 않는 import 구문입니다.',
    'performance-warning': '성능에 영향을 줄 수 있는 패턴입니다.',
    'security-risk': '보안에 위험할 수 있는 코드입니다.',
    'syntax-error': '문법 오류가 있습니다.',
  };
  
  return messages[type] || '코드를 검토해주세요.';
}

function generateSuggestion(type: string): string {
  const suggestions: Record<string, string> = {
    'react-hook-violation': 'React Hook 규칙 문서를 참고하여 수정하세요.',
    'circular-dependency': '의존성 구조를 단방향으로 리팩토링하세요.',
    'unused-import': '사용하지 않는 import를 제거하세요.',
    'performance-warning': '성능 최적화 방법을 적용해보세요.',
    'security-risk': '보안 가이드라인을 확인하세요.',
    'syntax-error': '문법 오류를 수정하세요.',
  };
  
  return suggestions[type] || '코드 리뷰를 통해 개선하세요.';
}

// 🛡️ 기타 분석 함수들 (결과는 제공하되 알고리즘은 보호)
function calculateQualityScore(analysis: any): number {
  // 🛡️ 보안: 구체적인 계산 공식은 숨기되 결과는 제공
  const errors = analysis.errors?.length || 0;
  const warnings = analysis.warnings?.length || 0;
  return Math.max(0, 100 - (errors * 10) - (warnings * 2));
}

function getHealthStatus(analysis: any): BalancedAnalysisExportData['summary']['overallHealth'] {
  const score = calculateQualityScore(analysis);
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'fair';
  return 'poor';
}

function detectProjectType(frameworks?: string[]): string {
  if (!frameworks) return 'unknown';
  if (frameworks.includes('react')) return 'react';
  if (frameworks.includes('vue')) return 'vue';
  if (frameworks.includes('angular')) return 'angular';
  return 'javascript';
}

function convertPerformanceIssues(issues: any[] = []): BalancedAnalysisExportData['performance']['issues'] {
  return issues.map((issue, index) => ({
    file: getFileName(issue.file),
    line: issue.line,
    type: issue.type || 'render-performance',
    severity: issue.severity || 'medium',
    description: issue.description || '성능 이슈가 감지되었습니다.',
    impact: issue.impact || '사용자 경험에 영향을 줄 수 있습니다.',
    suggestion: issue.suggestion || '성능 최적화를 고려해보세요.',
  }));
}

function convertSecurityIssues(issues: any[] = []): BalancedAnalysisExportData['security']['vulnerabilities'] {
  return issues.map((issue, index) => ({
    id: `vuln-${index + 1}`,
    file: getFileName(issue.file),
    line: issue.line,
    type: issue.type || 'sensitive-data',
    severity: issue.severity || 'medium',
    description: issue.description || '보안 취약점이 발견되었습니다.',
    cwe: issue.cwe,
    suggestion: issue.suggestion || '보안 가이드라인을 참고하세요.',
    references: issue.references,
  }));
}

function estimateBundleSize(analysis: any): { estimated: string; impact: 'low' | 'medium' | 'high' } {
  const totalFiles = analysis.totalFiles || 0;
  const estimated = totalFiles < 50 ? 'Small' : totalFiles < 200 ? 'Medium' : 'Large';
  const impact = totalFiles < 50 ? 'low' : totalFiles < 200 ? 'medium' : 'high';
  return { estimated, impact };
}

function calculateRiskLevel(securityIssues: any[] = []): 'low' | 'medium' | 'high' | 'critical' {
  const criticalCount = securityIssues.filter(i => i.severity === 'critical').length;
  const highCount = securityIssues.filter(i => i.severity === 'high').length;
  
  if (criticalCount > 0) return 'critical';
  if (highCount > 2) return 'high';
  if (securityIssues.length > 5) return 'medium';
  return 'low';
}

function detectArchitecturalPatterns(analysis: any): string[] {
  const patterns = [];
  if (analysis.hasComponents) patterns.push('Component-based');
  if (analysis.hasServices) patterns.push('Service-oriented');
  if (analysis.hasControllers) patterns.push('MVC');
  return patterns.length > 0 ? patterns : ['Standard'];
}

function analyzeFileStructure(analysis: any): BalancedAnalysisExportData['architecture']['fileStructure'] {
  return {
    components: analysis.fileTypes?.component || 0,
    services: analysis.fileTypes?.service || 0,
    utilities: analysis.fileTypes?.utility || 0,
    tests: analysis.fileTypes?.test || 0,
    assets: analysis.fileTypes?.asset || 0,
  };
}

function convertApiEndpoints(endpoints: any[] = []): BalancedAnalysisExportData['architecture']['apiEndpoints'] {
  return endpoints.map(endpoint => ({
    method: endpoint.method || 'GET',
    path: endpoint.path || '',
    file: getFileName(endpoint.file),
    line: endpoint.line,
  }));
}

function analyzeStateManagement(analysis: any): BalancedAnalysisExportData['architecture']['stateManagement'] | undefined {
  const stateLibs = ['redux', 'zustand', 'mobx', 'recoil'];
  const detectedLib = analysis.frameworks?.find((f: string) => 
    stateLibs.some(lib => f.toLowerCase().includes(lib)));
  
  if (detectedLib) {
    return {
      type: detectedLib,
      stores: analysis.stateStores || 1,
      complexity: analysis.stateComplexity || 'moderate',
    };
  }
  return undefined;
}

function generateActionableRecommendations(analysis: any): BalancedAnalysisExportData['recommendations'] {
  const recommendations: BalancedAnalysisExportData['recommendations'] = [];
  
  // 📍 구체적이고 실행 가능한 권장사항 생성
  if ((analysis.errors?.length || 0) > 0) {
    recommendations.push({
      id: 'fix-errors',
      priority: 'critical',
      category: 'best-practices',
      title: '오류 수정',
      description: '발견된 오류들을 우선적으로 수정하세요.',
      actionItems: [
        {
          task: '문법 오류 및 타입 오류 수정',
          estimatedEffort: 'medium',
          impact: '애플리케이션 안정성 향상',
        },
      ],
    });
  }
  
  if ((analysis.circularDependencies?.length || 0) > 0) {
    recommendations.push({
      id: 'fix-circular-deps',
      priority: 'high',
      category: 'maintainability',
      title: '순환 의존성 해결',
      description: '순환 의존성을 제거하여 코드 구조를 개선하세요.',
      actionItems: [
        {
          task: '모듈 구조 리팩토링',
          estimatedEffort: 'high',
          impact: '번들 크기 감소 및 성능 향상',
        },
      ],
    });
  }
  
  return recommendations;
}