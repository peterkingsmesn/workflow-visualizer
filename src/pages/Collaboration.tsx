import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, MessageCircle, Activity, Settings, Wifi, WifiOff, Video, Mic, MicOff } from 'lucide-react';
import { Node as ReactFlowNode, Edge as ReactFlowEdge } from 'reactflow';
import { UnifiedWorkflowCanvas } from '../components/canvas/UnifiedWorkflowCanvas';
import { useCollaborationStore } from '../store/collaborationStore';
import { useWorkflowStore } from '../store/workflowStore';
import './Collaboration.css';

const Collaboration: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [showUsers, setShowUsers] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);

  const {
    isConnected,
    isConnecting,
    connectionError,
    users,
    currentUser,
    chatMessages,
    unreadCount,
    activityLogs,
    userCursors,
    userSelections,
    settings,
    connect,
    disconnect,
    joinProject,
    leaveProject,
    sendChatMessage,
    markChatAsRead,
    updateSettings,
    updateCursorPosition,
    updateSelection
  } = useCollaborationStore();
  const { sendWorkflowChange, addActivityLog } = useCollaborationStore();

  const { nodes, edges, updateWorkflow } = useWorkflowStore();

  // 초기 연결
  useEffect(() => {
    if (settings.autoConnect && !isConnected && !isConnecting) {
      const serverUrl = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3001';
      connect(serverUrl);
    }

    return () => {
      if (id) {
        leaveProject();
      }
    };
  }, []);

  // 프로젝트 참가
  useEffect(() => {
    if (isConnected && id && !currentUser) {
      const user = {
        id: `user-${Date.now()}`,
        name: localStorage.getItem('userName') || '익명 사용자',
        email: localStorage.getItem('userEmail') || '',
        color: generateUserColor(),
        lastActivity: Date.now()
      };
      
      joinProject(id, user);
    }
  }, [isConnected, id, currentUser, joinProject]);

  // 채팅 메시지 전송
  const handleSendMessage = useCallback(() => {
    if (chatMessage.trim() && isConnected) {
      sendChatMessage(chatMessage.trim());
      setChatMessage('');
    }
  }, [chatMessage, isConnected, sendChatMessage]);

  // 채팅창 토글
  const handleToggleChat = useCallback(() => {
    setShowChat(!showChat);
    if (!showChat) {
      markChatAsRead();
    }
  }, [showChat, markChatAsRead]);

  // 마우스 이동 추적
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (isConnected && settings.showCursors) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      updateCursorPosition(x, y);
    }
  }, [isConnected, settings.showCursors, updateCursorPosition]);

  // 음성 통화 토글
  const handleToggleVoice = useCallback(() => {
    setIsVoiceEnabled(!isVoiceEnabled);
    // 실제 WebRTC 구현 필요
  }, [isVoiceEnabled]);

  // 마이크 토글
  const handleToggleMic = useCallback(() => {
    setIsMicEnabled(!isMicEnabled);
    // 실제 오디오 제어 필요
  }, [isMicEnabled]);

  // 사용자 색상 생성
  function generateUserColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // 워크플로우 업데이트 핸들러
  const handleWorkflowUpdate = useCallback((newNodes: ReactFlowNode[], newEdges: ReactFlowEdge[]) => {
    if (!isConnected || !currentUser) return;

    const updates = { nodes: newNodes as any, edges: newEdges as any };
    
    // 로컬 상태 업데이트
    updateWorkflow(updates);

    // 다른 사용자에게 변경사항 전송
    const delta: any = {
      type: 'bulk_update' as const,
      payload: updates,
      timestamp: Date.now(),
      userId: currentUser.id,
      sessionId: id || ''
    };

    sendWorkflowChange(delta);

    // 활동 로그 추가
    addActivityLog({
      id: `activity-${Date.now()}`,
      type: 'workflow_change',
      user: currentUser.name,
      timestamp: Date.now()
    });
  }, [isConnected, currentUser, updateWorkflow, sendWorkflowChange, addActivityLog]);

  return (
    <div className="collaboration-container">
      {/* 헤더 */}
      <header className="collaboration-header">
        <div className="header-left">
          <button 
            className="back-button"
            onClick={() => navigate('/dashboard')}
          >
            ← 대시보드
          </button>
          <h1>협업 워크스페이스</h1>
          
          {/* 연결 상태 */}
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span>
              {isConnecting ? '연결 중...' : 
               isConnected ? '연결됨' : '연결 끊김'}
            </span>
          </div>
        </div>

        <div className="header-actions">
          {/* 음성 통화 */}
          <button 
            className={`action-button ${isVoiceEnabled ? 'active' : ''}`}
            onClick={handleToggleVoice}
            title="음성 통화"
          >
            <Video size={16} />
          </button>
          
          <button 
            className={`action-button ${isMicEnabled ? 'active' : ''}`}
            onClick={handleToggleMic}
            title="마이크"
          >
            {isMicEnabled ? <Mic size={16} /> : <MicOff size={16} />}
          </button>

          {/* 패널 토글 */}
          <button 
            className={`action-button ${showUsers ? 'active' : ''}`}
            onClick={() => setShowUsers(!showUsers)}
            title="사용자 목록"
          >
            <Users size={16} />
            <span className="badge">{users.length}</span>
          </button>

          <button 
            className={`action-button ${showChat ? 'active' : ''}`}
            onClick={handleToggleChat}
            title="채팅"
          >
            <MessageCircle size={16} />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>

          <button 
            className={`action-button ${showActivity ? 'active' : ''}`}
            onClick={() => setShowActivity(!showActivity)}
            title="활동 로그"
          >
            <Activity size={16} />
          </button>
        </div>
      </header>

      {/* 메인 영역 */}
      <div className="collaboration-main">
        {/* 사용자 패널 */}
        {showUsers && (
          <aside className="users-panel">
            <div className="panel-header">
              <h3>참여자 ({users.length})</h3>
            </div>
            
            <div className="users-list">
              {users.map(user => (
                <div key={user.id} className="user-item">
                  <div 
                    className="user-avatar"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{user.name}</div>
                    <div className="user-status">
                      {user.id === currentUser?.id ? '나' : '온라인'}
                    </div>
                  </div>
                  <div className={`user-indicator ${(user as any).status || 'active'}`} />
                </div>
              ))}
            </div>

            {/* 설정 */}
            <div className="panel-settings">
              <h4>협업 설정</h4>
              <label>
                <input
                  type="checkbox"
                  checked={settings.showCursors}
                  onChange={(e) => updateSettings({ showCursors: e.target.checked })}
                />
                다른 사용자 커서 표시
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={settings.showSelections}
                  onChange={(e) => updateSettings({ showSelections: e.target.checked })}
                />
                다른 사용자 선택 표시
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={settings.enableChat}
                  onChange={(e) => updateSettings({ enableChat: e.target.checked })}
                />
                채팅 활성화
              </label>
            </div>
          </aside>
        )}

        {/* 캔버스 영역 */}
        <main 
          className="canvas-container"
          onMouseMove={handleMouseMove}
        >
          <UnifiedWorkflowCanvas nodes={nodes} edges={edges} onUpdate={handleWorkflowUpdate} />
          
          {/* 사용자 커서들 */}
          {settings.showCursors && Object.entries(userCursors).map(([userId, cursor]) => {
            const user = users.find(u => u.id === userId);
            if (!user || userId === currentUser?.id) return null;
            
            return (
              <div
                key={userId}
                className="user-cursor"
                style={{
                  left: cursor.x,
                  top: cursor.y,
                  borderColor: user.color
                }}
              >
                <div 
                  className="cursor-label"
                  style={{ backgroundColor: user.color }}
                >
                  {user.name}
                </div>
              </div>
            );
          })}
        </main>

        {/* 채팅 패널 */}
        {showChat && (
          <aside className="chat-panel">
            <div className="panel-header">
              <h3>채팅</h3>
              <button onClick={handleToggleChat}>×</button>
            </div>
            
            <div className="chat-messages">
              {chatMessages.map(message => (
                <div key={message.id} className="chat-message">
                  <div 
                    className="message-avatar"
                    style={{ backgroundColor: message.user.color }}
                  >
                    {message.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="message-content">
                    <div className="message-header">
                      <span className="message-author">{message.user.name}</span>
                      <span className="message-time">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="message-text">{message.message}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="chat-input">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="메시지를 입력하세요..."
                disabled={!isConnected}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!chatMessage.trim() || !isConnected}
              >
                전송
              </button>
            </div>
          </aside>
        )}

        {/* 활동 로그 패널 */}
        {showActivity && (
          <aside className="activity-panel">
            <div className="panel-header">
              <h3>활동 로그</h3>
              <button onClick={() => setShowActivity(false)}>×</button>
            </div>
            
            <div className="activity-list">
              {activityLogs.slice(-50).reverse().map(log => (
                <div key={log.id} className="activity-item">
                  <div className="activity-time">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="activity-message">
                    {log.type === 'user_joined' && `${log.user}님이 참여했습니다`}
                    {log.type === 'user_left' && `${log.user}님이 나갔습니다`}
                    {log.type === 'workflow_change' && `${log.user}님이 워크플로우를 수정했습니다`}
                    {log.type === 'chat_message' && `${log.user}님이 메시지를 보냈습니다`}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* 연결 오류 알림 */}
      {connectionError && (
        <div className="error-notification">
          <div className="error-content">
            <strong>연결 오류</strong>
            <p>{connectionError}</p>
            <button onClick={() => connect(process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3001')}>
              다시 연결
            </button>
          </div>
        </div>
      )}

      {/* 연결 중 오버레이 */}
      {isConnecting && (
        <div className="connecting-overlay">
          <div className="connecting-spinner">
            <div className="spinner" />
            <p>서버에 연결 중...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Collaboration;