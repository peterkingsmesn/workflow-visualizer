import React, { useState, useCallback } from 'react';
import './ProjectDiagnose.css';

interface DiagnoseResult {
  success: boolean;
  reportPath?: string;
  reportContent?: string;
  output?: string;
  error?: string;
  stderr?: string;
}

interface DiagnoseStatus {
  exists: boolean;
  lastModified?: string;
  size?: number;
  path?: string;
}

const ProjectDiagnose: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<DiagnoseResult | null>(null);
  const [status, setStatus] = useState<DiagnoseStatus | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // 진단 상태 확인
  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/diagnose/status');
      const data = await response.json();
      
      if (data.success) {
        setStatus(data);
      }
    } catch (error) {
      console.error('상태 확인 실패:', error);
    }
  }, []);

  // 진단 실행
  const runDiagnose = useCallback(async () => {
    setIsRunning(true);
    setResult(null);
    setLogs([]);
    
    try {
      const response = await fetch('/api/diagnose/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          options: {
            includeContent: false // 큰 파일 내용은 포함하지 않음
          }
        })
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        setLogs(prev => [...prev, '✅ 진단이 성공적으로 완료되었습니다.']);
        await checkStatus(); // 상태 업데이트
      } else {
        setLogs(prev => [...prev, `❌ 진단 실패: ${data.error}`]);
      }
      
      // 출력 로그 추가
      if (data.output) {
        const outputLines = data.output.split('\n').filter((line: string) => line.trim());
        setLogs(prev => [...prev, ...outputLines]);
      }
      
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      });
      setLogs(prev => [...prev, `❌ 요청 실패: ${error}`]);
    } finally {
      setIsRunning(false);
    }
  }, [checkStatus]);

  // 보고서 열기
  const openReport = useCallback(() => {
    if (status && status.exists && status.path) {
      // 새 창에서 보고서 열기
      const reportUrl = `/api/diagnose/report?path=${encodeURIComponent(status.path)}`;
      window.open(reportUrl, '_blank');
    }
  }, [status]);

  // 컴포넌트 마운트 시 상태 확인
  React.useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return (
    <div className="project-diagnose">
      <div className="diagnose-header">
        <h2>🔍 프로젝트 진단</h2>
        <p>프로젝트의 워크플로우 일치성을 검사하고 상세한 분석 보고서를 생성합니다.</p>
      </div>

      <div className="diagnose-controls">
        <button 
          className={`diagnose-btn ${isRunning ? 'running' : ''}`}
          onClick={runDiagnose}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <span className="spinner"></span>
              진단 실행 중...
            </>
          ) : (
            <>
              <span className="icon">🔍</span>
              진단 시작
            </>
          )}
        </button>

        <button 
          className="status-btn"
          onClick={checkStatus}
          disabled={isRunning}
        >
          <span className="icon">📊</span>
          상태 새로고침
        </button>
      </div>

      {status && (
        <div className="diagnose-status">
          <h3>📋 현재 상태</h3>
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">보고서 존재:</span>
              <span className={`status-value ${status.exists ? 'success' : 'error'}`}>
                {status.exists ? '✅ 있음' : '❌ 없음'}
              </span>
            </div>
            
            {status.exists && (
              <>
                <div className="status-item">
                  <span className="status-label">최종 수정:</span>
                  <span className="status-value">
                    {status.lastModified ? new Date(status.lastModified).toLocaleString() : 'N/A'}
                  </span>
                </div>
                
                <div className="status-item">
                  <span className="status-label">파일 크기:</span>
                  <span className="status-value">
                    {status.size ? `${(status.size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                  </span>
                </div>
              </>
            )}
          </div>
          
          {status.exists && (
            <button 
              className="open-report-btn"
              onClick={openReport}
              disabled={isRunning}
            >
              <span className="icon">📑</span>
              보고서 열기
            </button>
          )}
        </div>
      )}

      {result && (
        <div className="diagnose-result">
          <h3>📊 진단 결과</h3>
          <div className={`result-summary ${result.success ? 'success' : 'error'}`}>
            {result.success ? (
              <>
                <span className="icon">✅</span>
                <div>
                  <strong>진단 완료</strong>
                  <p>HTML 보고서가 생성되었습니다.</p>
                </div>
              </>
            ) : (
              <>
                <span className="icon">❌</span>
                <div>
                  <strong>진단 실패</strong>
                  <p>{result.error}</p>
                </div>
              </>
            )}
          </div>

          {result.success && result.reportPath && (
            <div className="report-info">
              <h4>📄 생성된 보고서</h4>
              <p className="report-path">{result.reportPath}</p>
              <button 
                className="open-report-btn"
                onClick={openReport}
              >
                <span className="icon">🌐</span>
                브라우저에서 열기
              </button>
            </div>
          )}
        </div>
      )}

      {logs.length > 0 && (
        <div className="diagnose-logs">
          <h3>📝 실행 로그</h3>
          <div className="logs-container">
            {logs.map((log, index) => (
              <div key={index} className="log-line">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="diagnose-features">
        <h3>🎯 진단 기능</h3>
        <div className="features-grid">
          <div className="feature-card">
            <h4>🔄 워크플로우 일치성</h4>
            <p>프로젝트 설정과 실제 파일 구조 비교</p>
          </div>
          
          <div className="feature-card">
            <h4>🌐 API 매칭</h4>
            <p>프론트엔드 API 호출과 백엔드 엔드포인트 매칭</p>
          </div>
          
          <div className="feature-card">
            <h4>📦 의존성 분석</h4>
            <p>package.json과 실제 import 사용 현황 비교</p>
          </div>
          
          <div className="feature-card">
            <h4>🔧 환경 설정</h4>
            <p>환경 변수 정의와 사용 현황 검사</p>
          </div>
          
          <div className="feature-card">
            <h4>📊 코드 분석</h4>
            <p>Python, JavaScript 코드 상세 분석</p>
          </div>
          
          <div className="feature-card">
            <h4>🎨 타입 정의</h4>
            <p>TypeScript 인터페이스 사용 현황</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDiagnose;