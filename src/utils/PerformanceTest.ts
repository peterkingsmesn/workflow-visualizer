/* 🚀 성능 테스트: Core Web Vitals 측정 및 성능 분석 */

import PerformanceMonitor from './PerformanceMonitor';

// 성능 테스트 인터페이스
export interface PerformanceTestResult {
  testName: string;
  timestamp: number;
  metrics: {
    // Core Web Vitals
    lcp?: number; // Largest Contentful Paint
    fid?: number; // First Input Delay
    cls?: number; // Cumulative Layout Shift
    fcp?: number; // First Contentful Paint
    ttfb?: number; // Time to First Byte
    // 추가 메트릭
    domContentLoaded?: number;
    loadComplete?: number;
    renderTime?: number;
    memoryUsage?: number;
    jsHeapSize?: number;
    // 워크플로우 특화 메트릭
    nodeRenderTime?: number;
    canvasInitTime?: number;
    interactionLatency?: number;
  };
  passed: boolean;
  thresholds: PerformanceThresholds;
  details?: string;
}

export interface PerformanceThresholds {
  lcp: number; // 2.5s
  fid: number; // 100ms
  cls: number; // 0.1
  fcp: number; // 1.8s
  ttfb: number; // 600ms
  domContentLoaded: number; // 1.5s
  loadComplete: number; // 3s
  renderTime: number; // 16ms (60fps)
  memoryUsage: number; // 50MB
  jsHeapSize: number; // 100MB
  nodeRenderTime: number; // 100ms
  canvasInitTime: number; // 500ms
  interactionLatency: number; // 50ms
}

export class PerformanceTest {
  private static instance: PerformanceTest;
  private observer: PerformanceObserver | null = null;
  private results: PerformanceTestResult[] = [];
  private thresholds: PerformanceThresholds;
  private isRunning = false;
  private currentTest: string | null = null;
  private testStartTime = 0;
  private performanceMonitor: typeof PerformanceMonitor;

  private constructor() {
    this.thresholds = {
      lcp: 2500, // 2.5s
      fid: 100, // 100ms
      cls: 0.1, // 0.1
      fcp: 1800, // 1.8s
      ttfb: 600, // 600ms
      domContentLoaded: 1500, // 1.5s
      loadComplete: 3000, // 3s
      renderTime: 16, // 16ms for 60fps
      memoryUsage: 50 * 1024 * 1024, // 50MB
      jsHeapSize: 100 * 1024 * 1024, // 100MB
      nodeRenderTime: 100, // 100ms
      canvasInitTime: 500, // 500ms
      interactionLatency: 50 // 50ms
    };

    this.performanceMonitor = PerformanceMonitor;
    this.initializeObserver();
  }

  public static getInstance(): PerformanceTest {
    if (!PerformanceTest.instance) {
      PerformanceTest.instance = new PerformanceTest();
    }
    return PerformanceTest.instance;
  }

  // 🚀 성능 테스트: 관찰자 초기화
  private initializeObserver(): void {
    if (!window.PerformanceObserver) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      // 다양한 성능 지표 관찰
      this.observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift', 'navigation', 'resource'] });
    } catch (error) {
      console.error('Failed to initialize PerformanceObserver:', error);
    }
  }

  // 🚀 성능 테스트: 성능 엔트리 처리
  private processPerformanceEntry(entry: PerformanceEntry): void {
    if (!this.isRunning || !this.currentTest) return;

    const testResult = this.results.find(r => r.testName === this.currentTest);
    if (!testResult) return;

    switch (entry.entryType) {
      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          testResult.metrics.fcp = entry.startTime;
        }
        break;

      case 'largest-contentful-paint':
        testResult.metrics.lcp = entry.startTime;
        break;

      case 'first-input':
        testResult.metrics.fid = (entry as any).processingStart - entry.startTime;
        break;

      case 'layout-shift':
        if (!(entry as any).hadRecentInput) {
          testResult.metrics.cls = (testResult.metrics.cls || 0) + (entry as any).value;
        }
        break;

      case 'navigation':
        const navEntry = entry as PerformanceNavigationTiming;
        testResult.metrics.ttfb = navEntry.responseStart - navEntry.requestStart;
        testResult.metrics.domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.fetchStart;
        testResult.metrics.loadComplete = navEntry.loadEventEnd - navEntry.fetchStart;
        break;
    }
  }

  // 🚀 성능 테스트: 테스트 시작
  public startTest(testName: string): void {
    if (this.isRunning) {
      console.warn('Another test is already running');
      return;
    }

    this.isRunning = true;
    this.currentTest = testName;
    this.testStartTime = performance.now();

    const testResult: PerformanceTestResult = {
      testName,
      timestamp: Date.now(),
      metrics: {
        renderTime: 0,
        memoryUsage: 0
      },
      passed: false,
      thresholds: { ...this.thresholds },
      details: ''
    };

    this.results.push(testResult);
    console.log(`🚀 Performance test started: ${testName}`);
  }

  // 🚀 성능 테스트: 테스트 종료
  public endTest(): PerformanceTestResult | null {
    if (!this.isRunning || !this.currentTest) {
      console.warn('No active test to end');
      return null;
    }

    const testResult = this.results.find(r => r.testName === this.currentTest);
    if (!testResult) return null;

    // 추가 메트릭 측정
    testResult.metrics.renderTime = performance.now() - this.testStartTime;
    
    // 메모리 사용량 측정
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      testResult.metrics.memoryUsage = memInfo.usedJSHeapSize;
      testResult.metrics.jsHeapSize = memInfo.totalJSHeapSize;
    }

    // 성능 테스트 결과 평가
    testResult.passed = this.evaluateTestResult(testResult);
    testResult.details = this.generateTestDetails(testResult);

    this.isRunning = false;
    this.currentTest = null;

    console.log(`🚀 Performance test completed: ${testResult.testName}`, testResult);
    return testResult;
  }

  // 🚀 성능 테스트: 워크플로우 특화 테스트
  public async testWorkflowPerformance(): Promise<PerformanceTestResult> {
    this.startTest('Workflow Performance Test');

    // 캔버스 초기화 시간 측정
    const canvasInitStart = performance.now();
    await this.simulateCanvasInitialization();
    const canvasInitEnd = performance.now();

    // 노드 렌더링 시간 측정
    const nodeRenderStart = performance.now();
    await this.simulateNodeRendering();
    const nodeRenderEnd = performance.now();

    // 상호작용 지연 시간 측정
    const interactionStart = performance.now();
    await this.simulateUserInteraction();
    const interactionEnd = performance.now();

    const testResult = this.results.find(r => r.testName === 'Workflow Performance Test');
    if (testResult) {
      testResult.metrics.canvasInitTime = canvasInitEnd - canvasInitStart;
      testResult.metrics.nodeRenderTime = nodeRenderEnd - nodeRenderStart;
      testResult.metrics.interactionLatency = interactionEnd - interactionStart;
    }

    return this.endTest()!;
  }

  // 🚀 성능 테스트: 라이트하우스 스타일 감사
  public async runLighthouseAudit(): Promise<PerformanceTestResult> {
    this.startTest('Lighthouse Audit');

    // Core Web Vitals 측정 대기
    await this.waitForCoreWebVitals();

    // 추가 성능 메트릭 수집
    await this.collectAdditionalMetrics();

    return this.endTest()!;
  }

  // 🚀 성능 테스트: 부하 테스트
  public async loadTest(nodeCount: number = 1000): Promise<PerformanceTestResult> {
    this.startTest(`Load Test (${nodeCount} nodes)`);

    const loadStart = performance.now();
    
    // 대량의 노드 생성 시뮬레이션
    for (let i = 0; i < nodeCount; i++) {
      await this.simulateNodeCreation();
      
      // 60fps 유지를 위한 프레임 체크
      if (i % 100 === 0) {
        await this.waitForNextFrame();
      }
    }

    const loadEnd = performance.now();

    const testResult = this.results.find(r => r.testName === `Load Test (${nodeCount} nodes)`);
    if (testResult) {
      testResult.metrics.renderTime = loadEnd - loadStart;
      testResult.metrics.nodeRenderTime = (loadEnd - loadStart) / nodeCount;
    }

    return this.endTest()!;
  }

  // 🚀 성능 테스트: 메모리 누수 테스트
  public async memoryLeakTest(): Promise<PerformanceTestResult> {
    this.startTest('Memory Leak Test');

    const initialMemory = this.getMemoryUsage();
    let peakMemory = initialMemory;

    // 메모리 사용량 모니터링
    const memoryMonitor = setInterval(() => {
      const currentMemory = this.getMemoryUsage();
      if (currentMemory > peakMemory) {
        peakMemory = currentMemory;
      }
    }, 100);

    try {
      // 메모리 집약적인 작업 시뮬레이션
      for (let i = 0; i < 1000; i++) {
        await this.simulateMemoryIntensiveTask();
        
        // 가비지 컬렉션 유도
        if (i % 100 === 0 && 'gc' in window) {
          (window as any).gc();
        }
      }

      // 정리 후 메모리 사용량 확인
      await this.waitForGarbageCollection();
      const finalMemory = this.getMemoryUsage();

      const testResult = this.results.find(r => r.testName === 'Memory Leak Test');
      if (testResult) {
        testResult.metrics.memoryUsage = finalMemory - initialMemory;
        testResult.metrics.jsHeapSize = peakMemory;
      }

    } finally {
      clearInterval(memoryMonitor);
    }

    return this.endTest()!;
  }

  // 🚀 성능 테스트: 결과 평가
  private evaluateTestResult(result: PerformanceTestResult): boolean {
    const failures: string[] = [];

    // Core Web Vitals 검사
    if (result.metrics.lcp && result.metrics.lcp > this.thresholds.lcp) {
      failures.push(`LCP: ${result.metrics.lcp}ms > ${this.thresholds.lcp}ms`);
    }
    if (result.metrics.fid && result.metrics.fid > this.thresholds.fid) {
      failures.push(`FID: ${result.metrics.fid}ms > ${this.thresholds.fid}ms`);
    }
    if (result.metrics.cls && result.metrics.cls > this.thresholds.cls) {
      failures.push(`CLS: ${result.metrics.cls} > ${this.thresholds.cls}`);
    }
    if (result.metrics.fcp && result.metrics.fcp > this.thresholds.fcp) {
      failures.push(`FCP: ${result.metrics.fcp}ms > ${this.thresholds.fcp}ms`);
    }

    // 메모리 사용량 검사
    if (result.metrics.memoryUsage && result.metrics.memoryUsage > this.thresholds.memoryUsage) {
      failures.push(`Memory: ${(result.metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB > ${(this.thresholds.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
    }

    // 워크플로우 특화 메트릭 검사
    if (result.metrics.nodeRenderTime && result.metrics.nodeRenderTime > this.thresholds.nodeRenderTime) {
      failures.push(`Node Render: ${result.metrics.nodeRenderTime}ms > ${this.thresholds.nodeRenderTime}ms`);
    }
    if (result.metrics.canvasInitTime && result.metrics.canvasInitTime > this.thresholds.canvasInitTime) {
      failures.push(`Canvas Init: ${result.metrics.canvasInitTime}ms > ${this.thresholds.canvasInitTime}ms`);
    }

    if (failures.length > 0) {
      result.details = `Performance test failed: ${failures.join(', ')}`;
      return false;
    }

    result.details = 'All performance metrics passed';
    return true;
  }

  // 🚀 성능 테스트: 테스트 세부사항 생성
  private generateTestDetails(result: PerformanceTestResult): string {
    const details: string[] = [];

    if (result.metrics.lcp) {
      const status = result.metrics.lcp <= this.thresholds.lcp ? '✅' : '❌';
      details.push(`${status} LCP: ${result.metrics.lcp}ms`);
    }
    if (result.metrics.fid) {
      const status = result.metrics.fid <= this.thresholds.fid ? '✅' : '❌';
      details.push(`${status} FID: ${result.metrics.fid}ms`);
    }
    if (result.metrics.cls) {
      const status = result.metrics.cls <= this.thresholds.cls ? '✅' : '❌';
      details.push(`${status} CLS: ${result.metrics.cls.toFixed(3)}`);
    }
    if (result.metrics.fcp) {
      const status = result.metrics.fcp <= this.thresholds.fcp ? '✅' : '❌';
      details.push(`${status} FCP: ${result.metrics.fcp}ms`);
    }

    return details.join('\n');
  }

  // 🚀 성능 테스트: 헬퍼 메서드들
  private async simulateCanvasInitialization(): Promise<void> {
    // 캔버스 초기화 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  private async simulateNodeRendering(): Promise<void> {
    // 노드 렌더링 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 30));
  }

  private async simulateUserInteraction(): Promise<void> {
    // 사용자 상호작용 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  private async simulateNodeCreation(): Promise<void> {
    // 노드 생성 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1));
  }

  private async simulateMemoryIntensiveTask(): Promise<void> {
    // 메모리 집약적 작업 시뮬레이션
    const largeArray = new Array(1000).fill(0).map(() => Math.random());
    await new Promise(resolve => setTimeout(resolve, 1));
  }

  private async waitForCoreWebVitals(): Promise<void> {
    // Core Web Vitals 측정 대기
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  private async collectAdditionalMetrics(): Promise<void> {
    // 추가 메트릭 수집
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async waitForNextFrame(): Promise<void> {
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
  }

  private async waitForGarbageCollection(): Promise<void> {
    // 가비지 컬렉션 대기
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  // 🚀 성능 테스트: 결과 조회
  public getResults(): PerformanceTestResult[] {
    return [...this.results];
  }

  public getLatestResult(): PerformanceTestResult | null {
    return this.results.length > 0 ? this.results[this.results.length - 1] : null;
  }

  public getResultByName(testName: string): PerformanceTestResult | null {
    return this.results.find(r => r.testName === testName) || null;
  }

  // 🚀 성능 테스트: 결과 내보내기
  public exportResults(): string {
    return JSON.stringify(this.results, null, 2);
  }

  public generateReport(): string {
    const report: string[] = [];
    report.push('# Performance Test Report');
    report.push('');
    report.push(`Generated at: ${new Date().toISOString()}`);
    report.push(`Total tests: ${this.results.length}`);
    report.push(`Passed: ${this.results.filter(r => r.passed).length}`);
    report.push(`Failed: ${this.results.filter(r => !r.passed).length}`);
    report.push('');

    this.results.forEach(result => {
      report.push(`## ${result.testName}`);
      report.push(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
      report.push(`Timestamp: ${new Date(result.timestamp).toISOString()}`);
      report.push('');
      report.push('### Metrics');
      
      Object.entries(result.metrics).forEach(([key, value]) => {
        if (value !== undefined) {
          report.push(`- ${key}: ${value}${this.getMetricUnit(key)}`);
        }
      });
      
      report.push('');
      report.push('### Details');
      report.push(result.details || 'No details available');
      report.push('');
    });

    return report.join('\n');
  }

  private getMetricUnit(metric: string): string {
    if (metric.includes('Time') || metric.includes('Delay') || metric.includes('Latency')) {
      return 'ms';
    }
    if (metric.includes('Memory') || metric.includes('Size')) {
      return 'B';
    }
    return '';
  }

  // 🚀 성능 테스트: 정리
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.results = [];
    this.isRunning = false;
    this.currentTest = null;
  }
}

export default PerformanceTest;