import React, { useState, useCallback, useMemo, memo } from 'react';
import { LazyImage } from './LazyImage';
import { useImagePreloader } from '../../hooks/useImagePreloader';
import { useIntersectionObserver } from '../../hooks/useEventListener';
import './ImageGallery.css';

// 🚀 성능 최적화: 이미지 갤러리 컴포넌트

export interface ImageItem {
  id: string;
  src: string;
  alt: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  priority?: 'high' | 'medium' | 'low';
  category?: string;
  tags?: string[];
}

export interface ImageGalleryProps {
  images: ImageItem[];
  columns?: number;
  gap?: number;
  showThumbnails?: boolean;
  enableLazyLoading?: boolean;
  enablePreloading?: boolean;
  maxPreloadImages?: number;
  onImageClick?: (image: ImageItem, index: number) => void;
  onImageLoad?: (image: ImageItem) => void;
  onImageError?: (image: ImageItem, error: Error) => void;
  className?: string;
  filterTags?: string[];
  sortBy?: 'name' | 'date' | 'size' | 'priority';
  sortOrder?: 'asc' | 'desc';
  virtualizeThreshold?: number;
}

export const ImageGallery: React.FC<ImageGalleryProps> = memo(({
  images,
  columns = 3,
  gap = 16,
  showThumbnails = true,
  enableLazyLoading = true,
  enablePreloading = true,
  maxPreloadImages = 10,
  onImageClick,
  onImageLoad,
  onImageError,
  className = '',
  filterTags = [],
  sortBy = 'name',
  sortOrder = 'asc',
  virtualizeThreshold = 100
}) => {
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: Math.min(50, images.length) });

  // 🚀 성능 최적화: 이미지 필터링 및 정렬
  const filteredAndSortedImages = useMemo(() => {
    let filtered = images;
    
    // 태그 필터링
    if (filterTags.length > 0) {
      filtered = images.filter(image => 
        image.tags?.some(tag => filterTags.includes(tag))
      );
    }
    
    // 정렬
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.alt.localeCompare(b.alt);
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = (priorityOrder[a.priority || 'medium'] || 2) - (priorityOrder[b.priority || 'medium'] || 2);
          break;
        case 'size':
          const sizeA = (a.width || 0) * (a.height || 0);
          const sizeB = (b.width || 0) * (b.height || 0);
          comparison = sizeA - sizeB;
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [images, filterTags, sortBy, sortOrder]);

  // 🚀 성능 최적화: 가시 범위 내 이미지만 렌더링
  const visibleImages = useMemo(() => {
    if (filteredAndSortedImages.length <= virtualizeThreshold) {
      return filteredAndSortedImages;
    }
    
    return filteredAndSortedImages.slice(visibleRange.start, visibleRange.end);
  }, [filteredAndSortedImages, visibleRange, virtualizeThreshold]);

  // 🚀 성능 최적화: 사전 로딩할 이미지 URL 추출
  const preloadUrls = useMemo(() => {
    if (!enablePreloading) return [];
    
    const highPriorityImages = filteredAndSortedImages
      .filter(img => img.priority === 'high')
      .slice(0, maxPreloadImages)
      .map(img => img.src);
    
    const regularImages = filteredAndSortedImages
      .filter(img => img.priority !== 'high')
      .slice(0, Math.max(0, maxPreloadImages - highPriorityImages.length))
      .map(img => img.src);
    
    return [...highPriorityImages, ...regularImages];
  }, [filteredAndSortedImages, enablePreloading, maxPreloadImages]);

  // 이미지 사전 로딩
  const preloadStatus = useImagePreloader(preloadUrls, {
    maxConcurrent: 3,
    priority: 'medium',
    onProgress: (loaded, total) => {
      console.log(`Preloaded ${loaded}/${total} images`);
    },
    onError: (url, error) => {
      console.warn(`Failed to preload ${url}:`, error);
    }
  });

  // 🚀 성능 최적화: 이미지 클릭 핸들러
  const handleImageClick = useCallback((image: ImageItem, index: number) => {
    setSelectedImage(image);
    setCurrentIndex(index);
    setIsModalOpen(true);
    onImageClick?.(image, index);
  }, [onImageClick]);

  // 🚀 성능 최적화: 이미지 로드 핸들러
  const handleImageLoad = useCallback((image: ImageItem) => {
    onImageLoad?.(image);
  }, [onImageLoad]);

  // 🚀 성능 최적화: 이미지 에러 핸들러
  const handleImageError = useCallback((image: ImageItem, error: Error) => {
    onImageError?.(image, error);
  }, [onImageError]);

  // 🚀 성능 최적화: 모달 닫기
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedImage(null);
  }, []);

  // 🚀 성능 최적화: 다음/이전 이미지
  const navigateImage = useCallback((direction: 'next' | 'prev') => {
    if (!selectedImage) return;
    
    const newIndex = direction === 'next' 
      ? (currentIndex + 1) % filteredAndSortedImages.length
      : (currentIndex - 1 + filteredAndSortedImages.length) % filteredAndSortedImages.length;
    
    setCurrentIndex(newIndex);
    setSelectedImage(filteredAndSortedImages[newIndex]);
  }, [selectedImage, currentIndex, filteredAndSortedImages]);

  // 🚀 성능 최적화: 무한 스크롤 (가상화된 경우)
  const loadMoreImages = useCallback(() => {
    if (filteredAndSortedImages.length <= virtualizeThreshold) return;
    
    setVisibleRange(prev => ({
      start: prev.start,
      end: Math.min(prev.end + 50, filteredAndSortedImages.length)
    }));
  }, [filteredAndSortedImages.length, virtualizeThreshold]);

  // 그리드 스타일
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${gap}px`,
    padding: `${gap}px`
  };

  if (filteredAndSortedImages.length === 0) {
    return (
      <div className={`image-gallery empty ${className}`}>
        <div className="empty-state">
          <span className="empty-icon">🖼️</span>
          <p>표시할 이미지가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`image-gallery ${className}`}>
      {/* 사전 로딩 상태 표시 */}
      {enablePreloading && preloadStatus.status.isLoading && (
        <div className="preload-status">
          <div className="preload-progress">
            <div 
              className="preload-fill"
              style={{ width: `${preloadStatus.status.progress}%` }}
            />
          </div>
          <span className="preload-text">
            이미지 로딩 중... {preloadStatus.status.loaded}/{preloadStatus.status.total}
          </span>
        </div>
      )}

      {/* 이미지 그리드 */}
      <div className="gallery-grid" style={gridStyle}>
        {visibleImages.map((image, index) => (
          <GalleryItem
            key={image.id}
            image={image}
            index={index}
            showThumbnails={showThumbnails}
            enableLazyLoading={enableLazyLoading}
            onClick={handleImageClick}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ))}
      </div>

      {/* 더 보기 버튼 (가상화된 경우) */}
      {filteredAndSortedImages.length > virtualizeThreshold && 
       visibleRange.end < filteredAndSortedImages.length && (
        <div className="load-more-container">
          <button 
            className="load-more-btn"
            onClick={loadMoreImages}
          >
            더 보기 ({filteredAndSortedImages.length - visibleRange.end}개 남음)
          </button>
        </div>
      )}

      {/* 이미지 모달 */}
      {isModalOpen && selectedImage && (
        <ImageModal
          image={selectedImage}
          isOpen={isModalOpen}
          onClose={closeModal}
          onNext={() => navigateImage('next')}
          onPrev={() => navigateImage('prev')}
          currentIndex={currentIndex}
          totalImages={filteredAndSortedImages.length}
        />
      )}
    </div>
  );
});

ImageGallery.displayName = 'ImageGallery';

// 🚀 성능 최적화: 개별 갤러리 아이템 컴포넌트
interface GalleryItemProps {
  image: ImageItem;
  index: number;
  showThumbnails: boolean;
  enableLazyLoading: boolean;
  onClick: (image: ImageItem, index: number) => void;
  onLoad: (image: ImageItem) => void;
  onError: (image: ImageItem, error: Error) => void;
}

const GalleryItem: React.FC<GalleryItemProps> = memo(({
  image,
  index,
  showThumbnails,
  enableLazyLoading,
  onClick,
  onLoad,
  onError
}) => {
  const handleClick = useCallback(() => {
    onClick(image, index);
  }, [image, index, onClick]);

  const handleLoad = useCallback(() => {
    onLoad(image);
  }, [image, onLoad]);

  const handleError = useCallback((error: React.SyntheticEvent<HTMLImageElement>) => {
    onError(image, new Error('Image load failed'));
  }, [image, onError]);

  const imageSrc = showThumbnails && image.thumbnail ? image.thumbnail : image.src;

  return (
    <div 
      className="gallery-item"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <LazyImage
        src={imageSrc}
        alt={image.alt}
        className="gallery-image"
        loading={enableLazyLoading ? 'lazy' : 'eager'}
        priority={image.priority === 'medium' ? 'auto' : image.priority as 'high' | 'low' | 'auto'}
        fade={true}
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {(image.title || image.description) && (
        <div className="gallery-overlay">
          {image.title && <h4 className="image-title">{image.title}</h4>}
          {image.description && <p className="image-description">{image.description}</p>}
        </div>
      )}
    </div>
  );
});

GalleryItem.displayName = 'GalleryItem';

// 🚀 성능 최적화: 이미지 모달 컴포넌트
interface ImageModalProps {
  image: ImageItem;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentIndex: number;
  totalImages: number;
}

const ImageModal: React.FC<ImageModalProps> = memo(({
  image,
  isOpen,
  onClose,
  onNext,
  onPrev,
  currentIndex,
  totalImages
}) => {
  // 키보드 이벤트 처리
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        onPrev();
        break;
      case 'ArrowRight':
        onNext();
        break;
    }
  }, [onClose, onNext, onPrev]);

  if (!isOpen) return null;

  return (
    <div 
      className="image-modal-overlay"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-navigation">
          <button 
            className="nav-btn prev"
            onClick={onPrev}
            disabled={totalImages <= 1}
          >
            ←
          </button>
          
          <div className="modal-image-container">
            <LazyImage
              src={image.src}
              alt={image.alt}
              className="modal-image"
              loading="eager"
              priority="high"
              fade={true}
            />
          </div>
          
          <button 
            className="nav-btn next"
            onClick={onNext}
            disabled={totalImages <= 1}
          >
            →
          </button>
        </div>
        
        <div className="modal-info">
          <div className="image-counter">
            {currentIndex + 1} / {totalImages}
          </div>
          
          {image.title && <h3 className="modal-title">{image.title}</h3>}
          {image.description && <p className="modal-description">{image.description}</p>}
          
          {image.tags && image.tags.length > 0 && (
            <div className="modal-tags">
              {image.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ImageModal.displayName = 'ImageModal';

export default ImageGallery;