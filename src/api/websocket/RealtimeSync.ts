import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
// import { useWorkflowStore } from '../../store/workflowStore'; // 미사용
import { getErrorMessage } from '../../utils/errorUtils';

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
    nodeId?: string;
  };
  selection?: {
    nodeIds: string[];
    edgeIds: string[];
  };
  lastActivity: number;
}

export interface WorkflowDelta {
  type: 'node_add' | 'node_update' | 'node_delete' | 'edge_add' | 'edge_update' | 'edge_delete' | 'bulk_update';
  payload: any;
  timestamp: number;
  userId: string;
  sessionId: string;
}

export interface RoomState {
  id: string;
  projectId: string;
  users: Map<string, CollaborationUser>;
  workflow: any;
  history: WorkflowDelta[];
  lastSaved: number;
}

export class RealtimeSync {
  private io: SocketIOServer;
  private rooms = new Map<string, RoomState>();
  private userSessions = new Map<string, string>(); // userId -> roomId

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    this.startPeriodicTasks();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`클라이언트 연결: ${socket.id}`);

      // 프로젝트 룸 참가
      socket.on('join_project', async (data: { projectId: string; user: CollaborationUser }) => {
        try {
          await this.handleJoinProject(socket, data);
        } catch (error) {
          socket.emit('error', { message: '프로젝트 참가 실패', error: getErrorMessage(error) });
        }
      });

      // 프로젝트 룸 떠나기
      socket.on('leave_project', async (data: { projectId: string }) => {
        try {
          await this.handleLeaveProject(socket, data);
        } catch (error) {
          socket.emit('error', { message: '프로젝트 떠나기 실패', error: getErrorMessage(error) });
        }
      });

      // 워크플로우 변경사항 동기화
      socket.on('workflow_change', async (data: WorkflowDelta) => {
        try {
          await this.handleWorkflowChange(socket, data);
        } catch (error) {
          socket.emit('error', { message: '워크플로우 동기화 실패', error: getErrorMessage(error) });
        }
      });

      // 커서 위치 업데이트
      socket.on('cursor_move', (data: { x: number; y: number; nodeId?: string }) => {
        this.handleCursorMove(socket, data);
      });

      // 선택 상태 업데이트
      socket.on('selection_change', (data: { nodeIds: string[]; edgeIds: string[] }) => {
        this.handleSelectionChange(socket, data);
      });

      // 사용자 상태 업데이트
      socket.on('user_status', (data: { status: 'active' | 'idle' | 'away' }) => {
        this.handleUserStatus(socket, data);
      });

      // 채팅 메시지
      socket.on('chat_message', (data: { message: string; projectId: string }) => {
        this.handleChatMessage(socket, data);
      });

      // 연결 해제
      socket.on('disconnect', () => {
        console.log(`클라이언트 연결 해제: ${socket.id}`);
        this.handleDisconnect(socket);
      });

      // 에러 처리
      socket.on('error', (error) => {
        console.error('Socket 에러:', error);
      });
    });
  }

  private async handleJoinProject(socket: Socket, data: { projectId: string; user: CollaborationUser }): Promise<void> {
    const { projectId, user } = data;
    const roomId = `project:${projectId}`;

    // 기존 룸에서 나가기
    const existingRoomId = this.userSessions.get(user.id);
    if (existingRoomId) {
      await this.handleLeaveProject(socket, { projectId: existingRoomId.split(':')[1] });
    }

    // 룸 참가
    socket.join(roomId);
    this.userSessions.set(user.id, roomId);

    // 룸 상태 초기화 또는 업데이트
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        projectId,
        users: new Map(),
        workflow: {
          nodes: [],
          edges: [],
          metadata: {
            version: '1.0.0',
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
          }
        },
        history: [],
        lastSaved: Date.now()
      });
    }

    const room = this.rooms.get(roomId)!;
    
    // 사용자 추가
    user.lastActivity = Date.now();
    room.users.set(user.id, user);

    // 기존 사용자들에게 새 사용자 알림
    socket.to(roomId).emit('user_joined', {
      user,
      totalUsers: room.users.size
    });

    // 새 사용자에게 현재 상태 전송
    socket.emit('project_state', {
      workflow: room.workflow,
      users: Array.from(room.users.values()),
      history: room.history.slice(-50) // 최근 50개 변경사항만
    });

    // 활동 로그
    this.broadcastToRoom(roomId, 'activity_log', {
      type: 'user_joined',
      user: user.name,
      timestamp: Date.now()
    });
  }

  private async handleLeaveProject(socket: Socket, data: { projectId: string }): Promise<void> {
    const { projectId } = data;
    const roomId = `project:${projectId}`;
    const room = this.rooms.get(roomId);

    if (!room) return;

    // 사용자 찾기
    const userId = Array.from(this.userSessions.entries())
      .find(([_, rId]) => rId === roomId)?.[0];

    if (userId) {
      const user = room.users.get(userId);
      
      // 룸에서 나가기
      socket.leave(roomId);
      this.userSessions.delete(userId);
      room.users.delete(userId);

      // 다른 사용자들에게 알림
      socket.to(roomId).emit('user_left', {
        userId,
        user: user?.name,
        totalUsers: room.users.size
      });

      // 활동 로그
      if (user) {
        this.broadcastToRoom(roomId, 'activity_log', {
          type: 'user_left',
          user: user.name,
          timestamp: Date.now()
        });
      }

      // 룸이 비었으면 정리
      if (room.users.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  private async handleWorkflowChange(socket: Socket, delta: WorkflowDelta): Promise<void> {
    const roomId = Array.from(socket.rooms).find(room => room.startsWith('project:'));
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    // 변경사항 타임스탬프 추가
    delta.timestamp = Date.now();
    delta.sessionId = socket.id;

    // 변경사항 적용
    this.applyWorkflowDelta(room, delta);

    // 히스토리에 추가
    room.history.push(delta);
    
    // 히스토리 크기 제한 (최대 1000개)
    if (room.history.length > 1000) {
      room.history = room.history.slice(-1000);
    }

    // 다른 클라이언트들에게 변경사항 브로드캐스트
    socket.to(roomId).emit('workflow_delta', delta);

    // 자동 저장 (5초마다)
    if (Date.now() - room.lastSaved > 5000) {
      await this.saveWorkflow(room);
      room.lastSaved = Date.now();
    }

    // 활동 로그
    const user = this.getUserFromSocket(socket, room);
    if (user) {
      this.broadcastToRoom(roomId, 'activity_log', {
        type: 'workflow_change',
        user: user.name,
        action: delta.type,
        timestamp: Date.now()
      });
    }
  }

  private handleCursorMove(socket: Socket, data: { x: number; y: number; nodeId?: string }): void {
    const roomId = Array.from(socket.rooms).find(room => room.startsWith('project:'));
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const user = this.getUserFromSocket(socket, room);
    if (!user) return;

    // 커서 위치 업데이트
    user.cursor = data;
    user.lastActivity = Date.now();

    // 다른 사용자들에게 커서 위치 브로드캐스트
    socket.to(roomId).emit('cursor_update', {
      userId: user.id,
      cursor: data
    });
  }

  private handleSelectionChange(socket: Socket, data: { nodeIds: string[]; edgeIds: string[] }): void {
    const roomId = Array.from(socket.rooms).find(room => room.startsWith('project:'));
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const user = this.getUserFromSocket(socket, room);
    if (!user) return;

    // 선택 상태 업데이트
    user.selection = data;
    user.lastActivity = Date.now();

    // 다른 사용자들에게 선택 상태 브로드캐스트
    socket.to(roomId).emit('selection_update', {
      userId: user.id,
      selection: data
    });
  }

  private handleUserStatus(socket: Socket, data: { status: 'active' | 'idle' | 'away' }): void {
    const roomId = Array.from(socket.rooms).find(room => room.startsWith('project:'));
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const user = this.getUserFromSocket(socket, room);
    if (!user) return;

    // 상태 업데이트
    (user as any).status = data.status;
    user.lastActivity = Date.now();

    // 다른 사용자들에게 상태 변경 브로드캐스트
    socket.to(roomId).emit('user_status_update', {
      userId: user.id,
      status: data.status
    });
  }

  private handleChatMessage(socket: Socket, data: { message: string; projectId: string }): void {
    const roomId = `project:${data.projectId}`;
    const room = this.rooms.get(roomId);
    if (!room) return;

    const user = this.getUserFromSocket(socket, room);
    if (!user) return;

    const chatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user: {
        id: user.id,
        name: user.name,
        color: user.color
      },
      message: data.message,
      timestamp: Date.now()
    };

    // 룸의 모든 사용자에게 메시지 브로드캐스트
    this.io.to(roomId).emit('chat_message', chatMessage);
  }

  private handleDisconnect(socket: Socket): void {
    // 모든 룸에서 사용자 제거
    for (const [userId, roomId] of this.userSessions.entries()) {
      const room = this.rooms.get(roomId);
      if (room && room.users.has(userId)) {
        const user = room.users.get(userId);
        
        // 사용자 제거
        room.users.delete(userId);
        this.userSessions.delete(userId);

        // 다른 사용자들에게 알림
        socket.to(roomId).emit('user_left', {
          userId,
          user: user?.name,
          totalUsers: room.users.size
        });

        // 룸이 비었으면 정리
        if (room.users.size === 0) {
          this.rooms.delete(roomId);
        }

        break;
      }
    }
  }

  private applyWorkflowDelta(room: RoomState, delta: WorkflowDelta): void {
    // 실제 구현에서는 Zustand 스토어와 연동
    switch (delta.type) {
      case 'node_add':
        // 노드 추가 로직
        break;
      case 'node_update':
        // 노드 업데이트 로직
        break;
      case 'node_delete':
        // 노드 삭제 로직
        break;
      case 'edge_add':
        // 엣지 추가 로직
        break;
      case 'edge_update':
        // 엣지 업데이트 로직
        break;
      case 'edge_delete':
        // 엣지 삭제 로직
        break;
      case 'bulk_update':
        // 대량 업데이트 로직
        break;
    }
  }

  private async saveWorkflow(room: RoomState): Promise<void> {
    try {
      // 실제 구현에서는 데이터베이스나 파일 시스템에 저장
      console.log(`워크플로우 저장: ${room.projectId}`);
    } catch (error) {
      console.error('워크플로우 저장 실패:', error);
    }
  }

  private getUserFromSocket(socket: Socket, room: RoomState): CollaborationUser | null {
    const userId = Array.from(this.userSessions.entries())
      .find(([_, roomId]) => roomId === room.id)?.[0];
    
    return userId ? room.users.get(userId) || null : null;
  }

  private broadcastToRoom(roomId: string, event: string, data: any): void {
    this.io.to(roomId).emit(event, data);
  }

  private startPeriodicTasks(): void {
    // 비활성 사용자 정리 (5분 이상 비활성)
    setInterval(() => {
      this.cleanupInactiveUsers();
    }, 60000); // 1분마다

    // 룸 상태 저장 (10분마다)
    setInterval(() => {
      this.saveAllRooms();
    }, 600000); // 10분마다

    // 메모리 정리 (1시간마다)
    setInterval(() => {
      this.cleanupMemory();
    }, 3600000); // 1시간마다
  }

  private cleanupInactiveUsers(): void {
    const now = Date.now();
    const inactiveThreshold = 5 * 60 * 1000; // 5분

    for (const [roomId, room] of this.rooms.entries()) {
      const inactiveUsers: string[] = [];

      for (const [userId, user] of room.users.entries()) {
        if (now - user.lastActivity > inactiveThreshold) {
          inactiveUsers.push(userId);
        }
      }

      // 비활성 사용자 제거
      inactiveUsers.forEach(userId => {
        const user = room.users.get(userId);
        room.users.delete(userId);
        this.userSessions.delete(userId);

        this.broadcastToRoom(roomId, 'user_left', {
          userId,
          user: user?.name,
          totalUsers: room.users.size,
          reason: 'inactive'
        });
      });

      // 빈 룸 정리
      if (room.users.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  private async saveAllRooms(): Promise<void> {
    for (const room of this.rooms.values()) {
      await this.saveWorkflow(room);
    }
  }

  private cleanupMemory(): void {
    // 오래된 히스토리 정리
    for (const room of this.rooms.values()) {
      if (room.history.length > 100) {
        room.history = room.history.slice(-100);
      }
    }
  }

  // 공개 메서드들
  public getRoomStats(): any {
    return {
      totalRooms: this.rooms.size,
      totalUsers: this.userSessions.size,
      rooms: Array.from(this.rooms.values()).map(room => ({
        id: room.id,
        projectId: room.projectId,
        userCount: room.users.size,
        lastActivity: Math.max(...Array.from(room.users.values()).map(u => u.lastActivity))
      }))
    };
  }

  public forceDisconnectUser(userId: string): void {
    const roomId = this.userSessions.get(userId);
    if (roomId) {
      const room = this.rooms.get(roomId);
      if (room) {
        room.users.delete(userId);
        this.userSessions.delete(userId);
        
        this.broadcastToRoom(roomId, 'user_left', {
          userId,
          reason: 'forced'
        });
      }
    }
  }

  public broadcastMessage(projectId: string, event: string, data: any): void {
    const roomId = `project:${projectId}`;
    this.broadcastToRoom(roomId, event, data);
  }
}