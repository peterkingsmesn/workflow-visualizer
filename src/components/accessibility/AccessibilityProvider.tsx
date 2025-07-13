import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { LiveRegionManager } from '../../utils/LiveRegionManager';
import { useScreenReader } from '../../hooks/useScreenReader';

// 🚀 접근성 최적화: 전역 접근성 컨텍스트

export interface AccessibilitySettings {
  // 스크린 리더 설정
  announcePageChanges: boolean;
  announceFormErrors: boolean;
  announceLoadingStates: boolean;
  announceSelectionChanges: boolean;
  
  // 키보드 네비게이션 설정
  enableKeyboardShortcuts: boolean;
  showFocusIndicators: boolean;
  skipLinksEnabled: boolean;
  
  // 비주얼 설정
  highContrast: boolean;
  reduceMotion: boolean;
  increaseFontSize: boolean;
  
  // 인터랙션 설정
  debounceTime: number;
  timeoutExtensions: boolean;
  confirmBeforeActions: boolean;
  
  // 언어 및 지역 설정
  language: string;
  dateFormat: string;
  numberFormat: string;
}

export interface AccessibilityContextValue {
  settings: AccessibilitySettings;
  updateSettings: (updates: Partial<AccessibilitySettings>) => void;
  resetSettings: () => void;
  
  // 스크린 리더 기능
  announce: (message: string, priority?: 'low' | 'medium' | 'high') => string;
  announceError: (error: string, context?: string) => string;
  announceSuccess: (message: string, details?: string) => string;
  announceLoading: (isLoading: boolean, context?: string) => string;
  announceNavigation: (page: string, section?: string) => string;
  
  // 상태 정보
  isScreenReaderDetected: boolean;
  isHighContrastMode: boolean;
  isReducedMotionMode: boolean;
  isTouchDevice: boolean;
  
  // 접근성 도구
  getFocusableElements: (container?: HTMLElement) => HTMLElement[];
  moveFocusToNext: (currentElement?: HTMLElement) => void;
  moveFocusToPrevious: (currentElement?: HTMLElement) => void;
  trapFocus: (container: HTMLElement) => () => void;
  
  // 유틸리티
  getAriaLabel: (key: string, params?: Record<string, any>) => string;
  formatForScreenReader: (text: string) => string;
}

const defaultSettings: AccessibilitySettings = {
  announcePageChanges: true,
  announceFormErrors: true,
  announceLoadingStates: true,
  announceSelectionChanges: true,
  enableKeyboardShortcuts: true,
  showFocusIndicators: true,
  skipLinksEnabled: true,
  highContrast: false,
  reduceMotion: false,
  increaseFontSize: false,
  debounceTime: 300,
  timeoutExtensions: false,
  confirmBeforeActions: false,
  language: 'ko',
  dateFormat: 'YYYY-MM-DD',
  numberFormat: 'ko-KR'
};

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export interface AccessibilityProviderProps {
  children: ReactNode;
  initialSettings?: Partial<AccessibilitySettings>;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children,
  initialSettings = {}
}) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    ...defaultSettings,
    ...initialSettings
  });

  // 시스템 설정 감지
  const [isHighContrastMode, setIsHighContrastMode] = useState(false);
  const [isReducedMotionMode, setIsReducedMotionMode] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // 스크린 리더 훅 사용
  const screenReader = useScreenReader({
    announcePageChanges: settings.announcePageChanges,
    announceFormErrors: settings.announceFormErrors,
    announceLoadingStates: settings.announceLoadingStates,
    announceSelectionChanges: settings.announceSelectionChanges,
    debounceTime: settings.debounceTime
  });

  // 🚀 접근성 최적화: 시스템 설정 감지
  useEffect(() => {
    // 고대비 모드 감지
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const updateHighContrast = (e: MediaQueryListEvent) => setIsHighContrastMode(e.matches);
    setIsHighContrastMode(highContrastQuery.matches);
    highContrastQuery.addListener(updateHighContrast);

    // 애니메이션 감소 모드 감지
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateReducedMotion = (e: MediaQueryListEvent) => setIsReducedMotionMode(e.matches);
    setIsReducedMotionMode(reducedMotionQuery.matches);
    reducedMotionQuery.addListener(updateReducedMotion);

    // 터치 디바이스 감지
    const updateTouchDevice = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    updateTouchDevice();

    return () => {
      highContrastQuery.removeListener(updateHighContrast);
      reducedMotionQuery.removeListener(updateReducedMotion);
    };
  }, []);

  // 🚀 접근성 최적화: 설정 적용
  useEffect(() => {
    // CSS 커스텀 속성으로 설정 적용
    const root = document.documentElement;
    
    // 폰트 크기 조정
    if (settings.increaseFontSize) {
      root.style.setProperty('--base-font-size', '18px');
    } else {
      root.style.removeProperty('--base-font-size');
    }
    
    // 고대비 모드
    if (settings.highContrast || isHighContrastMode) {
      root.setAttribute('data-high-contrast', 'true');
    } else {
      root.removeAttribute('data-high-contrast');
    }
    
    // 애니메이션 감소
    if (settings.reduceMotion || isReducedMotionMode) {
      root.setAttribute('data-reduce-motion', 'true');
    } else {
      root.removeAttribute('data-reduce-motion');
    }
    
    // 포커스 표시기
    if (settings.showFocusIndicators) {
      root.setAttribute('data-show-focus', 'true');
    } else {
      root.removeAttribute('data-show-focus');
    }
    
    // 언어 설정
    document.documentElement.lang = settings.language;
    
  }, [settings, isHighContrastMode, isReducedMotionMode]);

  // 🚀 접근성 최적화: 설정 관리
  const updateSettings = (updates: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    
    // 로컬 스토리지에 저장
    try {
      localStorage.setItem('accessibility-settings', JSON.stringify({ ...settings, ...updates }));
    } catch (error) {
      console.warn('Failed to save accessibility settings:', error);
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    
    // 로컬 스토리지에서 제거
    try {
      localStorage.removeItem('accessibility-settings');
    } catch (error) {
      console.warn('Failed to clear accessibility settings:', error);
    }
  };

  // 🚀 접근성 최적화: 로컬 스토리지에서 설정 로드
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('accessibility-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.warn('Failed to load accessibility settings:', error);
    }
  }, []);

  // 🚀 접근성 최적화: 포커스 관리 유틸리티
  const getFocusableElements = (container: HTMLElement = document.body): HTMLElement[] => {
    const focusableSelectors = [
      'a[href]',
      'area[href]',
      'input:not([disabled]):not([tabindex="-1"])',
      'select:not([disabled]):not([tabindex="-1"])',
      'textarea:not([disabled]):not([tabindex="-1"])',
      'button:not([disabled]):not([tabindex="-1"])',
      'iframe',
      'object',
      'embed',
      '[contenteditable]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    const elements = Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
    
    return elements.filter(element => {
      // 보이는 요소만 포함
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             element.offsetParent !== null;
    });
  };

  const moveFocusToNext = (currentElement?: HTMLElement) => {
    const focusableElements = getFocusableElements();
    const currentIndex = currentElement 
      ? focusableElements.indexOf(currentElement)
      : -1;
    
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    const nextElement = focusableElements[nextIndex];
    
    if (nextElement) {
      nextElement.focus();
      screenReader.announce(`포커스 이동: ${getElementDescription(nextElement)}`, 'low');
    }
  };

  const moveFocusToPrevious = (currentElement?: HTMLElement) => {
    const focusableElements = getFocusableElements();
    const currentIndex = currentElement 
      ? focusableElements.indexOf(currentElement)
      : focusableElements.length;
    
    const prevIndex = currentIndex === 0 
      ? focusableElements.length - 1 
      : currentIndex - 1;
    const prevElement = focusableElements[prevIndex];
    
    if (prevElement) {
      prevElement.focus();
      screenReader.announce(`포커스 이동: ${getElementDescription(prevElement)}`, 'low');
    }
  };

  const trapFocus = (container: HTMLElement): (() => void) => {
    const focusableElements = getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // 첫 번째 요소에 포커스
    firstElement?.focus();

    // 정리 함수 반환
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  };

  // 🚀 접근성 최적화: 다국어 지원
  const ariaLabels: Record<string, string> = {
    'button.close': '닫기',
    'button.menu': '메뉴',
    'button.search': '검색',
    'button.filter': '필터',
    'button.sort': '정렬',
    'input.search': '검색어 입력',
    'navigation.main': '주 네비게이션',
    'navigation.breadcrumb': '현재 위치',
    'region.main': '주요 내용',
    'region.sidebar': '사이드바',
    'status.loading': '로딩 중',
    'status.error': '오류 발생',
    'status.success': '성공',
    'page.current': '현재 페이지',
    'page.total': '전체 페이지'
  };

  const getAriaLabel = (key: string, params: Record<string, any> = {}): string => {
    let label = ariaLabels[key] || key;
    
    // 파라미터 치환
    Object.entries(params).forEach(([param, value]) => {
      label = label.replace(`{{${param}}}`, String(value));
    });
    
    return label;
  };

  // 🚀 접근성 최적화: 텍스트 포맷팅
  const formatForScreenReader = (text: string): string => {
    return text
      // 숫자를 읽기 쉽게 변환
      .replace(/(\d+)%/g, '$1퍼센트')
      .replace(/(\d+)\/(\d+)/g, '$1 중 $2')
      // 특수 문자 읽기
      .replace(/&/g, '그리고')
      .replace(/@/g, '골뱅이')
      .replace(/#/g, '샵')
      // 약어 확장
      .replace(/\bAPI\b/g, '에이피아이')
      .replace(/\bURL\b/g, '유알엘')
      .replace(/\bJSON\b/g, '제이슨')
      // 공백 정리
      .replace(/\s+/g, ' ')
      .trim();
  };

  // 🚀 접근성 최적화: 요소 설명 생성
  const getElementDescription = (element: HTMLElement): string => {
    const tagName = element.tagName.toLowerCase();
    const ariaLabel = element.getAttribute('aria-label');
    const text = element.textContent?.trim();
    const title = element.getAttribute('title');
    
    if (ariaLabel) return ariaLabel;
    if (text) return text;
    if (title) return title;
    
    // 태그별 기본 설명
    const descriptions: Record<string, string> = {
      'button': '버튼',
      'input': '입력 필드',
      'select': '선택 박스',
      'textarea': '텍스트 영역',
      'a': '링크',
      'img': '이미지'
    };
    
    return descriptions[tagName] || tagName;
  };

  // 🚀 접근성 최적화: 컨텍스트 값 구성
  const contextValue: AccessibilityContextValue = {
    settings,
    updateSettings,
    resetSettings,
    
    // 스크린 리더 기능
    announce: screenReader.announce,
    announceError: screenReader.announceError,
    announceSuccess: screenReader.announceSuccess,
    announceLoading: screenReader.announceLoading,
    announceNavigation: screenReader.announceNavigation,
    
    // 상태 정보
    isScreenReaderDetected: screenReader.isScreenReaderDetected,
    isHighContrastMode,
    isReducedMotionMode,
    isTouchDevice,
    
    // 접근성 도구
    getFocusableElements,
    moveFocusToNext,
    moveFocusToPrevious,
    trapFocus,
    
    // 유틸리티
    getAriaLabel,
    formatForScreenReader
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// 🚀 접근성 최적화: 컨텍스트 사용 훅
export const useAccessibility = (): AccessibilityContextValue => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// 🚀 접근성 최적화: 특정 기능별 훅들
export const useKeyboardNavigation = () => {
  const { 
    getFocusableElements, 
    moveFocusToNext, 
    moveFocusToPrevious, 
    trapFocus,
    settings 
  } = useAccessibility();

  return {
    getFocusableElements,
    moveFocusToNext,
    moveFocusToPrevious,
    trapFocus,
    isEnabled: settings.enableKeyboardShortcuts
  };
};

export const useAnnouncements = () => {
  const { 
    announce, 
    announceError, 
    announceSuccess, 
    announceLoading, 
    announceNavigation,
    isScreenReaderDetected 
  } = useAccessibility();

  return {
    announce,
    announceError,
    announceSuccess,
    announceLoading,
    announceNavigation,
    isEnabled: isScreenReaderDetected
  };
};

export const useAccessibilitySettings = () => {
  const { 
    settings, 
    updateSettings, 
    resetSettings, 
    isHighContrastMode, 
    isReducedMotionMode,
    isTouchDevice 
  } = useAccessibility();

  return {
    settings,
    updateSettings,
    resetSettings,
    systemSettings: {
      isHighContrastMode,
      isReducedMotionMode,
      isTouchDevice
    }
  };
};

export default AccessibilityProvider;