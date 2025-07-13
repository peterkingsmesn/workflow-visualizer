import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Share2 } from 'lucide-react';

interface GraphQLNodeData {
  label: string;
  type: string;
  endpoint?: string;
  queries?: string[];
  mutations?: string[];
  subscriptions?: string[];
  schema?: string;
}

const GraphQLNode: React.FC<NodeProps<GraphQLNodeData>> = ({ data, selected }) => {
  const totalOperations = 
    (data.queries?.length || 0) + 
    (data.mutations?.length || 0) + 
    (data.subscriptions?.length || 0);

  return (
    <div 
      className={`graphql-node node-container ${selected ? 'selected' : ''}`}
      style={{
        background: 'linear-gradient(135deg, #e10098 0%, #ff006e 100%)',
        border: '2px solid #e10098',
        borderRadius: '8px',
        padding: '10px',
        minWidth: '200px',
        boxShadow: selected ? '0 0 0 2px #c10080' : '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#e10098' }}
      />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Share2 size={20} color="white" />
        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
          {data.label}
        </div>
      </div>
      
      {data.endpoint && (
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>
          {data.endpoint}
        </div>
      )}
      
      <div style={{ fontSize: '11px', marginTop: '8px' }}>
        {data.queries && data.queries.length > 0 && (
          <div style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '2px' }}>
            <span style={{ color: '#fbbf24' }}>Q</span> {data.queries.length} queries
          </div>
        )}
        {data.mutations && data.mutations.length > 0 && (
          <div style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '2px' }}>
            <span style={{ color: '#34d399' }}>M</span> {data.mutations.length} mutations
          </div>
        )}
        {data.subscriptions && data.subscriptions.length > 0 && (
          <div style={{ color: 'rgba(255,255,255,0.9)' }}>
            <span style={{ color: '#60a5fa' }}>S</span> {data.subscriptions.length} subscriptions
          </div>
        )}
      </div>
      
      {totalOperations === 0 && (
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
          No operations defined
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#e10098' }}
      />
    </div>
  );
};

export default memo(GraphQLNode);