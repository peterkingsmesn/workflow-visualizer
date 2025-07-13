import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Package } from 'lucide-react';

interface ComponentNodeData {
  label: string;
  type: string;
  framework?: 'react' | 'vue' | 'angular' | 'svelte';
  props?: string[];
  state?: string[];
  hooks?: string[];
}

const ComponentNode: React.FC<NodeProps<ComponentNodeData>> = ({ data, selected }) => {
  const frameworkColors = {
    react: '#61dafb',
    vue: '#4fc08d',
    angular: '#dd0031',
    svelte: '#ff3e00'
  };

  return (
    <div 
      className={`component-node node-container ${selected ? 'selected' : ''}`}
      style={{
        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        border: `2px solid ${frameworkColors[data.framework || 'react'] || '#38b2ac'}`,
        borderRadius: '8px',
        padding: '10px',
        minWidth: '180px',
        boxShadow: selected ? '0 0 0 2px #2d3748' : '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: frameworkColors[data.framework || 'react'] || '#38b2ac' }}
      />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Package size={20} color="white" />
        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
          {data.label}
        </div>
      </div>
      
      {data.framework && (
        <div style={{ 
          fontSize: '10px', 
          color: 'white',
          backgroundColor: frameworkColors[data.framework],
          padding: '2px 6px',
          borderRadius: '4px',
          display: 'inline-block',
          marginBottom: '4px'
        }}>
          {data.framework.toUpperCase()}
        </div>
      )}
      
      {data.props && data.props.length > 0 && (
        <div style={{ marginTop: '8px', fontSize: '11px' }}>
          <div style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '2px' }}>
            Props: {data.props.join(', ')}
          </div>
        </div>
      )}
      
      {data.hooks && data.hooks.length > 0 && (
        <div style={{ fontSize: '11px', marginTop: '4px' }}>
          <div style={{ color: 'rgba(255,255,255,0.9)' }}>
            Hooks: {data.hooks.join(', ')}
          </div>
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: frameworkColors[data.framework || 'react'] || '#38b2ac' }}
      />
    </div>
  );
};

export default memo(ComponentNode);