import React from 'react';

interface SettingsModalProps {
  show: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ show, onClose }) => {
  if (!show) return null;

  const styles = {
    settingsOverlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    settingsPanel: {
      background: 'rgba(26, 26, 46, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '40px',
      maxWidth: '500px',
      width: '90%',
      border: '1px solid rgba(0, 212, 255, 0.3)',
      boxShadow: '0 20px 60px rgba(0, 212, 255, 0.3)'
    },
    settingsTitle: {
      fontSize: '28px',
      fontWeight: 700,
      color: 'white',
      marginBottom: '30px',
      background: 'linear-gradient(45deg, #00d4ff, #ff6b9d)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    },
    settingsContent: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '20px'
    },
    settingsLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: '16px',
      cursor: 'pointer'
    },
    closeButton: {
      marginTop: '30px',
      padding: '12px 24px',
      background: 'linear-gradient(45deg, #ff4757, #ff3838)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      width: '100%'
    }
  };

  return (
    <div style={styles.settingsOverlay} onClick={onClose}>
      <div style={styles.settingsPanel} onClick={e => e.stopPropagation()}>
        <h2 style={styles.settingsTitle}>에디터 설정</h2>
        <div style={styles.settingsContent}>
          <label style={styles.settingsLabel}>
            <input type="checkbox" style={{width: '20px', height: '20px'}} /> 자동 저장
          </label>
          <label style={styles.settingsLabel}>
            <input type="checkbox" style={{width: '20px', height: '20px'}} /> 실시간 분석
          </label>
          <label style={styles.settingsLabel}>
            <input type="checkbox" style={{width: '20px', height: '20px'}} /> 노드 스냅
          </label>
          <label style={styles.settingsLabel}>
            <input type="checkbox" style={{width: '20px', height: '20px'}} /> 미니맵 표시
          </label>
        </div>
        <button 
          style={styles.closeButton}
          onClick={onClose}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, {...styles.closeButton, transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(255, 71, 87, 0.4)'})}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.closeButton)}
        >
          닫기
        </button>
      </div>
    </div>
  );
};