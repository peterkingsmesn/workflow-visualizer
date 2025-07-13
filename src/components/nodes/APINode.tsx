import React, { memo, useState, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { Globe, Wifi, WifiOff, Play, Pause, RotateCcw, Eye, Settings } from 'lucide-react';
import './APINode.css';

interface APINodeData {
  name: string;
  category: 'backend-api' | 'frontend-api';
  method: string;
  path: string;
  file: string;
  line: number;
  apiType: 'rest' | 'websocket';
  matched: boolean;
  baseUrl?: string;
  headers?: Record<string, string>;
  parameters?: Record<string, any>;
  body?: any;
  enabled?: boolean;
}

interface APICallResult {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: any;
  error?: string;
  timestamp?: number;
  responseTime?: number;
}

interface APINodeProps {
  data: APINodeData;
  selected?: boolean;
}

const APINode: React.FC<APINodeProps> = memo(({ data, selected }) => {
  const { name, category, method, path, file, line, apiType, matched, baseUrl, headers, parameters, body, enabled = true } = data;
  const [callResult, setCallResult] = useState<APICallResult>({ status: 'idle' });
  const [showDetails, setShowDetails] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return '#22c55e';
      case 'POST': return '#3b82f6';
      case 'PUT': return '#f59e0b';
      case 'DELETE': return '#ef4444';
      case 'PATCH': return '#8b5cf6';
      case 'WS_IN':
      case 'WS_OUT': return '#06b6d4';
      default: return '#6b7280';
    }
  };

  const getIcon = () => {
    if (apiType === 'websocket') {
      return <Wifi size={16} />;
    }
    return <Globe size={16} />;
  };

  const getStatusIcon = () => {
    if (callResult.status === 'loading') {
      return <span className="status-icon loading">⟳</span>;
    } else if (callResult.status === 'success') {
      return <span className="status-icon success">✓</span>;
    } else if (callResult.status === 'error') {
      return <span className="status-icon error">✗</span>;
    } else if (matched) {
      return <span className="status-icon matched">✓</span>;
    } else {
      return <span className="status-icon unmatched">⚠</span>;
    }
  };

  const makeAPICall = useCallback(async () => {
    if (!enabled || !path || callResult.status === 'loading') return;
    
    setCallResult({ status: 'loading' });
    const startTime = Date.now();
    
    try {
      const url = baseUrl ? `${baseUrl}${path}` : path;
      const options: RequestInit = {
        method: method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };
      
      if (method && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && body) {
        options.body = JSON.stringify(body);
      }
      
      // Add query parameters for GET requests
      const urlWithParams = new URL(url, window.location.origin);
      if (parameters && (method === 'GET' || !method)) {
        Object.entries(parameters).forEach(([key, value]) => {
          urlWithParams.searchParams.append(key, String(value));
        });
      }
      
      const response = await fetch(urlWithParams.toString(), options);
      const responseTime = Date.now() - startTime;
      
      let responseData;
      try {
        responseData = await response.json();
      } catch {
        responseData = await response.text();
      }
      
      if (response.ok) {
        setCallResult({
          status: 'success',
          data: responseData,
          timestamp: Date.now(),
          responseTime
        });
      } else {
        setCallResult({
          status: 'error',
          error: `HTTP ${response.status}: ${response.statusText}`,
          timestamp: Date.now(),
          responseTime
        });
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      setCallResult({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
        responseTime
      });
    }
  }, [enabled, path, method, baseUrl, headers, parameters, body, callResult.status]);
  
  const toggleAutoRefresh = useCallback(() => {
    if (autoRefresh) {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
      setAutoRefresh(false);
    } else {
      const interval = setInterval(makeAPICall, 5000); // 5초마다 호출
      setRefreshInterval(interval);
      setAutoRefresh(true);
    }
  }, [autoRefresh, refreshInterval, makeAPICall]);
  
  const resetCall = useCallback(() => {
    setCallResult({ status: 'idle' });
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
    setAutoRefresh(false);
  }, [refreshInterval]);
  
  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className={`api-node ${category} ${selected ? 'selected' : ''} ${matched ? 'matched' : 'unmatched'} ${callResult.status}`}>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="handle-input"
      />
      
      <div className="node-header">
        <div className="node-icon">
          {getIcon()}
        </div>
        <div className="node-title">
          <span className="method-badge" style={{ backgroundColor: getMethodColor(method) }}>
            {method}
          </span>
          <span className="path-text">{path}</span>
        </div>
        {getStatusIcon()}
      </div>
      
      <div className="node-content">
        <div className="file-info">
          <span className="file-name">{file.split('/').pop()}</span>
          <span className="line-number">:{line}</span>
        </div>
        
        <div className="api-type-badge">
          {apiType === 'websocket' ? 'WebSocket' : 'REST API'}
        </div>
      </div>
      
      <div className="node-footer">
        <span className="category-badge">
          {category === 'backend-api' ? '백엔드' : '프론트엔드'}
        </span>
        
        {callResult.responseTime && (
          <span className="response-time">
            {formatResponseTime(callResult.responseTime)}
          </span>
        )}
      </div>
      
      <div className="node-actions">
        <button
          className="action-btn primary"
          onClick={makeAPICall}
          disabled={!enabled || callResult.status === 'loading'}
          title="API 호출"
        >
          <Play size={12} />
        </button>
        
        <button
          className="action-btn"
          onClick={toggleAutoRefresh}
          title={autoRefresh ? '자동 새로고침 중지' : '자동 새로고침 시작'}
        >
          {autoRefresh ? <Pause size={12} /> : <RotateCcw size={12} />}
        </button>
        
        <button
          className="action-btn"
          onClick={() => setShowDetails(!showDetails)}
          title="세부사항 보기"
        >
          <Eye size={12} />
        </button>
        
        <button
          className="action-btn"
          onClick={resetCall}
          title="초기화"
        >
          <Settings size={12} />
        </button>
      </div>
      
      {showDetails && (
        <div className="node-details">
          <div className="details-header">
            <h4>API 호출 정보</h4>
            <button 
              className="close-btn"
              onClick={() => setShowDetails(false)}
            >
              ×
            </button>
          </div>
          
          <div className="details-content">
            <div className="detail-row">
              <span className="detail-label">URL:</span>
              <span className="detail-value">{baseUrl ? `${baseUrl}${path}` : path}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Method:</span>
              <span className="detail-value">{method || 'GET'}</span>
            </div>
            
            {parameters && Object.keys(parameters).length > 0 && (
              <div className="detail-row">
                <span className="detail-label">Parameters:</span>
                <pre className="detail-json">{JSON.stringify(parameters, null, 2)}</pre>
              </div>
            )}
            
            {headers && Object.keys(headers).length > 0 && (
              <div className="detail-row">
                <span className="detail-label">Headers:</span>
                <pre className="detail-json">{JSON.stringify(headers, null, 2)}</pre>
              </div>
            )}
            
            {body && (
              <div className="detail-row">
                <span className="detail-label">Body:</span>
                <pre className="detail-json">{JSON.stringify(body, null, 2)}</pre>
              </div>
            )}
            
            {callResult.status !== 'idle' && (
              <div className="detail-row">
                <span className="detail-label">Response:</span>
                <div className="response-container">
                  <div className="response-meta">
                    <span className={`response-status ${callResult.status}`}>
                      {callResult.status.toUpperCase()}
                    </span>
                    {callResult.timestamp && (
                      <span className="response-timestamp">
                        {new Date(callResult.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  
                  {callResult.error && (
                    <div className="response-error">
                      {callResult.error}
                    </div>
                  )}
                  
                  {callResult.data && (
                    <pre className="response-data">
                      {typeof callResult.data === 'string' 
                        ? callResult.data 
                        : JSON.stringify(callResult.data, null, 2)
                      }
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="handle-output"
      />
    </div>
  );
});

APINode.displayName = 'APINode';

export default APINode;