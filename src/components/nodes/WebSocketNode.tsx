import React, { useState, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { Wifi, WifiOff, Users, MessageCircle, Settings, AlertTriangle } from 'lucide-react';
import { WebSocketData } from '../../types/workflow.types';

interface WebSocketNodeProps {
  data: WebSocketData;
  selected: boolean;
}

const WebSocketNode: React.FC<WebSocketNodeProps> = ({ data, selected }) => {
  const [showEvents, setShowEvents] = useState(false);
  const [showRooms, setShowRooms] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  const handleConnect = useCallback(() => {
    setConnectionStatus('connecting');
    // 실제 WebSocket 연결 로직
    setTimeout(() => {
      setConnectionStatus('connected');
    }, 1000);
  }, []);

  const handleDisconnect = useCallback(() => {
    setConnectionStatus('disconnected');
  }, []);

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi size={16} className="text-green-500" />;
      case 'connecting':
        return <Wifi size={16} className="text-yellow-500 animate-pulse" />;
      default:
        return <WifiOff size={16} className="text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'green';
      case 'connecting':
        return 'yellow';
      default:
        return 'red';
    }
  };

  const eventStats = {
    listeners: data.events?.filter(e => e.type === 'listener').length || 0,
    emitters: data.events?.filter(e => e.type === 'emit').length || 0
  };

  return (
    <div className={`websocket-node ${selected ? 'selected' : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        style={{ left: -8 }}
      />
      
      <div className="node-header">
        <div className="node-icon">
          {getStatusIcon()}
        </div>
        <div className="node-title">
          <h3>{data.name}</h3>
          <span className="node-type">WebSocket</span>
        </div>
        <div className={`connection-indicator ${getStatusColor()}`} />
      </div>

      <div className="connection-info">
        <div className="info-item">
          <span className="info-label">URL:</span>
          <span className="info-value">{data.url || 'localhost:3000'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">타입:</span>
          <span className="info-value">{data.type}</span>
        </div>
        <div className="info-item">
          <span className="info-label">상태:</span>
          <span className={`info-value status-${connectionStatus}`}>
            {connectionStatus === 'connected' ? '연결됨' : 
             connectionStatus === 'connecting' ? '연결 중' : '연결 끊김'}
          </span>
        </div>
      </div>

      <div className="websocket-stats">
        <div className="stat-group">
          <div className="stat-item">
            <MessageCircle size={14} />
            <span>{eventStats.listeners} 리스너</span>
          </div>
          <div className="stat-item">
            <MessageCircle size={14} />
            <span>{eventStats.emitters} 이미터</span>
          </div>
        </div>
        
        {data.rooms && data.rooms.length > 0 && (
          <div className="stat-group">
            <div className="stat-item">
              <Users size={14} />
              <span>{data.rooms.length} 룸</span>
            </div>
          </div>
        )}
      </div>

      <div className="websocket-sections">
        <div className="section">
          <button 
            className="section-header"
            onClick={() => setShowEvents(!showEvents)}
          >
            <MessageCircle size={14} />
            <span>이벤트 ({data.events?.length || 0})</span>
            <span className={`chevron ${showEvents ? 'expanded' : ''}`}>▼</span>
          </button>
          
          {showEvents && (
            <div className="section-content">
              {data.events?.slice(0, 5).map(event => (
                <div key={event.id} className={`event-item ${event.type}`}>
                  <div className="event-header">
                    <span className="event-type">{event.type}</span>
                    <span className="event-name">{event.name}</span>
                  </div>
                  {event.validation && (
                    <div className="event-validation">
                      <AlertTriangle size={12} />
                      <span>검증됨</span>
                    </div>
                  )}
                </div>
              )) || <div className="no-events">이벤트 없음</div>}
              
              {data.events && data.events.length > 5 && (
                <div className="more-events">
                  +{data.events.length - 5} 개 더...
                </div>
              )}
            </div>
          )}
        </div>

        {data.rooms && data.rooms.length > 0 && (
          <div className="section">
            <button 
              className="section-header"
              onClick={() => setShowRooms(!showRooms)}
            >
              <Users size={14} />
              <span>룸 ({data.rooms.length})</span>
              <span className={`chevron ${showRooms ? 'expanded' : ''}`}>▼</span>
            </button>
            
            {showRooms && (
              <div className="section-content">
                {data.rooms.slice(0, 5).map((room, index) => (
                  <div key={index} className="room-item">
                    <span className="room-name">{room}</span>
                    <span className="room-users">0 사용자</span>
                  </div>
                ))}
                
                {data.rooms.length > 5 && (
                  <div className="more-rooms">
                    +{data.rooms.length - 5} 개 더...
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="node-actions">
        {connectionStatus === 'connected' ? (
          <button 
            className="action-button disconnect"
            onClick={handleDisconnect}
          >
            <WifiOff size={14} />
            연결 끊기
          </button>
        ) : (
          <button 
            className="action-button connect"
            onClick={handleConnect}
            disabled={connectionStatus === 'connecting'}
          >
            <Wifi size={14} />
            {connectionStatus === 'connecting' ? '연결 중...' : '연결'}
          </button>
        )}
        
        <button className="action-button settings">
          <Settings size={14} />
          설정
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ right: -8 }}
      />
      
      {/* 이벤트별 핸들 */}
      {data.events?.slice(0, 3).map((event, index) => (
        <Handle
          key={event.id}
          type={event.type === 'emit' ? 'source' : 'target'}
          position={event.type === 'emit' ? Position.Right : Position.Left}
          id={event.id}
          style={{ 
            [event.type === 'emit' ? 'right' : 'left']: -8,
            top: 100 + (index * 20)
          }}
        />
      ))}
    </div>
  );
};

export default WebSocketNode;