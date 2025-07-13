import React from 'react';

interface AnalysisButtonsProps {
  isAnalyzing: boolean;
  onAnalyzeWorkflow: () => void;
  onAnalyzeAPIs: () => void;
  onAnalyzeTranslations: () => void;
}

export const AnalysisButtons: React.FC<AnalysisButtonsProps> = ({
  isAnalyzing,
  onAnalyzeWorkflow,
  onAnalyzeAPIs,
  onAnalyzeTranslations
}) => {
  const styles = {
    actionButton: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      background: 'linear-gradient(45deg, #00d4ff, #0099cc)',
      color: 'white',
      boxShadow: '0 4px 15px rgba(0, 212, 255, 0.3)'
    },
    actionButtonHover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(0, 212, 255, 0.4)'
    },
    buttonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  };

  return (
    <>
      <button 
        style={{...styles.actionButton, ...(isAnalyzing ? styles.buttonDisabled : {})}}
        onClick={onAnalyzeWorkflow}
        disabled={isAnalyzing}
        onMouseEnter={(e) => !isAnalyzing && Object.assign(e.currentTarget.style, {...styles.actionButton, ...styles.actionButtonHover})}
        onMouseLeave={(e) => !isAnalyzing && Object.assign(e.currentTarget.style, styles.actionButton)}
      >
        {isAnalyzing ? '분석 중...' : '파일 분석'}
      </button>
      
      <button 
        style={{...styles.actionButton, ...(isAnalyzing ? styles.buttonDisabled : {})}}
        onClick={onAnalyzeAPIs}
        disabled={isAnalyzing}
        onMouseEnter={(e) => !isAnalyzing && Object.assign(e.currentTarget.style, {...styles.actionButton, ...styles.actionButtonHover})}
        onMouseLeave={(e) => !isAnalyzing && Object.assign(e.currentTarget.style, styles.actionButton)}
      >
        {isAnalyzing ? '분석 중...' : 'API 분석'}
      </button>
      
      <button 
        style={{...styles.actionButton, ...(isAnalyzing ? styles.buttonDisabled : {})}}
        onClick={onAnalyzeTranslations}
        disabled={isAnalyzing}
        onMouseEnter={(e) => !isAnalyzing && Object.assign(e.currentTarget.style, {...styles.actionButton, ...styles.actionButtonHover})}
        onMouseLeave={(e) => !isAnalyzing && Object.assign(e.currentTarget.style, styles.actionButton)}
      >
        {isAnalyzing ? '분석 중...' : '번역 분석'}
      </button>
    </>
  );
};