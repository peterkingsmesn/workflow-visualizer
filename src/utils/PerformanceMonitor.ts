// 🚀 성능 최적화: 실시간 성능 모니터링 시스템

import { CONFIG } from '../config/constants';

export interface PerformanceMetrics {
  // 렌더링 성능
  renderTime: number;
  componentCount: number;
  reRenderCount: number;
  
  // 메모리 사용량
  memoryUsage: {
    used: number;
    total: number;
    limit: number;
    usageRatio: number;
  };
  
  // 네트워크 성능
  networkRequests: {
    total: number;
    pending: number;
    failed: number;
    avgResponseTime: number;
  };
  
  // 사용자 인터랙션
  userInteractions: {
    clicks: number;
    scrolls: number;
    keystrokes: number;
    avgResponseTime: number;
  };
  
  // 캐시 성능
  cachePerformance: {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
  };
  
  // 오류 정보
  errors: {
    jsErrors: number;
    networkErrors: number;
    renderErrors: number;
    lastError?: string;
  };
  
  // 전반적 성능 점수
  performanceScore: number;
  timestamp: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  category: 'memory' | 'render' | 'network' | 'interaction' | 'cache' | 'error';
  title: string;
  message: string;
  timestamp: number;
  resolved: boolean;
  threshold?: number;
  currentValue?: number;
}

export interface PerformanceConfig {
  // 모니터링 간격 (ms)
  monitoringInterval: number;
  
  // 경고 임계값
  thresholds: {
    memoryUsage: number;
    renderTime: number;
    networkResponseTime: number;
    interactionResponseTime: number;
    cacheHitRate: number;
    errorRate: number;
  };
  
  // 데이터 보존 기간
  dataRetentionPeriod: number;
  
  // 자동 최적화 활성화
  autoOptimization: boolean;
  
  // 리포팅 활성화
  enableReporting: boolean;
  
  // 알림 설정
  notifications: {
    enabled: boolean;
    types: ('warning' | 'error' | 'info')[];
  };
}

class PerformanceMonitorClass {
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private config: PerformanceConfig;
  private observers: Map<string, PerformanceObserver> = new Map();
  private intervals: Set<NodeJS.Timeout> = new Set();
  private listeners: Map<string, Function[]> = new Map();
  
  // 성능 추적을 위한 내부 상태
  private renderStartTimes: Map<string, number> = new Map();
  private networkRequests: Map<string, { start: number; end?: number; failed?: boolean }> = new Map();
  private userInteractionTimes: Map<string, number> = new Map();
  private componentRenderCounts: Map<string, number> = new Map();
  private lastMetricsTime = 0;
  private isMonitoring = false;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      monitoringInterval: CONFIG.PERFORMANCE.MONITOR_INTERVAL_MS,
      thresholds: {
        memoryUsage: CONFIG.PERFORMANCE.THRESHOLDS.MEMORY,
        renderTime: CONFIG.PERFORMANCE.THRESHOLDS.RENDER_TIME_MS,
        networkResponseTime: CONFIG.PERFORMANCE.THRESHOLDS.NETWORK_RESPONSE_MS,
        interactionResponseTime: CONFIG.PERFORMANCE.THRESHOLDS.INTERACTION_RESPONSE_MS,
        cacheHitRate: CONFIG.PERFORMANCE.THRESHOLDS.CACHE_HIT_RATE,
        errorRate: CONFIG.PERFORMANCE.THRESHOLDS.ERROR_RATE
      },
      dataRetentionPeriod: CONFIG.PERFORMANCE.DATA_RETENTION_MS,
      autoOptimization: true,
      enableReporting: true,
      notifications: {
        enabled: true,
        types: ['warning', 'error']
      },
      ...config
    };

    this.initializeMonitoring();
  }

  // 🚀 성능 최적화: 모니터링 시작
  start(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.setupPerformanceObservers();
    this.startMetricsCollection();
    this.setupEventListeners();
    
    console.log('[PerformanceMonitor] Monitoring started');
  }

  // 🚀 성능 최적화: 모니터링 중지
  stop(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    this.cleanupObservers();
    this.cleanupIntervals();
    this.cleanupEventListeners();
    
    console.log('[PerformanceMonitor] Monitoring stopped');
  }

  // 🚀 성능 최적화: 성능 관찰자 설정
  private setupPerformanceObservers(): void {
    // 렌더링 성능 관찰
    if ('PerformanceObserver' in window) {
      const renderObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure' && entry.name.startsWith('React')) {
            this.recordRenderTime(entry.name, entry.duration);
          }
        }
      });
      
      try {
        renderObserver.observe({ entryTypes: ['measure'] });
        this.observers.set('render', renderObserver);
      } catch (error) {
        console.warn('[PerformanceMonitor] Render observer not supported');
      }

      // 네트워크 성능 관찰
      const networkObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation' || entry.entryType === 'resource') {
            this.recordNetworkRequest(entry);
          }
        }
      });
      
      try {
        networkObserver.observe({ entryTypes: ['navigation', 'resource'] });
        this.observers.set('network', networkObserver);
      } catch (error) {
        console.warn('[PerformanceMonitor] Network observer not supported');
      }

      // 사용자 인터랙션 관찰
      const interactionObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'event') {
            this.recordUserInteraction(entry);
          }
        }
      });
      
      try {
        interactionObserver.observe({ entryTypes: ['event'] });
        this.observers.set('interaction', interactionObserver);
      } catch (error) {
        console.warn('[PerformanceMonitor] Interaction observer not supported');
      }
    }
  }

  // 🚀 성능 최적화: 메트릭 수집 시작
  private startMetricsCollection(): void {
    const collectMetrics = () => {
      if (!this.isMonitoring) return;
      
      const metrics = this.collectCurrentMetrics();
      this.metrics.push(metrics);
      
      // 데이터 보존 기간 관리
      this.cleanupOldMetrics();
      
      // 임계값 검사 및 알림
      this.checkThresholds(metrics);
      
      // 자동 최적화 실행
      if (this.config.autoOptimization) {
        this.performAutoOptimization(metrics);
      }
      
      // 리스너에게 알림
      this.emit('metrics-updated', metrics);
    };
    
    // 초기 수집
    collectMetrics();
    
    // 주기적 수집
    const interval = setInterval(collectMetrics, this.config.monitoringInterval);
    this.intervals.add(interval);
  }

  // 🚀 성능 최적화: 현재 메트릭 수집
  private collectCurrentMetrics(): PerformanceMetrics {
    const timestamp = Date.now();
    
    // 메모리 사용량 수집
    const memoryUsage = this.getMemoryUsage();
    
    // 렌더링 성능 수집
    const renderMetrics = this.getRenderMetrics();
    
    // 네트워크 성능 수집
    const networkMetrics = this.getNetworkMetrics();
    
    // 사용자 인터랙션 수집
    const interactionMetrics = this.getUserInteractionMetrics();
    
    // 캐시 성능 수집
    const cacheMetrics = this.getCacheMetrics();
    
    // 오류 정보 수집
    const errorMetrics = this.getErrorMetrics();
    
    // 전체 성능 점수 계산
    const performanceScore = this.calculatePerformanceScore({
      memoryUsage,
      renderMetrics,
      networkMetrics,
      interactionMetrics,
      cacheMetrics,
      errorMetrics
    });

    return {
      renderTime: renderMetrics.averageRenderTime,
      componentCount: renderMetrics.componentCount,
      reRenderCount: renderMetrics.reRenderCount,
      memoryUsage,
      networkRequests: networkMetrics,
      userInteractions: interactionMetrics,
      cachePerformance: cacheMetrics,
      errors: errorMetrics,
      performanceScore,
      timestamp
    };
  }

  // 🚀 성능 최적화: 메모리 사용량 수집
  private getMemoryUsage(): PerformanceMetrics['memoryUsage'] {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        usageRatio: memory.usedJSHeapSize / memory.jsHeapSizeLimit
      };
    }
    
    return {
      used: 0,
      total: 0,
      limit: 0,
      usageRatio: 0
    };
  }

  // 🚀 성능 최적화: 렌더링 메트릭 수집
  private getRenderMetrics() {
    const renderTimes = Array.from(this.renderStartTimes.values());
    const componentCount = this.componentRenderCounts.size;
    const reRenderCount = Array.from(this.componentRenderCounts.values())
      .reduce((sum, count) => sum + Math.max(0, count - 1), 0);
    
    return {
      averageRenderTime: renderTimes.length > 0 
        ? renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length 
        : 0,
      componentCount,
      reRenderCount
    };
  }

  // 🚀 성능 최적화: 네트워크 메트릭 수집
  private getNetworkMetrics(): PerformanceMetrics['networkRequests'] {
    const requests = Array.from(this.networkRequests.values());
    const completed = requests.filter(r => r.end !== undefined);
    const failed = requests.filter(r => r.failed).length;
    const avgResponseTime = completed.length > 0
      ? completed.reduce((sum, r) => sum + (r.end! - r.start), 0) / completed.length
      : 0;
    
    return {
      total: requests.length,
      pending: requests.filter(r => r.end === undefined && !r.failed).length,
      failed,
      avgResponseTime
    };
  }

  // 🚀 성능 최적화: 사용자 인터랙션 메트릭 수집
  private getUserInteractionMetrics(): PerformanceMetrics['userInteractions'] {
    const interactions = Array.from(this.userInteractionTimes.values());
    const avgResponseTime = interactions.length > 0
      ? interactions.reduce((sum, time) => sum + time, 0) / interactions.length
      : 0;
    
    return {
      clicks: this.userInteractionTimes.has('click') ? 1 : 0,
      scrolls: this.userInteractionTimes.has('scroll') ? 1 : 0,
      keystrokes: this.userInteractionTimes.has('keydown') ? 1 : 0,
      avgResponseTime
    };
  }

  // 🚀 성능 최적화: 캐시 메트릭 수집
  private getCacheMetrics(): PerformanceMetrics['cachePerformance'] {
    // NodeCache에서 통계 가져오기
    try {
      const NodeCache = require('../utils/NodeCache').NodeCache;
      const stats = NodeCache.getStats();
      
      return {
        hits: stats.totalHits,
        misses: stats.totalMisses,
        hitRate: stats.hitRate,
        size: stats.size
      };
    } catch {
      return {
        hits: 0,
        misses: 0,
        hitRate: 0,
        size: 0
      };
    }
  }

  // 🚀 성능 최적화: 오류 메트릭 수집
  private getErrorMetrics(): PerformanceMetrics['errors'] {
    // 전역 오류 추적은 별도 구현 필요
    return {
      jsErrors: 0,
      networkErrors: 0,
      renderErrors: 0,
      lastError: undefined
    };
  }

  // 🚀 성능 최적화: 성능 점수 계산
  private calculatePerformanceScore(metrics: any): number {
    let score = 100;
    
    // 메모리 사용량 페널티
    if (metrics.memoryUsage.usageRatio > this.config.thresholds.memoryUsage) {
      score -= (metrics.memoryUsage.usageRatio - this.config.thresholds.memoryUsage) * CONFIG.PERFORMANCE.SCORING.MEMORY_PENALTY;
    }
    
    // 렌더링 시간 페널티
    if (metrics.renderMetrics.averageRenderTime > this.config.thresholds.renderTime) {
      score -= (metrics.renderMetrics.averageRenderTime - this.config.thresholds.renderTime) * CONFIG.PERFORMANCE.SCORING.RENDER_PENALTY;
    }
    
    // 네트워크 응답 시간 페널티
    if (metrics.networkMetrics.avgResponseTime > this.config.thresholds.networkResponseTime) {
      score -= (metrics.networkMetrics.avgResponseTime - this.config.thresholds.networkResponseTime) / CONFIG.PERFORMANCE.SCORING.NETWORK_DIVISOR;
    }
    
    // 캐시 히트율 보너스
    if (metrics.cacheMetrics.hitRate > this.config.thresholds.cacheHitRate) {
      score += (metrics.cacheMetrics.hitRate - this.config.thresholds.cacheHitRate) * CONFIG.PERFORMANCE.SCORING.CACHE_BONUS;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  // 🚀 성능 최적화: 임계값 검사
  private checkThresholds(metrics: PerformanceMetrics): void {
    const alerts: PerformanceAlert[] = [];
    
    // 메모리 사용량 검사
    if (metrics.memoryUsage.usageRatio > this.config.thresholds.memoryUsage) {
      alerts.push({
        id: `memory-${Date.now()}`,
        type: 'warning',
        category: 'memory',
        title: '높은 메모리 사용량',
        message: `메모리 사용률이 ${Math.round(metrics.memoryUsage.usageRatio * 100)}%에 도달했습니다.`,
        timestamp: Date.now(),
        resolved: false,
        threshold: this.config.thresholds.memoryUsage,
        currentValue: metrics.memoryUsage.usageRatio
      });
    }
    
    // 렌더링 시간 검사
    if (metrics.renderTime > this.config.thresholds.renderTime) {
      alerts.push({
        id: `render-${Date.now()}`,
        type: 'warning',
        category: 'render',
        title: '느린 렌더링',
        message: `평균 렌더링 시간이 ${metrics.renderTime.toFixed(2)}ms입니다.`,
        timestamp: Date.now(),
        resolved: false,
        threshold: this.config.thresholds.renderTime,
        currentValue: metrics.renderTime
      });
    }
    
    // 네트워크 응답 시간 검사
    if (metrics.networkRequests.avgResponseTime > this.config.thresholds.networkResponseTime) {
      alerts.push({
        id: `network-${Date.now()}`,
        type: 'warning',
        category: 'network',
        title: '느린 네트워크 응답',
        message: `평균 네트워크 응답 시간이 ${metrics.networkRequests.avgResponseTime.toFixed(0)}ms입니다.`,
        timestamp: Date.now(),
        resolved: false,
        threshold: this.config.thresholds.networkResponseTime,
        currentValue: metrics.networkRequests.avgResponseTime
      });
    }
    
    // 알림 추가
    alerts.forEach(alert => {
      this.addAlert(alert);
    });
  }

  // 🚀 성능 최적화: 자동 최적화
  private performAutoOptimization(metrics: PerformanceMetrics): void {
    // 메모리 사용량이 높을 때 캐시 정리
    if (metrics.memoryUsage.usageRatio > this.config.thresholds.memoryUsage) {
      try {
        const NodeCache = require('../utils/NodeCache').NodeCache;
        NodeCache.optimize();
        console.log('[PerformanceMonitor] Auto-optimized cache due to high memory usage');
      } catch (error) {
        console.warn('[PerformanceMonitor] Failed to optimize cache:', error);
      }
    }
    
    // 가비지 컬렉션 요청 (가능한 경우)
    if (typeof gc === 'function' && metrics.memoryUsage.usageRatio > 0.9) {
      gc();
      console.log('[PerformanceMonitor] Triggered garbage collection');
    }
  }

  // 🚀 성능 최적화: 이벤트 리스너 설정
  private setupEventListeners(): void {
    // 오류 추적
    window.addEventListener('error', (event) => {
      this.recordError('js', event.error?.message || event.message);
    });
    
    // 네트워크 오류 추적
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError('network', event.reason?.message || 'Network error');
    });
  }

  // 🚀 성능 최적화: 기록 메서드들
  recordRenderTime(componentName: string, duration: number): void {
    this.renderStartTimes.set(componentName, duration);
    const currentCount = this.componentRenderCounts.get(componentName) || 0;
    this.componentRenderCounts.set(componentName, currentCount + 1);
  }

  recordNetworkRequest(entry: PerformanceEntry): void {
    this.networkRequests.set(entry.name, {
      start: entry.startTime,
      end: entry.startTime + entry.duration,
      failed: false
    });
  }

  recordUserInteraction(entry: PerformanceEntry): void {
    this.userInteractionTimes.set(entry.name, entry.duration);
  }

  recordError(type: 'js' | 'network' | 'render', message: string): void {
    console.error(`[PerformanceMonitor] ${type} error:`, message);
    
    // 오류 알림 생성
    this.addAlert({
      id: `error-${Date.now()}`,
      type: 'error',
      category: 'error',
      title: `${type.toUpperCase()} 오류`,
      message: message,
      timestamp: Date.now(),
      resolved: false
    });
  }

  // 🚀 성능 최적화: 알림 관리
  private addAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);
    
    // 알림 발송
    if (this.config.notifications.enabled && 
        this.config.notifications.types.includes(alert.type)) {
      this.emit('alert', alert);
    }
    
    // 오래된 알림 정리
    this.cleanupOldAlerts();
  }

  // 🚀 성능 최적화: 정리 메서드들
  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - this.config.dataRetentionPeriod;
    this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime);
  }

  private cleanupOldAlerts(): void {
    const cutoffTime = Date.now() - this.config.dataRetentionPeriod;
    this.alerts = this.alerts.filter(a => a.timestamp > cutoffTime);
  }

  private cleanupObservers(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }

  private cleanupIntervals(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
  }

  private cleanupEventListeners(): void {
    // 이벤트 리스너 정리는 별도 구현 필요
  }

  // 🚀 성능 최적화: 초기화
  private initializeMonitoring(): void {
    // 개발 모드에서만 전역 노출
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).PerformanceMonitor = this;
    }
  }

  // 🚀 성능 최적화: 이벤트 시스템
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function): void {
    if (!this.listeners.has(event)) return;
    
    if (callback) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    } else {
      this.listeners.delete(event);
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[PerformanceMonitor] Error in event listener:`, error);
        }
      });
    }
  }

  // 🚀 성능 최적화: 공개 API
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  getMetricsHistory(timeRange?: number): PerformanceMetrics[] {
    if (!timeRange) return [...this.metrics];
    
    const cutoffTime = Date.now() - timeRange;
    return this.metrics.filter(m => m.timestamp > cutoffTime);
  }

  getAlerts(resolved = false): PerformanceAlert[] {
    return this.alerts.filter(a => a.resolved === resolved);
  }

  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.emit('alert-resolved', alert);
    }
  }

  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // 모니터링 재시작이 필요한 경우
    if (this.isMonitoring) {
      this.stop();
      this.start();
    }
  }

  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  // 🚀 성능 최적화: 리포트 생성
  generateReport(timeRange?: number): {
    summary: any;
    metrics: PerformanceMetrics[];
    alerts: PerformanceAlert[];
    recommendations: string[];
  } {
    const metrics = this.getMetricsHistory(timeRange);
    const alerts = this.getAlerts();
    
    const summary = {
      averagePerformanceScore: metrics.length > 0 
        ? metrics.reduce((sum, m) => sum + m.performanceScore, 0) / metrics.length 
        : 0,
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.type === 'error').length,
      memoryUsagePeak: Math.max(...metrics.map(m => m.memoryUsage.usageRatio)),
      renderTimePeak: Math.max(...metrics.map(m => m.renderTime)),
      networkRequestsTotal: metrics.reduce((sum, m) => sum + m.networkRequests.total, 0)
    };
    
    const recommendations = this.generateRecommendations(metrics, alerts);
    
    return {
      summary,
      metrics,
      alerts,
      recommendations
    };
  }

  private generateRecommendations(metrics: PerformanceMetrics[], alerts: PerformanceAlert[]): string[] {
    const recommendations: string[] = [];
    
    // 메모리 사용량 기반 추천
    const avgMemoryUsage = metrics.reduce((sum, m) => sum + m.memoryUsage.usageRatio, 0) / metrics.length;
    if (avgMemoryUsage > 0.7) {
      recommendations.push('메모리 사용량이 높습니다. 캐시 정리 및 메모리 누수 점검을 권장합니다.');
    }
    
    // 렌더링 성능 기반 추천
    const avgRenderTime = metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length;
    if (avgRenderTime > 10) {
      recommendations.push('렌더링 시간이 길습니다. 컴포넌트 메모이제이션을 검토해보세요.');
    }
    
    // 네트워크 성능 기반 추천
    const avgNetworkTime = metrics.reduce((sum, m) => sum + m.networkRequests.avgResponseTime, 0) / metrics.length;
    if (avgNetworkTime > 1000) {
      recommendations.push('네트워크 응답이 느립니다. API 최적화 또는 캐싱 전략을 고려하세요.');
    }
    
    return recommendations;
  }

  // 🚀 성능 최적화: 정리
  destroy(): void {
    this.stop();
    this.metrics = [];
    this.alerts = [];
    this.listeners.clear();
    console.log('[PerformanceMonitor] Destroyed');
  }
}

// 싱글톤 인스턴스
export const PerformanceMonitor = new PerformanceMonitorClass();

export default PerformanceMonitor;