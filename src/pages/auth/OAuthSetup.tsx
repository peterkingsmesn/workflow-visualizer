import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, ExternalLink, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const OAuthSetup: React.FC = () => {
  const [copiedText, setCopiedText] = useState<string>('');
  const [oAuthStatus, setOAuthStatus] = useState<{
    google: boolean;
    github: boolean;
    checking: boolean;
  }>({
    google: false,
    github: false,
    checking: true
  });

  useEffect(() => {
    checkOAuthStatus();
  }, []);

  const checkOAuthStatus = async () => {
    try {
      const response = await fetch('/api/oauth/status');
      const data = await response.json();
      setOAuthStatus({
        google: data.google || false,
        github: data.github || false,
        checking: false
      });
    } catch (error) {
      console.error('OAuth 상태 확인 오류:', error);
      setOAuthStatus({
        google: false,
        github: false,
        checking: false
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const CopyButton = ({ text, label }: { text: string; label: string }) => (
    <button
      onClick={() => copyToClipboard(text, label)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        background: copiedText === label ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
        border: `1px solid ${copiedText === label ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.2)'}`,
        borderRadius: '6px',
        color: copiedText === label ? '#10b981' : 'rgba(255, 255, 255, 0.8)',
        fontSize: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
      }}
    >
      {copiedText === label ? <Check size={12} /> : <Copy size={12} />}
      {copiedText === label ? '복사됨!' : '복사'}
    </button>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(45deg, #0f0f23, #1a1a2e, #16213e)',
      backgroundSize: '200% 200%',
      animation: 'gradientAnimation 10s ease infinite',
      padding: '20px',
      color: 'white'
    }}>
      <style>
        {`
          @keyframes gradientAnimation {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'rgba(26, 26, 46, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '30px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 900,
            background: 'linear-gradient(45deg, #00d4ff, #ff6b9d)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '16px'
          }}>
            OAuth 설정 가이드
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '18px', marginBottom: '20px' }}>
            Google과 GitHub 로그인을 활성화하기 위한 단계별 가이드
          </p>
          
          {/* OAuth 상태 표시 */}
          <div style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: oAuthStatus.google ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${oAuthStatus.google ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              {oAuthStatus.checking ? (
                <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              ) : oAuthStatus.google ? (
                <CheckCircle size={16} color="#10b981" />
              ) : (
                <XCircle size={16} color="#ef4444" />
              )}
              <span style={{ color: oAuthStatus.google ? '#10b981' : '#ef4444' }}>
                Google OAuth {oAuthStatus.google ? '설정됨' : '미설정'}
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: oAuthStatus.github ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${oAuthStatus.github ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              {oAuthStatus.checking ? (
                <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              ) : oAuthStatus.github ? (
                <CheckCircle size={16} color="#10b981" />
              ) : (
                <XCircle size={16} color="#ef4444" />
              )}
              <span style={{ color: oAuthStatus.github ? '#10b981' : '#ef4444' }}>
                GitHub OAuth {oAuthStatus.github ? '설정됨' : '미설정'}
              </span>
            </div>
          </div>
          
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
          gap: '30px',
          marginBottom: '30px'
        }}>
          {/* Google OAuth 설정 */}
          <div style={{
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#4285F4',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google OAuth 설정
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <a
                href="https://console.cloud.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: 'rgba(66, 133, 244, 0.2)',
                  border: '1px solid rgba(66, 133, 244, 0.5)',
                  borderRadius: '8px',
                  color: '#4285F4',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(66, 133, 244, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(66, 133, 244, 0.2)';
                }}
              >
                <ExternalLink size={16} />
                Google Cloud Console 열기
              </a>
            </div>

            <ol style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '14px',
              lineHeight: '1.8',
              paddingLeft: '20px'
            }}>
              <li>새 프로젝트 생성: "workflow-visualizer"</li>
              <li>APIs & Services → OAuth consent screen</li>
              <li>User Type: "External" 선택</li>
              <li>App name: "Workflow Visualizer" 입력</li>
              <li>APIs & Services → Credentials</li>
              <li>CREATE CREDENTIALS → OAuth client ID</li>
              <li>Application type: "Web application"</li>
              <li>Authorized redirect URIs에 추가:</li>
            </ol>

            <div style={{
              background: 'rgba(66, 133, 244, 0.1)',
              border: '1px solid rgba(66, 133, 244, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginTop: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <code style={{ fontSize: '12px', color: '#4285F4' }}>
                http://localhost:3001/api/oauth/google/callback
              </code>
              <CopyButton text="http://localhost:3001/api/oauth/google/callback" label="google-callback" />
            </div>
          </div>

          {/* GitHub OAuth 설정 */}
          <div style={{
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              GitHub OAuth 설정
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <a
                href="https://github.com/settings/developers"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <ExternalLink size={16} />
                GitHub Developer Settings 열기
              </a>
            </div>

            <ol style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '14px',
              lineHeight: '1.8',
              paddingLeft: '20px'
            }}>
              <li>GitHub → Settings → Developer settings</li>
              <li>OAuth Apps → New OAuth App</li>
              <li>Application name: "Workflow Visualizer Local"</li>
              <li>Homepage URL: "http://localhost:3000"</li>
              <li>Authorization callback URL:</li>
            </ol>

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginTop: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <code style={{ fontSize: '12px', color: 'white' }}>
                http://localhost:3001/api/oauth/github/callback
              </code>
              <CopyButton text="http://localhost:3001/api/oauth/github/callback" label="github-callback" />
            </div>
          </div>
        </div>

        {/* 환경변수 설정 */}
        <div style={{
          background: 'rgba(26, 26, 46, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '30px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#ffeb3b',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertCircle size={24} />
            .env 파일 설정
          </h2>

          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            OAuth 앱을 생성한 후, 발급받은 Client ID와 Client Secret을 .env 파일에 추가하세요:
          </p>

          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            padding: '20px',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px'
            }}>
              <CopyButton 
                text={`GOOGLE_CLIENT_ID=your-actual-google-client-id
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret

GITHUB_CLIENT_ID=your-actual-github-client-id
GITHUB_CLIENT_SECRET=your-actual-github-client-secret`} 
                label="env-vars" 
              />
            </div>
            
            <pre style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '12px',
              lineHeight: '1.6',
              margin: 0,
              whiteSpace: 'pre-wrap'
            }}>{`# Google OAuth
GOOGLE_CLIENT_ID=your-actual-google-client-id
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret

# GitHub OAuth  
GITHUB_CLIENT_ID=your-actual-github-client-id
GITHUB_CLIENT_SECRET=your-actual-github-client-secret`}</pre>
          </div>

          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(255, 235, 59, 0.1)',
            border: '1px solid rgba(255, 235, 59, 0.3)',
            borderRadius: '8px'
          }}>
            <p style={{
              color: '#ffeb3b',
              fontSize: '14px',
              margin: 0,
              fontWeight: 500
            }}>
              ⚠️ 설정 후 개발 서버를 재시작하세요: <code>npm run dev</code>
            </p>
          </div>
        </div>

        {/* 네비게이션 버튼 */}
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link
            to="/"
            style={{
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              color: 'white',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.3s ease'
            }}
          >
            홈으로 돌아가기
          </Link>

          <Link
            to="/auth/login"
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(45deg, #00d4ff, #0099cc)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(0, 212, 255, 0.3)',
              transition: 'all 0.3s ease'
            }}
          >
            로그인 페이지로
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OAuthSetup;