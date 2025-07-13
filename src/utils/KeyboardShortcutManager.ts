// 🚀 키보드 접근성: 글로벌 키보드 단축키 관리 시스템

export interface KeyboardShortcut {
  id: string;
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  description: string;
  category: string;
  handler: (event: KeyboardEvent) => void;
  enabled: boolean;
  priority: number; // 높은 숫자가 우선순위
}

export interface ShortcutCategory {
  id: string;
  name: string;
  description: string;
  color: string;
}

class KeyboardShortcutManagerClass {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private categories: Map<string, ShortcutCategory> = new Map();
  private isListening: boolean = false;
  private debugMode: boolean = false;

  constructor() {
    this.initializeDefaultCategories();
    this.initializeDefaultShortcuts();
  }

  private initializeDefaultCategories(): void {
    this.addCategory({
      id: 'workflow',
      name: '워크플로우',
      description: '워크플로우 관련 작업',
      color: '#3b82f6'
    });

    this.addCategory({
      id: 'navigation',
      name: '내비게이션',
      description: '화면 및 노드 이동',
      color: '#10b981'
    });

    this.addCategory({
      id: 'editing',
      name: '편집',
      description: '노드 편집 및 수정',
      color: '#f59e0b'
    });

    this.addCategory({
      id: 'selection',
      name: '선택',
      description: '노드 선택 및 관리',
      color: '#8b5cf6'
    });

    this.addCategory({
      id: 'system',
      name: '시스템',
      description: '시스템 및 앱 제어',
      color: '#6b7280'
    });
  }

  private initializeDefaultShortcuts(): void {
    // 워크플로우 단축키
    this.addShortcut({
      id: 'save-workflow',
      key: 's',
      ctrlKey: true,
      description: '워크플로우 저장',
      category: 'workflow',
      handler: () => this.emit('save-workflow'),
      enabled: true,
      priority: 100
    });

    this.addShortcut({
      id: 'new-workflow',
      key: 'n',
      ctrlKey: true,
      description: '새 워크플로우',
      category: 'workflow',
      handler: () => this.emit('new-workflow'),
      enabled: true,
      priority: 100
    });

    this.addShortcut({
      id: 'open-workflow',
      key: 'o',
      ctrlKey: true,
      description: '워크플로우 열기',
      category: 'workflow',
      handler: () => this.emit('open-workflow'),
      enabled: true,
      priority: 100
    });

    // 편집 단축키
    this.addShortcut({
      id: 'undo',
      key: 'z',
      ctrlKey: true,
      description: '실행취소',
      category: 'editing',
      handler: () => this.emit('undo'),
      enabled: true,
      priority: 90
    });

    this.addShortcut({
      id: 'redo',
      key: 'y',
      ctrlKey: true,
      description: '다시실행',
      category: 'editing',
      handler: () => this.emit('redo'),
      enabled: true,
      priority: 90
    });

    this.addShortcut({
      id: 'copy',
      key: 'c',
      ctrlKey: true,
      description: '복사',
      category: 'editing',
      handler: () => this.emit('copy'),
      enabled: true,
      priority: 85
    });

    this.addShortcut({
      id: 'paste',
      key: 'v',
      ctrlKey: true,
      description: '붙여넣기',
      category: 'editing',
      handler: () => this.emit('paste'),
      enabled: true,
      priority: 85
    });

    this.addShortcut({
      id: 'duplicate',
      key: 'd',
      ctrlKey: true,
      description: '복제',
      category: 'editing',
      handler: () => this.emit('duplicate'),
      enabled: true,
      priority: 80
    });

    // 선택 단축키
    this.addShortcut({
      id: 'select-all',
      key: 'a',
      ctrlKey: true,
      description: '전체 선택',
      category: 'selection',
      handler: () => this.emit('select-all'),
      enabled: true,
      priority: 75
    });

    this.addShortcut({
      id: 'deselect-all',
      key: 'Escape',
      description: '선택 해제',
      category: 'selection',
      handler: () => this.emit('deselect-all'),
      enabled: true,
      priority: 70
    });

    this.addShortcut({
      id: 'delete-selected',
      key: 'Delete',
      description: '선택된 항목 삭제',
      category: 'selection',
      handler: () => this.emit('delete-selected'),
      enabled: true,
      priority: 95
    });

    this.addShortcut({
      id: 'delete-selected-backspace',
      key: 'Backspace',
      description: '선택된 항목 삭제 (백스페이스)',
      category: 'selection',
      handler: () => this.emit('delete-selected'),
      enabled: true,
      priority: 95
    });

    // 내비게이션 단축키
    this.addShortcut({
      id: 'focus-next',
      key: 'Tab',
      description: '다음 요소로 이동',
      category: 'navigation',
      handler: (e) => {
        // Tab 키는 기본 동작을 유지하되, 커스텀 로직 추가 가능
        this.emit('focus-next', e);
      },
      enabled: true,
      priority: 60
    });

    this.addShortcut({
      id: 'focus-previous',
      key: 'Tab',
      shiftKey: true,
      description: '이전 요소로 이동',
      category: 'navigation',
      handler: (e) => {
        this.emit('focus-previous', e);
      },
      enabled: true,
      priority: 60
    });

    this.addShortcut({
      id: 'move-up',
      key: 'ArrowUp',
      description: '위로 이동',
      category: 'navigation',
      handler: () => this.emit('move-up'),
      enabled: true,
      priority: 55
    });

    this.addShortcut({
      id: 'move-down',
      key: 'ArrowDown',
      description: '아래로 이동',
      category: 'navigation',
      handler: () => this.emit('move-down'),
      enabled: true,
      priority: 55
    });

    this.addShortcut({
      id: 'move-left',
      key: 'ArrowLeft',
      description: '왼쪽으로 이동',
      category: 'navigation',
      handler: () => this.emit('move-left'),
      enabled: true,
      priority: 55
    });

    this.addShortcut({
      id: 'move-right',
      key: 'ArrowRight',
      description: '오른쪽으로 이동',
      category: 'navigation',
      handler: () => this.emit('move-right'),
      enabled: true,
      priority: 55
    });

    // 시스템 단축키
    this.addShortcut({
      id: 'command-palette',
      key: 'p',
      ctrlKey: true,
      shiftKey: true,
      description: '커맨드 팔레트 열기',
      category: 'system',
      handler: () => this.emit('command-palette'),
      enabled: true,
      priority: 110
    });

    this.addShortcut({
      id: 'search',
      key: 'f',
      ctrlKey: true,
      description: '검색',
      category: 'system',
      handler: () => this.emit('search'),
      enabled: true,
      priority: 85
    });

    this.addShortcut({
      id: 'toggle-theme',
      key: 't',
      ctrlKey: true,
      shiftKey: true,
      description: '테마 전환',
      category: 'system',
      handler: () => this.emit('toggle-theme'),
      enabled: true,
      priority: 50
    });

    this.addShortcut({
      id: 'zoom-in',
      key: '=',
      ctrlKey: true,
      description: '확대',
      category: 'navigation',
      handler: () => this.emit('zoom-in'),
      enabled: true,
      priority: 65
    });

    this.addShortcut({
      id: 'zoom-out',
      key: '-',
      ctrlKey: true,
      description: '축소',
      category: 'navigation',
      handler: () => this.emit('zoom-out'),
      enabled: true,
      priority: 65
    });

    this.addShortcut({
      id: 'zoom-reset',
      key: '0',
      ctrlKey: true,
      description: '확대/축소 초기화',
      category: 'navigation',
      handler: () => this.emit('zoom-reset'),
      enabled: true,
      priority: 65
    });

    this.addShortcut({
      id: 'fit-view',
      key: 'f',
      ctrlKey: true,
      altKey: true,
      description: '전체 화면에 맞추기',
      category: 'navigation',
      handler: () => this.emit('fit-view'),
      enabled: true,
      priority: 65
    });
  }

  public addCategory(category: ShortcutCategory): void {
    this.categories.set(category.id, category);
  }

  public addShortcut(shortcut: KeyboardShortcut): void {
    if (this.debugMode) {
      console.log(`[KeyboardShortcutManager] Adding shortcut: ${shortcut.id}`);
    }
    this.shortcuts.set(shortcut.id, shortcut);
  }

  public removeShortcut(id: string): boolean {
    return this.shortcuts.delete(id);
  }

  public enableShortcut(id: string): void {
    const shortcut = this.shortcuts.get(id);
    if (shortcut) {
      shortcut.enabled = true;
    }
  }

  public disableShortcut(id: string): void {
    const shortcut = this.shortcuts.get(id);
    if (shortcut) {
      shortcut.enabled = false;
    }
  }

  public getShortcut(id: string): KeyboardShortcut | undefined {
    return this.shortcuts.get(id);
  }

  public getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values()).sort((a, b) => b.priority - a.priority);
  }

  public getShortcutsByCategory(categoryId: string): KeyboardShortcut[] {
    return this.getAllShortcuts().filter(shortcut => shortcut.category === categoryId);
  }

  public getAllCategories(): ShortcutCategory[] {
    return Array.from(this.categories.values());
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    // 입력 필드에서는 단축키 비활성화
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const matchingShortcuts = this.findMatchingShortcuts(event);
    
    if (matchingShortcuts.length > 0) {
      // 우선순위가 가장 높은 단축키 실행
      const shortcut = matchingShortcuts[0];
      
      if (this.debugMode) {
        console.log(`[KeyboardShortcutManager] Executing shortcut: ${shortcut.id}`);
      }

      // 기본 동작 방지 (Tab 키 등 특별한 경우 제외)
      if (shortcut.key !== 'Tab') {
        event.preventDefault();
        event.stopPropagation();
      }

      shortcut.handler(event);
    }
  };

  private findMatchingShortcuts(event: KeyboardEvent): KeyboardShortcut[] {
    const shortcuts = this.getAllShortcuts().filter(shortcut => {
      if (!shortcut.enabled) return false;

      const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatches = (shortcut.ctrlKey || false) === event.ctrlKey;
      const shiftMatches = (shortcut.shiftKey || false) === event.shiftKey;
      const altMatches = (shortcut.altKey || false) === event.altKey;
      const metaMatches = (shortcut.metaKey || false) === event.metaKey;

      return keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches;
    });

    return shortcuts.sort((a, b) => b.priority - a.priority);
  }

  public startListening(): void {
    if (!this.isListening) {
      document.addEventListener('keydown', this.handleKeyDown, true);
      this.isListening = true;
      
      if (this.debugMode) {
        console.log('[KeyboardShortcutManager] Started listening for keyboard events');
      }
    }
  }

  public stopListening(): void {
    if (this.isListening) {
      document.removeEventListener('keydown', this.handleKeyDown, true);
      this.isListening = false;
      
      if (this.debugMode) {
        console.log('[KeyboardShortcutManager] Stopped listening for keyboard events');
      }
    }
  }

  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  // 이벤트 시스템
  private eventListeners: Map<string, Set<Function>> = new Map();

  public on(eventName: string, listener: Function): void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set());
    }
    this.eventListeners.get(eventName)!.add(listener);
  }

  public off(eventName: string, listener: Function): void {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  private emit(eventName: string, data?: any): void {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`[KeyboardShortcutManager] Error in event listener for ${eventName}:`, error);
        }
      });
    }
  }

  // 단축키 포맷팅 유틸리티
  public formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.shiftKey) parts.push('Shift');
    if (shortcut.altKey) parts.push('Alt');
    if (shortcut.metaKey) parts.push('Cmd');
    
    // 특수 키 이름 변환
    const keyMap: Record<string, string> = {
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'ArrowLeft': '←',
      'ArrowRight': '→',
      'Escape': 'Esc',
      'Delete': 'Del',
      'Backspace': '⌫',
      ' ': 'Space'
    };
    
    const displayKey = keyMap[shortcut.key] || shortcut.key.toUpperCase();
    parts.push(displayKey);
    
    return parts.join(' + ');
  }

  // 충돌 검사
  public checkConflicts(): Array<{ shortcut1: KeyboardShortcut; shortcut2: KeyboardShortcut }> {
    const conflicts: Array<{ shortcut1: KeyboardShortcut; shortcut2: KeyboardShortcut }> = [];
    const shortcuts = this.getAllShortcuts();
    
    for (let i = 0; i < shortcuts.length; i++) {
      for (let j = i + 1; j < shortcuts.length; j++) {
        const s1 = shortcuts[i];
        const s2 = shortcuts[j];
        
        if (this.shortcutsConflict(s1, s2)) {
          conflicts.push({ shortcut1: s1, shortcut2: s2 });
        }
      }
    }
    
    return conflicts;
  }

  private shortcutsConflict(s1: KeyboardShortcut, s2: KeyboardShortcut): boolean {
    return (
      s1.key.toLowerCase() === s2.key.toLowerCase() &&
      (s1.ctrlKey || false) === (s2.ctrlKey || false) &&
      (s1.shiftKey || false) === (s2.shiftKey || false) &&
      (s1.altKey || false) === (s2.altKey || false) &&
      (s1.metaKey || false) === (s2.metaKey || false)
    );
  }

  // 상태 정보
  public getStatus(): {
    isListening: boolean;
    shortcutCount: number;
    categoryCount: number;
    enabledShortcuts: number;
    conflicts: number;
  } {
    const conflicts = this.checkConflicts();
    const enabledShortcuts = this.getAllShortcuts().filter(s => s.enabled).length;
    
    return {
      isListening: this.isListening,
      shortcutCount: this.shortcuts.size,
      categoryCount: this.categories.size,
      enabledShortcuts,
      conflicts: conflicts.length
    };
  }

  // 설정 저장/로드
  public exportSettings(): any {
    return {
      shortcuts: Array.from(this.shortcuts.entries()).map(([id, shortcut]) => ({
        id,
        enabled: shortcut.enabled,
        priority: shortcut.priority
      })),
      categories: Array.from(this.categories.entries())
    };
  }

  public importSettings(settings: any): void {
    if (settings.shortcuts) {
      settings.shortcuts.forEach((item: any) => {
        const shortcut = this.shortcuts.get(item.id);
        if (shortcut) {
          shortcut.enabled = item.enabled;
          shortcut.priority = item.priority;
        }
      });
    }
    
    if (settings.categories) {
      settings.categories.forEach(([id, category]: [string, ShortcutCategory]) => {
        this.categories.set(id, category);
      });
    }
  }
}

// 싱글톤 인스턴스
export const KeyboardShortcutManager = new KeyboardShortcutManagerClass();

// 디버깅용 전역 노출 (개발 모드에서만)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).KeyboardShortcutManager = KeyboardShortcutManager;
}

export default KeyboardShortcutManager;