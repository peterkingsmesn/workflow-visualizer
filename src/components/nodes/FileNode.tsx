import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FileCode } from 'lucide-react';

interface FileNodeData {
  label: string;
  type: string;
  path?: string;
  extension?: string;
  size?: number;
  imports?: string[];
  exports?: string[];
}

const FileNode: React.FC<NodeProps<FileNodeData>> = ({ data, selected }) => {
  const getFileColor = (extension: string) => {
    const colors: Record<string, string> = {
      js: '#f0db4f',
      ts: '#3178c6',
      jsx: '#61dafb',
      tsx: '#61dafb',
      py: '#3776ab',
      css: '#1572b6',
      html: '#e34c26',
      json: '#292929',
    };
    return colors[extension] || '#6b7280';
  };

  return (
    <div 
      className={`file-node node-container ${selected ? 'selected' : ''}`}
      style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        border: `2px solid ${data.extension ? getFileColor(data.extension) : '#64748b'}`,
        borderRadius: '8px',
        padding: '10px',
        minWidth: '180px',
        boxShadow: selected ? '0 0 0 2px #3b82f6' : '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#64748b' }}
      />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <FileCode size={20} color={data.extension ? getFileColor(data.extension) : '#94a3b8'} />
        <div style={{ color: '#e2e8f0', fontWeight: 'bold', fontSize: '14px' }}>
          {data.label}
        </div>
      </div>
      
      {data.path && (
        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
          {data.path}
        </div>
      )}
      
      {data.imports && data.imports.length > 0 && (
        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
          Imports: {data.imports.length}
        </div>
      )}
      
      {data.exports && data.exports.length > 0 && (
        <div style={{ fontSize: '10px', color: '#64748b' }}>
          Exports: {data.exports.length}
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#64748b' }}
      />
    </div>
  );
};

export default memo(FileNode);