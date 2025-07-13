import React, { memo, useMemo } from 'react';
import './AnalysisProgress.css';

// 🔒 보안: 분석 과정 상세 정보 노출 방지
// 사용자에게는 간단한 진행 상황과 오류 요약만 표시

// 🔒 보안: 민감한 분석 과정 정보 제거된 안전한 인터페이스
interface SecureAnalysisProgress {
  id: string;
  stage: 'scanning' | 'analyzing' | 'processing' | 'complete' | 'error';
  message: string; // "파일을 분석하는 중..." 정도만
  percentage: number; // 0-100
  startTime: number;
  endTime?: number;
  issuesFound?: number; // 구체적 내용 없이 개수만
}

interface SecureAnalysisProgressProps {
  tasks: SecureAnalysisProgress[];
  onCancel?: (taskId: string) => void;
  onClear?: () => void;
  className?: string;
  showCompleted?: boolean;
  maxVisible?: number;
}

export const SecureAnalysisProgress: React.FC<SecureAnalysisProgressProps> = memo(({
  tasks,
  onCancel,
  onClear,
  className = '',
  showCompleted = true,
  maxVisible = 3
}) => {
  // 🔒 보안: 상세 작업 정보 대신 요약만 표시
  const filteredTasks = useMemo(() => {
    let filtered = showCompleted 
      ? tasks 
      : tasks.filter(task => task.stage !== 'complete');
    
    // 최신 작업을 위에 표시
    filtered = filtered.sort((a, b) => b.startTime - a.startTime);
    
    // 표시할 최대 개수 제한
    if (maxVisible > 0) {
      filtered = filtered.slice(0, maxVisible);
    }
    
    return filtered;
  }, [tasks, showCompleted, maxVisible]);

  // 🔒 보안: 민감한 통계 대신 전체 상태만
  const overallStatus = useMemo(() => {
    const hasRunning = tasks.some(t => ['scanning', 'analyzing', 'processing'].includes(t.stage));
    const hasErrors = tasks.some(t => t.stage === 'error');
    const allComplete = tasks.length > 0 && tasks.every(t => t.stage === 'complete');
    
    if (hasErrors) return { status: 'error', message: '분석 중 오류가 발생했습니다.' };
    if (hasRunning) return { status: 'running', message: '프로젝트를 분석하는 중...' };
    if (allComplete) return { status: 'complete', message: '분석이 완료되었습니다.' };
    return { status: 'idle', message: '분석 준비 중...' };
  }, [tasks]);

  if (filteredTasks.length === 0 && tasks.length === 0) {
    return null;
  }

  return (
    <div className={`analysis-progress-container ${className}`}>
      {/* 🔒 전체 상태 표시 (세부사항 없음) */}
      <div className="overall-status">
        <div className={`status-indicator status-${overallStatus.status}`}>
          <div className="status-icon">
            {overallStatus.status === 'running' && (
              <div className="spinner"></div>
            )}
            {overallStatus.status === 'complete' && (
              <svg className="check-icon" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" />
              </svg>
            )}
            {overallStatus.status === 'error' && (
              <svg className="error-icon" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" />
              </svg>
            )}
          </div>
          <span className="status-message">{overallStatus.message}</span>
        </div>
        
        {/* 🔒 간단한 진행 상황만 표시 */}
        {overallStatus.status === 'running' && (
          <div className="progress-summary">
            {filteredTasks.map(task => (
              <div key={task.id} className="task-summary">
                <div className="task-stage">
                  {getStageDisplayName(task.stage)}
                </div>
                <div className="task-progress">
                  <div 
                    className="progress-bar"
                    style={{ width: `${task.percentage}%` }}
                  />
                  <span className="progress-text">{task.percentage}%</span>
                </div>
                {task.issuesFound !== undefined && (
                  <div className="issues-found">
                    {task.issuesFound}개 이슈 발견
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* 🔒 완료 시 요약 정보만 */}
        {overallStatus.status === 'complete' && (
          <div className="completion-summary">
            <div className="summary-stats">
              <span>분석 완료</span>
              {tasks.reduce((total, task) => total + (task.issuesFound || 0), 0) > 0 && (
                <span className="total-issues">
                  총 {tasks.reduce((total, task) => total + (task.issuesFound || 0), 0)}개 이슈 발견
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 🔒 필요시 취소/정리 버튼만 */}
      {(onCancel || onClear) && (
        <div className="progress-actions">
          {onCancel && overallStatus.status === 'running' && (
            <button
              onClick={() => filteredTasks.forEach(task => onCancel(task.id))}
              className="cancel-button"
            >
              취소
            </button>
          )}
          {onClear && overallStatus.status === 'complete' && (
            <button
              onClick={onClear}
              className="clear-button"
            >
              정리
            </button>
          )}
        </div>
      )}
    </div>
  );
});

// 🔒 보안: 단계명을 사용자 친화적이고 일반적인 용어로 변환
function getStageDisplayName(stage: SecureAnalysisProgress['stage']): string {
  const stageNames: Record<SecureAnalysisProgress['stage'], string> = {
    'scanning': '파일 스캔 중',
    'analyzing': '코드 분석 중',
    'processing': '결과 처리 중',
    'complete': '완료',
    'error': '오류',
  };
  
  return stageNames[stage] || '처리 중';
}

// 🔒 기존 상세 분석 진행 상황을 안전한 형식으로 변환
export function convertToSecureProgress(
  detailedProgress: any // 내부 상세 진행 상황
): SecureAnalysisProgress {
  // 🔒 보안: 상세 분석 과정 정보 제거, 단순한 단계와 진행률만
  const stage = mapToSecureStage(detailedProgress.status, detailedProgress.type);
  const percentage = calculateSafePercentage(detailedProgress);
  const message = generateSafeMessage(stage, percentage);
  
  return {
    id: detailedProgress.id || generateTaskId(),
    stage,
    message,
    percentage,
    startTime: detailedProgress.startTime || Date.now(),
    endTime: detailedProgress.endTime,
    issuesFound: detailedProgress.errors?.length || 0,
  };
}

// 🔒 보안: 내부 상태를 안전한 단계로 매핑
function mapToSecureStage(
  status: string, 
  type?: string
): SecureAnalysisProgress['stage'] {
  if (status === 'error' || status === 'failed') return 'error';
  if (status === 'completed' || status === 'done') return 'complete';
  
  // 🔒 보안: 구체적인 분석 타입 대신 일반적인 단계로
  if (type?.includes('scan') || status === 'scanning') return 'scanning';
  if (type?.includes('analyze') || status === 'analyzing') return 'analyzing';
  if (type?.includes('process') || status === 'processing') return 'processing';
  
  return 'analyzing'; // 기본값
}

// 🔒 보안: 안전한 진행률 계산 (구체적인 계산 로직 숨김)
function calculateSafePercentage(progress: any): number {
  if (progress.percentage !== undefined) {
    return Math.min(100, Math.max(0, progress.percentage));
  }
  
  // 🔒 보안: 내부 진행 상황 계산 로직 숨김
  if (progress.completed && progress.total) {
    return Math.round((progress.completed / progress.total) * 100);
  }
  
  // 기본 추정치
  if (progress.status === 'running') return 50;
  if (progress.status === 'completed') return 100;
  return 0;
}

// 🔒 보안: 일반적인 메시지만 생성 (구체적인 분석 내용 없음)
function generateSafeMessage(stage: SecureAnalysisProgress['stage'], percentage: number): string {
  const messages: Record<SecureAnalysisProgress['stage'], string> = {
    'scanning': '프로젝트 파일을 스캔하고 있습니다...',
    'analyzing': '코드를 분석하고 있습니다...',
    'processing': '분석 결과를 처리하고 있습니다...',
    'complete': '분석이 완료되었습니다.',
    'error': '분석 중 오류가 발생했습니다.',
  };
  
  return messages[stage];
}

function generateTaskId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

SecureAnalysisProgress.displayName = 'SecureAnalysisProgress';