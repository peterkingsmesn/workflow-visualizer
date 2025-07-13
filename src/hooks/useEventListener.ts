import { useEffect, useRef, useCallback } from 'react';

// 🚀 성능 최적화: 이벤트 리스너 자동 정리 훅

export interface EventListenerOptions extends AddEventListenerOptions {
  condition?: boolean;
  target?: EventTarget | null;
  throttle?: number;
  debounce?: number;
}

export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: EventListenerOptions
): void;

export function useEventListener<K extends keyof DocumentEventMap>(
  eventName: K,
  handler: (event: DocumentEventMap[K]) => void,
  options?: EventListenerOptions & { target: Document }
): void;

export function useEventListener<K extends keyof HTMLElementEventMap>(
  eventName: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  options?: EventListenerOptions & { target: HTMLElement | null }
): void;

export function useEventListener(
  eventName: string,
  handler: (event: Event) => void,
  options?: EventListenerOptions
): void;

export function useEventListener(
  eventName: string,
  handler: (event: any) => void,
  options: EventListenerOptions = {}
) {
  const {
    condition = true,
    target,
    throttle,
    debounce,
    ...listenerOptions
  } = options;

  const handlerRef = useRef(handler);
  const throttleRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // 핸들러 참조 업데이트
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  // 최적화된 이벤트 핸들러 생성
  const optimizedHandler = useCallback((event: Event) => {
    // 쓰로틀링
    if (throttle) {
      if (throttleRef.current) return;
      
      throttleRef.current = setTimeout(() => {
        throttleRef.current = null;
      }, throttle);
      
      handlerRef.current(event);
      return;
    }

    // 디바운싱
    if (debounce) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      debounceRef.current = setTimeout(() => {
        handlerRef.current(event);
        debounceRef.current = null;
      }, debounce);
      return;
    }

    // 일반 실행
    handlerRef.current(event);
  }, [throttle, debounce]);

  useEffect(() => {
    if (!condition) return;

    // 타겟 결정
    const element = target || window;
    if (!element || !element.addEventListener) return;

    // 이벤트 리스너 추가
    element.addEventListener(eventName, optimizedHandler, listenerOptions);

    // 정리 함수
    return () => {
      element.removeEventListener(eventName, optimizedHandler, listenerOptions);
      
      // 타이머 정리
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
        throttleRef.current = null;
      }
      
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [eventName, optimizedHandler, condition, target, listenerOptions.capture, listenerOptions.passive, listenerOptions.once]);
}

// 여러 이벤트 리스너를 관리하는 훅
export function useMultipleEventListeners(
  events: Array<{
    eventName: string;
    handler: (event: any) => void;
    options?: EventListenerOptions;
  }>
) {
  const listenersRef = useRef<Array<{
    element: EventTarget;
    eventName: string;
    handler: (event: any) => void;
    options?: AddEventListenerOptions;
  }>>([]);

  useEffect(() => {
    // 기존 리스너 정리
    listenersRef.current.forEach(({ element, eventName, handler, options }) => {
      element.removeEventListener(eventName, handler, options);
    });
    listenersRef.current = [];

    // 새 리스너 등록
    events.forEach(({ eventName, handler, options = {} }) => {
      const {
        condition = true,
        target,
        throttle,
        debounce,
        ...listenerOptions
      } = options;

      if (!condition) return;

      const element = target || window;
      if (!element || !element.addEventListener) return;

      let optimizedHandler = handler;

      // 쓰로틀링/디바운싱 적용
      if (throttle || debounce) {
        let timeoutId: NodeJS.Timeout | null = null;
        
        optimizedHandler = (event: any) => {
          if (throttle) {
            if (timeoutId) return;
            timeoutId = setTimeout(() => {
              timeoutId = null;
            }, throttle);
            handler(event);
          } else if (debounce) {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
              handler(event);
              timeoutId = null;
            }, debounce);
          }
        };
      }

      element.addEventListener(eventName, optimizedHandler, listenerOptions);
      
      listenersRef.current.push({
        element,
        eventName,
        handler: optimizedHandler,
        options: listenerOptions
      });
    });

    // 정리 함수
    return () => {
      listenersRef.current.forEach(({ element, eventName, handler, options }) => {
        element.removeEventListener(eventName, handler, options);
      });
      listenersRef.current = [];
    };
  }, [events]);
}

// 리사이즈 이벤트 전용 훅
export function useResizeObserver(
  callback: (entries: ResizeObserverEntry[]) => void,
  elementRef: React.RefObject<Element>,
  options: {
    throttle?: number;
    debounce?: number;
    condition?: boolean;
  } = {}
) {
  const { throttle, debounce, condition = true } = options;
  const callbackRef = useRef(callback);
  const observerRef = useRef<ResizeObserver | null>(null);
  const throttleRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!condition || !elementRef.current) return;

    const element = elementRef.current;

    // 최적화된 콜백 생성
    const optimizedCallback = (entries: ResizeObserverEntry[]) => {
      if (throttle) {
        if (throttleRef.current) return;
        throttleRef.current = setTimeout(() => {
          throttleRef.current = null;
        }, throttle);
        callbackRef.current(entries);
        return;
      }

      if (debounce) {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
          callbackRef.current(entries);
          debounceRef.current = null;
        }, debounce);
        return;
      }

      callbackRef.current(entries);
    };

    // ResizeObserver 생성 및 관찰 시작
    if ('ResizeObserver' in window) {
      observerRef.current = new ResizeObserver(optimizedCallback);
      observerRef.current.observe(element);
    }

    // 정리 함수
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
        throttleRef.current = null;
      }
      
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [condition, elementRef, throttle, debounce]);
}

// IntersectionObserver 전용 훅
export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit & {
    condition?: boolean;
    throttle?: number;
    debounce?: number;
  } = {}
) {
  const { condition = true, throttle, debounce, ...observerOptions } = options;
  const callbackRef = useRef(callback);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const throttleRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!condition || !elementRef.current) return;

    const element = elementRef.current;

    // 최적화된 콜백 생성
    const optimizedCallback = (entries: IntersectionObserverEntry[]) => {
      if (throttle) {
        if (throttleRef.current) return;
        throttleRef.current = setTimeout(() => {
          throttleRef.current = null;
        }, throttle);
        callbackRef.current(entries);
        return;
      }

      if (debounce) {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
          callbackRef.current(entries);
          debounceRef.current = null;
        }, debounce);
        return;
      }

      callbackRef.current(entries);
    };

    // IntersectionObserver 생성 및 관찰 시작
    if ('IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(optimizedCallback, observerOptions);
      observerRef.current.observe(element);
    }

    // 정리 함수
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
        throttleRef.current = null;
      }
      
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [condition, elementRef, observerOptions.root, observerOptions.rootMargin, observerOptions.threshold, throttle, debounce]);
}

// 메모리 누수 감지를 위한 이벤트 리스너 추적 훅
export function useEventListenerTracker() {
  const listenersRef = useRef<Set<{
    target: EventTarget;
    eventName: string;
    handler: Function;
    timestamp: number;
  }>>(new Set());

  const addListener = useCallback((
    target: EventTarget,
    eventName: string,
    handler: Function
  ) => {
    const listenerInfo = {
      target,
      eventName,
      handler,
      timestamp: Date.now()
    };
    
    listenersRef.current.add(listenerInfo);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EventTracker] Added listener: ${eventName}`, listenerInfo);
    }
    
    return listenerInfo;
  }, []);

  const removeListener = useCallback((listenerInfo: any) => {
    listenersRef.current.delete(listenerInfo);
    
    if (process.env.NODE_ENV === 'development') {
      const duration = Date.now() - listenerInfo.timestamp;
      console.log(`[EventTracker] Removed listener: ${listenerInfo.eventName} (lived ${duration}ms)`);
    }
  }, []);

  const getActiveListeners = useCallback(() => {
    return Array.from(listenersRef.current);
  }, []);

  const checkForLeaks = useCallback(() => {
    const now = Date.now();
    const oldListeners = Array.from(listenersRef.current)
      .filter(listener => now - listener.timestamp > 5 * 60 * 1000); // 5분 이상

    if (oldListeners.length > 0) {
      console.warn(`[EventTracker] Potential memory leak detected: ${oldListeners.length} old listeners`, oldListeners);
    }

    return oldListeners;
  }, []);

  useEffect(() => {
    // 주기적으로 메모리 누수 검사
    const interval = setInterval(checkForLeaks, 60 * 1000); // 1분마다
    
    return () => {
      clearInterval(interval);
    };
  }, [checkForLeaks]);

  return {
    addListener,
    removeListener,
    getActiveListeners,
    checkForLeaks,
    activeCount: listenersRef.current.size
  };
}

export default useEventListener;