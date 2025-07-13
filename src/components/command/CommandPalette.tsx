import React, { useEffect, useRef, useCallback, memo } from 'react';
import { useCommandPalette, Command, CommandCategory } from '../../hooks/useCommandPalette';
import { useAccessibility } from '../accessibility/AccessibilityProvider';
import './CommandPalette.css';

// 🚀 접근성 최적화: 커맨드 팩레트 컴포넌트

interface CommandPaletteProps {
  className?: string;
  placeholder?: string;
  maxResults?: number;
  showCategories?: boolean;
  showShortcuts?: boolean;
  showRecent?: boolean;
}

export const CommandPalette: React.FC<CommandPaletteProps> = memo(({
  className = '',
  placeholder = '명령을 입력하세요...',
  maxResults = 20,
  showCategories = true,
  showShortcuts = true,
  showRecent = true
}) => {
  const { state, actions } = useCommandPalette();
  const { trapFocus, getAriaLabel, formatForScreenReader } = useAccessibility();
  
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selectedItemRef = useRef<HTMLLIElement>(null);

  // 🚀 접근성 최적화: 포커스 트랩 설정
  useEffect(() => {
    if (!state.isOpen || !modalRef.current) return;
    
    const cleanup = trapFocus(modalRef.current);
    
    // 입력 필드에 포커스
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
    
    return cleanup;
  }, [state.isOpen, trapFocus]);

  // 🚀 접근성 최적화: 키보드 이벤트 처리
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        actions.close();
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        actions.selectNext();
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        actions.selectPrevious();
        break;
        
      case 'Enter':
        e.preventDefault();
        if (state.filteredCommands.length > 0) {
          actions.executeSelected();
        }
        break;
        
      case 'Tab':
        e.preventDefault();
        actions.selectNext();
        break;
    }
  }, [actions, state.filteredCommands.length]);

  // 🚀 접근성 최적화: 입력 변경 처리
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    actions.setQuery(e.target.value);
  }, [actions]);

  // 🚀 접근성 최적화: 커맨드 클릭 처리
  const handleCommandClick = useCallback((command: Command, index: number) => {
    actions.executeCommand(command.id);
  }, [actions]);

  // 🚀 접근성 최적화: 선택된 아이템 스크롤
  useEffect(() => {
    if (selectedItemRef.current && listRef.current) {
      const item = selectedItemRef.current;
      const container = listRef.current;
      
      const itemTop = item.offsetTop;
      const itemBottom = itemTop + item.offsetHeight;
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;
      
      if (itemTop < containerTop) {
        container.scrollTop = itemTop;
      } else if (itemBottom > containerBottom) {
        container.scrollTop = itemBottom - container.clientHeight;
      }
    }
  }, [state.selectedIndex]);

  // 🚀 접근성 최적화: 검색 결과 그룹화
  const groupedCommands = React.useMemo(() => {
    if (!showCategories) {
      return [{ category: null, commands: state.filteredCommands.slice(0, maxResults) }];
    }

    const categoryMap = new Map<string, Command[]>();
    
    // 최근 커맨드가 있고 검색어가 없으면 별도 그룹으로 표시
    if (!state.query && showRecent && state.recentCommands.length > 0) {
      const recentInFiltered = state.filteredCommands.filter(cmd => 
        state.recentCommands.some(recent => recent.id === cmd.id)
      );
      
      if (recentInFiltered.length > 0) {
        categoryMap.set('recent', recentInFiltered.slice(0, 5));
      }
    }
    
    // 나머지 커맨드들을 카테고리별로 그룹화
    const otherCommands = state.filteredCommands.filter(cmd => {
      if (!state.query || !showRecent) return true;
      return !state.recentCommands.some(recent => recent.id === cmd.id);
    });
    
    otherCommands.forEach(command => {
      if (!categoryMap.has(command.category)) {
        categoryMap.set(command.category, []);
      }
      categoryMap.get(command.category)!.push(command);
    });

    // 결과를 배열로 변환
    const groups = Array.from(categoryMap.entries()).map(([categoryId, commands]) => {
      const category = categoryId === 'recent' 
        ? { id: 'recent', name: '최근 사용', icon: '🕒', priority: 0 }
        : state.categories.find(cat => cat.id === categoryId);
      
      return {
        category,
        commands: commands.slice(0, Math.ceil(maxResults / categoryMap.size))
      };
    });

    // 카테고리 우선순위로 정렬
    return groups.sort((a, b) => (a.category?.priority || 99) - (b.category?.priority || 99));
  }, [state.filteredCommands, state.categories, state.query, state.recentCommands, showCategories, showRecent, maxResults]);

  // 🚀 접근성 최적화: 단축키 포맷팅
  const formatShortcut = useCallback((shortcut: string[]): string => {
    return shortcut.join(' + ');
  }, []);

  if (!state.isOpen) {
    return null;
  }

  return (
    <div className="command-palette-overlay" onClick={actions.close}>
      <div 
        ref={modalRef}
        className={`command-palette ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={getAriaLabel('command-palette')}
        onKeyDown={handleKeyDown}
      >
        {/* 헤더 */}
        <div className="command-palette-header">
          <div className="search-container">
            <div className="search-icon">🔍</div>
            <input
              ref={inputRef}
              type="text"
              className="search-input"
              placeholder={placeholder}
              value={state.query}
              onChange={handleInputChange}
              aria-label="커맨드 검색"
              aria-describedby="command-palette-results"
              aria-activedescendant={
                state.filteredCommands[state.selectedIndex] 
                  ? `command-${state.filteredCommands[state.selectedIndex].id}`
                  : undefined
              }
              autoComplete="off"
              spellCheck={false}
            />
            {state.isLoading && (
              <div className="loading-indicator" aria-label="실행 중">
                <div className="spinner" />
              </div>
            )}
          </div>
          
          <button 
            className="close-button"
            onClick={actions.close}
            aria-label="커맨드 팩레트 닫기"
            tabIndex={-1}
          >
            ✕
          </button>
        </div>

        {/* 결과 목록 */}
        <div className="command-palette-body">
          {state.filteredCommands.length === 0 ? (
            <div className="no-results" role="status">
              {state.query ? (
                <>
                  <div className="no-results-icon">🔍</div>
                  <div className="no-results-text">
                    <strong>"{state.query}"</strong>에 대한 결과가 없습니다
                  </div>
                  <div className="no-results-hint">
                    다른 키워드로 검색해보세요
                  </div>
                </>
              ) : (
                <>
                  <div className="no-results-icon">⌨️</div>
                  <div className="no-results-text">
                    커맨드를 입력하거나 목록에서 선택하세요
                  </div>
                  <div className="no-results-hint">
                    Ctrl+Shift+P 또는 Ctrl+K로 다시 열 수 있습니다
                  </div>
                </>
              )}
            </div>
          ) : (
            <ul 
              ref={listRef}
              className="command-list"
              role="listbox"
              aria-label="사용 가능한 커맨드"
              id="command-palette-results"
            >
              {groupedCommands.map((group, groupIndex) => (
                <React.Fragment key={group.category?.id || 'default'}>
                  {/* 카테고리 헤더 */}
                  {showCategories && group.category && (
                    <li className="category-header" role="presentation">
                      <div className="category-content">
                        {group.category.icon && (
                          <span className="category-icon" aria-hidden="true">
                            {group.category.icon}
                          </span>
                        )}
                        <span className="category-name">{group.category.name}</span>
                        <span className="category-count">
                          {group.commands.length}
                        </span>
                      </div>
                    </li>
                  )}
                  
                  {/* 커맨드 목록 */}
                  {group.commands.map((command, commandIndex) => {
                    const globalIndex = groupedCommands
                      .slice(0, groupIndex)
                      .reduce((sum, g) => sum + g.commands.length, 0) + commandIndex;
                    
                    const isSelected = globalIndex === state.selectedIndex;
                    
                    return (
                      <li
                        key={command.id}
                        ref={isSelected ? selectedItemRef : undefined}
                        className={`command-item ${isSelected ? 'selected' : ''} ${command.disabled ? 'disabled' : ''}`}
                        role="option"
                        aria-selected={isSelected}
                        id={`command-${command.id}`}
                        onClick={() => !command.disabled && handleCommandClick(command, globalIndex)}
                      >
                        <div className="command-content">
                          <div className="command-main">
                            <div className="command-header">
                              {command.icon && (
                                <span className="command-icon" aria-hidden="true">
                                  {command.icon}
                                </span>
                              )}
                              <span className="command-title">
                                {command.title}
                              </span>
                              {showShortcuts && command.shortcut && (
                                <span className="command-shortcut" aria-label={`단축키: ${formatShortcut(command.shortcut)}`}>
                                  {command.shortcut.map((key, index) => (
                                    <React.Fragment key={key}>
                                      {index > 0 && <span className="shortcut-separator">+</span>}
                                      <kbd className="shortcut-key">{key}</kbd>
                                    </React.Fragment>
                                  ))}
                                </span>
                              )}
                            </div>
                            
                            {command.description && (
                              <div className="command-description">
                                {command.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </React.Fragment>
              ))}
            </ul>
          )}
        </div>

        {/* 푸터 */}
        <div className="command-palette-footer">
          <div className="footer-hints">
            <div className="hint">
              <kbd>Enter</kbd>
              <span>실행</span>
            </div>
            <div className="hint">
              <kbd>↑</kbd>
              <kbd>↓</kbd>
              <span>이동</span>
            </div>
            <div className="hint">
              <kbd>Esc</kbd>
              <span>닫기</span>
            </div>
          </div>
          
          {state.filteredCommands.length > 0 && (
            <div className="result-count" role="status" aria-live="polite">
              {state.filteredCommands.length}개 결과
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

CommandPalette.displayName = 'CommandPalette';

// 🚀 접근성 최적화: 커맨드 팩레트 래퍼 컴포넌트
interface CommandPaletteWrapperProps {
  children?: React.ReactNode;
}

export const CommandPaletteWrapper: React.FC<CommandPaletteWrapperProps> = ({ children }) => {
  return (
    <>
      {children}
      <CommandPalette />
    </>
  );
};

export default CommandPalette;