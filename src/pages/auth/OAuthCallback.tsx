import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const success = searchParams.get('success');
        const error = searchParams.get('error');
        const register = searchParams.get('register');

        // 디버깅을 위한 로그
        console.log('OAuth Callback - URL 파라미터:', {
          token: token ? 'present' : 'missing',
          success,
          error,
          register,
          fullUrl: window.location.href
        });

        if (error) {
          setStatus('error');
          setMessage(t('auth.errors.oauthFailed') || 'OAuth 인증 실패');
          setTimeout(() => {
            navigate('/auth/login');
          }, 3000);
          return;
        }

        if (success === 'true' && token) {
          // 토큰 저장
          localStorage.setItem('token', token);
          
          // 사용자 정보 가져오기
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const user = await response.json();
            localStorage.setItem('user', JSON.stringify(user));
            
            setStatus('success');
            
            // register 파라미터 체크
            const isRegistration = searchParams.get('register') === 'true';
            if (isRegistration) {
              setMessage('회원가입 성공! 환영합니다.');
            } else {
              setMessage(t('auth.success.loginSuccess') || '로그인 성공!');
            }
            
            // 이전 페이지로 돌아가기 또는 대시보드로 이동
            const returnUrl = sessionStorage.getItem('returnUrl') || '/dashboard';
            sessionStorage.removeItem('returnUrl');
            
            setTimeout(() => {
              navigate(returnUrl);
            }, 2000);
          } else {
            throw new Error('Failed to fetch user info');
          }
        } else {
          setStatus('error');
          setMessage(t('auth.errors.invalidCallback') || '잘못된 콜백 요청');
          setTimeout(() => {
            navigate('/auth/login');
          }, 3000);
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(t('auth.errors.networkError') || '네트워크 오류');
        setTimeout(() => {
          navigate('/auth/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, t]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(45deg, #0f0f23, #1a1a2e, #16213e)',
      backgroundSize: '200% 200%',
      animation: 'gradientAnimation 10s ease infinite',
      padding: '48px 16px'
    }}>
      <style>
        {`
          @keyframes gradientAnimation {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        background: 'rgba(26, 26, 46, 0.8)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '40px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 60px rgba(0, 212, 255, 0.3)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 800,
            background: 'linear-gradient(45deg, #00d4ff, #ff6b9d)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '32px'
          }}>
            {t('auth.callback.title') || '로그인 처리 중'}
          </h2>
          
          <div style={{ marginTop: '32px' }}>
            {status === 'loading' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  animation: 'spin 1s linear infinite',
                  width: '48px',
                  height: '48px',
                  border: '3px solid rgba(255, 255, 255, 0.3)',
                  borderTopColor: '#00d4ff',
                  borderRadius: '50%'
                }}></div>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{t('auth.callback.processing') || '인증 처리 중...'}</p>
              </div>
            )}
            
            {status === 'success' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg style={{ width: '24px', height: '24px', color: '#10b981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p style={{ color: '#10b981', fontWeight: 500 }}>{message || '로그인 성공!'}</p>
                <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>{t('auth.callback.redirecting') || '대시보드로 이동 중...'}</p>
              </div>
            )}
            
            {status === 'error' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'rgba(255, 71, 87, 0.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg style={{ width: '24px', height: '24px', color: '#ff4757' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
                <p style={{ color: '#ff4757', fontWeight: 500 }}>{message || '로그인 실패'}</p>
                <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>{t('auth.callback.redirectingToLogin') || '로그인 페이지로 이동 중...'}</p>
              </div>
            )}
          </div>
          
          <div style={{ marginTop: '32px' }}>
            <button
              onClick={() => navigate('/auth/login')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '8px 24px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.9)',
                background: 'rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              {t('auth.callback.backToLogin') || '로그인 페이지로 돌아가기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;