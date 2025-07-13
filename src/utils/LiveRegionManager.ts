// 🚀 접근성 최적화: 스크린 리더용 라이브 영역 관리

export type LiveRegionType = 'polite' | 'assertive' | 'off';
export type LiveRegionRelevant = 'additions' | 'removals' | 'text' | 'all';

export interface LiveRegionOptions {
  type?: LiveRegionType;
  relevant?: LiveRegionRelevant;
  atomic?: boolean;
  busy?: boolean;
  timeout?: number;
  persistent?: boolean;
  priority?: number;
}

export interface LiveMessage {
  id: string;
  content: string;
  type: LiveRegionType;
  timestamp: number;
  priority: number;
  persistent: boolean;
  read: boolean;
}

class LiveRegionManagerClass {
  private regions: Map<LiveRegionType, HTMLElement> = new Map();
  private messageQueue: LiveMessage[] = [];
  private currentMessage: LiveMessage | null = null;
  private isProcessing = false;
  private messageHistory: LiveMessage[] = [];
  private maxHistorySize = 100;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeRegions();
    this.setupEventListeners();
  }

  // 🚀 접근성 최적화: 라이브 영역 초기화
  private initializeRegions(): void {
    const regions: Array<{ type: LiveRegionType; id: string }> = [
      { type: 'polite', id: 'live-region-polite' },
      { type: 'assertive', id: 'live-region-assertive' },
      { type: 'off', id: 'live-region-off' }
    ];

    regions.forEach(({ type, id }) => {
      let region = document.getElementById(id) as HTMLElement;
      
      if (!region) {
        region = document.createElement('div');
        region.id = id;
        region.setAttribute('aria-live', type);
        region.setAttribute('aria-atomic', 'false');
        region.setAttribute('aria-relevant', 'additions text');
        region.className = 'sr-only live-region';
        
        // 화면에서 숨기지만 스크린 리더에서는 접근 가능
        region.style.cssText = `
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: -1px !important;
          overflow: hidden !important;
          clip: rect(0, 0, 0, 0) !important;
          white-space: nowrap !important;
          border: 0 !important;
        `;
        
        document.body.appendChild(region);
      }
      
      this.regions.set(type, region);
    });

    console.log('[LiveRegionManager] Live regions initialized');
  }

  // 🚀 접근성 최적화: 메시지 발표
  announce(
    content: string, 
    options: LiveRegionOptions = {}
  ): string {
    const {
      type = 'polite',
      relevant = 'additions',
      atomic = false,
      busy = false,
      timeout = 0,
      persistent = false,
      priority = 1
    } = options;

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const message: LiveMessage = {
      id: messageId,
      content: this.sanitizeContent(content),
      type,
      timestamp: Date.now(),
      priority,
      persistent,
      read: false
    };

    // 우선순위에 따라 큐에 삽입
    this.insertMessageByPriority(message);
    
    // 즉시 처리 (assertive) 또는 큐 처리
    if (type === 'assertive') {
      this.processMessageImmediately(message);
    } else {
      this.processQueue();
    }

    // 히스토리에 추가
    this.addToHistory(message);
    
    // 타임아웃 설정
    if (timeout > 0 && !persistent) {
      setTimeout(() => {
        this.clearMessage(messageId);
      }, timeout);
    }

    // 이벤트 발생
    this.emit('message-announced', message);
    
    return messageId;
  }

  // 🚀 접근성 최적화: 즉시 발표 (중요한 메시지용)
  announceImmediate(content: string, options: Omit<LiveRegionOptions, 'type'> = {}): string {
    return this.announce(content, { ...options, type: 'assertive' });
  }

  // 🚀 접근성 최적화: 정중한 발표 (일반 메시지용)
  announcePolite(content: string, options: Omit<LiveRegionOptions, 'type'> = {}): string {
    return this.announce(content, { ...options, type: 'polite' });
  }

  // 🚀 접근성 최적화: 상태 변경 발표
  announceStatus(status: string, details?: string): string {
    const content = details ? `${status}. ${details}` : status;
    return this.announcePolite(content, { priority: 2 });
  }

  // 🚀 접근성 최적화: 오류 발표
  announceError(error: string, context?: string): string {
    const content = context ? `오류: ${error}. 위치: ${context}` : `오류: ${error}`;
    return this.announceImmediate(content, { priority: 5, persistent: true });
  }

  // 🚀 접근성 최적화: 성공 메시지 발표
  announceSuccess(message: string, details?: string): string {
    const content = details ? `성공: ${message}. ${details}` : `성공: ${message}`;
    return this.announcePolite(content, { priority: 3 });
  }

  // 🚀 접근성 최적화: 진행 상황 발표
  announceProgress(current: number, total: number, task?: string): string {
    const percentage = Math.round((current / total) * 100);
    const content = task 
      ? `${task} 진행률: ${current}/${total} (${percentage}%)`
      : `진행률: ${current}/${total} (${percentage}%)`;
    
    return this.announcePolite(content, { priority: 1 });
  }

  // 🚀 접근성 최적화: 로딩 상태 발표
  announceLoading(isLoading: boolean, context?: string): string {
    const content = isLoading
      ? context ? `${context} 로딩 중` : '로딩 중'
      : context ? `${context} 로딩 완료` : '로딩 완료';
    
    return this.announcePolite(content, { priority: 2 });
  }

  // 🚀 접근성 최적화: 네비게이션 변경 발표
  announceNavigation(page: string, section?: string): string {
    const content = section 
      ? `페이지 이동: ${page}, ${section} 섹션`
      : `페이지 이동: ${page}`;
    
    return this.announcePolite(content, { priority: 3 });
  }

  // 🚀 접근성 최적화: 선택 변경 발표
  announceSelection(selected: string[], total?: number): string {
    const count = selected.length;
    let content = '';
    
    if (count === 0) {
      content = '선택된 항목 없음';
    } else if (count === 1) {
      content = `선택됨: ${selected[0]}`;
    } else {
      content = total 
        ? `${count}개 항목 선택됨 (총 ${total}개 중)`
        : `${count}개 항목 선택됨`;
    }
    
    return this.announcePolite(content, { priority: 2 });
  }

  // 🚀 접근성 최적화: 우선순위별 메시지 삽입
  private insertMessageByPriority(message: LiveMessage): void {
    const index = this.messageQueue.findIndex(m => m.priority < message.priority);
    if (index === -1) {
      this.messageQueue.push(message);
    } else {
      this.messageQueue.splice(index, 0, message);
    }
  }

  // 🚀 접근성 최적화: 즉시 메시지 처리
  private processMessageImmediately(message: LiveMessage): void {
    // 현재 메시지 중단
    if (this.currentMessage && !this.currentMessage.persistent) {
      this.clearCurrentMessage();
    }
    
    this.displayMessage(message);
    this.currentMessage = message;
  }

  // 🚀 접근성 최적화: 큐 처리
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.messageQueue.length > 0) {
      // 현재 메시지가 진행 중이면 대기
      if (this.currentMessage && this.currentMessage.persistent) {
        await this.waitForCurrentMessage();
      }

      const message = this.messageQueue.shift();
      if (!message) break;

      this.displayMessage(message);
      this.currentMessage = message;

      // 메시지 표시 시간 대기
      await this.waitForMessage(message);
    }

    this.isProcessing = false;
  }

  // 🚀 접근성 최적화: 메시지 표시
  private displayMessage(message: LiveMessage): void {
    const region = this.regions.get(message.type);
    if (!region) return;

    // 기존 내용 정리
    region.innerHTML = '';
    
    // 새 메시지 추가
    const messageElement = document.createElement('div');
    messageElement.textContent = message.content;
    messageElement.setAttribute('data-message-id', message.id);
    
    region.appendChild(messageElement);
    
    // 읽음 상태 업데이트
    message.read = true;
    
    // 이벤트 발생
    this.emit('message-displayed', message);
    
    console.log(`[LiveRegionManager] Announced (${message.type}): ${message.content}`);
  }

  // 🚀 접근성 최적화: 메시지 대기
  private waitForMessage(message: LiveMessage): Promise<void> {
    return new Promise(resolve => {
      // 메시지 길이에 따른 대기 시간 계산
      const baseTime = 1000; // 1초
      const timePerChar = 50; // 글자당 50ms
      const waitTime = Math.max(baseTime, message.content.length * timePerChar);
      
      setTimeout(() => {
        if (this.currentMessage?.id === message.id && !message.persistent) {
          this.clearCurrentMessage();
        }
        resolve();
      }, waitTime);
    });
  }

  // 🚀 접근성 최적화: 현재 메시지 대기
  private waitForCurrentMessage(): Promise<void> {
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (!this.currentMessage || this.currentMessage.read) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  // 🚀 접근성 최적화: 메시지 정리
  clearMessage(messageId: string): void {
    // 큐에서 제거
    this.messageQueue = this.messageQueue.filter(m => m.id !== messageId);
    
    // 현재 메시지가 해당 메시지면 정리
    if (this.currentMessage?.id === messageId) {
      this.clearCurrentMessage();
    }
    
    // DOM에서 제거
    this.regions.forEach(region => {
      const messageElement = region.querySelector(`[data-message-id="${messageId}"]`);
      if (messageElement) {
        messageElement.remove();
      }
    });
    
    this.emit('message-cleared', messageId);
  }

  // 🚀 접근성 최적화: 현재 메시지 정리
  private clearCurrentMessage(): void {
    if (!this.currentMessage) return;
    
    const region = this.regions.get(this.currentMessage.type);
    if (region) {
      region.innerHTML = '';
    }
    
    this.emit('message-cleared', this.currentMessage.id);
    this.currentMessage = null;
  }

  // 🚀 접근성 최적화: 모든 메시지 정리
  clearAll(type?: LiveRegionType): void {
    if (type) {
      // 특정 타입의 메시지만 정리
      this.messageQueue = this.messageQueue.filter(m => m.type !== type);
      
      if (this.currentMessage?.type === type) {
        this.clearCurrentMessage();
      }
      
      const region = this.regions.get(type);
      if (region) {
        region.innerHTML = '';
      }
    } else {
      // 모든 메시지 정리
      this.messageQueue = [];
      this.clearCurrentMessage();
      
      this.regions.forEach(region => {
        region.innerHTML = '';
      });
    }
    
    this.emit('all-messages-cleared', type || 'all');
  }

  // 🚀 접근성 최적화: 메시지 내용 정제
  private sanitizeContent(content: string): string {
    // HTML 태그 제거
    const withoutHtml = content.replace(/<[^>]*>/g, '');
    
    // 연속된 공백 정리
    const normalized = withoutHtml.replace(/\s+/g, ' ').trim();
    
    // 특수 문자 변환
    const escaped = normalized
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    return escaped;
  }

  // 🚀 접근성 최적화: 히스토리 관리
  private addToHistory(message: LiveMessage): void {
    this.messageHistory.unshift(message);
    
    // 히스토리 크기 제한
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory = this.messageHistory.slice(0, this.maxHistorySize);
    }
  }

  // 🚀 접근성 최적화: 이벤트 리스너 설정
  private setupEventListeners(): void {
    // 페이지 언로드 시 정리
    window.addEventListener('beforeunload', () => {
      this.destroy();
    });
    
    // 페이지 가시성 변경 감지
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // 페이지가 숨겨지면 메시지 일시 정지
        this.pauseAnnouncements();
      } else {
        // 페이지가 다시 보이면 메시지 재개
        this.resumeAnnouncements();
      }
    });
  }

  // 🚀 접근성 최적화: 발표 일시 정지/재개
  private pauseAnnouncements(): void {
    this.regions.forEach(region => {
      region.setAttribute('aria-live', 'off');
    });
  }

  private resumeAnnouncements(): void {
    this.regions.forEach((region, type) => {
      region.setAttribute('aria-live', type);
    });
  }

  // 🚀 접근성 최적화: 이벤트 시스템
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
          console.error(`[LiveRegionManager] Error in event listener:`, error);
        }
      });
    }
  }

  // 🚀 접근성 최적화: 상태 조회 API
  getQueueStatus(): {
    queueLength: number;
    currentMessage: LiveMessage | null;
    isProcessing: boolean;
  } {
    return {
      queueLength: this.messageQueue.length,
      currentMessage: this.currentMessage,
      isProcessing: this.isProcessing
    };
  }

  getMessageHistory(limit?: number): LiveMessage[] {
    return limit 
      ? this.messageHistory.slice(0, limit)
      : [...this.messageHistory];
  }

  getUnreadMessages(): LiveMessage[] {
    return this.messageHistory.filter(m => !m.read);
  }

  // 🚀 접근성 최적화: 설정 관리
  updateSettings(settings: {
    maxHistorySize?: number;
  }): void {
    if (settings.maxHistorySize !== undefined) {
      this.maxHistorySize = settings.maxHistorySize;
      
      // 히스토리 크기 조정
      if (this.messageHistory.length > this.maxHistorySize) {
        this.messageHistory = this.messageHistory.slice(0, this.maxHistorySize);
      }
    }
  }

  // 🚀 접근성 최적화: 디버깅 정보
  getDebugInfo(): {
    regions: Array<{ type: LiveRegionType; element: HTMLElement }>;
    messageQueue: LiveMessage[];
    messageHistory: LiveMessage[];
    currentMessage: LiveMessage | null;
    isProcessing: boolean;
  } {
    return {
      regions: Array.from(this.regions.entries()).map(([type, element]) => ({
        type,
        element
      })),
      messageQueue: [...this.messageQueue],
      messageHistory: [...this.messageHistory],
      currentMessage: this.currentMessage,
      isProcessing: this.isProcessing
    };
  }

  // 🚀 접근성 최적화: 정리
  destroy(): void {
    // 모든 메시지 정리
    this.clearAll();
    
    // 라이브 영역 제거
    this.regions.forEach(region => {
      if (region.parentNode) {
        region.parentNode.removeChild(region);
      }
    });
    this.regions.clear();
    
    // 이벤트 리스너 정리
    this.listeners.clear();
    
    // 상태 초기화
    this.messageQueue = [];
    this.messageHistory = [];
    this.currentMessage = null;
    this.isProcessing = false;
    
    console.log('[LiveRegionManager] Destroyed');
  }
}

// 싱글톤 인스턴스
export const LiveRegionManager = new LiveRegionManagerClass();

// 개발 모드에서 전역 노출
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).LiveRegionManager = LiveRegionManager;
}

export default LiveRegionManager;