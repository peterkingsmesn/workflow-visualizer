import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Database } from 'lucide-react';

interface DatabaseNodeData {
  label: string;
  type: string;
  status?: 'active' | 'inactive' | 'error';
  tables?: string[];
  connection?: {
    host?: string;
    port?: number;
    database?: string;
  };
}

const DatabaseNode: React.FC<NodeProps<DatabaseNodeData>> = ({ data, selected }) => {
  return (
    <div 
      className={`database-node node-container ${selected ? 'selected' : ''} ${data.status || 'active'}`}
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: '2px solid #5a67d8',
        borderRadius: '8px',
        padding: '10px',
        minWidth: '180px',
        boxShadow: selected ? '0 0 0 2px #4c51bf' : '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#5a67d8' }}
      />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Database size={20} color="white" />
        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
          {data.label}
        </div>
      </div>
      
      {data.connection && (
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
          {data.connection.database || 'Database'}
          {data.connection.host && ` @ ${data.connection.host}`}
        </div>
      )}
      
      {data.tables && data.tables.length > 0 && (
        <div style={{ marginTop: '8px', fontSize: '11px' }}>
          <div style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '4px' }}>
            Tables ({data.tables.length}):
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)' }}>
            {data.tables.slice(0, 3).join(', ')}
            {data.tables.length > 3 && '...'}
          </div>
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#5a67d8' }}
      />
    </div>
  );
};

export default memo(DatabaseNode);