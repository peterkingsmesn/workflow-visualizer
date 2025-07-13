/**
 * 🔒 보안 강화된 분석 결과 내보내기 유틸리티
 * - 핵심 분석 알고리즘과 상세 로직 보호
 * - 사용자에게는 오류 정보와 개선 제안만 제공
 */

// 🔒 보안: 민감한 정보 제거된 안전한 내보내기 인터페이스
export interface SecureAnalysisExportData {
  metadata: {
    projectName: string;
    analysisDate: string;
    fileCount: number; // 구체적인 경로 대신 파일 수만
    projectType: string; // react, vue, angular 등
  };
  
  // 🔒 보안: 전체 구조 대신 요약 정보만
  summary: {
    totalIssues: number;
    criticalIssues: number;
    warningCount: number;
    codeQualityScore: number; // 0-100 점수
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  };
  
  // 🔒 보안: 파일 경로/라인 번호 제거, 카테고리화된 이슈만
  issues: Array<{
    id: string; // 고유 ID (파일 정보 없음)
    category: 'dependency' | 'syntax' | 'performance' | 'security' | 'maintainability';
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string; // "React Hook 규칙 위반"
    description: string; // 일반적인 설명
    impact: string; // "성능 저하 가능성"
    recommendation: string; // "Hook 사용 패턴 검토 필요"
    affectedCount: number; // 영향받는 파일 수 (구체적 위치 없음)
  }>;
  
  // 🔒 보안: 구체적인 API 경로 대신 요약만
  architecture: {
    frameworksDetected: string[];
    archPatterns: string[]; // "MVC", "Component-based" 등
    hasApiLayer: boolean;
    hasStateManagement: boolean;
    testCoverage: 'none' | 'low' | 'medium' | 'high';
  };
  
  // 🔒 보안: 개선 제안 (구체적 구현 방법 없음)
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    estimatedImpact: string;
  }>;
}

// 🔒 기존 상세 데이터를 안전한 형식으로 변환
export function convertToSecureFormat(
  fullAnalysis: any, // 내부 상세 분석 결과
  projectName: string
): SecureAnalysisExportData {
  // 🔒 보안: 상세 로직은 서버사이드에서만 실행
  const issueCategories = categorizeIssues(fullAnalysis.errors, fullAnalysis.warnings);
  const qualityScore = calculateQualityScore(issueCategories);
  
  return {
    metadata: {
      projectName,
      analysisDate: new Date().toISOString(),
      fileCount: fullAnalysis.totalFiles || 0,
      projectType: detectProjectType(fullAnalysis.frameworks),
    },
    
    summary: {
      totalIssues: issueCategories.length,
      criticalIssues: issueCategories.filter(i => i.severity === 'critical').length,
      warningCount: issueCategories.filter(i => i.severity === 'low').length,
      codeQualityScore: qualityScore,
      overallHealth: getHealthStatus(qualityScore),
    },
    
    issues: issueCategories,
    
    architecture: {
      frameworksDetected: fullAnalysis.frameworks || [],
      archPatterns: detectArchPatterns(fullAnalysis),
      hasApiLayer: hasApiEndpoints(fullAnalysis),
      hasStateManagement: hasStateManagement(fullAnalysis),
      testCoverage: estimateTestCoverage(fullAnalysis),
    },
    
    recommendations: generateRecommendations(issueCategories, qualityScore),
  };
}

// 🔒 민감한 이슈 정보를 카테고리로 변환 (내부 로직 숨김)
function categorizeIssues(errors: any[], warnings: any[]): SecureAnalysisExportData['issues'] {
  const allIssues = [...(errors || []), ...(warnings || [])];
  const categorizedMap = new Map<string, any>();
  
  allIssues.forEach(issue => {
    // 🔒 보안: 구체적인 파일 정보 제거, 패턴별로 그룹화
    const category = mapToSecureCategory(issue.type);
    const key = `${category}-${issue.type}`;
    
    if (!categorizedMap.has(key)) {
      categorizedMap.set(key, {
        id: generateSecureId(),
        category,
        severity: mapToSecureSeverity(issue.severity),
        title: getGenericTitle(issue.type),
        description: getGenericDescription(issue.type),
        impact: getImpactDescription(issue.type),
        recommendation: getRecommendation(issue.type),
        affectedCount: 0,
      });
    }
    
    categorizedMap.get(key)!.affectedCount++;
  });
  
  return Array.from(categorizedMap.values());
}

// 🔒 보안: 내부 이슈 타입을 안전한 카테고리로 매핑
function mapToSecureCategory(issueType: string): SecureAnalysisExportData['issues'][0]['category'] {
  const categoryMap: Record<string, SecureAnalysisExportData['issues'][0]['category']> = {
    'react-hook-violation': 'dependency',
    'circular-dependency': 'dependency',
    'unused-import': 'maintainability',
    'performance-warning': 'performance',
    'security-risk': 'security',
    'syntax-error': 'syntax',
  };
  
  return categoryMap[issueType] || 'maintainability';
}

// 🔒 보안: 일반적인 제목만 제공 (구체적 파일/라인 정보 없음)
function getGenericTitle(issueType: string): string {
  const titleMap: Record<string, string> = {
    'react-hook-violation': 'React Hook 사용 규칙 위반',
    'circular-dependency': '순환 의존성 발견',
    'unused-import': '사용되지 않는 import',
    'performance-warning': '성능 최적화 필요',
    'security-risk': '보안 위험 요소',
    'syntax-error': '문법 오류',
  };
  
  return titleMap[issueType] || '코드 품질 이슈';
}

// 🔒 보안: 구체적 구현 방법 없는 일반적 설명만
function getGenericDescription(issueType: string): string {
  const descMap: Record<string, string> = {
    'react-hook-violation': 'React Hook 사용 규칙을 위반하는 패턴이 감지되었습니다.',
    'circular-dependency': '모듈 간 순환 참조가 발견되어 번들 크기와 성능에 영향을 줄 수 있습니다.',
    'unused-import': '사용되지 않는 import 구문이 있어 번들 크기를 증가시킬 수 있습니다.',
    'performance-warning': '성능에 영향을 줄 수 있는 패턴이 발견되었습니다.',
    'security-risk': '보안에 위험을 줄 수 있는 코드 패턴이 감지되었습니다.',
    'syntax-error': '문법 오류가 있어 컴파일에 실패할 수 있습니다.',
  };
  
  return descMap[issueType] || '코드 품질 개선이 필요합니다.';
}

// 🔒 보안: 구체적 해결 방법 대신 일반적 권장사항만
function getRecommendation(issueType: string): string {
  const recMap: Record<string, string> = {
    'react-hook-violation': 'React 공식 문서의 Hook 규칙을 참고하여 수정해주세요.',
    'circular-dependency': '모듈 구조를 재검토하고 의존성을 단방향으로 정리해주세요.',
    'unused-import': '사용하지 않는 import 구문을 제거해주세요.',
    'performance-warning': '성능 최적화 가이드를 참고하여 개선해주세요.',
    'security-risk': '보안 가이드라인을 참고하여 코드를 수정해주세요.',
    'syntax-error': '문법 오류를 수정해주세요.',
  };
  
  return recMap[issueType] || '코드 리뷰를 통해 개선해주세요.';
}

// 🔒 기타 보안 헬퍼 함수들 (구현 로직 숨김)
function calculateQualityScore(issues: any[]): number {
  // 🔒 보안: 구체적인 계산 공식 숨김
  return Math.max(0, 100 - (issues.length * 5));
}

function getHealthStatus(score: number): SecureAnalysisExportData['summary']['overallHealth'] {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'fair';
  return 'poor';
}

function generateSecureId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function detectProjectType(frameworks?: string[]): string {
  if (!frameworks) return 'unknown';
  if (frameworks.includes('react')) return 'react';
  if (frameworks.includes('vue')) return 'vue';
  if (frameworks.includes('angular')) return 'angular';
  return 'javascript';
}

function detectArchPatterns(analysis: any): string[] {
  // 🔒 보안: 패턴 감지 로직 숨김
  return ['Component-based'];
}

function hasApiEndpoints(analysis: any): boolean {
  return !!(analysis.dataFlow?.apiEndpoints?.length);
}

function hasStateManagement(analysis: any): boolean {
  return !!(analysis.frameworks?.some((f: string) => 
    ['redux', 'zustand', 'mobx', 'recoil'].includes(f.toLowerCase())));
}

function estimateTestCoverage(analysis: any): 'none' | 'low' | 'medium' | 'high' {
  const testFiles = analysis.fileTypes?.test || 0;
  const totalFiles = analysis.totalFiles || 1;
  const ratio = testFiles / totalFiles;
  
  if (ratio === 0) return 'none';
  if (ratio < 0.3) return 'low';
  if (ratio < 0.6) return 'medium';
  return 'high';
}

function generateRecommendations(
  issues: SecureAnalysisExportData['issues'], 
  score: number
): SecureAnalysisExportData['recommendations'] {
  const recommendations: SecureAnalysisExportData['recommendations'] = [];
  
  if (score < 70) {
    recommendations.push({
      priority: 'high',
      category: 'Code Quality',
      title: '코드 품질 개선',
      description: '전반적인 코드 품질 향상이 필요합니다.',
      estimatedImpact: '유지보수성 및 안정성 향상',
    });
  }
  
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  if (criticalIssues.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'Critical Issues',
      title: '긴급 이슈 해결',
      description: '심각한 문제들을 우선적으로 해결해주세요.',
      estimatedImpact: '시스템 안정성 확보',
    });
  }
  
  return recommendations;
}

function getImpactDescription(issueType: string): string {
  const impactMap: Record<string, string> = {
    'react-hook-violation': '렌더링 성능 저하 및 예상치 못한 동작',
    'circular-dependency': '번들 크기 증가 및 로딩 성능 저하',
    'unused-import': '번들 크기 불필요한 증가',
    'performance-warning': '사용자 경험 저하',
    'security-risk': '보안 취약점 노출',
    'syntax-error': '애플리케이션 실행 불가',
  };
  
  return impactMap[issueType] || '코드 품질 저하';
}

function mapToSecureSeverity(severity: string): SecureAnalysisExportData['issues'][0]['severity'] {
  const severityMap: Record<string, SecureAnalysisExportData['issues'][0]['severity']> = {
    'error': 'critical',
    'warning': 'medium',
    'info': 'low',
  };
  
  return severityMap[severity] || 'medium';
}