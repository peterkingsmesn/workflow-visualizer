import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { io, Socket } from 'socket.io-client';
import { CollaborationUser, WorkflowDelta } from '../api/websocket/RealtimeSync';

export interface ChatMessage {
  id: string;
  user: {
    id: string;
    name: string;
    color: string;
  };
  message: string;
  timestamp: number;
}

export interface ActivityLog {
  id: string;
  type: 'user_joined' | 'user_left' | 'workflow_change' | 'chat_message';
  user: string;
  action?: string;
  timestamp: number;
}

export interface CollaborationState {
  // 연결 상태
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  socket: Socket | null;

  // 현재 세션 정보
  currentProjectId: string | null;
  currentUser: CollaborationUser | null;
  sessionId: string | null;

  // 협업 사용자들
  users: CollaborationUser[];
  userCursors: Record<string, { x: number; y: number; nodeId?: string }>;
  userSelections: Record<string, { nodeIds: string[]; edgeIds: string[] }>;

  // 채팅
  chatMessages: ChatMessage[];
  unreadCount: number;
  isChatOpen: boolean;

  // 활동 로그
  activityLogs: ActivityLog[];

  // 워크플로우 동기화
  pendingChanges: WorkflowDelta[];
  isApplyingChanges: boolean;
  lastSyncTimestamp: number;

  // 설정
  settings: {
    showCursors: boolean;
    showSelections: boolean;
    enableChat: boolean;
    enableActivityLogs: boolean;
    autoConnect: boolean;
  };
}

export interface CollaborationActions {
  // 연결 관리
  connect: (serverUrl: string) => void;
  disconnect: () => void;
  joinProject: (projectId: string, user: CollaborationUser) => void;
  leaveProject: () => void;

  // 사용자 상태
  updateCursorPosition: (x: number, y: number, nodeId?: string) => void;
  updateSelection: (nodeIds: string[], edgeIds: string[]) => void;
  updateUserStatus: (status: 'active' | 'idle' | 'away') => void;

  // 워크플로우 동기화
  sendWorkflowChange: (delta: WorkflowDelta) => void;
  applyWorkflowDelta: (delta: WorkflowDelta) => void;
  clearPendingChanges: () => void;

  // 채팅
  sendChatMessage: (message: string) => void;
  addChatMessage: (message: ChatMessage) => void;
  markChatAsRead: () => void;
  toggleChat: () => void;

  // 활동 로그
  addActivityLog: (log: ActivityLog) => void;
  clearActivityLogs: () => void;

  // 설정
  updateSettings: (settings: Partial<CollaborationState['settings']>) => void;

  // 내부 상태 업데이트
  setConnectionState: (isConnected: boolean, error?: string) => void;
  setUsers: (users: CollaborationUser[]) => void;
  updateUser: (userId: string, updates: Partial<CollaborationUser>) => void;
  removeUser: (userId: string) => void;
}

export const useCollaborationStore = create<CollaborationState & CollaborationActions>()(
  immer((set, get) => ({
    // 초기 상태
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    socket: null,

    currentProjectId: null,
    currentUser: null,
    sessionId: null,

    users: [],
    userCursors: {},
    userSelections: {},

    chatMessages: [],
    unreadCount: 0,
    isChatOpen: false,

    activityLogs: [],

    pendingChanges: [],
    isApplyingChanges: false,
    lastSyncTimestamp: 0,

    settings: {
      showCursors: true,
      showSelections: true,
      enableChat: true,
      enableActivityLogs: true,
      autoConnect: true
    },

    // 연결 관리
    connect: (serverUrl: string) => {
      set(state => {
        if (state.socket?.connected) {
          return;
        }

        state.isConnecting = true;
        state.connectionError = null;

        const socket = io(serverUrl, {
          transports: ['websocket', 'polling'],
          autoConnect: true
        });

        // 연결 성공
        socket.on('connect', () => {
          set(state => {
            state.isConnected = true;
            state.isConnecting = false;
            state.connectionError = null;
            state.sessionId = socket.id;
          });
        });

        // 연결 실패
        socket.on('connect_error', (error) => {
          set(state => {
            state.isConnected = false;
            state.isConnecting = false;
            state.connectionError = error.message;
          });
        });

        // 연결 해제
        socket.on('disconnect', () => {
          set(state => {
            state.isConnected = false;
            state.isConnecting = false;
          });
        });

        // 프로젝트 상태 수신
        socket.on('project_state', (data) => {
          set(state => {
            state.users = data.users || [];
            // 워크플로우 상태도 업데이트 (useWorkflowStore와 연동 필요)
          });
        });

        // 사용자 참가
        socket.on('user_joined', (data) => {
          set(state => {
            const existingIndex = state.users.findIndex(u => u.id === data.user.id);
            if (existingIndex >= 0) {
              state.users[existingIndex] = data.user;
            } else {
              state.users.push(data.user);
            }
          });

          get().addActivityLog({
            id: `activity-${Date.now()}`,
            type: 'user_joined',
            user: data.user.name,
            timestamp: Date.now()
          });
        });

        // 사용자 떠남
        socket.on('user_left', (data) => {
          set(state => {
            state.users = state.users.filter(u => u.id !== data.userId);
            delete state.userCursors[data.userId];
            delete state.userSelections[data.userId];
          });

          if (data.user) {
            get().addActivityLog({
              id: `activity-${Date.now()}`,
              type: 'user_left',
              user: data.user,
              timestamp: Date.now()
            });
          }
        });

        // 워크플로우 변경사항 수신
        socket.on('workflow_delta', (delta) => {
          get().applyWorkflowDelta(delta);
        });

        // 커서 위치 업데이트
        socket.on('cursor_update', (data) => {
          set(state => {
            state.userCursors[data.userId] = data.cursor;
          });
        });

        // 선택 상태 업데이트
        socket.on('selection_update', (data) => {
          set(state => {
            state.userSelections[data.userId] = data.selection;
          });
        });

        // 사용자 상태 업데이트
        socket.on('user_status_update', (data) => {
          set(state => {
            const user = state.users.find(u => u.id === data.userId);
            if (user) {
              (user as any).status = data.status;
            }
          });
        });

        // 채팅 메시지 수신
        socket.on('chat_message', (message) => {
          get().addChatMessage(message);
        });

        // 활동 로그 수신
        socket.on('activity_log', (log) => {
          get().addActivityLog(log);
        });

        // 에러 처리
        socket.on('error', (error) => {
          set(state => {
            state.connectionError = error.message;
          });
        });

        return { ...state, socket };
      });
    },

    disconnect: () => {
      set(state => {
        if (state.socket) {
          state.socket.disconnect();
          state.socket = null;
        }
        
        state.isConnected = false;
        state.isConnecting = false;
        state.connectionError = null;
        state.currentProjectId = null;
        state.users = [];
        state.userCursors = {};
        state.userSelections = {};
        state.chatMessages = [];
        state.activityLogs = [];
        state.pendingChanges = [];
      });
    },

    joinProject: (projectId: string, user: CollaborationUser) => {
      const { socket } = get();
      if (!socket?.connected) return;

      set(state => {
        state.currentProjectId = projectId;
        state.currentUser = user;
      });

      socket.emit('join_project', { projectId, user });
    },

    leaveProject: () => {
      const { socket, currentProjectId } = get();
      if (!socket?.connected || !currentProjectId) return;

      socket.emit('leave_project', { projectId: currentProjectId });

      set(state => {
        state.currentProjectId = null;
        state.currentUser = null;
        state.users = [];
        state.userCursors = {};
        state.userSelections = {};
        state.chatMessages = [];
        state.activityLogs = [];
      });
    },

    // 사용자 상태 업데이트
    updateCursorPosition: (x: number, y: number, nodeId?: string) => {
      const { socket } = get();
      if (!socket?.connected) return;

      socket.emit('cursor_move', { x, y, nodeId });
    },

    updateSelection: (nodeIds: string[], edgeIds: string[]) => {
      const { socket } = get();
      if (!socket?.connected) return;

      socket.emit('selection_change', { nodeIds, edgeIds });
    },

    updateUserStatus: (status: 'active' | 'idle' | 'away') => {
      const { socket } = get();
      if (!socket?.connected) return;

      socket.emit('user_status', { status });
    },

    // 워크플로우 동기화
    sendWorkflowChange: (delta: WorkflowDelta) => {
      const { socket } = get();
      if (!socket?.connected) return;

      set(state => {
        state.pendingChanges.push(delta);
        state.lastSyncTimestamp = Date.now();
      });

      socket.emit('workflow_change', delta);
    },

    applyWorkflowDelta: (delta: WorkflowDelta) => {
      set(state => {
        state.isApplyingChanges = true;
      });

      // 실제 워크플로우 상태 업데이트는 useWorkflowStore에서 처리
      // 여기서는 협업 관련 상태만 업데이트

      setTimeout(() => {
        set(state => {
          state.isApplyingChanges = false;
          state.lastSyncTimestamp = Date.now();
        });
      }, 100);
    },

    clearPendingChanges: () => {
      set(state => {
        state.pendingChanges = [];
      });
    },

    // 채팅
    sendChatMessage: (message: string) => {
      const { socket, currentProjectId } = get();
      if (!socket?.connected || !currentProjectId) return;

      socket.emit('chat_message', { message, projectId: currentProjectId });
    },

    addChatMessage: (message: ChatMessage) => {
      set(state => {
        state.chatMessages.push(message);
        
        // 최대 1000개 메시지 유지
        if (state.chatMessages.length > 1000) {
          state.chatMessages = state.chatMessages.slice(-1000);
        }

        // 읽지 않은 메시지 카운트 증가 (채팅창이 닫혀있을 때만)
        if (!state.isChatOpen) {
          state.unreadCount++;
        }
      });
    },

    markChatAsRead: () => {
      set(state => {
        state.unreadCount = 0;
      });
    },

    toggleChat: () => {
      set(state => {
        state.isChatOpen = !state.isChatOpen;
        if (state.isChatOpen) {
          state.unreadCount = 0;
        }
      });
    },

    // 활동 로그
    addActivityLog: (log: ActivityLog) => {
      set(state => {
        state.activityLogs.push(log);
        
        // 최대 500개 로그 유지
        if (state.activityLogs.length > 500) {
          state.activityLogs = state.activityLogs.slice(-500);
        }
      });
    },

    clearActivityLogs: () => {
      set(state => {
        state.activityLogs = [];
      });
    },

    // 설정
    updateSettings: (newSettings) => {
      set(state => {
        state.settings = { ...state.settings, ...newSettings };
      });
    },

    // 내부 상태 업데이트
    setConnectionState: (isConnected: boolean, error?: string) => {
      set(state => {
        state.isConnected = isConnected;
        state.connectionError = error || null;
      });
    },

    setUsers: (users: CollaborationUser[]) => {
      set(state => {
        state.users = users;
      });
    },

    updateUser: (userId: string, updates: Partial<CollaborationUser>) => {
      set(state => {
        const userIndex = state.users.findIndex(u => u.id === userId);
        if (userIndex >= 0) {
          state.users[userIndex] = { ...state.users[userIndex], ...updates };
        }
      });
    },

    removeUser: (userId: string) => {
      set(state => {
        state.users = state.users.filter(u => u.id !== userId);
        delete state.userCursors[userId];
        delete state.userSelections[userId];
      });
    }
  }))
);

// 선택자 함수들
export const selectCollaborationUsers = (state: CollaborationState) => state.users;
export const selectChatMessages = (state: CollaborationState) => state.chatMessages;
export const selectIsConnected = (state: CollaborationState) => state.isConnected;
export const selectCurrentUser = (state: CollaborationState) => state.currentUser;
export const selectUserCursors = (state: CollaborationState) => state.userCursors;
export const selectUserSelections = (state: CollaborationState) => state.userSelections;