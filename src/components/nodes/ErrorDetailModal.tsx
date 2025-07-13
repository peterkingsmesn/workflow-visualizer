import React, { memo } from 'react';
import { X, AlertCircle, AlertTriangle, FileText, FolderOpen } from 'lucide-react';
import './ErrorDetailModal.css';

interface ErrorDetail {
  fileName: string;
  filePath: string;
  errors: any[];
  warnings: any[];
  info?: string;
}

interface ErrorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  detail: ErrorDetail | null;
}

// React.memo로 최적화 - props가 변경되지 않으면 리렌더링 방지
export const ErrorDetailModal = memo<ErrorDetailModalProps>(({ isOpen, onClose, detail }) => {
  if (!isOpen || !detail) return null;

  const totalIssues = detail.errors.length + detail.warnings.length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <FileText size={24} />
            <h2>{detail.fileName}</h2>
          </div>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="file-path">
            <FolderOpen size={16} />
            <span>{detail.filePath}</span>
          </div>

          {totalIssues === 0 ? (
            <div className="no-issues">
              <div className="success-icon">✅</div>
              <h3>이 파일에는 문제가 없습니다</h3>
              {detail.info && <p className="file-info">{detail.info}</p>}
            </div>
          ) : (
            <>
              {detail.errors.length > 0 && (
                <div className="issue-section">
                  <div className="section-header error">
                    <AlertCircle size={20} />
                    <h3>오류 ({detail.errors.length})</h3>
                  </div>
                  <div className="issue-list">
                    {detail.errors.map((error, index) => (
                      <div key={`error-${index}`} className="issue-item error">
                        <div className="issue-icon">
                          <AlertCircle size={16} />
                        </div>
                        <div className="issue-content">
                          <div className="issue-header">
                            <span className="issue-type">오류 #{index + 1}</span>
                            {error.line && <span className="issue-line">라인 {error.line}</span>}
                            {error.column && <span className="issue-column">열 {error.column}</span>}
                          </div>
                          <p className="issue-message">
                            {typeof error === 'string' ? error : error.message || error.text || '알 수 없는 오류'}
                          </p>
                          {error.code && (
                            <div className="issue-code">
                              <strong>오류 코드:</strong> {error.code}
                            </div>
                          )}
                          {error.context && (
                            <div className="issue-context">
                              <strong>컨텍스트:</strong> <code>{error.context}</code>
                            </div>
                          )}
                          {error.file && error.file !== detail.filePath && (
                            <div className="issue-file">
                              <strong>관련 파일:</strong> {error.file}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detail.warnings.length > 0 && (
                <div className="issue-section">
                  <div className="section-header warning">
                    <AlertTriangle size={20} />
                    <h3>경고 ({detail.warnings.length})</h3>
                  </div>
                  <div className="issue-list">
                    {detail.warnings.map((warning, index) => (
                      <div key={`warning-${index}`} className="issue-item warning">
                        <div className="issue-icon">
                          <AlertTriangle size={16} />
                        </div>
                        <div className="issue-content">
                          <div className="issue-header">
                            <span className="issue-type">경고 #{index + 1}</span>
                            {warning.line && <span className="issue-line">라인 {warning.line}</span>}
                            {warning.column && <span className="issue-column">열 {warning.column}</span>}
                          </div>
                          <p className="issue-message">
                            {typeof warning === 'string' ? warning : warning.message || warning.text || '알 수 없는 경고'}
                          </p>
                          {warning.code && (
                            <div className="issue-code">
                              <strong>경고 코드:</strong> {warning.code}
                            </div>
                          )}
                          {warning.context && (
                            <div className="issue-context">
                              <strong>컨텍스트:</strong> <code>{warning.context}</code>
                            </div>
                          )}
                          {warning.file && warning.file !== detail.filePath && (
                            <div className="issue-file">
                              <strong>관련 파일:</strong> {warning.file}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="action-button" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
});

ErrorDetailModal.displayName = 'ErrorDetailModal';