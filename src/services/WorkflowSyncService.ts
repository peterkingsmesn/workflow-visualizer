import { io, Socket } from 'socket.io-client';
import { WorkflowState } from '../types/workflow.types';
import { debounce } from '../utils/debounce';

export interface SyncEvent {
  type: 'workflow-update' | 'node-update' | 'edge-update' | 'selection-change' | 'user-cursor';
  data: any;
  userId: string;
  timestamp: number;
  sessionId: string;
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  cursor?: { x: number; y: number };
  selection?: string[];
  lastActive: number;
}

export interface CollaborationSession {
  id: string;
  name: string;
  users: User[];
  workflow: WorkflowState;
  createdAt: number;
  updatedAt: number;
}

export class WorkflowSyncService {
  private socket: Socket | null = null;
  private currentSession: CollaborationSession | null = null;
  private currentUser: User | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private syncBuffer: SyncEvent[] = [];
  private lastSync = 0;
  private syncInterval = 100; // 100ms throttling
  private sessionId: string = '';
  private config: any = {};
  
  // 🚀 메모리 관리 최적화: 리소스 정리를 위한 추가 필드들
  private eventCache = new Map<string, SyncEvent>();
  private maxCacheSize = 100;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private memoryCheckInterval: NodeJS.Timeout | null = null;
  private activeTimers = new Set<NodeJS.Timeout>();
  private abortController: AbortController | null = null;
  
  constructor(private serverUrl: string = 'http://localhost:3001') {
    this.setupEventListeners();
    this.startMemoryManagement();
  }

  /**
   * 서버에 연결
   */
  async connect(user: User): Promise<void> {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    this.currentUser = user;

    try {
      this.socket = io(this.serverUrl, {
        transports: ['websocket'],
        timeout: 10000,
        auth: {
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          userColor: user.color
        }
      });

      await this.waitForConnection();
      this.setupSocketListeners();
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      
      // 버퍼된 이벤트 전송
      this.flushSyncBuffer();
      
      this.emit('connected', { user });
    } catch (error) {
      this.isConnecting = false;
      this.emit('connection-error', error);
      throw error;
    }
  }

  /**
   * 서버 연결 해제
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentSession = null;
    this.currentUser = null;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    // 🚀 메모리 관리 최적화: 리소스 정리
    this.cleanup();
    
    // 이벤트 리스너 제거
    this.removeEventListeners();
    
    this.emit('disconnected', {
      timestamp: Date.now(),
      reason: 'manual_disconnect',
      sessionId: this.sessionId
    });
  }

  /**
   * 협업 세션 생성
   */
  async createSession(name: string, workflow: WorkflowState): Promise<CollaborationSession> {
    if (!this.socket?.connected) {
      throw new Error('서버에 연결되지 않았습니다.');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('create-session', { name, workflow }, (response: any) => {
        if (response.success) {
          this.currentSession = response.session;
          this.emit('session-created', response.session);
          resolve(response.session);
        } else {
          reject(new Error(response.error || '세션 생성에 실패했습니다.'));
        }
      });
    });
  }

  /**
   * 협업 세션 참가
   */
  async joinSession(sessionId: string): Promise<CollaborationSession> {
    if (!this.socket?.connected) {
      throw new Error('서버에 연결되지 않았습니다.');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('join-session', { sessionId }, (response: any) => {
        if (response.success) {
          this.currentSession = response.session;
          this.emit('session-joined', response.session);
          resolve(response.session);
        } else {
          reject(new Error(response.error || '세션 참가에 실패했습니다.'));
        }
      });
    });
  }

  /**
   * 협업 세션 종료
   */
  async leaveSession(): Promise<void> {
    if (!this.socket?.connected || !this.currentSession) {
      return;
    }

    return new Promise((resolve) => {
      this.socket!.emit('leave-session', { sessionId: this.currentSession!.id }, () => {
        this.currentSession = null;
        this.emit('session-left', {
        sessionId: this.sessionId,
        timestamp: Date.now()
      });
        resolve();
      });
    });
  }

  /**
   * 워크플로우 업데이트 동기화
   */
  syncWorkflowUpdate(update: Partial<WorkflowState>): void {
    if (!this.currentSession || !this.currentUser) {
      return;
    }

    const event: SyncEvent = {
      type: 'workflow-update',
      data: update,
      userId: this.currentUser.id,
      timestamp: Date.now(),
      sessionId: this.currentSession.id
    };

    this.queueSyncEvent(event);
  }

  /**
   * 노드 업데이트 동기화
   */
  syncNodeUpdate(nodeId: string, update: any): void {
    if (!this.currentSession || !this.currentUser) {
      return;
    }

    const event: SyncEvent = {
      type: 'node-update',
      data: { nodeId, update },
      userId: this.currentUser.id,
      timestamp: Date.now(),
      sessionId: this.currentSession.id
    };

    this.queueSyncEvent(event);
  }

  /**
   * 엣지 업데이트 동기화
   */
  syncEdgeUpdate(edgeId: string, update: any): void {
    if (!this.currentSession || !this.currentUser) {
      return;
    }

    const event: SyncEvent = {
      type: 'edge-update',
      data: { edgeId, update },
      userId: this.currentUser.id,
      timestamp: Date.now(),
      sessionId: this.currentSession.id
    };

    this.queueSyncEvent(event);
  }

  /**
   * 선택 상태 동기화
   */
  syncSelectionChange(selectedNodeIds: string[]): void {
    if (!this.currentSession || !this.currentUser) {
      return;
    }

    const event: SyncEvent = {
      type: 'selection-change',
      data: { selectedNodeIds },
      userId: this.currentUser.id,
      timestamp: Date.now(),
      sessionId: this.currentSession.id
    };

    this.sendSyncEvent(event);
  }

  /**
   * 사용자 커서 위치 동기화
   */
  syncUserCursor(x: number, y: number): void {
    if (!this.currentSession || !this.currentUser) {
      return;
    }

    const event: SyncEvent = {
      type: 'user-cursor',
      data: { x, y },
      userId: this.currentUser.id,
      timestamp: Date.now(),
      sessionId: this.currentSession.id
    };

    this.sendSyncEvent(event);
  }

  /**
   * 세션 정보 가져오기
   */
  getCurrentSession(): CollaborationSession | null {
    return this.currentSession;
  }

  /**
   * 현재 사용자 정보 가져오기
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * 연결 상태 확인
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * 이벤트 리스너 등록
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * 이벤트 리스너 해제
   */
  off(event: string, callback?: Function): void {
    if (!this.listeners.has(event)) {
      return;
    }

    if (callback) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      this.listeners.delete(event);
    }
  }

  /**
   * 활성 세션 목록 가져오기
   */
  async getActiveSessions(): Promise<CollaborationSession[]> {
    if (!this.socket?.connected) {
      return [];
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('get-active-sessions', {
        timestamp: Date.now()
      }, (response: any) => {
        if (response.success) {
          resolve(response.sessions);
        } else {
          reject(new Error(response.error || '세션 목록을 가져올 수 없습니다.'));
        }
      });
    });
  }

  private beforeUnloadHandler = () => {
    this.disconnect();
  };

  private visibilityChangeHandler = () => {
    if (document.hidden) {
      this.syncUserCursor(-1, -1); // 커서 숨김
    }
  };

  private setupEventListeners(): void {
    // 전역 이벤트 리스너 설정
    window.addEventListener('beforeunload', this.beforeUnloadHandler);

    // 페이지 가시성 변경 감지
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  private removeEventListeners(): void {
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  private async waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('소켓이 초기화되지 않았습니다.'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('연결 시간 초과'));
      }, 10000);

      this.socket.on('connect', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('sync-event', (event: SyncEvent) => {
      this.handleSyncEvent(event);
    });

    this.socket.on('user-joined', (user: User) => {
      this.emit('user-joined', user);
    });

    this.socket.on('user-left', (userId: string) => {
      this.emit('user-left', userId);
    });

    this.socket.on('session-updated', (session: CollaborationSession) => {
      this.currentSession = session;
      this.emit('session-updated', session);
    });

    this.socket.on('disconnect', () => {
      this.emit('disconnected', {
      timestamp: Date.now(),
      reason: 'manual_disconnect',
      sessionId: this.sessionId
    });
      this.attemptReconnect();
    });

    this.socket.on('error', (error) => {
      this.emit('error', error);
    });
  }

  private handleSyncEvent(event: SyncEvent): void {
    // 자신이 보낸 이벤트는 무시
    if (event.userId === this.currentUser?.id) {
      return;
    }

    switch (event.type) {
      case 'workflow-update':
        this.emit('remote-workflow-update', event.data);
        break;
      case 'node-update':
        this.emit('remote-node-update', event.data);
        break;
      case 'edge-update':
        this.emit('remote-edge-update', event.data);
        break;
      case 'selection-change':
        this.emit('remote-selection-change', { 
          userId: event.userId, 
          selectedNodeIds: event.data.selectedNodeIds 
        });
        break;
      case 'user-cursor':
        this.emit('remote-user-cursor', {
          userId: event.userId,
          x: event.data.x,
          y: event.data.y
        });
        break;
    }
  }

  private queueSyncEvent(event: SyncEvent): void {
    this.syncBuffer.push(event);
    this.debouncedFlush();
  }

  private debouncedFlush = debounce(() => {
    this.flushSyncBuffer();
  }, this.syncInterval);

  private flushSyncBuffer(): void {
    if (this.syncBuffer.length === 0 || !this.socket?.connected) {
      return;
    }

    const now = Date.now();
    if (now - this.lastSync < this.syncInterval) {
      return;
    }

    const eventsToSend = [...this.syncBuffer];
    this.syncBuffer = [];
    this.lastSync = now;

    // 같은 타입의 이벤트들을 병합
    const mergedEvents = this.mergeEvents(eventsToSend);

    mergedEvents.forEach(event => {
      this.sendSyncEvent(event);
    });
  }

  private mergeEvents(events: SyncEvent[]): SyncEvent[] {
    const merged = new Map<string, SyncEvent>();

    events.forEach(event => {
      const key = `${event.type}-${event.sessionId}`;
      const existing = merged.get(key);

      if (!existing || event.timestamp > existing.timestamp) {
        merged.set(key, event);
      }
    });

    return Array.from(merged.values());
  }

  private sendSyncEvent(event: SyncEvent): void {
    if (!this.socket?.connected) {
      this.queueSyncEvent(event);
      return;
    }

    this.socket.emit('sync-event', event);
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('reconnect-failed', {
        attempts: this.reconnectAttempts,
        maxAttempts: this.config.maxReconnectAttempts,
        timestamp: Date.now()
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      if (this.currentUser) {
        this.emit('reconnecting', { attempts: this.reconnectAttempts });
        this.connect(this.currentUser).catch(() => {
          this.attemptReconnect();
        });
      }
    }, delay);
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // 🚀 메모리 관리 최적화: 메모리 관리 시작
  private startMemoryManagement(): void {
    // 주기적 정리 (5분마다)
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 5 * 60 * 1000);
    this.activeTimers.add(this.cleanupInterval);

    // 메모리 체크 (1분마다)
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 60 * 1000);
    this.activeTimers.add(this.memoryCheckInterval);

    // AbortController 초기화
    this.abortController = new AbortController();
  }

  // 🚀 메모리 관리 최적화: 전체 정리
  private cleanup(): void {
    // 모든 타이머 정리
    this.activeTimers.forEach(timer => {
      clearInterval(timer);
      clearTimeout(timer);
    });
    this.activeTimers.clear();

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }

    // AbortController 중단
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // 캐시 정리
    this.eventCache.clear();
    this.syncBuffer = [];
    
    // 리스너 정리 (선택적)
    this.listeners.clear();

    console.log('[WorkflowSyncService] All resources cleaned up');
  }

  // 🚀 메모리 관리 최적화: 주기적 정리 작업
  private performCleanup(): void {
    let cleanedCount = 0;

    // 1. 이벤트 캐시 정리 (오래된 항목 제거)
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10분

    for (const [key, event] of this.eventCache.entries()) {
      if (now - event.timestamp > maxAge) {
        this.eventCache.delete(key);
        cleanedCount++;
      }
    }

    // 2. 캐시 크기 제한
    if (this.eventCache.size > this.maxCacheSize) {
      const excess = this.eventCache.size - this.maxCacheSize;
      const entries = Array.from(this.eventCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      for (let i = 0; i < excess; i++) {
        this.eventCache.delete(entries[i][0]);
        cleanedCount++;
      }
    }

    // 3. 동기화 버퍼 정리 (오래된 이벤트 제거)
    this.syncBuffer = this.syncBuffer.filter(event => 
      now - event.timestamp <= maxAge
    );

    // 4. 비활성 리스너 정리
    const emptyEvents: string[] = [];
    for (const [event, callbacks] of this.listeners.entries()) {
      if (callbacks.length === 0) {
        emptyEvents.push(event);
      }
    }
    emptyEvents.forEach(event => this.listeners.delete(event));

    if (cleanedCount > 0 || emptyEvents.length > 0) {
      console.log(`[WorkflowSyncService] Cleaned up: ${cleanedCount} cache entries, ${emptyEvents.length} empty listeners`);
    }
  }

  // 🚀 메모리 관리 최적화: 메모리 사용량 체크
  private checkMemoryUsage(): void {
    if (typeof performance === 'undefined' || !(performance as any).memory) {
      return;
    }

    const memory = (performance as any).memory;
    const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

    // 메모리 사용률이 높으면 적극적 정리
    if (usageRatio > 0.8) {
      console.warn(`[WorkflowSyncService] High memory usage detected: ${Math.round(usageRatio * 100)}%`);
      
      // 캐시 크기 줄이기
      this.maxCacheSize = Math.max(50, Math.floor(this.maxCacheSize * 0.7));
      
      // 즉시 정리 실행
      this.performCleanup();
      
      // 동기화 간격 늘리기 (메모리 압박 상황에서)
      this.syncInterval = Math.min(500, this.syncInterval * 1.5);
    } else if (usageRatio < 0.5) {
      // 메모리 여유가 있으면 설정 복원
      this.maxCacheSize = Math.min(100, this.maxCacheSize + 5);
      this.syncInterval = Math.max(100, this.syncInterval * 0.95);
    }
  }

  // 🚀 메모리 관리 최적화: 안전한 타이머 생성
  private createTimer(callback: Function, delay: number, isInterval = false): NodeJS.Timeout {
    const timer = isInterval 
      ? setInterval(callback as any, delay)
      : setTimeout(callback as any, delay);
    
    this.activeTimers.add(timer);
    
    // 타이머 완료 시 자동 정리
    if (!isInterval) {
      setTimeout(() => {
        this.activeTimers.delete(timer);
      }, delay + 100);
    }
    
    return timer;
  }

  // 🚀 메모리 관리 최적화: 안전한 타이머 정리
  private clearTimer(timer: NodeJS.Timeout): void {
    clearTimeout(timer);
    clearInterval(timer);
    this.activeTimers.delete(timer);
  }

  // 🚀 메모리 관리 최적화: 이벤트 캐싱 (중복 방지)
  private cacheEvent(event: SyncEvent): boolean {
    const key = `${event.type}-${event.sessionId}-${event.userId}`;
    const existing = this.eventCache.get(key);
    
    // 동일한 이벤트가 최근에 있었으면 무시
    if (existing && event.timestamp - existing.timestamp < 1000) {
      return false;
    }
    
    this.eventCache.set(key, event);
    return true;
  }

  // 🚀 메모리 관리 최적화: 메모리 상태 정보
  getMemoryStatus(): {
    eventCacheSize: number;
    syncBufferSize: number;
    listenerCount: number;
    activeTimerCount: number;
    memoryUsage?: {
      used: number;
      total: number;
      limit: number;
      usageRatio: number;
    };
  } {
    const listenerCount = Array.from(this.listeners.values())
      .reduce((sum, callbacks) => sum + callbacks.length, 0);

    let memoryUsage;
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      memoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        usageRatio: memory.usedJSHeapSize / memory.jsHeapSizeLimit
      };
    }

    return {
      eventCacheSize: this.eventCache.size,
      syncBufferSize: this.syncBuffer.length,
      listenerCount,
      activeTimerCount: this.activeTimers.size,
      memoryUsage
    };
  }

  // 🚀 메모리 관리 최적화: 강제 정리
  forceCleanup(): void {
    this.performCleanup();
    
    // 가비지 컬렉션 요청 (가능한 경우)
    if (typeof gc === 'function') {
      gc();
    }
    
    console.log('[WorkflowSyncService] Force cleanup completed');
  }

  // 🚀 메모리 관리 최적화: 디스트럭터
  destroy(): void {
    this.disconnect();
    this.cleanup();
    
    console.log('[WorkflowSyncService] Service destroyed');
  }
}

// 싱글톤 인스턴스 생성
export const workflowSyncService = new WorkflowSyncService();
