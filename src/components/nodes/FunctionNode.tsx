import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Code } from 'lucide-react';

interface FunctionNodeData {
  label: string;
  type: string;
  params?: string[];
  returns?: string;
  async?: boolean;
  complexity?: 'low' | 'medium' | 'high';
}

const FunctionNode: React.FC<NodeProps<FunctionNodeData>> = ({ data, selected }) => {
  const complexityColors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444'
  };

  return (
    <div 
      className={`function-node node-container ${selected ? 'selected' : ''}`}
      style={{
        background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
        border: '2px solid #3b82f6',
        borderRadius: '8px',
        padding: '10px',
        minWidth: '180px',
        boxShadow: selected ? '0 0 0 2px #2563eb' : '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#3b82f6' }}
      />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Code size={20} color="white" />
        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
          {data.async && <span style={{ fontSize: '10px', marginRight: '4px' }}>async</span>}
          {data.label}
        </div>
      </div>
      
      {data.params && data.params.length > 0 && (
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', marginBottom: '4px' }}>
          ({data.params.join(', ')})
        </div>
      )}
      
      {data.returns && (
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
          → {data.returns}
        </div>
      )}
      
      {data.complexity && (
        <div style={{ 
          marginTop: '8px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px',
          fontSize: '10px'
        }}>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>Complexity:</span>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: complexityColors[data.complexity]
          }} />
          <span style={{ color: 'rgba(255,255,255,0.9)' }}>{data.complexity}</span>
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#3b82f6' }}
      />
    </div>
  );
};

export default memo(FunctionNode);