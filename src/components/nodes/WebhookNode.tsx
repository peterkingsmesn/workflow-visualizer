import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Webhook } from 'lucide-react';

interface WebhookNodeData {
  label: string;
  type: string;
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  events?: string[];
  headers?: Record<string, string>;
  status?: 'active' | 'inactive' | 'error';
}

const WebhookNode: React.FC<NodeProps<WebhookNodeData>> = ({ data, selected }) => {
  const methodColors = {
    GET: '#48bb78',
    POST: '#4299e1',
    PUT: '#ed8936',
    DELETE: '#f56565'
  };

  return (
    <div 
      className={`webhook-node node-container ${selected ? 'selected' : ''}`}
      style={{
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        border: '2px solid #3182ce',
        borderRadius: '8px',
        padding: '10px',
        minWidth: '200px',
        boxShadow: selected ? '0 0 0 2px #2b6cb0' : '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#3182ce' }}
      />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Webhook size={20} color="white" />
        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
          {data.label}
        </div>
        {data.method && (
          <div style={{
            fontSize: '10px',
            color: 'white',
            backgroundColor: methodColors[data.method],
            padding: '2px 6px',
            borderRadius: '4px',
            marginLeft: 'auto'
          }}>
            {data.method}
          </div>
        )}
      </div>
      
      {data.url && (
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', marginBottom: '4px' }}>
          {data.url.length > 30 ? data.url.substring(0, 30) + '...' : data.url}
        </div>
      )}
      
      {data.events && data.events.length > 0 && (
        <div style={{ marginTop: '8px', fontSize: '11px' }}>
          <div style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '4px' }}>
            Events:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {data.events.map((event, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  color: 'white'
                }}
              >
                {event}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#3182ce' }}
      />
    </div>
  );
};

export default memo(WebhookNode);