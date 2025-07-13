import { useEffect, useCallback, useRef, useState } from 'react';
import { KeyboardShortcutManager, KeyboardShortcut } from '../utils/KeyboardShortcutManager';
import { FocusManager } from '../utils/FocusManager';
import { useWorkflowActions, useSelection } from '../contexts/WorkflowStateContext';

// 🚀 키보드 접근성: 키보드 단축키 커스텀 훅

export interface UseKeyboardShortcutsOptions {
  context?: string;
  group?: string;
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export interface KeyboardShortcutHandlers {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDuplicate?: () => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onDelete?: () => void;
  onSearch?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onFitView?: () => void;
  onToggleTheme?: () => void;
  onCommandPalette?: () => void;
  onFocusNext?: (event: KeyboardEvent) => void;
  onFocusPrevious?: (event: KeyboardEvent) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
}

export function useKeyboardShortcuts(
  handlers: KeyboardShortcutHandlers,
  options: UseKeyboardShortcutsOptions = {}
) {
  const {
    context = 'global',
    group = 'main',
    enabled = true,
    preventDefault = true,
    stopPropagation = true
  } = options;

  const workflowActions = useWorkflowActions();
  const { selection, actions: selectionActions } = useSelection();
  const handlersRef = useRef(handlers);

  // 핸들러 참조 업데이트
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  // 이벤트 핸들러 등록
  useEffect(() => {
    if (!enabled) return;

    const eventHandlers = new Map<string, Function>();

    // 워크플로우 관련 이벤트
    if (handlersRef.current.onSave) {
      const handler = () => {
        handlersRef.current.onSave?.();
        workflowActions.saveWorkflow();
      };
      eventHandlers.set('save-workflow', handler);
      KeyboardShortcutManager.on('save-workflow', handler);
    }

    if (handlersRef.current.onUndo) {
      const handler = () => handlersRef.current.onUndo?.();
      eventHandlers.set('undo', handler);
      KeyboardShortcutManager.on('undo', handler);
    }

    if (handlersRef.current.onRedo) {
      const handler = () => handlersRef.current.onRedo?.();
      eventHandlers.set('redo', handler);
      KeyboardShortcutManager.on('redo', handler);
    }

    // 편집 관련 이벤트
    if (handlersRef.current.onCopy) {
      const handler = () => handlersRef.current.onCopy?.();
      eventHandlers.set('copy', handler);
      KeyboardShortcutManager.on('copy', handler);
    }

    if (handlersRef.current.onPaste) {
      const handler = () => handlersRef.current.onPaste?.();
      eventHandlers.set('paste', handler);
      KeyboardShortcutManager.on('paste', handler);
    }

    if (handlersRef.current.onDuplicate) {
      const handler = () => handlersRef.current.onDuplicate?.();
      eventHandlers.set('duplicate', handler);
      KeyboardShortcutManager.on('duplicate', handler);
    }

    // 선택 관련 이벤트
    if (handlersRef.current.onSelectAll) {
      const handler = () => handlersRef.current.onSelectAll?.();
      eventHandlers.set('select-all', handler);
      KeyboardShortcutManager.on('select-all', handler);
    }

    if (handlersRef.current.onDeselectAll) {
      const handler = () => {
        handlersRef.current.onDeselectAll?.();
        selectionActions.clearSelection();
      };
      eventHandlers.set('deselect-all', handler);
      KeyboardShortcutManager.on('deselect-all', handler);
    }

    if (handlersRef.current.onDelete) {
      const handler = () => {
        handlersRef.current.onDelete?.();
        // 선택된 노드들 삭제
        selection.selectedNodes.forEach(nodeId => {
          workflowActions.removeNode?.(nodeId);
        });
        selectionActions.clearSelection();
      };
      eventHandlers.set('delete-selected', handler);
      KeyboardShortcutManager.on('delete-selected', handler);
    }

    // 내비게이션 관련 이벤트
    if (handlersRef.current.onFocusNext) {
      const handler = (event: KeyboardEvent) => {
        handlersRef.current.onFocusNext?.(event);
      };
      eventHandlers.set('focus-next', handler);
      KeyboardShortcutManager.on('focus-next', handler);
    }

    if (handlersRef.current.onFocusPrevious) {
      const handler = (event: KeyboardEvent) => {
        handlersRef.current.onFocusPrevious?.(event);
      };
      eventHandlers.set('focus-previous', handler);
      KeyboardShortcutManager.on('focus-previous', handler);
    }

    if (handlersRef.current.onMoveUp) {
      const handler = () => handlersRef.current.onMoveUp?.();
      eventHandlers.set('move-up', handler);
      KeyboardShortcutManager.on('move-up', handler);
    }

    if (handlersRef.current.onMoveDown) {
      const handler = () => handlersRef.current.onMoveDown?.();
      eventHandlers.set('move-down', handler);
      KeyboardShortcutManager.on('move-down', handler);
    }

    if (handlersRef.current.onMoveLeft) {
      const handler = () => handlersRef.current.onMoveLeft?.();
      eventHandlers.set('move-left', handler);
      KeyboardShortcutManager.on('move-left', handler);
    }

    if (handlersRef.current.onMoveRight) {
      const handler = () => handlersRef.current.onMoveRight?.();
      eventHandlers.set('move-right', handler);
      KeyboardShortcutManager.on('move-right', handler);
    }

    // 줌 관련 이벤트
    if (handlersRef.current.onZoomIn) {
      const handler = () => handlersRef.current.onZoomIn?.();
      eventHandlers.set('zoom-in', handler);
      KeyboardShortcutManager.on('zoom-in', handler);
    }

    if (handlersRef.current.onZoomOut) {
      const handler = () => handlersRef.current.onZoomOut?.();
      eventHandlers.set('zoom-out', handler);
      KeyboardShortcutManager.on('zoom-out', handler);
    }

    if (handlersRef.current.onZoomReset) {
      const handler = () => handlersRef.current.onZoomReset?.();
      eventHandlers.set('zoom-reset', handler);
      KeyboardShortcutManager.on('zoom-reset', handler);
    }

    if (handlersRef.current.onFitView) {
      const handler = () => handlersRef.current.onFitView?.();
      eventHandlers.set('fit-view', handler);
      KeyboardShortcutManager.on('fit-view', handler);
    }

    // 시스템 관련 이벤트
    if (handlersRef.current.onSearch) {
      const handler = () => handlersRef.current.onSearch?.();
      eventHandlers.set('search', handler);
      KeyboardShortcutManager.on('search', handler);
    }

    if (handlersRef.current.onToggleTheme) {
      const handler = () => {
        handlersRef.current.onToggleTheme?.();
        // 테마 토글 로직
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        workflowActions.setTheme(newTheme);
      };
      eventHandlers.set('toggle-theme', handler);
      KeyboardShortcutManager.on('toggle-theme', handler);
    }

    if (handlersRef.current.onCommandPalette) {
      const handler = () => handlersRef.current.onCommandPalette?.();
      eventHandlers.set('command-palette', handler);
      KeyboardShortcutManager.on('command-palette', handler);
    }

    // 포커스 컨텍스트 활성화
    if (context !== 'global') {
      FocusManager.setActiveContext(context);
    }

    // 정리 함수
    return () => {
      eventHandlers.forEach((handler, eventName) => {
        KeyboardShortcutManager.off(eventName, handler);
      });
    };
  }, [
    enabled,
    context,
    group,
    workflowActions,
    selectionActions,
    selection.selectedNodes
  ]);

  // 포커스 관리
  const registerFocusElement = useCallback((
    element: HTMLElement,
    focusId?: string
  ) => {
    if (element) {
      FocusManager.registerElement(element, context, group, focusId);
    }
  }, [context, group]);

  const unregisterFocusElement = useCallback((element: HTMLElement) => {
    if (element) {
      FocusManager.unregisterElement(element);
    }
  }, []);

  const focusElement = useCallback((focusId: string) => {
    return FocusManager.focusElement(focusId);
  }, []);

  const focusNext = useCallback(() => {
    return FocusManager.focusNext();
  }, []);

  const focusPrevious = useCallback(() => {
    return FocusManager.focusPrevious();
  }, []);

  const focusFirst = useCallback(() => {
    return FocusManager.focusFirst();
  }, []);

  const focusLast = useCallback(() => {
    return FocusManager.focusLast();
  }, []);

  return {
    // 포커스 관리
    registerFocusElement,
    unregisterFocusElement,
    focusElement,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    
    // 단축키 관리
    manager: KeyboardShortcutManager,
    focusManager: FocusManager
  };
}

// 특정 요소에 포커스 기능을 추가하는 훅
export function useFocusableElement(
  ref: React.RefObject<HTMLElement>,
  options: {
    focusId?: string;
    context?: string;
    group?: string;
    autoFocus?: boolean;
  } = {}
) {
  const {
    focusId,
    context = 'global',
    group = 'main',
    autoFocus = false
  } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // 요소 등록
    FocusManager.registerElement(element, context, group, focusId);

    // 자동 포커스
    if (autoFocus) {
      element.focus();
    }

    // 정리
    return () => {
      FocusManager.unregisterElement(element);
    };
  }, [ref, focusId, context, group, autoFocus]);

  const focus = useCallback(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, [ref]);

  return { focus };
}

// 포커스 트랩을 위한 훅
export function useFocusTrap(
  ref: React.RefObject<HTMLElement>,
  options: {
    enabled?: boolean;
    context?: string;
    restoreFocus?: boolean;
  } = {}
) {
  const {
    enabled = true,
    context = 'modal',
    restoreFocus = true
  } = options;

  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;

    // 현재 포커스 저장
    if (restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }

    // 포커스 트랩 활성화
    FocusManager.trapFocus(context);

    // 컨테이너 내의 첫 번째 포커스 가능한 요소로 포커스 이동
    const focusableElements = ref.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }

    // 정리
    return () => {
      FocusManager.releaseFocusTrap();
      
      // 이전 포커스 복원
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [enabled, context, restoreFocus, ref]);
}

// 키보드 단축키 목록을 가져오는 훅
export function useShortcutList(categoryId?: string) {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);

  useEffect(() => {
    const updateShortcuts = () => {
      const allShortcuts = categoryId 
        ? KeyboardShortcutManager.getShortcutsByCategory(categoryId)
        : KeyboardShortcutManager.getAllShortcuts();
      
      setShortcuts(allShortcuts);
    };

    updateShortcuts();
    
    // 단축키 변경 감지 (실제 구현에서는 이벤트 시스템 필요)
    const interval = setInterval(updateShortcuts, 1000);
    
    return () => clearInterval(interval);
  }, [categoryId]);

  return shortcuts;
}

export default useKeyboardShortcuts;