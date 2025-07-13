# ⌨️ 키보드 접근성 가이드

## 🎯 목표: 완전한 키보드 내비게이션 지원

개발자 도구로서 **마우스 없이도 모든 기능 사용 가능**해야 합니다.

---

## 🔍 현재 접근성 이슈 분석

### 🚨 식별된 문제점들

#### 1. **레이아웃 내비게이션 부재**
```typescript
// 🚨 문제: Tab 키로 이동 불가능
<div className="workflow-canvas">
  <div className="node" onClick={handleClick}>
    {/* tabIndex 또는 적절한 semantic element 누락 */}
  </div>
</div>

// 🚨 문제: 포커스 인디케이터 부재
.api-node:focus {
  /* 포커스 스타일 없음 */
}
```

#### 2. **시각적 피드백 부족**
```typescript
// 🚨 문제: 스크린 리더 사용자를 위한 정보 부족
<button onClick={handleSave}>
  저장 {/* 로딩 상태, 성공/실패 정보 없음 */}
</button>

// 🚨 문제: aria-label 및 역할 정보 누락
<div className="workflow-node">
  {/* 노드의 역할과 상태 설명 없음 */}
</div>
```

#### 3. **단축키 시스템 미비**
```typescript
// 🚨 문제: 전역 단축키 없음
// Ctrl+S, Ctrl+Z, Ctrl+C, Ctrl+V 등 기본 단축키 미지원
```

---

## ⌨️ 키보드 내비게이션 시스템 구현

### 1. **글로벌 단축키 시스템**

```typescript
// ✅ 글로벌 단축키 관리자
class KeyboardShortcutManager {
  private shortcuts = new Map<string, () => void>();
  private isEnabled = true;

  constructor() {
    this.setupGlobalListeners();
    this.registerDefaultShortcuts();
  }

  register(combination: string, handler: () => void, description: string) {
    this.shortcuts.set(combination, handler);
    console.log(`단축키 등록: ${combination} - ${description}`);
  }

  private setupGlobalListeners() {
    document.addEventListener('keydown', (e) => {
      if (!this.isEnabled) return;
      
      const combination = this.getCombination(e);
      const handler = this.shortcuts.get(combination);
      
      if (handler) {
        e.preventDefault();
        handler();
      }
    });
  }

  private getCombination(e: KeyboardEvent): string {
    const parts = [];
    if (e.ctrlKey) parts.push('ctrl');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');
    if (e.metaKey) parts.push('meta');
    parts.push(e.key.toLowerCase());
    return parts.join('+');
  }

  private registerDefaultShortcuts() {
    // 기본 단축키들
    this.register('ctrl+s', () => {
      document.dispatchEvent(new CustomEvent('workflow:save'));
    }, '워크플로우 저장');

    this.register('ctrl+z', () => {
      document.dispatchEvent(new CustomEvent('workflow:undo'));
    }, '실행취소');

    this.register('ctrl+y', () => {
      document.dispatchEvent(new CustomEvent('workflow:redo'));
    }, '다시실행');

    this.register('ctrl+c', () => {
      document.dispatchEvent(new CustomEvent('workflow:copy'));
    }, '복사');

    this.register('ctrl+v', () => {
      document.dispatchEvent(new CustomEvent('workflow:paste'));
    }, '붙여넣기');

    this.register('delete', () => {
      document.dispatchEvent(new CustomEvent('workflow:delete'));
    }, '선택된 요소 삭제');

    this.register('escape', () => {
      document.dispatchEvent(new CustomEvent('workflow:deselect'));
    }, '선택 해제');

    // 내비게이션 단축키
    this.register('ctrl+shift+p', () => {
      document.dispatchEvent(new CustomEvent('app:command-palette'));
    }, '커맨드 팩레트 열기');

    this.register('ctrl+/', () => {
      document.dispatchEvent(new CustomEvent('app:help'));
    }, '도움말 보기');
  }
}

// ✅ React Hook으로 래핑
const useKeyboardShortcuts = () => {
  const manager = useRef(new KeyboardShortcutManager());
  
  const registerShortcut = useCallback((combination: string, handler: () => void, description: string) => {
    manager.current.register(combination, handler, description);
  }, []);

  return { registerShortcut };
};
```

### 2. **포커스 관리 시스템**

```typescript
// ✅ 지능형 포커스 관리자
class FocusManager {
  private focusableElements: HTMLElement[] = [];
  private currentIndex = -1;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.updateFocusableElements();
    this.setupListeners();
  }

  private updateFocusableElements() {
    const selector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '.workflow-node',
      '.focusable'
    ].join(', ');

    this.focusableElements = Array.from(
      this.container.querySelectorAll(selector)
    ).filter(el => this.isVisible(el)) as HTMLElement[];
  }

  private isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           element.offsetParent !== null;
  }

  focusNext() {
    this.updateFocusableElements();
    this.currentIndex = (this.currentIndex + 1) % this.focusableElements.length;
    this.focusableElements[this.currentIndex]?.focus();
  }

  focusPrevious() {
    this.updateFocusableElements();
    this.currentIndex = this.currentIndex <= 0 
      ? this.focusableElements.length - 1 
      : this.currentIndex - 1;
    this.focusableElements[this.currentIndex]?.focus();
  }

  focusFirst() {
    this.updateFocusableElements();
    this.currentIndex = 0;
    this.focusableElements[0]?.focus();
  }

  focusLast() {
    this.updateFocusableElements();
    this.currentIndex = this.focusableElements.length - 1;
    this.focusableElements[this.currentIndex]?.focus();
  }

  private setupListeners() {
    this.container.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            this.focusPrevious();
          } else {
            this.focusNext();
          }
          break;
        case 'Home':
          if (e.ctrlKey) {
            e.preventDefault();
            this.focusFirst();
          }
          break;
        case 'End':
          if (e.ctrlKey) {
            e.preventDefault();
            this.focusLast();
          }
          break;
      }
    });

    // DOM 변경 감지
    const observer = new MutationObserver(() => {
      this.updateFocusableElements();
    });
    observer.observe(this.container, { childList: true, subtree: true });
  }
}

// ✅ 컴포넌트에서 사용
const WorkflowCanvas = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const focusManager = useRef<FocusManager>();

  useEffect(() => {
    if (canvasRef.current) {
      focusManager.current = new FocusManager(canvasRef.current);
    }
    return () => focusManager.current?.dispose();
  }, []);

  return (
    <div 
      ref={canvasRef}
      className="workflow-canvas"
      role="application"
      aria-label="워크플로우 디자인 캔버스"
    >
      {/* 내용 */}
    </div>
  );
};
```

### 3. **접근가능한 노드 컴포넌트**

```typescript
// ✅ 완전히 접근가능한 API 노드
const AccessibleAPINode = ({ data, selected, onSelect, onEdit, onDelete }: APINodeProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const nodeRef = useRef<HTMLDivElement>(null);

  // 키보드 이벤트 처리
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (e.shiftKey) {
          onEdit?.(data.id);
        } else {
          onSelect?.(data.id);
        }
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        onDelete?.(data.id);
        break;
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        e.preventDefault();
        handleArrowNavigation(e.key);
        break;
      case 'F2':
        e.preventDefault();
        onEdit?.(data.id);
        break;
      case 'Escape':
        e.preventDefault();
        nodeRef.current?.blur();
        break;
    }
  };

  const handleArrowNavigation = (key: string) => {
    const canvas = nodeRef.current?.closest('.workflow-canvas');
    if (!canvas) return;

    const nodes = Array.from(canvas.querySelectorAll('.workflow-node'));
    const currentIndex = nodes.indexOf(nodeRef.current!);
    let nextIndex = currentIndex;

    switch (key) {
      case 'ArrowUp':
        nextIndex = Math.max(0, currentIndex - 1);
        break;
      case 'ArrowDown':
        nextIndex = Math.min(nodes.length - 1, currentIndex + 1);
        break;
      case 'ArrowLeft':
        // 논리적 이전 노드로 이동
        nextIndex = currentIndex > 0 ? currentIndex - 1 : nodes.length - 1;
        break;
      case 'ArrowRight':
        // 논리적 다음 노드로 이동
        nextIndex = (currentIndex + 1) % nodes.length;
        break;
    }

    (nodes[nextIndex] as HTMLElement)?.focus();
  };

  // 상태 설명
  const getStatusDescription = () => {
    switch (callStatus) {
      case 'loading': return 'API 호출 중';
      case 'success': return 'API 호출 성공';
      case 'error': return 'API 호출 실패';
      default: return 'API 호출 준비 완료';
    }
  };

  return (
    <div
      ref={nodeRef}
      className={`workflow-node api-node ${selected ? 'selected' : ''} ${callStatus}`}
      role="button"
      tabIndex={0}
      aria-label={`${data.method} ${data.path} API 노드`}
      aria-describedby={`node-${data.id}-description`}
      aria-expanded={isExpanded}
      aria-selected={selected}
      onKeyDown={handleKeyDown}
      onClick={() => onSelect?.(data.id)}
    >
      {/* 시각적 콘텐츠 */}
      <div className="node-header">
        <div className="node-icon" aria-hidden="true">
          <Globe size={16} />
        </div>
        <div className="node-title">
          <span className="method-badge">{data.method}</span>
          <span className="path-text">{data.path}</span>
        </div>
        <div className="status-icon" aria-hidden="true">
          {callStatus === 'loading' && '⟳'}
          {callStatus === 'success' && '✓'}
          {callStatus === 'error' && '✗'}
        </div>
      </div>

      {/* 스크린 리더를 위한 설명 */}
      <div id={`node-${data.id}-description`} className="sr-only">
        {data.file} 파일의 {data.line}번 줄에 위치. 
        {getStatusDescription()}. 
        엔터 키로 선택, Shift+엔터로 편집, Delete로 삭제 가능.
      </div>

      {/* 에러 메시지 */}
      {callStatus === 'error' && (
        <div 
          role="alert" 
          aria-live="polite"
          className="error-message"
        >
          API 호출에 실패했습니다.
        </div>
      )}

      {/* 성공 메시지 */}
      {callStatus === 'success' && (
        <div 
          role="status" 
          aria-live="polite"
          className="success-message"
        >
          API 호출이 성공했습니다.
        </div>
      )}

      {/* 포커스 인디케이터 */}
      <div className="focus-indicator" aria-hidden="true" />
    </div>
  );
};
```

### 4. **스크린 리더 지원**

```typescript
// ✅ 라이브 리전 관리자
class LiveRegionManager {
  private politeLiveRegion: HTMLElement;
  private assertiveLiveRegion: HTMLElement;
  private statusRegion: HTMLElement;

  constructor() {
    this.createLiveRegions();
  }

  private createLiveRegions() {
    // 정중한 알림
    this.politeLiveRegion = document.createElement('div');
    this.politeLiveRegion.setAttribute('aria-live', 'polite');
    this.politeLiveRegion.setAttribute('aria-atomic', 'true');
    this.politeLiveRegion.className = 'sr-only';
    this.politeLiveRegion.id = 'polite-live-region';
    document.body.appendChild(this.politeLiveRegion);

    // 긴급 알림
    this.assertiveLiveRegion = document.createElement('div');
    this.assertiveLiveRegion.setAttribute('aria-live', 'assertive');
    this.assertiveLiveRegion.setAttribute('aria-atomic', 'true');
    this.assertiveLiveRegion.className = 'sr-only';
    this.assertiveLiveRegion.id = 'assertive-live-region';
    document.body.appendChild(this.assertiveLiveRegion);

    // 상태 알림
    this.statusRegion = document.createElement('div');
    this.statusRegion.setAttribute('role', 'status');
    this.statusRegion.setAttribute('aria-live', 'polite');
    this.statusRegion.className = 'sr-only';
    this.statusRegion.id = 'status-region';
    document.body.appendChild(this.statusRegion);
  }

  announce(message: string, priority: 'polite' | 'assertive' | 'status' = 'polite') {
    const region = {
      polite: this.politeLiveRegion,
      assertive: this.assertiveLiveRegion,
      status: this.statusRegion
    }[priority];

    // 기존 메시지 제거
    region.textContent = '';
    
    // 새 메시지 설정 (지연으로 스크린 리더가 인식하도록)
    setTimeout(() => {
      region.textContent = message;
    }, 10);

    // 일정 시간 후 자동 제거
    setTimeout(() => {
      region.textContent = '';
    }, 5000);
  }
}

const liveRegionManager = new LiveRegionManager();

// ✅ 훅 으로 사용
const useAnnouncer = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' | 'status' = 'polite') => {
    liveRegionManager.announce(message, priority);
  }, []);

  return announce;
};

// ✅ 사용 예시
const WorkflowActions = () => {
  const announce = useAnnouncer();
  
  const handleSave = async () => {
    announce('워크플로우를 저장 중입니다.', 'polite');
    
    try {
      await saveWorkflow();
      announce('워크플로우가 성공적으로 저장되었습니다.', 'status');
    } catch (error) {
      announce('워크플로우 저장에 실패했습니다.', 'assertive');
    }
  };

  return (
    <button onClick={handleSave}>
      저장
    </button>
  );
};
```

### 5. **대화상자 및 모달 접근성**

```typescript
// ✅ 접근가능한 모달 컴포넌트
const AccessibleModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  initialFocusRef 
}: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const [trapInstance, setTrapInstance] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      // 이전 포커스 요소 기억
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // 포커스 트랩 설정
      import('focus-trap').then(({ createFocusTrap }) => {
        if (modalRef.current) {
          const trap = createFocusTrap(modalRef.current, {
            initialFocus: initialFocusRef?.current || undefined,
            allowOutsideClick: false,
            escapeDeactivates: true,
            onDeactivate: onClose
          });
          trap.activate();
          setTrapInstance(trap);
        }
      });

      // 스크린 리더에게 모달 열림 알림
      liveRegionManager.announce(`${title} 대화상자가 열렸습니다.`, 'polite');
    }

    return () => {
      if (trapInstance) {
        trapInstance.deactivate();
        setTrapInstance(null);
      }
      
      // 이전 포커스 복귀
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose, title, initialFocusRef, trapInstance]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay"
      aria-hidden={!isOpen}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">
            {title}
          </h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label={`${title} 대화상자 닫기`}
          >
            ×
          </button>
        </div>
        
        <div id="modal-description" className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};
```

### 6. **커맨드 팩레트 시스템**

```typescript
// ✅ 전역 커맨드 팩레트
const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const announce = useAnnouncer();

  // 커맨드 데이터
  const commands = useMemo(() => [
    { id: 'save', label: '워크플로우 저장', shortcut: 'Ctrl+S', action: () => saveWorkflow() },
    { id: 'undo', label: '실행취소', shortcut: 'Ctrl+Z', action: () => undo() },
    { id: 'redo', label: '다시실행', shortcut: 'Ctrl+Y', action: () => redo() },
    { id: 'copy', label: '선택된 노드 복사', shortcut: 'Ctrl+C', action: () => copySelected() },
    { id: 'paste', label: '노드 붙여넣기', shortcut: 'Ctrl+V', action: () => paste() },
    { id: 'delete', label: '선택된 노드 삭제', shortcut: 'Delete', action: () => deleteSelected() },
    { id: 'new-api', label: '새 API 노드 추가', action: () => addAPINode() },
    { id: 'new-data', label: '새 데이터 노드 추가', action: () => addDataNode() },
    { id: 'export', label: '워크플로우 내보내기', action: () => openExportDialog() },
    { id: 'settings', label: '설정 열기', action: () => openSettings() },
  ], []);

  // 필터링된 커맨드
  const filteredCommands = useMemo(() => {
    if (!query) return commands;
    return commands.filter(cmd => 
      cmd.label.toLowerCase().includes(query.toLowerCase())
    );
  }, [commands, query]);

  // 키보드 내비게이션
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const executeCommand = (command: Command) => {
    command.action();
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
    announce(`${command.label} 커맨드를 실행했습니다.`, 'status');
  };

  // 전역 단축키 리스너
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // 열릴 때 포커스
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      announce('커맨드 팩레트가 열렸습니다. 커맨드를 검색하거나 위아래 화살표로 이동하세요.', 'polite');
    }
  }, [isOpen, announce]);

  if (!isOpen) return null;

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="커맨드 팩레트"
      initialFocusRef={inputRef}
    >
      <div className="command-palette" onKeyDown={handleKeyDown}>
        <input
          ref={inputRef}
          type="text"
          placeholder="커맨드 검색..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          className="command-input"
          aria-label="커맨드 검색 입력"
          aria-describedby="command-help"
        />
        
        <div id="command-help" className="sr-only">
          {filteredCommands.length}개의 커맨드가 있습니다. 위아래 화살표로 이동, 엔터로 실행할 수 있습니다.
        </div>

        <ul className="command-list" role="listbox" aria-label="커맨드 목록">
          {filteredCommands.map((command, index) => (
            <li
              key={command.id}
              className={`command-item ${index === selectedIndex ? 'selected' : ''}`}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => executeCommand(command)}
            >
              <div className="command-label">{command.label}</div>
              {command.shortcut && (
                <div className="command-shortcut" aria-label={`단축키: ${command.shortcut}`}>
                  {command.shortcut}
                </div>
              )}
            </li>
          ))}
        </ul>
        
        {filteredCommands.length === 0 && (
          <div className="no-commands" role="status">
            '"{query}"에 대한 커맨드를 찾을 수 없습니다.
          </div>
        )}
      </div>
    </AccessibleModal>
  );
};
```

---

## 🎨 접근성 CSS 스타일

```css
/* ✅ 포커스 인디케이터 */
.workflow-node {
  position: relative;
  transition: all 0.2s ease;
}

.workflow-node:focus {
  outline: 3px solid var(--focus-color, #4f46e5);
  outline-offset: 2px;
  z-index: 1000;
}

.workflow-node:focus .focus-indicator {
  opacity: 1;
}

.focus-indicator {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border: 3px solid var(--focus-color, #4f46e5);
  border-radius: 8px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

/* ✅ 고대비 모드 */
@media (prefers-contrast: high) {
  .workflow-node {
    border-width: 3px;
  }
  
  .workflow-node:focus {
    outline-width: 4px;
  }
  
  .focus-indicator {
    border-width: 4px;
  }
}

/* ✅ 애니메이션 감소 설정 */
@media (prefers-reduced-motion: reduce) {
  .workflow-node,
  .focus-indicator {
    transition: none;
  }
}

/* ✅ 스크린 리더 전용 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ✅ 키보드 사용자를 위한 버튼 스타일 */
button:focus-visible {
  outline: 3px solid var(--focus-color, #4f46e5);
  outline-offset: 2px;
}

button:focus:not(:focus-visible) {
  outline: none;
}

/* ✅ 커맨드 팩레트 스타일 */
.command-palette {
  width: 500px;
  max-height: 400px;
  overflow: hidden;
}

.command-input {
  width: 100%;
  padding: 12px;
  border: 2px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  font-size: 16px;
}

.command-input:focus {
  outline: none;
  border-color: var(--focus-color, #4f46e5);
  box-shadow: 0 0 0 3px var(--focus-color-alpha, rgba(79, 70, 229, 0.2));
}

.command-list {
  max-height: 300px;
  overflow-y: auto;
  margin: 0;
  padding: 0;
  list-style: none;
}

.command-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.command-item:hover,
.command-item.selected {
  background: var(--highlight-color, #eff6ff);
  color: var(--highlight-text, #1e40af);
}

.command-item.selected {
  border-left: 4px solid var(--focus-color, #4f46e5);
}

.command-shortcut {
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
  background: var(--key-background, #f3f4f6);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}
```

---

## 🎯 접근성 채크리스트

### ✅ 기본 접근성
- [ ] 모든 인터랙티브 요소에 tabindex 설정
- [ ] 적절한 semantic HTML 요소 사용
- [ ] aria-label 및 aria-describedby 추가
- [ ] 포커스 인디케이터 스타일링
- [ ] 컩러 대비 비율 4.5:1 이상 유지

### ⌨️ 키보드 내비게이션
- [ ] Tab/Shift+Tab으로 순차적 이동
- [ ] 화살표 키로 방향성 이동
- [ ] Enter/Space로 요소 활성화
- [ ] Escape로 대화상자/모달 닫기
- [ ] 전역 단축키 (Ctrl+S, Ctrl+Z 등)

### 🔊 스크린 리더 지원
- [ ] 의미있는 heading 구조
- [ ] aria-live regions로 동적 내용 알림
- [ ] 상태 변경 알림 (role="status")
- [ ] 오류 메시지 알림 (role="alert")

### 🎯 고급 기능
- [ ] 커맨드 팩레트 시스템
- [ ] 사용자 정의 단축키
- [ ] 포커스 트랩 관리
- [ ] 맥락 메뉴 시스템

---

## 📈 예상 개선 효과

| 접근성 영역 | 현재 | 목표 | 개선율 |
|-------------|------|------|--------|
| 키보드 내비게이션 | 20% | 95% | **375% 개선** |
| 스크린 리더 지원 | 30% | 90% | **200% 개선** |
| 시각적 포커스 | 60% | 95% | **58% 개선** |
| WCAG 2.1 준수 | Level A | Level AA | **100% 준수** |

이러한 개선을 통해 **모든 사용자가 마우스 없이도 완전히 사용 가능한 도구**가 됩니다!
