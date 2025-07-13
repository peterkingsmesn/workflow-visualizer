import { useEffect, useCallback, useRef, useState } from 'react';
import { LiveRegionManager, LiveMessage } from '../utils/LiveRegionManager';

// 🚀 접근성 최적화: 스크린 리더 지원 훅

export interface ScreenReaderOptions {
  announcePageChanges?: boolean;
  announceFormErrors?: boolean;
  announceLoadingStates?: boolean;
  announceSelectionChanges?: boolean;
  debounceTime?: number;
}

export interface ScreenReaderHookReturn {
  announce: (message: string, priority?: 'low' | 'medium' | 'high') => string;
  announceError: (error: string, context?: string) => string;
  announceSuccess: (message: string, details?: string) => string;
  announceStatus: (status: string, details?: string) => string;
  announceProgress: (current: number, total: number, task?: string) => string;
  announceLoading: (isLoading: boolean, context?: string) => string;
  announceNavigation: (page: string, section?: string) => string;
  announceSelection: (selected: string[], total?: number) => string;
  clearMessages: (type?: 'polite' | 'assertive') => void;
  getQueueStatus: () => any;
  isScreenReaderDetected: boolean;
}

export function useScreenReader(options: ScreenReaderOptions = {}): ScreenReaderHookReturn {
  const {
    announcePageChanges = true,
    announceFormErrors = true,
    announceLoadingStates = true,
    announceSelectionChanges = true,
    debounceTime = 300
  } = options;

  const [isScreenReaderDetected, setIsScreenReaderDetected] = useState(false);
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lastAnnouncements = useRef<Map<string, string>>(new Map());

  // 🚀 접근성 최적화: 스크린 리더 감지
  useEffect(() => {
    const detectScreenReader = () => {
      // 여러 방법으로 스크린 리더 감지 시도
      let detected = false;

      // 1. User Agent 확인
      const userAgent = navigator.userAgent.toLowerCase();
      const screenReaderUAs = ['nvda', 'jaws', 'voiceover', 'orca', 'dragon'];
      detected = screenReaderUAs.some(sr => userAgent.includes(sr));

      // 2. 접근성 API 확인 (실험적)
      if (!detected && 'speechSynthesis' in window) {
        detected = window.speechSynthesis.getVoices().length > 0;
      }

      // 3. 미디어 쿼리 확인
      if (!detected && window.matchMedia) {
        detected = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      }

      // 4. 포커스 동작 패턴 감지 (휴리스틱)
      if (!detected) {
        let tabKeyPressed = false;
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Tab') {
            tabKeyPressed = true;
            setIsScreenReaderDetected(true);
            document.removeEventListener('keydown', handleKeyDown);
          }
        };

        document.addEventListener('keydown', handleKeyDown);
        
        // 5초 후 리스너 제거
        setTimeout(() => {
          document.removeEventListener('keydown', handleKeyDown);
        }, 5000);
      }

      setIsScreenReaderDetected(detected);
    };

    detectScreenReader();
  }, []);

  // 🚀 접근성 최적화: 디바운스된 발표
  const debouncedAnnounce = useCallback((
    key: string,
    message: string,
    announceFunction: () => string
  ): string => {
    // 이전 타이머 취소
    const existingTimer = debounceTimers.current.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // 동일한 메시지 중복 방지
    const lastMessage = lastAnnouncements.current.get(key);
    if (lastMessage === message) {
      return '';
    }

    let messageId = '';

    // 새 타이머 설정
    const timer = setTimeout(() => {
      messageId = announceFunction();
      lastAnnouncements.current.set(key, message);
      debounceTimers.current.delete(key);
    }, debounceTime);

    debounceTimers.current.set(key, timer);
    return messageId;
  }, [debounceTime]);

  // 🚀 접근성 최적화: 기본 발표 함수
  const announce = useCallback((
    message: string, 
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): string => {
    if (!message.trim()) return '';

    const priorityMap = {
      low: 1,
      medium: 2,
      high: 3
    };

    return LiveRegionManager.announcePolite(message, {
      priority: priorityMap[priority]
    });
  }, []);

  // 🚀 접근성 최적화: 오류 발표
  const announceError = useCallback((error: string, context?: string): string => {
    if (!announceFormErrors) return '';
    
    return debouncedAnnounce(
      `error-${context || 'general'}`,
      error,
      () => LiveRegionManager.announceError(error, context)
    );
  }, [announceFormErrors, debouncedAnnounce]);

  // 🚀 접근성 최적화: 성공 발표
  const announceSuccess = useCallback((message: string, details?: string): string => {
    return debouncedAnnounce(
      `success-${message}`,
      message,
      () => LiveRegionManager.announceSuccess(message, details)
    );
  }, [debouncedAnnounce]);

  // 🚀 접근성 최적화: 상태 발표
  const announceStatus = useCallback((status: string, details?: string): string => {
    return debouncedAnnounce(
      `status-${status}`,
      status,
      () => LiveRegionManager.announceStatus(status, details)
    );
  }, [debouncedAnnounce]);

  // 🚀 접근성 최적화: 진행률 발표
  const announceProgress = useCallback((
    current: number, 
    total: number, 
    task?: string
  ): string => {
    const progressKey = `progress-${task || 'default'}`;
    const message = `${current}/${total}`;
    
    return debouncedAnnounce(
      progressKey,
      message,
      () => LiveRegionManager.announceProgress(current, total, task)
    );
  }, [debouncedAnnounce]);

  // 🚀 접근성 최적화: 로딩 상태 발표
  const announceLoading = useCallback((isLoading: boolean, context?: string): string => {
    if (!announceLoadingStates) return '';
    
    const loadingKey = `loading-${context || 'general'}`;
    const message = isLoading ? 'loading' : 'loaded';
    
    return debouncedAnnounce(
      loadingKey,
      message,
      () => LiveRegionManager.announceLoading(isLoading, context)
    );
  }, [announceLoadingStates, debouncedAnnounce]);

  // 🚀 접근성 최적화: 네비게이션 발표
  const announceNavigation = useCallback((page: string, section?: string): string => {
    if (!announcePageChanges) return '';
    
    return LiveRegionManager.announceNavigation(page, section);
  }, [announcePageChanges]);

  // 🚀 접근성 최적화: 선택 변경 발표
  const announceSelection = useCallback((selected: string[], total?: number): string => {
    if (!announceSelectionChanges) return '';
    
    const selectionKey = 'selection';
    const message = `${selected.length}-${total || 'unknown'}`;
    
    return debouncedAnnounce(
      selectionKey,
      message,
      () => LiveRegionManager.announceSelection(selected, total)
    );
  }, [announceSelectionChanges, debouncedAnnounce]);

  // 🚀 접근성 최적화: 메시지 정리
  const clearMessages = useCallback((type?: 'polite' | 'assertive') => {
    LiveRegionManager.clearAll(type);
    
    // 디바운스 타이머도 정리
    debounceTimers.current.forEach(timer => clearTimeout(timer));
    debounceTimers.current.clear();
    lastAnnouncements.current.clear();
  }, []);

  // 🚀 접근성 최적화: 큐 상태 조회
  const getQueueStatus = useCallback(() => {
    return LiveRegionManager.getQueueStatus();
  }, []);

  // 🚀 접근성 최적화: 정리
  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 타이머 정리
      debounceTimers.current.forEach(timer => clearTimeout(timer));
      debounceTimers.current.clear();
      lastAnnouncements.current.clear();
    };
  }, []);

  return {
    announce,
    announceError,
    announceSuccess,
    announceStatus,
    announceProgress,
    announceLoading,
    announceNavigation,
    announceSelection,
    clearMessages,
    getQueueStatus,
    isScreenReaderDetected
  };
}

// 🚀 접근성 최적화: 특정 용도별 훅들

export function useFormAccessibility() {
  const screenReader = useScreenReader({
    announceFormErrors: true,
    announceLoadingStates: true,
    debounceTime: 500
  });

  const announceFieldError = useCallback((fieldName: string, error: string) => {
    return screenReader.announceError(error, `${fieldName} 필드`);
  }, [screenReader]);

  const announceValidationSuccess = useCallback((fieldName: string) => {
    return screenReader.announceSuccess(`${fieldName} 입력이 유효합니다`);
  }, [screenReader]);

  const announceFormSubmission = useCallback((isSubmitting: boolean) => {
    return screenReader.announceLoading(isSubmitting, '폼 제출');
  }, [screenReader]);

  return {
    ...screenReader,
    announceFieldError,
    announceValidationSuccess,
    announceFormSubmission
  };
}

export function useNavigationAccessibility() {
  const screenReader = useScreenReader({
    announcePageChanges: true,
    announceLoadingStates: true
  });

  const announceRouteChange = useCallback((from: string, to: string) => {
    return screenReader.announceNavigation(to, `${from}에서 이동`);
  }, [screenReader]);

  const announceModalOpen = useCallback((modalTitle: string) => {
    return screenReader.announce(`${modalTitle} 모달이 열렸습니다`, 'high');
  }, [screenReader]);

  const announceModalClose = useCallback((modalTitle: string) => {
    return screenReader.announce(`${modalTitle} 모달이 닫혔습니다`, 'medium');
  }, [screenReader]);

  return {
    ...screenReader,
    announceRouteChange,
    announceModalOpen,
    announceModalClose
  };
}

export function useDataAccessibility() {
  const screenReader = useScreenReader({
    announceLoadingStates: true,
    announceSelectionChanges: true
  });

  const announceDataLoaded = useCallback((itemType: string, count: number) => {
    return screenReader.announceSuccess(`${count}개의 ${itemType}이(가) 로드되었습니다`);
  }, [screenReader]);

  const announceDataError = useCallback((operation: string, error: string) => {
    return screenReader.announceError(`${operation} 중 오류가 발생했습니다: ${error}`);
  }, [screenReader]);

  const announceSearch = useCallback((query: string, resultCount: number) => {
    return screenReader.announce(
      `"${query}" 검색 결과: ${resultCount}개 항목`,
      'medium'
    );
  }, [screenReader]);

  const announceFilter = useCallback((filterName: string, activeFilters: number) => {
    return screenReader.announce(
      `${filterName} 필터 적용됨. 총 ${activeFilters}개 필터 활성`,
      'low'
    );
  }, [screenReader]);

  const announceSorting = useCallback((column: string, direction: 'asc' | 'desc') => {
    const directionText = direction === 'asc' ? '오름차순' : '내림차순';
    return screenReader.announce(
      `${column} 기준 ${directionText}으로 정렬됨`,
      'low'
    );
  }, [screenReader]);

  return {
    ...screenReader,
    announceDataLoaded,
    announceDataError,
    announceSearch,
    announceFilter,
    announceSorting
  };
}

export default useScreenReader;