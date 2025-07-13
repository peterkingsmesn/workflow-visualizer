import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { AlertTriangle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import './ErrorNode.css';

interface ErrorNodeData {
  label: string;
  errors?: string[];
  warnings?: string[];
  status: 'error' | 'warning' | 'normal';
  file?: string;
  line?: number;
}

interface ErrorNodeProps {
  data: ErrorNodeData;
  selected?: boolean;
}

const ErrorNode: React.FC<ErrorNodeProps> = memo(({ data, selected }) => {
  const { label, errors = [], warnings = [], status, file, line } = data;
  const [expanded, setExpanded] = useState(false);

  const getIcon = () => {
    if (status === 'error') {
      return <AlertCircle className="error-icon" size={20} />;
    }
    return <AlertTriangle className="warning-icon" size={20} />;
  };

  const getStatusColor = () => {
    if (status === 'error') return '#ef4444';
    if (status === 'warning') return '#f59e0b';
    return '#6b7280';
  };

  const totalIssues = errors.length + warnings.length;

  return (
    <div 
      className={`error-node ${status} ${selected ? 'selected' : ''}`}
      style={{ borderColor: getStatusColor() }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="handle-input"
      />
      
      <div className="node-header" style={{ backgroundColor: getStatusColor() }}>
        <div className="header-content">
          {getIcon()}
          <span className="node-title">{label}</span>
          <span className="issue-count">{totalIssues}</span>
        </div>
        {totalIssues > 0 && (
          <button 
            className="expand-btn"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>
      
      {file && (
        <div className="file-info">
          <span className="file-name">{file}</span>
          {line && <span className="line-number">:{line}</span>}
        </div>
      )}
      
      {expanded && (
        <div className="issues-list">
          {errors.length > 0 && (
            <div className="issue-section">
              <h4 className="issue-type error">오류 ({errors.length})</h4>
              {errors.map((error, index) => (
                <div key={`error-${index}`} className="issue-item error">
                  <AlertCircle size={14} />
                  <span className="issue-text">{error}</span>
                </div>
              ))}
            </div>
          )}
          
          {warnings.length > 0 && (
            <div className="issue-section">
              <h4 className="issue-type warning">경고 ({warnings.length})</h4>
              {warnings.map((warning, index) => (
                <div key={`warning-${index}`} className="issue-item warning">
                  <AlertTriangle size={14} />
                  <span className="issue-text">{warning}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="node-footer">
        <div className="stats">
          {errors.length > 0 && (
            <span className="stat error">{errors.length} 오류</span>
          )}
          {warnings.length > 0 && (
            <span className="stat warning">{warnings.length} 경고</span>
          )}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="handle-output"
      />
    </div>
  );
});

ErrorNode.displayName = 'ErrorNode';

export default ErrorNode;