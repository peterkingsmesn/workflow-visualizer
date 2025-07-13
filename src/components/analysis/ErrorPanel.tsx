import React from 'react';
import { WorkflowError } from '../../types/workflow.types';
import { useWorkflowStore } from '../../store/workflowStore';

interface ErrorPanelProps {
  errors: WorkflowError[];
}

const getErrorIcon = (type: string) => {
  const icons: Record<string, string> = {
    missing_import: '📦',
    circular_dependency: '🔄',
    type_mismatch: '⚡',
    api_mismatch: '🌐',
  };
  return icons[type] || '⚠️';
};

const getSeverityColor = (severity: string) => {
  return severity === 'error' ? '#EF4444' : '#F59E0B';
};

export const ErrorPanel: React.FC<ErrorPanelProps> = ({ errors }) => {
  const { selectNode } = useWorkflowStore();
  
  const handleErrorClick = (error: WorkflowError) => {
    if (error.node) {
      selectNode(error.node);
    }
  };

  const groupedErrors = errors.reduce((acc, error) => {
    if (!acc[error.type]) {
      acc[error.type] = [];
    }
    acc[error.type].push(error);
    return acc;
  }, {} as Record<string, WorkflowError[]>);

  if (errors.length === 0) {
    return (
      <div className="error-panel empty">
        <div className="empty-state">
          <span className="empty-icon">✅</span>
          <p>에러가 없습니다!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="error-panel">
      <div className="panel-header">
        <h3>문제점 분석</h3>
        <span className="error-count">{errors.length}</span>
      </div>

      <div className="error-list">
        {Object.entries(groupedErrors).map(([type, typeErrors]) => (
          <div key={type} className="error-group">
            <div className="group-header">
              <span className="error-icon">{getErrorIcon(type)}</span>
              <span className="error-type">{type.replace(/_/g, ' ')}</span>
              <span className="count">{typeErrors.length}</span>
            </div>
            
            <div className="group-errors">
              {typeErrors.map((error) => (
                <div 
                  key={error.id}
                  className="error-item"
                  onClick={() => handleErrorClick(error)}
                  style={{ borderLeftColor: getSeverityColor(error.severity) }}
                >
                  <div className="error-message">{error.message}</div>
                  {error.suggestion && (
                    <div className="error-suggestion">
                      💡 {error.suggestion}
                    </div>
                  )}
                  {error.node && (
                    <div className="error-location">
                      📍 {error.node}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="panel-footer">
        <button className="btn-fix-all">
          🔧 모든 에러 자동 수정
        </button>
      </div>
    </div>
  );
};