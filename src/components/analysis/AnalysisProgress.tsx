import React, { memo, useMemo } from 'react';
import { AnalysisProgress as AnalysisProgressType } from '../../hooks/useAnalysisWorker';
import './AnalysisProgress.css';

// 🚀 성능 최적화: WebWorker 분석 진행 상황 표시 컴포넌트

interface AnalysisProgressProps {
  tasks: AnalysisProgressType[];
  onCancel?: (taskId: string) => void;
  onClear?: () => void;
  className?: string;
  showCompleted?: boolean;
  maxVisible?: number;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = memo(({
  tasks,
  onCancel,
  onClear,
  className = '',
  showCompleted = true,
  maxVisible = 5
}) => {
  // 🚀 성능 최적화: 필터링된 작업 목록 메모이제이션
  const filteredTasks = useMemo(() => {
    let filtered = showCompleted 
      ? tasks 
      : tasks.filter(task => task.status !== 'completed');
    
    // 최신 작업을 위에 표시
    filtered = filtered.sort((a, b) => b.startTime - a.startTime);
    
    // 표시할 최대 개수 제한
    if (maxVisible > 0) {
      filtered = filtered.slice(0, maxVisible);
    }
    
    return filtered;
  }, [tasks, showCompleted, maxVisible]);

  // 🚀 성능 최적화: 전체 통계 메모이제이션
  const statistics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const running = tasks.filter(t => t.status === 'running').length;
    const error = tasks.filter(t => t.status === 'error').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    
    const avgDuration = tasks
      .filter(t => t.endTime)
      .reduce((sum, t) => sum + (t.endTime! - t.startTime), 0) / Math.max(completed, 1);
    
    return {
      total,
      completed,
      running,
      error,
      pending,
      avgDuration
    };
  }, [tasks]);

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getTaskIcon = (type: string): string => {
    const iconMap: Record<string, string> = {
      'ANALYZE_DEPENDENCIES': '🔍',
      'CALCULATE_METRICS': '📊',
      'ANALYZE_FILE': '📄',
      'default': '⚙️'
    };
    return iconMap[type] || iconMap['default'];
  };

  const getStatusIcon = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending': '⏳',
      'running': '🔄',
      'completed': '✅',
      'error': '❌'
    };
    return statusMap[status] || '❓';
  };

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className={`analysis-progress ${className}`}>
      {/* 헤더 및 통계 */}
      <div className="progress-header">
        <div className="header-title">
          <h4>분석 진행 상황</h4>
          <div className="task-count">
            {statistics.running > 0 && (
              <span className="count running">{statistics.running} 실행중</span>
            )}
            {statistics.pending > 0 && (
              <span className="count pending">{statistics.pending} 대기중</span>
            )}
            <span className="count total">{statistics.total} 총작업</span>
          </div>
        </div>
        
        <div className="header-actions">
          {onClear && (
            <button 
              className="btn-clear" 
              onClick={onClear}
              title="완료된 작업 지우기"
            >
              지우기
            </button>
          )}
        </div>
      </div>

      {/* 전체 진행률 바 */}
      {statistics.total > 0 && (
        <div className="overall-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill completed"
              style={{ width: `${(statistics.completed / statistics.total) * 100}%` }}
            />
            <div 
              className="progress-fill error"
              style={{ 
                width: `${(statistics.error / statistics.total) * 100}%`,
                left: `${(statistics.completed / statistics.total) * 100}%`
              }}
            />
          </div>
          <div className="progress-text">
            {statistics.completed}/{statistics.total} 완료
            {statistics.error > 0 && ` (${statistics.error} 오류)`}
          </div>
        </div>
      )}

      {/* 개별 작업 목록 */}
      <div className="task-list">
        {filteredTasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            onCancel={onCancel}
            formatDuration={formatDuration}
            getTaskIcon={getTaskIcon}
            getStatusIcon={getStatusIcon}
          />
        ))}
      </div>

      {/* 통계 요약 */}
      {statistics.completed > 0 && (
        <div className="progress-stats">
          <div className="stat">
            <span className="stat-label">평균 실행시간:</span>
            <span className="stat-value">{formatDuration(statistics.avgDuration)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">성공률:</span>
            <span className="stat-value">
              {Math.round((statistics.completed / (statistics.completed + statistics.error)) * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

AnalysisProgress.displayName = 'AnalysisProgress';

// 🚀 성능 최적화: 개별 작업 아이템 컴포넌트 분리
interface TaskItemProps {
  task: AnalysisProgressType;
  onCancel?: (taskId: string) => void;
  formatDuration: (ms: number) => string;
  getTaskIcon: (type: string) => string;
  getStatusIcon: (status: string) => string;
}

const TaskItem: React.FC<TaskItemProps> = memo(({
  task,
  onCancel,
  formatDuration,
  getTaskIcon,
  getStatusIcon
}) => {
  const duration = task.endTime 
    ? task.endTime - task.startTime
    : Date.now() - task.startTime;

  const canCancel = task.status === 'running' || task.status === 'pending';

  return (
    <div className={`task-item ${task.status}`}>
      <div className="task-header">
        <div className="task-info">
          <span className="task-icon">{getTaskIcon(task.type)}</span>
          <span className="task-type">{getTaskTypeName(task.type)}</span>
          <span className="task-status-icon">{getStatusIcon(task.status)}</span>
        </div>
        
        <div className="task-actions">
          <span className="task-duration">{formatDuration(duration)}</span>
          {canCancel && onCancel && (
            <button 
              className="btn-cancel"
              onClick={() => onCancel(task.id)}
              title="작업 취소"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* 진행률 바 (실행 중인 작업에만 표시) */}
      {task.status === 'running' && (
        <div className="task-progress">
          <div className="progress-bar small">
            <div 
              className="progress-fill running"
              style={{ width: `${task.progress}%` }}
            />
          </div>
          <span className="progress-percentage">{Math.round(task.progress)}%</span>
        </div>
      )}

      {/* 에러 메시지 */}
      {task.status === 'error' && task.error && (
        <div className="task-error">
          <span className="error-text">{task.error}</span>
        </div>
      )}

      {/* 결과 요약 (완료된 작업에만 표시) */}
      {task.status === 'completed' && task.result && (
        <div className="task-result">
          <TaskResultSummary result={task.result} type={task.type} />
        </div>
      )}
    </div>
  );
});

TaskItem.displayName = 'TaskItem';

// 🚀 성능 최적화: 결과 요약 컴포넌트
interface TaskResultSummaryProps {
  result: any;
  type: string;
}

const TaskResultSummary: React.FC<TaskResultSummaryProps> = memo(({ result, type }) => {
  const summary = useMemo(() => {
    switch (type) {
      case 'ANALYZE_DEPENDENCIES':
        return {
          icon: '📊',
          text: `${result.dependencies?.length || 0}개 의존성, ${result.circularDependencies?.length || 0}개 순환참조`
        };
      
      case 'CALCULATE_METRICS':
        return {
          icon: '📈',
          text: `${result.nodeMetrics?.length || 0}개 노드, 복잡도: ${result.globalMetrics?.performance?.complexity?.toFixed(1) || 'N/A'}`
        };
      
      case 'ANALYZE_FILE':
        return {
          icon: '📄',
          text: `${result.dependencies?.length || 0}개 의존성 발견`
        };
      
      default:
        return {
          icon: '✅',
          text: '분석 완료'
        };
    }
  }, [result, type]);

  return (
    <div className="result-summary">
      <span className="result-icon">{summary.icon}</span>
      <span className="result-text">{summary.text}</span>
    </div>
  );
});

TaskResultSummary.displayName = 'TaskResultSummary';

// 헬퍼 함수
function getTaskTypeName(type: string): string {
  const typeNames: Record<string, string> = {
    'ANALYZE_DEPENDENCIES': '의존성 분석',
    'CALCULATE_METRICS': '메트릭 계산',
    'ANALYZE_FILE': '파일 분석'
  };
  return typeNames[type] || type;
}

export default AnalysisProgress;