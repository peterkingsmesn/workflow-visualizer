import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Server } from 'lucide-react';

interface ServiceNodeData {
  label: string;
  type: string;
  status?: 'running' | 'stopped' | 'error';
  port?: number;
  protocol?: 'http' | 'https' | 'tcp' | 'udp';
  endpoints?: string[];
}

const ServiceNode: React.FC<NodeProps<ServiceNodeData>> = ({ data, selected }) => {
  const statusColors = {
    running: '#48bb78',
    stopped: '#718096',
    error: '#f56565'
  };

  return (
    <div 
      className={`service-node node-container ${selected ? 'selected' : ''}`}
      style={{
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        border: '2px solid #e53e3e',
        borderRadius: '8px',
        padding: '10px',
        minWidth: '180px',
        boxShadow: selected ? '0 0 0 2px #c53030' : '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#e53e3e' }}
      />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Server size={20} color="white" />
        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
          {data.label}
        </div>
        {data.status && (
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: statusColors[data.status],
              marginLeft: 'auto'
            }}
          />
        )}
      </div>
      
      {data.port && (
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
          Port: {data.port} ({data.protocol || 'http'})
        </div>
      )}
      
      {data.endpoints && data.endpoints.length > 0 && (
        <div style={{ marginTop: '8px', fontSize: '11px' }}>
          <div style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '4px' }}>
            Endpoints:
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)' }}>
            {data.endpoints.slice(0, 2).map((endpoint, idx) => (
              <div key={idx}>{endpoint}</div>
            ))}
            {data.endpoints.length > 2 && `+${data.endpoints.length - 2} more`}
          </div>
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#e53e3e' }}
      />
    </div>
  );
};

export default memo(ServiceNode);