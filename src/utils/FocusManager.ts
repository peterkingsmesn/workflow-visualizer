// 🚀 키보드 접근성: 지능형 포커스 관리 시스템

export interface FocusableElement extends HTMLElement {
  __focusId?: string;
  __focusGroup?: string;
  __focusIndex?: number;
}

export interface FocusGroup {
  id: string;
  name: string;
  elements: FocusableElement[];
  currentIndex: number;
  isActive: boolean;
  wrap: boolean; // 끝에서 처음으로 순환
  orientation: 'horizontal' | 'vertical' | 'both';
  priority: number;
}

export interface FocusContext {
  id: string;
  name: string;
  groups: Map<string, FocusGroup>;
  activeGroupId: string | null;
  isActive: boolean;
  priority: number;
}

class FocusManagerClass {
  private contexts: Map<string, FocusContext> = new Map();
  private activeContextId: string | null = null;
  private focusHistory: string[] = [];
  private maxHistorySize: number = 50;
  private debugMode: boolean = false;
  private trapStack: string[] = []; // 포커스 트랩 스택

  constructor() {
    this.initializeDefaultContext();
    this.setupGlobalListeners();
  }

  private initializeDefaultContext(): void {
    this.createContext('global', '전역', 0);
    this.createGroup('global', 'main', '메인 콘텐츠', {
      wrap: true,
      orientation: 'both',
      priority: 0
    });
    this.setActiveContext('global');
  }

  private setupGlobalListeners(): void {
    // 포커스 이벤트 감지
    document.addEventListener('focusin', this.handleFocusIn, true);
    document.addEventListener('focusout', this.handleFocusOut, true);
    
    // 키보드 이벤트 감지
    document.addEventListener('keydown', this.handleKeyDown, true);
    
    // DOM 변경 감지
    const observer = new MutationObserver(this.handleDOMChanges);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['tabindex', 'disabled', 'aria-hidden']
    });
  }

  private handleFocusIn = (event: FocusEvent): void => {
    const target = event.target as FocusableElement;
    if (target && target.__focusId) {
      this.addToHistory(target.__focusId);
      
      if (this.debugMode) {
        console.log(`[FocusManager] Focus in: ${target.__focusId}`);
      }
    }
  };

  private handleFocusOut = (event: FocusEvent): void => {
    if (this.debugMode) {
      const target = event.target as FocusableElement;
      console.log(`[FocusManager] Focus out: ${target.__focusId || 'unknown'}`);
    }
  };

  private handleKeyDown = (event: KeyboardEvent): void => {
    const activeContext = this.getActiveContext();
    if (!activeContext) return;

    const activeGroup = this.getActiveGroup(activeContext);
    if (!activeGroup) return;

    let handled = false;

    switch (event.key) {
      case 'ArrowUp':
        if (activeGroup.orientation === 'vertical' || activeGroup.orientation === 'both') {
          handled = this.moveFocus('previous', activeGroup);
        }
        break;
      
      case 'ArrowDown':
        if (activeGroup.orientation === 'vertical' || activeGroup.orientation === 'both') {
          handled = this.moveFocus('next', activeGroup);
        }
        break;
      
      case 'ArrowLeft':
        if (activeGroup.orientation === 'horizontal' || activeGroup.orientation === 'both') {
          handled = this.moveFocus('previous', activeGroup);
        }
        break;
      
      case 'ArrowRight':
        if (activeGroup.orientation === 'horizontal' || activeGroup.orientation === 'both') {
          handled = this.moveFocus('next', activeGroup);
        }
        break;
      
      case 'Home':
        handled = this.focusFirst(activeGroup);
        break;
      
      case 'End':
        handled = this.focusLast(activeGroup);
        break;
      
      case 'Escape':
        handled = this.handleEscape();
        break;
    }

    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  private handleDOMChanges = (mutations: MutationRecord[]): void => {
    let needsUpdate = false;

    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            needsUpdate = true;
          }
        });
        
        mutation.removedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.removeElementFromGroups(node as HTMLElement);
          }
        });
      } else if (mutation.type === 'attributes') {
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      // 디바운스된 업데이트
      this.scheduleUpdate();
    }
  };

  private updateTimeoutId: number | null = null;
  
  private scheduleUpdate(): void {
    if (this.updateTimeoutId) {
      clearTimeout(this.updateTimeoutId);
    }
    
    this.updateTimeoutId = window.setTimeout(() => {
      this.updateAllGroups();
      this.updateTimeoutId = null;
    }, 100);
  }

  // Context 관리
  public createContext(id: string, name: string, priority: number = 0): FocusContext {
    const context: FocusContext = {
      id,
      name,
      groups: new Map(),
      activeGroupId: null,
      isActive: false,
      priority
    };
    
    this.contexts.set(id, context);
    
    if (this.debugMode) {
      console.log(`[FocusManager] Created context: ${id}`);
    }
    
    return context;
  }

  public removeContext(id: string): boolean {
    if (this.activeContextId === id) {
      this.setActiveContext('global');
    }
    
    return this.contexts.delete(id);
  }

  public setActiveContext(id: string): boolean {
    const context = this.contexts.get(id);
    if (!context) return false;

    // 이전 컨텍스트 비활성화
    if (this.activeContextId) {
      const prevContext = this.contexts.get(this.activeContextId);
      if (prevContext) {
        prevContext.isActive = false;
      }
    }

    // 새 컨텍스트 활성화
    context.isActive = true;
    this.activeContextId = id;
    
    if (this.debugMode) {
      console.log(`[FocusManager] Active context: ${id}`);
    }
    
    return true;
  }

  public getActiveContext(): FocusContext | null {
    return this.activeContextId ? this.contexts.get(this.activeContextId) || null : null;
  }

  // Group 관리
  public createGroup(
    contextId: string, 
    groupId: string, 
    name: string, 
    options: {
      wrap?: boolean;
      orientation?: 'horizontal' | 'vertical' | 'both';
      priority?: number;
    } = {}
  ): FocusGroup {
    const context = this.contexts.get(contextId);
    if (!context) {
      throw new Error(`Context ${contextId} not found`);
    }

    const group: FocusGroup = {
      id: groupId,
      name,
      elements: [],
      currentIndex: -1,
      isActive: false,
      wrap: options.wrap ?? true,
      orientation: options.orientation ?? 'both',
      priority: options.priority ?? 0
    };

    context.groups.set(groupId, group);
    
    // 첫 번째 그룹이면 활성화
    if (context.groups.size === 1) {
      context.activeGroupId = groupId;
      group.isActive = true;
    }
    
    if (this.debugMode) {
      console.log(`[FocusManager] Created group: ${contextId}/${groupId}`);
    }
    
    return group;
  }

  public removeGroup(contextId: string, groupId: string): boolean {
    const context = this.contexts.get(contextId);
    if (!context) return false;

    if (context.activeGroupId === groupId) {
      // 다른 그룹을 활성화
      const remainingGroups = Array.from(context.groups.keys()).filter(id => id !== groupId);
      context.activeGroupId = remainingGroups[0] || null;
      
      if (context.activeGroupId) {
        const newActiveGroup = context.groups.get(context.activeGroupId);
        if (newActiveGroup) {
          newActiveGroup.isActive = true;
        }
      }
    }

    return context.groups.delete(groupId);
  }

  public setActiveGroup(contextId: string, groupId: string): boolean {
    const context = this.contexts.get(contextId);
    if (!context) return false;

    const group = context.groups.get(groupId);
    if (!group) return false;

    // 이전 그룹 비활성화
    if (context.activeGroupId) {
      const prevGroup = context.groups.get(context.activeGroupId);
      if (prevGroup) {
        prevGroup.isActive = false;
      }
    }

    // 새 그룹 활성화
    group.isActive = true;
    context.activeGroupId = groupId;
    
    if (this.debugMode) {
      console.log(`[FocusManager] Active group: ${contextId}/${groupId}`);
    }
    
    return true;
  }

  private getActiveGroup(context: FocusContext): FocusGroup | null {
    return context.activeGroupId ? context.groups.get(context.activeGroupId) || null : null;
  }

  // Element 관리
  public registerElement(
    element: FocusableElement,
    contextId: string = 'global',
    groupId: string = 'main',
    focusId?: string
  ): void {
    const context = this.contexts.get(contextId);
    if (!context) return;

    const group = context.groups.get(groupId);
    if (!group) return;

    // 포커스 ID 설정
    const id = focusId || this.generateFocusId(element);
    element.__focusId = id;
    element.__focusGroup = groupId;
    element.tabIndex = element.tabIndex >= 0 ? element.tabIndex : 0;

    // 중복 제거
    const existingIndex = group.elements.findIndex(el => el.__focusId === id);
    if (existingIndex >= 0) {
      group.elements[existingIndex] = element;
      element.__focusIndex = existingIndex;
    } else {
      element.__focusIndex = group.elements.length;
      group.elements.push(element);
    }

    if (this.debugMode) {
      console.log(`[FocusManager] Registered element: ${id} in ${contextId}/${groupId}`);
    }
  }

  public unregisterElement(element: FocusableElement): void {
    const focusId = element.__focusId;
    const groupId = element.__focusGroup;
    
    if (!focusId || !groupId) return;

    // 모든 컨텍스트에서 찾아서 제거
    this.contexts.forEach(context => {
      const group = context.groups.get(groupId);
      if (group) {
        const index = group.elements.findIndex(el => el.__focusId === focusId);
        if (index >= 0) {
          group.elements.splice(index, 1);
          // 인덱스 재정렬
          this.reindexGroup(group);
          
          // 현재 인덱스 조정
          if (group.currentIndex >= group.elements.length) {
            group.currentIndex = group.elements.length - 1;
          }
        }
      }
    });

    // 요소에서 포커스 정보 제거
    delete element.__focusId;
    delete element.__focusGroup;
    delete element.__focusIndex;

    if (this.debugMode) {
      console.log(`[FocusManager] Unregistered element: ${focusId}`);
    }
  }

  private removeElementFromGroups(element: HTMLElement): void {
    const allElements = element.querySelectorAll('[data-focus-id]');
    allElements.forEach(el => {
      this.unregisterElement(el as FocusableElement);
    });
    
    if (element.dataset.focusId) {
      this.unregisterElement(element as FocusableElement);
    }
  }

  private generateFocusId(element: HTMLElement): string {
    return `focus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private reindexGroup(group: FocusGroup): void {
    group.elements.forEach((element, index) => {
      element.__focusIndex = index;
    });
  }

  // 포커스 이동
  public focusElement(focusId: string): boolean {
    const element = this.findElementById(focusId);
    if (!element) return false;

    try {
      element.focus();
      return true;
    } catch (error) {
      if (this.debugMode) {
        console.error(`[FocusManager] Failed to focus element ${focusId}:`, error);
      }
      return false;
    }
  }

  public focusFirst(group?: FocusGroup): boolean {
    const targetGroup = group || this.getCurrentGroup();
    if (!targetGroup || targetGroup.elements.length === 0) return false;

    targetGroup.currentIndex = 0;
    return this.focusElement(targetGroup.elements[0].__focusId!);
  }

  public focusLast(group?: FocusGroup): boolean {
    const targetGroup = group || this.getCurrentGroup();
    if (!targetGroup || targetGroup.elements.length === 0) return false;

    targetGroup.currentIndex = targetGroup.elements.length - 1;
    return this.focusElement(targetGroup.elements[targetGroup.currentIndex].__focusId!);
  }

  public focusNext(group?: FocusGroup): boolean {
    return this.moveFocus('next', group);
  }

  public focusPrevious(group?: FocusGroup): boolean {
    return this.moveFocus('previous', group);
  }

  private moveFocus(direction: 'next' | 'previous', group?: FocusGroup): boolean {
    const targetGroup = group || this.getCurrentGroup();
    if (!targetGroup || targetGroup.elements.length === 0) return false;

    let newIndex = targetGroup.currentIndex;
    
    if (direction === 'next') {
      newIndex++;
      if (newIndex >= targetGroup.elements.length) {
        if (targetGroup.wrap) {
          newIndex = 0;
        } else {
          return false;
        }
      }
    } else {
      newIndex--;
      if (newIndex < 0) {
        if (targetGroup.wrap) {
          newIndex = targetGroup.elements.length - 1;
        } else {
          return false;
        }
      }
    }

    targetGroup.currentIndex = newIndex;
    return this.focusElement(targetGroup.elements[newIndex].__focusId!);
  }

  private getCurrentGroup(): FocusGroup | null {
    const context = this.getActiveContext();
    return context ? this.getActiveGroup(context) : null;
  }

  private findElementById(focusId: string): FocusableElement | null {
    let found: FocusableElement | null = null;
    
    this.contexts.forEach(context => {
      context.groups.forEach(group => {
        const element = group.elements.find(el => el.__focusId === focusId);
        if (element) {
          found = element;
        }
      });
    });
    
    return found;
  }

  // 포커스 트랩
  public trapFocus(contextId: string): void {
    this.trapStack.push(contextId);
    this.setActiveContext(contextId);
    
    if (this.debugMode) {
      console.log(`[FocusManager] Focus trapped in: ${contextId}`);
    }
  }

  public releaseFocusTrap(): string | null {
    const released = this.trapStack.pop() || null;
    
    if (this.trapStack.length > 0) {
      this.setActiveContext(this.trapStack[this.trapStack.length - 1]);
    } else {
      this.setActiveContext('global');
    }
    
    if (this.debugMode && released) {
      console.log(`[FocusManager] Focus trap released: ${released}`);
    }
    
    return released;
  }

  private handleEscape(): boolean {
    if (this.trapStack.length > 0) {
      this.releaseFocusTrap();
      return true;
    }
    return false;
  }

  // 히스토리 관리
  private addToHistory(focusId: string): void {
    // 중복 제거
    const index = this.focusHistory.indexOf(focusId);
    if (index >= 0) {
      this.focusHistory.splice(index, 1);
    }
    
    this.focusHistory.unshift(focusId);
    
    // 크기 제한
    if (this.focusHistory.length > this.maxHistorySize) {
      this.focusHistory = this.focusHistory.slice(0, this.maxHistorySize);
    }
  }

  public goBack(): boolean {
    if (this.focusHistory.length > 1) {
      // 현재 포커스는 첫 번째이므로 두 번째로 이동
      const prevFocusId = this.focusHistory[1];
      return this.focusElement(prevFocusId);
    }
    return false;
  }

  public getFocusHistory(): string[] {
    return [...this.focusHistory];
  }

  // 업데이트 및 정리
  private updateAllGroups(): void {
    this.contexts.forEach(context => {
      context.groups.forEach(group => {
        this.updateGroup(group);
      });
    });
  }

  private updateGroup(group: FocusGroup): void {
    // 비활성 요소 제거
    group.elements = group.elements.filter(element => {
      return document.contains(element) && 
             !(element as any).disabled && 
             element.style.display !== 'none' &&
             element.getAttribute('aria-hidden') !== 'true';
    });
    
    // 인덱스 재정렬
    this.reindexGroup(group);
    
    // 현재 인덱스 유효성 검사
    if (group.currentIndex >= group.elements.length) {
      group.currentIndex = group.elements.length - 1;
    }
    if (group.currentIndex < 0 && group.elements.length > 0) {
      group.currentIndex = 0;
    }
  }

  // 상태 정보
  public getStatus(): {
    activeContextId: string | null;
    contextCount: number;
    totalGroups: number;
    totalElements: number;
    focusHistorySize: number;
    trapStackSize: number;
  } {
    let totalGroups = 0;
    let totalElements = 0;
    
    this.contexts.forEach(context => {
      totalGroups += context.groups.size;
      context.groups.forEach(group => {
        totalElements += group.elements.length;
      });
    });
    
    return {
      activeContextId: this.activeContextId,
      contextCount: this.contexts.size,
      totalGroups,
      totalElements,
      focusHistorySize: this.focusHistory.length,
      trapStackSize: this.trapStack.length
    };
  }

  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  // 정리
  public destroy(): void {
    document.removeEventListener('focusin', this.handleFocusIn, true);
    document.removeEventListener('focusout', this.handleFocusOut, true);
    document.removeEventListener('keydown', this.handleKeyDown, true);
    
    if (this.updateTimeoutId) {
      clearTimeout(this.updateTimeoutId);
    }
    
    this.contexts.clear();
    this.focusHistory = [];
    this.trapStack = [];
  }
}

// 싱글톤 인스턴스
export const FocusManager = new FocusManagerClass();

// 디버깅용 전역 노출 (개발 모드에서만)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).FocusManager = FocusManager;
}

export default FocusManager;