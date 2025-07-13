import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useAccessibility } from '../components/accessibility/AccessibilityProvider';

// 🚀 접근성 최적화: 커맨드 팩레트 훅

export interface Command {
  id: string;
  title: string;
  description?: string;
  category: string;
  icon?: string;
  shortcut?: string[];
  action: () => void | Promise<void>;
  keywords?: string[];
  disabled?: boolean;
  when?: () => boolean;
}

export interface CommandCategory {
  id: string;
  name: string;
  icon?: string;
  priority?: number;
}

export interface CommandPaletteState {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  commands: Command[];
  filteredCommands: Command[];
  categories: CommandCategory[];
  recentCommands: Command[];
  isLoading: boolean;
}

export interface CommandPaletteHookReturn {
  state: CommandPaletteState;
  actions: {
    open: () => void;
    close: () => void;
    toggle: () => void;
    setQuery: (query: string) => void;
    selectNext: () => void;
    selectPrevious: () => void;
    executeSelected: () => Promise<void>;
    executeCommand: (commandId: string) => Promise<void>;
    registerCommand: (command: Command) => void;
    unregisterCommand: (commandId: string) => void;
    registerCategory: (category: CommandCategory) => void;
    addToRecent: (command: Command) => void;
    clearRecent: () => void;
  };
}

const DEFAULT_CATEGORIES: CommandCategory[] = [
  { id: 'workflow', name: '워크플로우', icon: '🔄', priority: 1 },
  { id: 'edit', name: '편집', icon: '✏️', priority: 2 },
  { id: 'navigation', name: '탐색', icon: '🧭', priority: 3 },
  { id: 'view', name: '보기', icon: '👁️', priority: 4 },
  { id: 'export', name: '내보내기', icon: '📤', priority: 5 },
  { id: 'settings', name: '설정', icon: '⚙️', priority: 6 },
  { id: 'help', name: '도움말', icon: '❓', priority: 7 }
];

export function useCommandPalette(): CommandPaletteHookReturn {
  const [state, setState] = useState<CommandPaletteState>({
    isOpen: false,
    query: '',
    selectedIndex: 0,
    commands: [],
    filteredCommands: [],
    categories: DEFAULT_CATEGORIES,
    recentCommands: [],
    isLoading: false
  });

  const commandsRef = useRef<Map<string, Command>>(new Map());
  const categoriesRef = useRef<Map<string, CommandCategory>>(new Map());
  const recentCommandsRef = useRef<Command[]>([]);
  
  const { announce } = useAccessibility();

  // 🚀 접근성 최적화: 키보드 단축키 등록
  useKeyboardShortcuts({
    onSearch: () => toggle()
  }, {
    enabled: true
  });

  // 🚀 접근성 최적화: 기본 커맨드 등록
  useEffect(() => {
    // 워크플로우 관련 커맨드
    registerCommand({
      id: 'workflow.save',
      title: '워크플로우 저장',
      description: '현재 워크플로우를 저장합니다',
      category: 'workflow',
      icon: '💾',
      shortcut: ['Ctrl', 'S'],
      action: () => {
        // 실제 저장 로직 구현 필요
        announce('워크플로우가 저장되었습니다', 'medium');
      },
      keywords: ['save', 'store', '저장', '보존']
    });

    registerCommand({
      id: 'workflow.export',
      title: '워크플로우 내보내기',
      description: '워크플로우를 JSON 파일로 내보냅니다',
      category: 'export',
      icon: '📤',
      action: () => {
        // 실제 내보내기 로직 구현 필요
        announce('워크플로우 내보내기를 시작합니다', 'medium');
      },
      keywords: ['export', 'download', '내보내기', '다운로드']
    });

    registerCommand({
      id: 'workflow.import',
      title: '워크플로우 가져오기',
      description: 'JSON 파일에서 워크플로우를 가져옵니다',
      category: 'workflow',
      icon: '📥',
      action: () => {
        // 실제 가져오기 로직 구현 필요
        announce('워크플로우 가져오기를 시작합니다', 'medium');
      },
      keywords: ['import', 'upload', '가져오기', '업로드']
    });

    // 편집 관련 커맨드
    registerCommand({
      id: 'edit.undo',
      title: '실행 취소',
      description: '마지막 작업을 취소합니다',
      category: 'edit',
      icon: '↶',
      shortcut: ['Ctrl', 'Z'],
      action: () => {
        // 실제 실행취소 로직 구현 필요
        announce('작업이 취소되었습니다', 'medium');
      },
      keywords: ['undo', 'revert', '실행취소', '되돌리기']
    });

    registerCommand({
      id: 'edit.redo',
      title: '다시 실행',
      description: '취소된 작업을 다시 실행합니다',
      category: 'edit',
      icon: '↷',
      shortcut: ['Ctrl', 'Y'],
      action: () => {
        // 실제 다시실행 로직 구현 필요
        announce('작업이 다시 실행되었습니다', 'medium');
      },
      keywords: ['redo', 'restore', '다시실행', '복원']
    });

    registerCommand({
      id: 'edit.copy',
      title: '복사',
      description: '선택된 요소를 복사합니다',
      category: 'edit',
      icon: '📋',
      shortcut: ['Ctrl', 'C'],
      action: () => {
        // 실제 복사 로직 구현 필요
        announce('요소가 복사되었습니다', 'medium');
      },
      keywords: ['copy', 'duplicate', '복사', '복제']
    });

    registerCommand({
      id: 'edit.paste',
      title: '붙여넣기',
      description: '복사된 요소를 붙여넣습니다',
      category: 'edit',
      icon: '📄',
      shortcut: ['Ctrl', 'V'],
      action: () => {
        // 실제 붙여넣기 로직 구현 필요
        announce('요소가 붙여넣기되었습니다', 'medium');
      },
      keywords: ['paste', 'insert', '붙여넣기', '삽입']
    });

    // 탐색 관련 커맨드
    registerCommand({
      id: 'navigation.focus-canvas',
      title: '캔버스에 포커스',
      description: '워크플로우 캔버스로 포커스를 이동합니다',
      category: 'navigation',
      icon: '🎯',
      action: () => {
        // 실제 포커스 이동 로직 구현 필요
        announce('캔버스로 포커스가 이동되었습니다', 'medium');
      },
      keywords: ['focus', 'canvas', '포커스', '캔버스']
    });

    registerCommand({
      id: 'navigation.center-view',
      title: '화면 중앙 정렬',
      description: '워크플로우를 화면 중앙에 정렬합니다',
      category: 'navigation',
      icon: '🎯',
      action: () => {
        // 실제 중앙 정렬 로직 구현 필요
        announce('화면이 중앙 정렬되었습니다', 'medium');
      },
      keywords: ['center', 'align', '중앙', '정렬']
    });

    // 보기 관련 커맨드
    registerCommand({
      id: 'view.zoom-in',
      title: '확대',
      description: '워크플로우를 확대합니다',
      category: 'view',
      icon: '🔍',
      shortcut: ['Ctrl', '+'],
      action: () => {
        // 실제 확대 로직 구현 필요
        announce('화면이 확대되었습니다', 'medium');
      },
      keywords: ['zoom', 'in', 'magnify', '확대']
    });

    registerCommand({
      id: 'view.zoom-out',
      title: '축소',
      description: '워크플로우를 축소합니다',
      category: 'view',
      icon: '🔍',
      shortcut: ['Ctrl', '-'],
      action: () => {
        // 실제 축소 로직 구현 필요
        announce('화면이 축소되었습니다', 'medium');
      },
      keywords: ['zoom', 'out', 'shrink', '축소']
    });

    registerCommand({
      id: 'view.fit-to-screen',
      title: '화면에 맞춤',
      description: '워크플로우를 화면에 맞게 조정합니다',
      category: 'view',
      icon: '📐',
      shortcut: ['Ctrl', '0'],
      action: () => {
        // 실제 화면 맞춤 로직 구현 필요
        announce('화면에 맞게 조정되었습니다', 'medium');
      },
      keywords: ['fit', 'screen', 'adjust', '맞춤', '조정']
    });

    // 설정 관련 커맨드
    registerCommand({
      id: 'settings.preferences',
      title: '환경설정',
      description: '애플리케이션 설정을 엽니다',
      category: 'settings',
      icon: '⚙️',
      action: () => {
        // 실제 설정 열기 로직 구현 필요
        announce('환경설정이 열렸습니다', 'medium');
      },
      keywords: ['settings', 'preferences', 'config', '설정', '환경설정']
    });

    registerCommand({
      id: 'settings.keyboard-shortcuts',
      title: '키보드 단축키',
      description: '키보드 단축키 목록을 확인합니다',
      category: 'settings',
      icon: '⌨️',
      action: () => {
        // 실제 단축키 표시 로직 구현 필요
        announce('키보드 단축키 목록이 표시됩니다', 'medium');
      },
      keywords: ['keyboard', 'shortcuts', 'hotkeys', '키보드', '단축키']
    });

    // 도움말 관련 커맨드
    registerCommand({
      id: 'help.documentation',
      title: '도움말 문서',
      description: '사용자 가이드를 엽니다',
      category: 'help',
      icon: '📖',
      action: () => {
        // 실제 도움말 열기 로직 구현 필요
        announce('도움말 문서가 열렸습니다', 'medium');
      },
      keywords: ['help', 'documentation', 'guide', '도움말', '가이드']
    });

    registerCommand({
      id: 'help.about',
      title: '정보',
      description: '애플리케이션 정보를 확인합니다',
      category: 'help',
      icon: 'ℹ️',
      action: () => {
        // 실제 정보 표시 로직 구현 필요
        announce('애플리케이션 정보가 표시됩니다', 'medium');
      },
      keywords: ['about', 'info', 'version', '정보', '버전']
    });

    // 로컬 스토리지에서 최근 커맨드 로드
    loadRecentCommands();
  }, [announce]);

  // 🚀 접근성 최적화: 퍼지 검색 구현
  const filteredCommands = useMemo(() => {
    if (!state.query.trim()) {
      // 검색어가 없으면 최근 커맨드와 모든 커맨드를 표시
      const availableCommands = Array.from(commandsRef.current.values())
        .filter(cmd => !cmd.when || cmd.when())
        .filter(cmd => !cmd.disabled);

      const recentCommands = recentCommandsRef.current
        .filter(cmd => availableCommands.find(c => c.id === cmd.id));

      if (recentCommands.length > 0) {
        const otherCommands = availableCommands
          .filter(cmd => !recentCommands.find(r => r.id === cmd.id));
        
        return [...recentCommands, ...otherCommands];
      }

      return availableCommands;
    }

    const query = state.query.toLowerCase();
    const commands = Array.from(commandsRef.current.values())
      .filter(cmd => !cmd.when || cmd.when())
      .filter(cmd => !cmd.disabled);

    // 퍼지 검색 스코어링
    const scored = commands.map(cmd => {
      let score = 0;
      
      // 제목 매칭 (높은 점수)
      if (cmd.title.toLowerCase().includes(query)) {
        score += 100;
        if (cmd.title.toLowerCase().startsWith(query)) {
          score += 50;
        }
      }
      
      // 설명 매칭 (중간 점수)
      if (cmd.description?.toLowerCase().includes(query)) {
        score += 50;
      }
      
      // 키워드 매칭 (중간 점수)
      if (cmd.keywords?.some(keyword => keyword.toLowerCase().includes(query))) {
        score += 75;
      }
      
      // 카테고리 매칭 (낮은 점수)
      if (cmd.category.toLowerCase().includes(query)) {
        score += 25;
      }
      
      // 문자별 순서 매칭 (퍼지 검색)
      const titleChars = cmd.title.toLowerCase();
      let queryIndex = 0;
      let consecutiveMatches = 0;
      
      for (let i = 0; i < titleChars.length && queryIndex < query.length; i++) {
        if (titleChars[i] === query[queryIndex]) {
          queryIndex++;
          consecutiveMatches++;
          score += consecutiveMatches * 2; // 연속 매칭 보너스
        } else {
          consecutiveMatches = 0;
        }
      }
      
      // 모든 문자가 순서대로 포함되어 있으면 추가 점수
      if (queryIndex === query.length) {
        score += 30;
      }
      
      return { command: cmd, score };
    });

    // 점수 순으로 정렬하고 0점 이상인 것만 반환
    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.command);
  }, [state.query, state.commands]);

  // 🚀 접근성 최적화: 커맨드 팩레트 열기
  const open = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: true,
      selectedIndex: 0,
      query: ''
    }));
    
    announce('커맨드 팩레트가 열렸습니다', 'medium');
  }, [announce]);

  // 🚀 접근성 최적화: 커맨드 팩레트 닫기
  const close = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      selectedIndex: 0,
      query: ''
    }));
    
    announce('커맨드 팩레트가 닫혔습니다', 'low');
  }, [announce]);

  // 🚀 접근성 최적화: 토글
  const toggle = useCallback(() => {
    if (state.isOpen) {
      close();
    } else {
      open();
    }
  }, [state.isOpen, open, close]);

  // 🚀 접근성 최적화: 검색어 설정
  const setQuery = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      query,
      selectedIndex: 0
    }));
  }, []);

  // 🚀 접근성 최적화: 다음 선택
  const selectNext = useCallback(() => {
    setState(prev => {
      const newIndex = prev.selectedIndex < filteredCommands.length - 1 
        ? prev.selectedIndex + 1 
        : 0;
      
      const selectedCommand = filteredCommands[newIndex];
      if (selectedCommand) {
        announce(`${selectedCommand.title} 선택됨`, 'low');
      }
      
      return {
        ...prev,
        selectedIndex: newIndex
      };
    });
  }, [filteredCommands, announce]);

  // 🚀 접근성 최적화: 이전 선택
  const selectPrevious = useCallback(() => {
    setState(prev => {
      const newIndex = prev.selectedIndex > 0 
        ? prev.selectedIndex - 1 
        : filteredCommands.length - 1;
      
      const selectedCommand = filteredCommands[newIndex];
      if (selectedCommand) {
        announce(`${selectedCommand.title} 선택됨`, 'low');
      }
      
      return {
        ...prev,
        selectedIndex: newIndex
      };
    });
  }, [filteredCommands, announce]);

  // 🚀 접근성 최적화: 선택된 커맨드 실행
  const executeSelected = useCallback(async () => {
    const selectedCommand = filteredCommands[state.selectedIndex];
    if (!selectedCommand) return;

    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await selectedCommand.action();
      addToRecent(selectedCommand);
      close();
      announce(`${selectedCommand.title} 실행됨`, 'medium');
    } catch (error) {
      console.error('Command execution failed:', error);
      announce(`${selectedCommand.title} 실행 중 오류가 발생했습니다`, 'high');
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [filteredCommands, state.selectedIndex, close, announce]);

  // 🚀 접근성 최적화: 특정 커맨드 실행
  const executeCommand = useCallback(async (commandId: string) => {
    const command = commandsRef.current.get(commandId);
    if (!command) return;

    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await command.action();
      addToRecent(command);
      announce(`${command.title} 실행됨`, 'medium');
    } catch (error) {
      console.error('Command execution failed:', error);
      announce(`${command.title} 실행 중 오류가 발생했습니다`, 'high');
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [announce]);

  // 🚀 접근성 최적화: 커맨드 등록
  const registerCommand = useCallback((command: Command) => {
    commandsRef.current.set(command.id, command);
    setState(prev => ({
      ...prev,
      commands: Array.from(commandsRef.current.values())
    }));
  }, []);

  // 🚀 접근성 최적화: 커맨드 등록 해제
  const unregisterCommand = useCallback((commandId: string) => {
    commandsRef.current.delete(commandId);
    setState(prev => ({
      ...prev,
      commands: Array.from(commandsRef.current.values())
    }));
  }, []);

  // 🚀 접근성 최적화: 카테고리 등록
  const registerCategory = useCallback((category: CommandCategory) => {
    categoriesRef.current.set(category.id, category);
    setState(prev => ({
      ...prev,
      categories: Array.from(categoriesRef.current.values())
        .sort((a, b) => (a.priority || 99) - (b.priority || 99))
    }));
  }, []);

  // 🚀 접근성 최적화: 최근 커맨드에 추가
  const addToRecent = useCallback((command: Command) => {
    const maxRecent = 10;
    const updated = [
      command,
      ...recentCommandsRef.current.filter(cmd => cmd.id !== command.id)
    ].slice(0, maxRecent);
    
    recentCommandsRef.current = updated;
    
    setState(prev => ({
      ...prev,
      recentCommands: updated
    }));
    
    // 로컬 스토리지에 저장
    try {
      localStorage.setItem('commandPalette.recent', JSON.stringify(updated.map(cmd => cmd.id)));
    } catch (error) {
      console.warn('Failed to save recent commands:', error);
    }
  }, []);

  // 🚀 접근성 최적화: 최근 커맨드 정리
  const clearRecent = useCallback(() => {
    recentCommandsRef.current = [];
    setState(prev => ({
      ...prev,
      recentCommands: []
    }));
    
    try {
      localStorage.removeItem('commandPalette.recent');
    } catch (error) {
      console.warn('Failed to clear recent commands:', error);
    }
  }, []);

  // 🚀 접근성 최적화: 최근 커맨드 로드
  const loadRecentCommands = useCallback(() => {
    try {
      const saved = localStorage.getItem('commandPalette.recent');
      if (saved) {
        const commandIds = JSON.parse(saved);
        const recentCommands = commandIds
          .map((id: string) => commandsRef.current.get(id))
          .filter(Boolean);
        
        recentCommandsRef.current = recentCommands;
        setState(prev => ({
          ...prev,
          recentCommands
        }));
      }
    } catch (error) {
      console.warn('Failed to load recent commands:', error);
    }
  }, []);

  // 🚀 접근성 최적화: 필터링된 커맨드 업데이트
  useEffect(() => {
    setState(prev => ({
      ...prev,
      filteredCommands,
      selectedIndex: Math.min(prev.selectedIndex, Math.max(0, filteredCommands.length - 1))
    }));
  }, [filteredCommands]);

  return {
    state: {
      ...state,
      filteredCommands
    },
    actions: {
      open,
      close,
      toggle,
      setQuery,
      selectNext,
      selectPrevious,
      executeSelected,
      executeCommand,
      registerCommand,
      unregisterCommand,
      registerCategory,
      addToRecent,
      clearRecent
    }
  };
}

export default useCommandPalette;