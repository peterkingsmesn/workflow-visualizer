import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, RefreshCw, Database, Globe, Bell, Shield, Palette } from 'lucide-react';
import './Settings.css';

interface SettingsData {
  general: {
    autoSave: boolean;
    autoAnalyze: boolean;
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  editor: {
    nodeSnap: boolean;
    showMinimap: boolean;
    connectionType: 'smooth' | 'straight' | 'step';
    gridSize: number;
  };
  analysis: {
    maxDepth: number;
    excludePatterns: string[];
    includeHidden: boolean;
    circularDependencyCheck: boolean;
  };
  api: {
    baseUrl: string;
    timeout: number;
    retryCount: number;
  };
  notifications: {
    errorAlerts: boolean;
    analysisComplete: boolean;
    autoSaveNotification: boolean;
  };
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState<SettingsData>({
    general: {
      autoSave: true,
      autoAnalyze: false,
      theme: 'system',
      language: 'ko'
    },
    editor: {
      nodeSnap: true,
      showMinimap: true,
      connectionType: 'smooth',
      gridSize: 20
    },
    analysis: {
      maxDepth: 10,
      excludePatterns: ['node_modules', '.git', 'dist', 'build'],
      includeHidden: false,
      circularDependencyCheck: true
    },
    api: {
      baseUrl: 'http://localhost:3001',
      timeout: 30000,
      retryCount: 3
    },
    notifications: {
      errorAlerts: true,
      analysisComplete: true,
      autoSaveNotification: false
    }
  });

  // 설정 로드
  useEffect(() => {
    const savedSettings = localStorage.getItem('workflow-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // 설정 변경 핸들러
  const updateSetting = (category: keyof SettingsData, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  // 설정 저장
  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('workflow-settings', JSON.stringify(settings));
      setHasChanges(false);
      // 성공 알림
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 설정 초기화
  const handleReset = () => {
    if (confirm('모든 설정을 초기값으로 되돌리시겠습니까?')) {
      // 초기값으로 리셋
      window.location.reload();
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="settings-section">
            <h3>일반 설정</h3>
            
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.general.autoSave}
                  onChange={(e) => updateSetting('general', 'autoSave', e.target.checked)}
                />
                자동 저장
              </label>
              <p className="setting-description">
                워크플로우 변경사항을 자동으로 저장합니다.
              </p>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.general.autoAnalyze}
                  onChange={(e) => updateSetting('general', 'autoAnalyze', e.target.checked)}
                />
                실시간 분석
              </label>
              <p className="setting-description">
                파일 변경 시 자동으로 분석을 실행합니다.
              </p>
            </div>

            <div className="setting-item">
              <label>테마</label>
              <select
                value={settings.general.theme}
                onChange={(e) => updateSetting('general', 'theme', e.target.value)}
              >
                <option value="light">라이트</option>
                <option value="dark">다크</option>
                <option value="system">시스템 설정</option>
              </select>
            </div>

            <div className="setting-item">
              <label>언어</label>
              <select
                value={settings.general.language}
                onChange={(e) => updateSetting('general', 'language', e.target.value)}
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
                <option value="zh">中文</option>
              </select>
            </div>
          </div>
        );

      case 'editor':
        return (
          <div className="settings-section">
            <h3>에디터 설정</h3>
            
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.editor.nodeSnap}
                  onChange={(e) => updateSetting('editor', 'nodeSnap', e.target.checked)}
                />
                노드 스냅
              </label>
              <p className="setting-description">
                노드를 그리드에 맞춰 정렬합니다.
              </p>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.editor.showMinimap}
                  onChange={(e) => updateSetting('editor', 'showMinimap', e.target.checked)}
                />
                미니맵 표시
              </label>
            </div>

            <div className="setting-item">
              <label>연결선 타입</label>
              <select
                value={settings.editor.connectionType}
                onChange={(e) => updateSetting('editor', 'connectionType', e.target.value)}
              >
                <option value="smooth">부드러운 곡선</option>
                <option value="straight">직선</option>
                <option value="step">계단식</option>
              </select>
            </div>

            <div className="setting-item">
              <label>그리드 크기</label>
              <input
                type="number"
                min="10"
                max="50"
                value={settings.editor.gridSize}
                onChange={(e) => updateSetting('editor', 'gridSize', parseInt(e.target.value))}
              />
            </div>
          </div>
        );

      case 'analysis':
        return (
          <div className="settings-section">
            <h3>분석 설정</h3>
            
            <div className="setting-item">
              <label>최대 탐색 깊이</label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.analysis.maxDepth}
                onChange={(e) => updateSetting('analysis', 'maxDepth', parseInt(e.target.value))}
              />
              <p className="setting-description">
                폴더 구조 탐색 시 최대 깊이를 설정합니다.
              </p>
            </div>

            <div className="setting-item">
              <label>제외 패턴</label>
              <textarea
                value={settings.analysis.excludePatterns.join('\n')}
                onChange={(e) => updateSetting('analysis', 'excludePatterns', e.target.value.split('\n').filter(Boolean))}
                rows={4}
                placeholder="node_modules&#10;.git&#10;dist"
              />
              <p className="setting-description">
                분석에서 제외할 폴더나 파일 패턴을 입력하세요. (줄바꿈으로 구분)
              </p>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.analysis.includeHidden}
                  onChange={(e) => updateSetting('analysis', 'includeHidden', e.target.checked)}
                />
                숨김 파일 포함
              </label>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.analysis.circularDependencyCheck}
                  onChange={(e) => updateSetting('analysis', 'circularDependencyCheck', e.target.checked)}
                />
                순환 의존성 검사
              </label>
            </div>
          </div>
        );

      case 'api':
        return (
          <div className="settings-section">
            <h3>API 설정</h3>
            
            <div className="setting-item">
              <label>기본 URL</label>
              <input
                type="text"
                value={settings.api.baseUrl}
                onChange={(e) => updateSetting('api', 'baseUrl', e.target.value)}
                placeholder="http://localhost:3001"
              />
            </div>

            <div className="setting-item">
              <label>타임아웃 (ms)</label>
              <input
                type="number"
                min="5000"
                max="60000"
                value={settings.api.timeout}
                onChange={(e) => updateSetting('api', 'timeout', parseInt(e.target.value))}
              />
            </div>

            <div className="setting-item">
              <label>재시도 횟수</label>
              <input
                type="number"
                min="0"
                max="5"
                value={settings.api.retryCount}
                onChange={(e) => updateSetting('api', 'retryCount', parseInt(e.target.value))}
              />
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="settings-section">
            <h3>알림 설정</h3>
            
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.notifications.errorAlerts}
                  onChange={(e) => updateSetting('notifications', 'errorAlerts', e.target.checked)}
                />
                오류 알림
              </label>
              <p className="setting-description">
                오류 발생 시 알림을 표시합니다.
              </p>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.notifications.analysisComplete}
                  onChange={(e) => updateSetting('notifications', 'analysisComplete', e.target.checked)}
                />
                분석 완료 알림
              </label>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.notifications.autoSaveNotification}
                  onChange={(e) => updateSetting('notifications', 'autoSaveNotification', e.target.checked)}
                />
                자동 저장 알림
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="settings-container">
      <header className="settings-header">
        <div className="header-left">
          <button 
            className="back-button"
            onClick={() => navigate('/dashboard')}
          >
            ← 대시보드
          </button>
          <h1>설정</h1>
        </div>
        
        <div className="header-actions">
          {hasChanges && (
            <span className="unsaved-indicator">저장되지 않은 변경사항</span>
          )}
          <button 
            className="action-button"
            onClick={handleReset}
          >
            <RefreshCw size={16} />
            초기화
          </button>
          <button 
            className="action-button primary"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            <Save size={16} />
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </header>

      <div className="settings-main">
        <nav className="settings-nav">
          <button
            className={`nav-item ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <Globe size={20} />
            일반
          </button>
          <button
            className={`nav-item ${activeTab === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveTab('editor')}
          >
            <Palette size={20} />
            에디터
          </button>
          <button
            className={`nav-item ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
          >
            <Database size={20} />
            분석
          </button>
          <button
            className={`nav-item ${activeTab === 'api' ? 'active' : ''}`}
            onClick={() => setActiveTab('api')}
          >
            <Shield size={20} />
            API
          </button>
          <button
            className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={20} />
            알림
          </button>
        </nav>

        <main className="settings-content">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
};

export default Settings;