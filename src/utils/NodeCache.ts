// 🚀 성능 최적화: WeakMap 기반 노드 캐싱 시스템

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size?: number;
}

export interface CacheStats {
  size: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  memoryUsage: number;
  oldestEntry: number;
  newestEntry: number;
}

export interface CacheOptions {
  maxSize?: number;
  maxAge?: number; // milliseconds
  checkInterval?: number;
  enableStats?: boolean;
  onEviction?: (key: any, value: any) => void;
}

class NodeCacheClass {
  // 🚀 성능 최적화: WeakMap으로 메모리 누수 방지
  private weakCache = new WeakMap<object, Map<string, CacheEntry<any>>>();
  private strongCache = new Map<string, CacheEntry<any>>();
  
  // 통계 정보
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalMemoryUsage: 0
  };
  
  private options: Required<CacheOptions>;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private memoryMonitorInterval: NodeJS.Timeout | null = null;

  constructor(options: CacheOptions = {}) {
    this.options = {
      maxSize: options.maxSize || 1000,
      maxAge: options.maxAge || 5 * 60 * 1000, // 5분
      checkInterval: options.checkInterval || 60 * 1000, // 1분
      enableStats: options.enableStats !== false,
      onEviction: options.onEviction || (() => {})
    };

    this.startCleanupScheduler();
    this.startMemoryMonitor();
  }

  // WeakMap 기반 캐시 (객체 키용)
  setWeak<T>(obj: object, key: string, value: T): void {
    if (!this.weakCache.has(obj)) {
      this.weakCache.set(obj, new Map());
    }
    
    const objCache = this.weakCache.get(obj)!;
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      size: this.estimateSize(value)
    };
    
    objCache.set(key, entry);
    
    if (this.options.enableStats) {
      this.stats.totalMemoryUsage += entry.size || 0;
    }
  }

  getWeak<T>(obj: object, key: string): T | undefined {
    const objCache = this.weakCache.get(obj);
    if (!objCache) {
      this.recordMiss();
      return undefined;
    }
    
    const entry = objCache.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      this.recordMiss();
      return undefined;
    }
    
    // 만료 검사
    if (this.isExpired(entry)) {
      objCache.delete(key);
      this.recordMiss();
      return undefined;
    }
    
    // 액세스 정보 업데이트
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    this.recordHit();
    return entry.value;
  }

  hasWeak(obj: object, key: string): boolean {
    const objCache = this.weakCache.get(obj);
    if (!objCache) return false;
    
    const entry = objCache.get(key);
    if (!entry) return false;
    
    return !this.isExpired(entry);
  }

  deleteWeak(obj: object, key: string): boolean {
    const objCache = this.weakCache.get(obj);
    if (!objCache) return false;
    
    const entry = objCache.get(key);
    if (entry && this.options.enableStats) {
      this.stats.totalMemoryUsage -= entry.size || 0;
    }
    
    const deleted = objCache.delete(key);
    if (deleted && entry) {
      this.options.onEviction(key, entry.value);
      this.stats.evictions++;
    }
    
    return deleted;
  }

  // 일반 문자열 키 캐시
  set<T>(key: string, value: T): void {
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      size: this.estimateSize(value)
    };
    
    // 크기 제한 확인
    if (this.strongCache.size >= this.options.maxSize) {
      this.evictLRU();
    }
    
    const existingEntry = this.strongCache.get(key);
    if (existingEntry && this.options.enableStats) {
      this.stats.totalMemoryUsage -= existingEntry.size || 0;
    }
    
    this.strongCache.set(key, entry);
    
    if (this.options.enableStats) {
      this.stats.totalMemoryUsage += entry.size || 0;
    }
  }

  get<T>(key: string): T | undefined {
    const entry = this.strongCache.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      this.recordMiss();
      return undefined;
    }
    
    // 만료 검사
    if (this.isExpired(entry)) {
      this.delete(key);
      this.recordMiss();
      return undefined;
    }
    
    // 액세스 정보 업데이트
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    this.recordHit();
    return entry.value;
  }

  has(key: string): boolean {
    const entry = this.strongCache.get(key);
    if (!entry) return false;
    
    return !this.isExpired(entry);
  }

  delete(key: string): boolean {
    const entry = this.strongCache.get(key);
    if (entry && this.options.enableStats) {
      this.stats.totalMemoryUsage -= entry.size || 0;
    }
    
    const deleted = this.strongCache.delete(key);
    if (deleted && entry) {
      this.options.onEviction(key, entry.value);
      this.stats.evictions++;
    }
    
    return deleted;
  }

  // 캐시 정리
  clear(): void {
    const entries = Array.from(this.strongCache.entries());
    this.strongCache.clear();
    
    if (this.options.enableStats) {
      this.stats.totalMemoryUsage = 0;
    }
    
    // 이벤트 핸들러 호출
    entries.forEach(([key, entry]) => {
      this.options.onEviction(key, entry.value);
      this.stats.evictions++;
    });
  }

  // 만료된 항목 정리
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, entry] of this.strongCache.entries()) {
      if (this.isExpired(entry)) {
        this.delete(key);
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  }

  // LRU 기반 제거
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.strongCache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  // 만료 검사
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > this.options.maxAge;
  }

  // 크기 추정
  private estimateSize(value: any): number {
    try {
      if (value === null || value === undefined) return 0;
      if (typeof value === 'string') return value.length * 2; // UTF-16
      if (typeof value === 'number') return 8;
      if (typeof value === 'boolean') return 4;
      if (value instanceof Date) return 8;
      if (value instanceof ArrayBuffer) return value.byteLength;
      
      // 객체는 JSON 직렬화 크기로 근사
      return JSON.stringify(value).length * 2;
    } catch {
      return 100; // 기본값
    }
  }

  // 통계 기록
  private recordHit(): void {
    if (this.options.enableStats) {
      this.stats.hits++;
    }
  }

  private recordMiss(): void {
    if (this.options.enableStats) {
      this.stats.misses++;
    }
  }

  // 정리 스케줄러
  private startCleanupScheduler(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.options.checkInterval);
  }

  // 메모리 모니터
  private startMemoryMonitor(): void {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      this.memoryMonitorInterval = setInterval(() => {
        this.checkMemoryPressure();
      }, this.options.checkInterval * 2);
    }
  }

  private checkMemoryPressure(): void {
    if (typeof performance === 'undefined' || !(performance as any).memory) return;
    
    const memory = (performance as any).memory;
    const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    
    // 메모리 사용률이 80% 이상이면 적극적 정리
    if (usageRatio > 0.8) {
      const cleaned = this.cleanup();
      
      // 여전히 높으면 캐시 크기 줄이기
      if (usageRatio > 0.9) {
        this.evictHalf();
      }
      
      console.warn(`[NodeCache] High memory usage detected (${Math.round(usageRatio * 100)}%). Cleaned ${cleaned} entries.`);
    }
  }

  private evictHalf(): void {
    const entries = Array.from(this.strongCache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    
    const toEvict = Math.floor(entries.length / 2);
    for (let i = 0; i < toEvict; i++) {
      this.delete(entries[i][0]);
    }
  }

  // 통계 조회
  getStats(): CacheStats {
    const entries = Array.from(this.strongCache.values());
    const totalRequests = this.stats.hits + this.stats.misses;
    
    return {
      size: this.strongCache.size,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      memoryUsage: this.stats.totalMemoryUsage,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : 0,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : 0
    };
  }

  // 메모리 사용량 조회
  getMemoryUsage(): {
    cacheSize: number;
    entryCount: number;
    avgEntrySize: number;
    systemMemory?: {
      used: number;
      total: number;
      limit: number;
    };
  } {
    const stats = this.getStats();
    const systemMemory = typeof performance !== 'undefined' && (performance as any).memory ? {
      used: ((performance as any).memory).usedJSHeapSize,
      total: ((performance as any).memory).totalJSHeapSize,
      limit: ((performance as any).memory).jsHeapSizeLimit
    } : undefined;
    
    return {
      cacheSize: stats.memoryUsage,
      entryCount: stats.size,
      avgEntrySize: stats.size > 0 ? stats.memoryUsage / stats.size : 0,
      systemMemory
    };
  }

  // 캐시 최적화
  optimize(): {
    before: CacheStats;
    after: CacheStats;
    cleaned: number;
    optimizations: string[];
  } {
    const before = this.getStats();
    const optimizations: string[] = [];
    let cleaned = 0;
    
    // 1. 만료된 항목 정리
    const expiredCleaned = this.cleanup();
    cleaned += expiredCleaned;
    if (expiredCleaned > 0) {
      optimizations.push(`${expiredCleaned}개 만료된 항목 정리`);
    }
    
    // 2. 낮은 접근 빈도 항목 정리
    const lowAccessThreshold = 2;
    const oldEntries = Array.from(this.strongCache.entries())
      .filter(([, entry]) => entry.accessCount < lowAccessThreshold)
      .map(([key]) => key);
    
    oldEntries.forEach(key => this.delete(key));
    cleaned += oldEntries.length;
    if (oldEntries.length > 0) {
      optimizations.push(`${oldEntries.length}개 저사용 항목 정리`);
    }
    
    // 3. 메모리 압축 (브라우저에서 가능한 경우)
    if (typeof gc === 'function') {
      gc();
      optimizations.push('가비지 컬렉션 실행');
    }
    
    const after = this.getStats();
    
    return {
      before,
      after,
      cleaned,
      optimizations
    };
  }

  // 정리
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
      this.memoryMonitorInterval = null;
    }
    
    this.clear();
  }
}

// 싱글톤 인스턴스
export const NodeCache = new NodeCacheClass({
  maxSize: 1000,
  maxAge: 5 * 60 * 1000, // 5분
  checkInterval: 60 * 1000, // 1분
  enableStats: true,
  onEviction: (key, value) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[NodeCache] Evicted: ${key}`);
    }
  }
});

// 타입별 전용 캐시 인스턴스들
export const ComponentCache = new NodeCacheClass({
  maxSize: 500,
  maxAge: 10 * 60 * 1000, // 10분
  enableStats: true
});

export const MetricsCache = new NodeCacheClass({
  maxSize: 200,
  maxAge: 2 * 60 * 1000, // 2분
  enableStats: true
});

export const AssetCache = new NodeCacheClass({
  maxSize: 100,
  maxAge: 30 * 60 * 1000, // 30분
  enableStats: true
});

// 디버깅용 전역 노출 (개발 모드에서만)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).NodeCache = NodeCache;
  (window as any).ComponentCache = ComponentCache;
  (window as any).MetricsCache = MetricsCache;
  (window as any).AssetCache = AssetCache;
}

export default NodeCache;