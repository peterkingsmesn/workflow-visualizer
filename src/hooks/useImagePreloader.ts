import { useState, useEffect, useCallback, useRef } from 'react';
import { AssetCache } from '../utils/NodeCache';

// 🚀 성능 최적화: 이미지 사전 로딩 훅

export interface PreloadOptions {
  quality?: 'high' | 'medium' | 'low';
  maxConcurrent?: number;
  priority?: 'high' | 'medium' | 'low';
  timeout?: number;
  retryAttempts?: number;
  onProgress?: (loaded: number, total: number) => void;
  onError?: (url: string, error: Error) => void;
}

export interface PreloadStatus {
  isLoading: boolean;
  loaded: number;
  total: number;
  errors: string[];
  progress: number;
}

export interface PreloadResult {
  url: string;
  success: boolean;
  error?: Error;
  duration: number;
  size?: number;
}

export function useImagePreloader(
  urls: string[],
  options: PreloadOptions = {}
) {
  const {
    quality = 'medium',
    maxConcurrent = 4,
    priority = 'medium',
    timeout = 10000,
    retryAttempts = 2,
    onProgress,
    onError
  } = options;

  const [status, setStatus] = useState<PreloadStatus>({
    isLoading: false,
    loaded: 0,
    total: urls.length,
    errors: [],
    progress: 0
  });

  const [results, setResults] = useState<PreloadResult[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeLoadsRef = useRef<Set<string>>(new Set());

  // 🚀 성능 최적화: 이미지 품질 최적화
  const optimizeImageUrl = useCallback((url: string): string => {
    const cacheKey = `optimized-${url}-${quality}`;
    const cached = AssetCache.get<string>(cacheKey);
    if (cached) return cached;

    let optimizedUrl = url;
    
    // 품질 파라미터 추가
    const qualityMap = { high: 90, medium: 70, low: 50 };
    const separator = url.includes('?') ? '&' : '?';
    optimizedUrl += `${separator}quality=${qualityMap[quality]}`;
    
    // WebP 변환 (지원 시)
    if (supportsWebP()) {
      optimizedUrl = optimizedUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }
    
    AssetCache.set(cacheKey, optimizedUrl);
    return optimizedUrl;
  }, [quality]);

  // 🚀 성능 최적화: 단일 이미지 로딩
  const loadSingleImage = useCallback(async (
    url: string,
    signal?: AbortSignal
  ): Promise<PreloadResult> => {
    const startTime = Date.now();
    let attempts = 0;
    
    const attemptLoad = async (): Promise<PreloadResult> => {
      attempts++;
      
      return new Promise((resolve) => {
        const img = new Image();
        const optimizedUrl = optimizeImageUrl(url);
        
        // 타임아웃 설정
        const timeoutId = setTimeout(() => {
          img.src = '';
          resolve({
            url,
            success: false,
            error: new Error('Timeout'),
            duration: Date.now() - startTime
          });
        }, timeout);


        // 중단 처리
        const abortHandler = () => {
          clearTimeout(timeoutId);
          img.src = '';
          resolve({
            url,
            success: false,
            error: new Error('Aborted'),
            duration: Date.now() - startTime
          });
        };

        if (signal) {
          signal.addEventListener('abort', abortHandler);
        }

        img.src = optimizedUrl;

        // cleanup 함수에 추가
        img.onload = function() {
          clearTimeout(timeoutId);
          if (signal) {
            signal.removeEventListener('abort', abortHandler);
          }
          
          // 이미지 크기 추정
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          
          let estimatedSize = 0;
          if (ctx) {
            try {
              ctx.drawImage(img, 0, 0);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              estimatedSize = imageData.data.length;
            } catch {
              estimatedSize = canvas.width * canvas.height * 4; // 기본 추정
            }
          }

          // 캐시에 저장
          AssetCache.set(`preloaded-${url}`, img);
          
          resolve({
            url,
            success: true,
            duration: Date.now() - startTime,
            size: estimatedSize
          });
        };

        img.onerror = function(error) {
          clearTimeout(timeoutId);
          if (signal) {
            signal.removeEventListener('abort', abortHandler);
          }
          
          resolve({
            url,
            success: false,
            error: error instanceof Error ? error : new Error('Load failed'),
            duration: Date.now() - startTime
          });
        };
      });
    };

    let result = await attemptLoad();
    
    // 재시도 로직
    while (!result.success && attempts < retryAttempts && !signal?.aborted) {
      await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      result = await attemptLoad();
    }

    return result;
  }, [optimizeImageUrl, timeout, retryAttempts]);

  // 🚀 성능 최적화: 배치 로딩
  const preloadBatch = useCallback(async (
    urlBatch: string[],
    signal?: AbortSignal
  ): Promise<PreloadResult[]> => {
    const promises = urlBatch.map(url => {
      if (activeLoadsRef.current.has(url)) {
        return Promise.resolve({
          url,
          success: true,
          duration: 0
        } as PreloadResult);
      }
      
      activeLoadsRef.current.add(url);
      return loadSingleImage(url, signal);
    });

    const results = await Promise.all(promises);
    
    // 완료된 로딩 제거
    urlBatch.forEach(url => activeLoadsRef.current.delete(url));
    
    return results;
  }, [loadSingleImage]);

  // 🚀 성능 최적화: 우선순위 기반 로딩
  const startPreloading = useCallback(async () => {
    if (urls.length === 0) return;
    
    setStatus(prev => ({
      ...prev,
      isLoading: true,
      total: urls.length,
      loaded: 0,
      errors: [],
      progress: 0
    }));

    // 중단 컨트롤러 생성
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      // 우선순위 순서로 URL 정렬
      const sortedUrls = [...urls].sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[priority] - priorityOrder[priority];
      });

      // 배치 단위로 로딩
      const batches: string[][] = [];
      for (let i = 0; i < sortedUrls.length; i += maxConcurrent) {
        batches.push(sortedUrls.slice(i, i + maxConcurrent));
      }

      const allResults: PreloadResult[] = [];
      let totalLoaded = 0;

      for (const batch of batches) {
        if (signal.aborted) break;
        
        const batchResults = await preloadBatch(batch, signal);
        allResults.push(...batchResults);
        
        totalLoaded += batchResults.length;
        const progress = Math.round((totalLoaded / urls.length) * 100);
        
        // 에러 수집
        const errors = batchResults
          .filter(r => !r.success)
          .map(r => r.url);
        
        setStatus(prev => ({
          ...prev,
          loaded: totalLoaded,
          progress,
          errors: [...prev.errors, ...errors]
        }));

        // 진행률 콜백
        onProgress?.(totalLoaded, urls.length);
        
        // 에러 콜백
        batchResults.forEach(result => {
          if (!result.success && result.error) {
            onError?.(result.url, result.error);
          }
        });
      }

      setResults(allResults);
      setStatus(prev => ({
        ...prev,
        isLoading: false
      }));

    } catch (error) {
      console.error('Preloading failed:', error);
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        errors: [...prev.errors, 'Preloading failed']
      }));
    }
  }, [urls, maxConcurrent, priority, preloadBatch, onProgress, onError]);

  // 🚀 성능 최적화: 로딩 중단
  const cancelPreloading = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    activeLoadsRef.current.clear();
    setStatus(prev => ({
      ...prev,
      isLoading: false
    }));
  }, []);

  // 🚀 성능 최적화: 캐시 상태 확인
  const getCachedUrls = useCallback((): string[] => {
    return urls.filter(url => AssetCache.has(`preloaded-${url}`));
  }, [urls]);

  // 🚀 성능 최적화: 통계 정보
  const getStats = useCallback(() => {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    const totalSize = successful.reduce((sum, r) => sum + (r.size || 0), 0);
    const avgDuration = successful.length > 0 
      ? successful.reduce((sum, r) => sum + r.duration, 0) / successful.length 
      : 0;

    return {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      totalSize,
      avgDuration,
      successRate: results.length > 0 ? successful.length / results.length : 0
    };
  }, [results]);

  // 자동 시작
  useEffect(() => {
    if (urls.length > 0) {
      startPreloading();
    }
    
    return () => {
      cancelPreloading();
    };
  }, [urls, startPreloading, cancelPreloading]);

  // 정리
  useEffect(() => {
    return () => {
      cancelPreloading();
    };
  }, [cancelPreloading]);

  return {
    status,
    results,
    stats: getStats(),
    cachedUrls: getCachedUrls(),
    startPreloading,
    cancelPreloading,
    isPreloaded: (url: string) => AssetCache.has(`preloaded-${url}`),
    clearCache: () => AssetCache.clear()
  };
}

// 🚀 성능 최적화: 간단한 사전 로딩 훅
export function useSimpleImagePreloader(urls: string[]) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  
  const preload = useCallback(async () => {
    setIsLoading(true);
    setLoadedCount(0);
    
    let loaded = 0;
    const promises = urls.map(url => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          loaded++;
          setLoadedCount(loaded);
          resolve();
        };
        img.onerror = () => {
          loaded++;
          setLoadedCount(loaded);
          resolve();
        };
        img.src = url;
      });
    });
    
    await Promise.all(promises);
    setIsLoading(false);
  }, [urls]);
  
  useEffect(() => {
    if (urls.length > 0) {
      preload();
    }
  }, [urls, preload]);
  
  return {
    isLoading,
    loadedCount,
    total: urls.length,
    progress: urls.length > 0 ? (loadedCount / urls.length) * 100 : 0
  };
}

// WebP 지원 확인 (캐시됨)
function supportsWebP(): boolean {
  const cached = AssetCache.get<boolean>('webp-support');
  if (cached !== undefined) return cached;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const supported = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  
  AssetCache.set('webp-support', supported);
  return supported;
}

export default useImagePreloader;