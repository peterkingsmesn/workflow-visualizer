import React, { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, { getLanguagePreference, changeLanguage } from '../../i18n';

interface I18nProviderProps {
  children: React.ReactNode;
  fallbackComponent?: React.ComponentType;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ 
  children, 
  fallbackComponent: FallbackComponent 
}) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeI18n = async () => {
      try {
        // 저장된 언어 설정 또는 브라우저 언어 사용
        const preferredLanguage = getLanguagePreference();
        
        // i18n 초기화 대기
        if (!i18n.isInitialized) {
          await i18n.init();
        }
        
        // 언어 설정
        await changeLanguage(preferredLanguage);
        
        setIsReady(true);
      } catch (err) {
        console.error('i18n 초기화 실패:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류');
        setIsReady(true); // 에러가 있어도 렌더링은 계속
      }
    };

    initializeI18n();
  }, []);

  // 🚀 i18n 준비 상태 확인
  if (!isReady) {
    if (FallbackComponent) {
      return <FallbackComponent />;
    }
    
    return (
      <div className="i18n-loading">
        <div className="loading-spinner"></div>
        <p>언어 설정을 로딩 중...</p>
      </div>
    );
  }

  // ❌ 에러 상태
  if (error) {
    console.warn('i18n 에러 발생, 기본 언어로 진행:', error);
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
};

// 🎯 간단한 로딩 컴포넌트
export const I18nLoadingFallback: React.FC = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: '16px'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <p style={{ color: '#6b7280', fontSize: '14px' }}>
      언어 설정을 로딩 중...
    </p>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default I18nProvider;