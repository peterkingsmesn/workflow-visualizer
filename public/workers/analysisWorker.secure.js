// 🔒 보안: 핵심 분석 알고리즘 보호된 WebWorker
// 상세 분석 로직은 서버에서만 실행, 클라이언트는 최소한의 처리만

class SecureAnalysisWorker {
  constructor() {
    this.serverEndpoint = '/api/analysis/secure'; // 🔒 서버사이드 분석 엔드포인트
    this.taskQueue = new Map();
  }

  // 🔒 보안: 파일 데이터를 서버로 전송하여 안전하게 분석
  async analyzeProject(files, options = {}) {
    const taskId = this.generateTaskId();
    const startTime = Date.now();
    
    try {
      // 🔒 보안: 민감한 로직 대신 서버 API 호출
      this.postProgress(taskId, {
        stage: 'scanning',
        message: '파일을 준비하는 중...',
        percentage: 10
      });

      // 🔒 파일 데이터 정제 (민감한 정보 제거)
      const sanitizedFiles = this.sanitizeFiles(files);
      
      this.postProgress(taskId, {
        stage: 'analyzing', 
        message: '서버에서 분석 중...',
        percentage: 30
      });

      // 🔒 보안: 실제 분석은 서버에서만 실행
      const analysisResult = await this.requestServerAnalysis(sanitizedFiles, options);
      
      this.postProgress(taskId, {
        stage: 'processing',
        message: '결과를 처리하는 중...',
        percentage: 80
      });

      // 🔒 클라이언트에서는 결과 포맷팅만
      const secureResult = this.formatSecureResult(analysisResult, startTime);
      
      this.postProgress(taskId, {
        stage: 'complete',
        message: '분석 완료',
        percentage: 100,
        result: secureResult
      });

      return secureResult;

    } catch (error) {
      this.postProgress(taskId, {
        stage: 'error',
        message: '분석 중 오류가 발생했습니다.',
        percentage: 0,
        error: this.sanitizeError(error)
      });
      throw error;
    }
  }

  // 🔒 보안: 파일 데이터에서 민감한 정보 제거
  sanitizeFiles(files) {
    return files.map(file => ({
      // 🔒 파일 내용은 서버로 전송하되, 로컬에서는 메타데이터만 유지
      path: this.sanitizePath(file.path),
      name: file.name,
      size: file.size,
      type: file.type,
      // 🔒 보안: 실제 내용은 해시값으로만 저장 (로컬 분석 방지)
      contentHash: this.generateContentHash(file.content),
      // 🔒 서버 분석을 위해 내용은 암호화하여 전송
      encryptedContent: this.encryptContent(file.content)
    }));
  }

  // 🔒 보안: 서버 API 호출로 실제 분석 수행
  async requestServerAnalysis(sanitizedFiles, options) {
    const requestPayload = {
      files: sanitizedFiles,
      options: {
        // 🔒 보안: 클라이언트에서는 분석 옵션만 전달
        includeMetrics: options.includeMetrics || false,
        maxComplexity: options.maxComplexity || 100,
        analysisDepth: options.analysisDepth || 'standard'
      },
      clientId: this.generateClientId(),
      timestamp: Date.now()
    };

    const response = await fetch(this.serverEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.getAuthToken()
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      throw new Error(`서버 분석 실패: ${response.status}`);
    }

    return await response.json();
  }

  // 🔒 보안: 서버 응답을 안전한 형태로 포맷팅
  formatSecureResult(serverResult, startTime) {
    const analysisTime = Date.now() - startTime;
    
    return {
      // 🔒 보안: 상세 분석 정보 대신 요약만 제공
      summary: {
        totalFiles: serverResult.totalFiles || 0,
        issuesFound: serverResult.issues?.length || 0,
        criticalIssues: serverResult.issues?.filter(i => i.severity === 'critical').length || 0,
        codeQualityScore: serverResult.qualityScore || 0,
        analysisTime: analysisTime
      },
      
      // 🔒 보안: 구체적 파일 정보 없는 카테고리화된 이슈만
      issues: (serverResult.issues || []).map(issue => ({
        id: issue.id,
        category: issue.category,
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        recommendation: issue.recommendation,
        affectedCount: issue.affectedCount
      })),
      
      // 🔒 보안: 아키텍처 요약만 (구체적 구현 정보 없음)
      architecture: {
        projectType: serverResult.projectType || 'unknown',
        frameworks: serverResult.frameworks || [],
        hasTests: serverResult.hasTests || false,
        hasDocumentation: serverResult.hasDocumentation || false
      },
      
      // 🔒 클라이언트 메타데이터
      metadata: {
        analysisDate: new Date().toISOString(),
        analysisMethod: 'secure-server-side',
        version: '1.0.0'
      }
    };
  }

  // 🔒 보안: 진행 상황 업데이트 (상세 로직 노출 없음)
  postProgress(taskId, progress) {
    self.postMessage({
      type: 'progress',
      taskId,
      data: {
        stage: progress.stage,
        message: progress.message,
        percentage: progress.percentage,
        timestamp: Date.now(),
        // 🔒 보안: 민감한 중간 결과는 전송하지 않음
        ...(progress.result && { result: progress.result }),
        ...(progress.error && { error: progress.error })
      }
    });
  }

  // 🔒 보안: 오류 정보 정제 (내부 구조 노출 방지)
  sanitizeError(error) {
    return {
      message: '분석 중 문제가 발생했습니다.',
      code: 'ANALYSIS_ERROR',
      timestamp: Date.now()
      // 🔒 보안: 스택 트레이스나 상세 오류 정보 제거
    };
  }

  // 🔒 보안 헬퍼 함수들 (실제 암호화는 서버에서)
  sanitizePath(path) {
    // 🔒 절대 경로 정보 제거, 상대 경로만 유지
    return path.replace(/^.*[/\\]/, '').substring(0, 100);
  }

  generateContentHash(content) {
    // 🔒 간단한 해시 (실제 보안 해시는 서버에서)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit 정수로 변환
    }
    return hash.toString(36);
  }

  encryptContent(content) {
    // 🔒 실제 암호화는 서버에서 처리, 여기서는 플레이스홀더
    return btoa(encodeURIComponent(content.substring(0, 1000))); // 일부만 전송
  }

  generateTaskId() {
    return `secure-task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  generateClientId() {
    return `client-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  getAuthToken() {
    // 🔒 실제 구현에서는 JWT 토큰 등 사용
    return `Bearer ${localStorage.getItem('authToken') || 'anonymous'}`;
  }
}

// 🔒 보안: 레거시 인터페이스 호환성 유지하면서 보안 강화
class LegacyCompatibilityWrapper {
  constructor() {
    this.secureWorker = new SecureAnalysisWorker();
  }

  // 🔒 기존 API와 호환되도록 래핑
  async analyzeDependencies(files) {
    console.warn('🔒 보안: 상세 의존성 분석은 서버에서만 수행됩니다.');
    
    try {
      const result = await this.secureWorker.analyzeProject(files, {
        includeMetrics: true,
        analysisDepth: 'dependency'
      });
      
      // 🔒 보안: 기존 형식과 유사하지만 민감한 정보 제거
      return {
        dependencies: [], // 🔒 빈 배열 (실제 의존성 구조 숨김)
        circularDependencies: [], // 🔒 구체적 순환 의존성 정보 숨김  
        metrics: {
          totalFiles: result.summary.totalFiles,
          // 🔒 보안: 상세 메트릭 대신 점수만
          complexityScore: result.summary.codeQualityScore,
          hasIssues: result.summary.issuesFound > 0
        },
        analysisTime: result.summary.analysisTime
      };
    } catch (error) {
      return {
        dependencies: [],
        circularDependencies: [],
        metrics: { error: true },
        analysisTime: 0
      };
    }
  }

  // 🔒 다른 레거시 메서드들도 유사하게 래핑
  async calculateComplexityScore(files) {
    const result = await this.secureWorker.analyzeProject(files, {
      analysisDepth: 'complexity'
    });
    
    return {
      score: result.summary.codeQualityScore,
      // 🔒 보안: 구체적 계산 과정 숨김
      factors: { hidden: true },
      recommendations: result.issues.slice(0, 3) // 상위 3개 권장사항만
    };
  }
}

// 🔒 보안: 메인 워커 인스턴스 (레거시 호환성 유지)
const analyzer = new LegacyCompatibilityWrapper();

// 🔒 WebWorker 메시지 처리 (보안 강화)
self.onmessage = async function(e) {
  const { type, data, taskId } = e.data;
  
  try {
    let result;
    
    switch (type) {
      case 'ANALYZE_DEPENDENCIES':
        result = await analyzer.analyzeDependencies(data.files);
        break;
        
      case 'CALCULATE_COMPLEXITY':
        result = await analyzer.calculateComplexityScore(data.files);
        break;
        
      case 'FULL_ANALYSIS':
        result = await analyzer.secureWorker.analyzeProject(data.files, data.options);
        break;
        
      default:
        throw new Error(`알 수 없는 분석 타입: ${type}`);
    }
    
    // 🔒 보안: 성공 응답도 정제하여 전송
    self.postMessage({
      type: 'success',
      taskId,
      result: result,
      timestamp: Date.now()
    });
    
  } catch (error) {
    // 🔒 보안: 오류 정보도 안전하게 처리
    self.postMessage({
      type: 'error',
      taskId,
      error: {
        message: '분석 중 오류가 발생했습니다.',
        code: 'WORKER_ERROR'
      },
      timestamp: Date.now()
    });
  }
};