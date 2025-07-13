import React from 'react';
import { Save, Download, Upload, Settings } from 'lucide-react';
import { AnalysisButtons } from './AnalysisButtons';
import { NodeAddDropdown } from './NodeAddDropdown';

interface EditorHeaderProps {
  isAnalyzing: boolean;
  isSaving: boolean;
  showSettings: boolean;
  onNavigateBack: () => void;
  onAnalyzeWorkflow: () => void;
  onAnalyzeAPIs: () => void;
  onAnalyzeTranslations: () => void;
  onAddNode: (type: string) => void;
  onSave: () => void;
  onExport: () => void;
  onImport: () => void;
  onToggleSettings: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  isAnalyzing,
  isSaving,
  showSettings,
  onNavigateBack,
  onAnalyzeWorkflow,
  onAnalyzeAPIs,
  onAnalyzeTranslations,
  onAddNode,
  onSave,
  onExport,
  onImport,
  onToggleSettings
}) => {
  const styles = {
    header: {
      height: '60px',
      background: 'rgba(10, 10, 10, 0.8)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      position: 'relative' as const,
      zIndex: 10
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 700,
      background: 'linear-gradient(45deg, #00d4ff, #ff6b9d)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      margin: 0
    },
    backButton: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'rgba(255, 255, 255, 0.9)'
    },
    backButtonHover: {
      background: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 15px rgba(255, 255, 255, 0.1)'
    },
    headerActions: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center'
    },
    saveButton: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      background: 'linear-gradient(45deg, #10b981, #059669)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    exportButton: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      background: 'linear-gradient(45deg, #3b82f6, #2563eb)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    settingsButton: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      background: 'rgba(255, 255, 255, 0.1)',
      color: 'rgba(255, 255, 255, 0.9)',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    buttonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  };

  return (
    <header style={styles.header}>
      <div style={styles.headerLeft}>
        <button 
          style={styles.backButton}
          onClick={onNavigateBack}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.backButtonHover)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.backButton)}
        >
          {'←'} 대시보드
        </button>
        <h1 style={styles.title}>워크플로우 에디터</h1>
      </div>
      
      <div style={styles.headerActions}>
        <AnalysisButtons
          isAnalyzing={isAnalyzing}
          onAnalyzeWorkflow={onAnalyzeWorkflow}
          onAnalyzeAPIs={onAnalyzeAPIs}
          onAnalyzeTranslations={onAnalyzeTranslations}
        />
        
        <NodeAddDropdown onAddNode={onAddNode} />

        <button 
          style={{...styles.saveButton, ...(isSaving ? styles.buttonDisabled : {})}}
          onClick={onSave}
          disabled={isSaving}
          onMouseEnter={(e) => !isSaving && Object.assign(e.currentTarget.style, {...styles.saveButton, transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'})}
          onMouseLeave={(e) => !isSaving && Object.assign(e.currentTarget.style, styles.saveButton)}
        >
          <Save size={16} />
          {isSaving ? '저장 중...' : '저장'}
        </button>
        
        <button 
          style={styles.exportButton}
          onClick={onExport}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, {...styles.exportButton, transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)'})}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.exportButton)}
        >
          <Download size={16} />
          내보내기
        </button>
        
        <button 
          style={styles.exportButton}
          onClick={onImport}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, {...styles.exportButton, transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)'})}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.exportButton)}
        >
          <Upload size={16} />
          가져오기
        </button>
        
        <button 
          style={styles.settingsButton}
          onClick={onToggleSettings}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, {...styles.settingsButton, background: 'rgba(255, 255, 255, 0.2)', transform: 'translateY(-2px)'})}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.settingsButton)}
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
};