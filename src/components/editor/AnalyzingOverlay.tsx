import React from 'react';

interface AnalyzingOverlayProps {
  show: boolean;
}

export const AnalyzingOverlay: React.FC<AnalyzingOverlayProps> = ({ show }) => {
  if (!show) return null;

  const styles = {
    analyzingOverlay: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100
    },
    analyzingContent: {
      textAlign: 'center' as const,
      color: 'white'
    },
    spinner: {
      width: '50px',
      height: '50px',
      border: '3px solid rgba(0, 212, 255, 0.3)',
      borderTop: '3px solid #00d4ff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 20px'
    }
  };

  return (
    <div style={styles.analyzingOverlay}>
      <div style={styles.analyzingContent}>
        <div style={styles.spinner}></div>
        <h3 style={{fontSize: '24px', marginBottom: '10px'}}>프로젝트 분석 중...</h3>
        <p style={{fontSize: '16px', color: 'rgba(255, 255, 255, 0.8)'}}>파일 의존성을 분석하고 있습니다.</p>
      </div>
    </div>
  );
};