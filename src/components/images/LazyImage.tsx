import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { useIntersectionObserver } from '../../hooks/useEventListener';
import { AssetCache } from '../../utils/NodeCache';
import './LazyImage.css';

// 🚀 성능 최적화: 지연 로딩 이미지 컴포넌트

export interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholder?: string;
  fallback?: string;
  loading?: 'lazy' | 'eager';
  priority?: 'high' | 'low' | 'auto';
  quality?: 'high' | 'medium' | 'low';
  blur?: boolean;
  fade?: boolean;
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  preload?: boolean;
  threshold?: number;
  rootMargin?: string;
}

export const LazyImage: React.FC<LazyImageProps> = memo(({
  src,
  alt,
  className = '',
  width,
  height,
  placeholder,
  fallback,
  loading = 'lazy',
  priority = 'auto',
  quality = 'medium',
  blur = true,
  fade = true,
  onLoad,
  onError,
  preload = false,
  threshold = 0.1,
  rootMargin = '50px'
}) => {
  // 상태 관리
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  
  // 레퍼런스
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageInstanceRef = useRef<HTMLImageElement | null>(null);

  // 🚀 성능 최적화: 이미지 품질 조정
  const getOptimizedSrc = useCallback((originalSrc: string): string => {
    // 캐시된 최적화된 URL 확인
    const cacheKey = `optimized-${originalSrc}-${quality}`;
    const cached = AssetCache.get<string>(cacheKey);
    if (cached) {
      return cached;
    }

    // URL 파라미터로 품질 조정 (실제 환경에서는 CDN 설정 필요)
    const qualityMap = {
      'high': 90,
      'medium': 70,
      'low': 50
    };
    
    let optimizedSrc = originalSrc;
    
    // 이미지 포맷 최적화 (WebP 지원 확인)
    if (supportsWebP()) {
      optimizedSrc = originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }
    
    // 품질 파라미터 추가
    const separator = optimizedSrc.includes('?') ? '&' : '?';
    optimizedSrc += `${separator}quality=${qualityMap[quality]}`;
    
    // 사이즈 최적화
    if (width && height) {
      optimizedSrc += `&w=${width}&h=${height}`;
    }
    
    // 결과 캐싱
    AssetCache.set(cacheKey, optimizedSrc);
    return optimizedSrc;
  }, [quality, width, height]);

  // 🚀 성능 최적화: 이미지 사전 로딩
  const preloadImage = useCallback((imageSrc: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        // 메모리 캐시에 저장
        AssetCache.set(`preloaded-${imageSrc}`, img);
        resolve();
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to preload image: ${imageSrc}`));
      };
      
      img.src = imageSrc;
    });
  }, []);

  // 🚀 성능 최적화: 이미지 로딩 처리
  const loadImage = useCallback(async () => {
    if (isLoading || isLoaded) return;
    
    setIsLoading(true);
    setHasError(false);
    
    try {
      const optimizedSrc = getOptimizedSrc(src);
      
      // 사전 로딩된 이미지 확인
      const preloadedImage = AssetCache.get<HTMLImageElement>(`preloaded-${optimizedSrc}`);
      if (preloadedImage) {
        setCurrentSrc(optimizedSrc);
        setIsLoaded(true);
        setIsLoading(false);
        return;
      }
      
      // 새 이미지 인스턴스 생성
      const img = new Image();
      imageInstanceRef.current = img;
      
      img.onload = () => {
        if (imageInstanceRef.current === img) {
          setCurrentSrc(optimizedSrc);
          setIsLoaded(true);
          setIsLoading(false);
          
          // 캐시에 저장
          AssetCache.set(`loaded-${optimizedSrc}`, img);
        }
      };
      
      img.onerror = () => {
        if (imageInstanceRef.current === img) {
          setHasError(true);
          setIsLoading(false);
          
          // 폴백 이미지 시도
          if (fallback && fallback !== optimizedSrc) {
            setCurrentSrc(fallback);
            setIsLoaded(true);
          }
        }
      };
      
      img.src = optimizedSrc;
      
    } catch (error) {
      console.error('Image loading error:', error);
      setHasError(true);
      setIsLoading(false);
    }
  }, [src, isLoading, isLoaded, getOptimizedSrc, fallback]);

  // IntersectionObserver를 통한 지연 로딩
  useIntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isLoaded && !isLoading) {
          loadImage();
        }
      });
    },
    containerRef,
    {
      condition: loading === 'lazy',
      threshold,
      rootMargin
    }
  );

  // 즉시 로딩 처리
  useEffect(() => {
    if (loading === 'eager' || priority === 'high') {
      loadImage();
    }
  }, [loading, priority, loadImage]);

  // 사전 로딩 처리
  useEffect(() => {
    if (preload && src) {
      const optimizedSrc = getOptimizedSrc(src);
      preloadImage(optimizedSrc).catch(console.error);
    }
  }, [preload, src, getOptimizedSrc, preloadImage]);

  // 이미지 로드 핸들러
  const handleImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    onLoad?.(event);
  }, [onLoad]);

  const handleImageError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    onError?.(event);
  }, [onError]);

  // 스타일 계산
  const containerStyle: React.CSSProperties = {
    width,
    height,
    aspectRatio: width && height ? `${width}/${height}` : undefined
  };

  return (
    <div 
      ref={containerRef}
      className={`lazy-image-container ${className} ${isLoaded ? 'loaded' : ''} ${isLoading ? 'loading' : ''} ${hasError ? 'error' : ''}`}
      style={containerStyle}
    >
      {/* 플레이스홀더 */}
      {!isLoaded && placeholder && (
        <div className="lazy-image-placeholder">
          <img
            src={placeholder}
            alt=""
            className={`placeholder-image ${blur ? 'blur' : ''}`}
            loading="eager"
          />
        </div>
      )}
      
      {/* 로딩 스피너 */}
      {isLoading && (
        <div className="lazy-image-spinner">
          <div className="spinner" />
        </div>
      )}
      
      {/* 실제 이미지 */}
      {currentSrc && !hasError && (
        <img
          ref={imageRef}
          src={currentSrc}
          alt={alt}
          className={`lazy-image ${fade ? 'fade' : ''} ${isLoaded ? 'visible' : ''}`}
          width={width}
          height={height}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={loading}
          decoding="async"
          fetchPriority={priority}
        />
      )}
      
      {/* 에러 상태 */}
      {hasError && !fallback && (
        <div className="lazy-image-error">
          <span className="error-icon">🖼️</span>
          <span className="error-text">이미지를 불러올 수 없습니다</span>
        </div>
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

// 🚀 성능 최적화: WebP 지원 확인
function supportsWebP(): boolean {
  // 캐시된 결과 확인
  const cached = AssetCache.get<boolean>('webp-support');
  if (cached !== undefined) {
    return cached;
  }

  // WebP 지원 확인
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  const supported = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  
  // 결과 캐싱
  AssetCache.set('webp-support', supported);
  return supported;
}

// 🚀 성능 최적화: 이미지 사전 로딩 유틸리티
export const ImagePreloader = {
  // 단일 이미지 사전 로딩
  async preloadSingle(src: string, options: { quality?: 'high' | 'medium' | 'low' } = {}): Promise<void> {
    const cacheKey = `preloaded-${src}`;
    
    if (AssetCache.has(cacheKey)) {
      return;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        AssetCache.set(cacheKey, img);
        resolve();
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to preload image: ${src}`));
      };
      
      img.src = src;
    });
  },

  // 여러 이미지 병렬 사전 로딩
  async preloadMultiple(srcs: string[], options: { 
    quality?: 'high' | 'medium' | 'low';
    maxConcurrent?: number;
    onProgress?: (loaded: number, total: number) => void;
  } = {}): Promise<void> {
    const { maxConcurrent = 4, onProgress } = options;
    let loaded = 0;
    
    const loadChunk = async (chunk: string[]): Promise<void> => {
      const promises = chunk.map(async (src) => {
        try {
          await this.preloadSingle(src, options);
          loaded++;
          onProgress?.(loaded, srcs.length);
        } catch (error) {
          console.warn(`Failed to preload ${src}:`, error);
        }
      });
      
      await Promise.all(promises);
    };

    // 청크 단위로 병렬 로딩
    const chunks: string[][] = [];
    for (let i = 0; i < srcs.length; i += maxConcurrent) {
      chunks.push(srcs.slice(i, i + maxConcurrent));
    }

    for (const chunk of chunks) {
      await loadChunk(chunk);
    }
  },

  // 우선순위 기반 사전 로딩
  async preloadWithPriority(images: Array<{ src: string; priority: number }>, options: {
    maxConcurrent?: number;
    onProgress?: (loaded: number, total: number) => void;
  } = {}): Promise<void> {
    // 우선순위 순으로 정렬
    const sorted = images.sort((a, b) => b.priority - a.priority);
    const srcs = sorted.map(img => img.src);
    
    await this.preloadMultiple(srcs, options);
  },

  // 캐시 정리
  clearCache(): void {
    AssetCache.clear();
  },

  // 캐시 상태 확인
  getCacheStatus(): {
    size: number;
    entries: string[];
    memoryUsage: number;
  } {
    const stats = AssetCache.getStats();
    const entries = Array.from(AssetCache['strongCache'].keys())
      .filter(key => key.startsWith('preloaded-') || key.startsWith('loaded-'));
    
    return {
      size: stats.size,
      entries,
      memoryUsage: stats.memoryUsage
    };
  }
};

export default LazyImage;