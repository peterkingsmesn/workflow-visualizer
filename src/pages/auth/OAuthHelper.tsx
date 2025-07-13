import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, ExternalLink, AlertCircle, Settings, Key } from 'lucide-react';

const OAuthHelper: React.FC = () => {
  const [copiedText, setCopiedText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'setup' | 'test'>('setup');

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

  const testOAuthConnection = async (provider: 'google' | 'github') => {
    const baseUrl = window.location.origin;
    const testUrl = `${baseUrl}/api/oauth/${provider}?test=true`;
    
    // 새 창에서 OAuth 테스트
    const popup = window.open(testUrl, `${provider}_oauth_test`, 'width=600,height=600');
    
    if (popup) {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          // 테스트 완료 후 상태 새로고침
          window.location.reload();
        }
      }, 1000);
    }
  };

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

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
            OAuth 설정 도우미
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '18px' }}>
            완전 자동화된 OAuth 설정 및 테스트 도구
          </p>
        </div>

        {/* 탭 네비게이션 */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => setActiveTab('setup')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'setup' ? 'linear-gradient(45deg, #00d4ff, #0099cc)' : 'rgba(255, 255, 255, 0.1)',
              border: `1px solid ${activeTab === 'setup' ? '#00d4ff' : 'rgba(255, 255, 255, 0.2)'}`,
              borderRadius: '10px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
          >
            <Settings size={16} />
            자동 설정
          </button>
          <button
            onClick={() => setActiveTab('test')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'test' ? 'linear-gradient(45deg, #00d4ff, #0099cc)' : 'rgba(255, 255, 255, 0.1)',
              border: `1px solid ${activeTab === 'test' ? '#00d4ff' : 'rgba(255, 255, 255, 0.2)'}`,
              borderRadius: '10px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
          >
            <Key size={16} />
            연결 테스트
          </button>
        </div>

        {activeTab === 'setup' && (
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
              color: '#00d4ff',
              marginBottom: '20px'
            }}>
              🚀 자동 OAuth 설정 (개발용)
            </h2>
            
            <div style={{
              background: 'rgba(0, 212, 255, 0.1)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              borderRadius: '10px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h3 style={{ color: '#00d4ff', marginBottom: '15px', fontSize: '18px' }}>
                ✅ 개발용 OAuth 설정 완료!
              </h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '15px' }}>
                테스트용 OAuth 자격증명이 이미 .env 파일에 설정되어 있습니다.
              </p>
              <div style={{
                display: 'grid',
                gap: '10px',
                fontSize: '13px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  borderRadius: '6px'
                }}>
                  <span style={{ color: '#10b981' }}>✓</span>
                  <span>Google OAuth 클라이언트 ID 설정됨</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  borderRadius: '6px'
                }}>
                  <span style={{ color: '#10b981' }}>✓</span>
                  <span>GitHub OAuth 앱 ID 설정됨</span>
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 235, 59, 0.1)',
              border: '1px solid rgba(255, 235, 59, 0.3)',
              borderRadius: '10px',
              padding: '20px'
            }}>
              <h3 style={{ color: '#ffeb3b', marginBottom: '15px', fontSize: '16px' }}>
                ⚠️ 실제 배포 시 주의사항
              </h3>
              <ul style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '14px',
                lineHeight: '1.6',
                paddingLeft: '20px'
              }}>
                <li>현재 설정된 자격증명은 개발용 테스트 값입니다</li>
                <li>실제 배포 시 Google Cloud Console과 GitHub에서 실제 OAuth 앱을 생성해야 합니다</li>
                <li>production 환경에서는 실제 자격증명으로 교체하세요</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'test' && (
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
              color: '#00d4ff',
              marginBottom: '20px'
            }}>
              🔧 OAuth 연결 테스트
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '20px'
            }}>
              <div style={{
                background: 'rgba(66, 133, 244, 0.1)',
                border: '1px solid rgba(66, 133, 244, 0.3)',
                borderRadius: '10px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <h3 style={{ color: '#4285F4', marginBottom: '15px' }}>Google OAuth</h3>
                <button
                  onClick={() => testOAuthConnection('google')}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(45deg, #4285F4, #34A853)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(66, 133, 244, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Google 로그인 테스트
                </button>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '10px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <h3 style={{ color: 'white', marginBottom: '15px' }}>GitHub OAuth</h3>
                <button
                  onClick={() => testOAuthConnection('github')}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(45deg, #333, #666)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  GitHub 로그인 테스트
                </button>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 71, 87, 0.1)',
              border: '1px solid rgba(255, 71, 87, 0.3)',
              borderRadius: '10px',
              padding: '20px'
            }}>
              <h3 style={{ color: '#ff4757', marginBottom: '15px', fontSize: '16px' }}>
                💡 테스트 안내
              </h3>
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '14px',
                lineHeight: '1.6',
                margin: 0
              }}>
                현재 설정된 자격증명은 개발용 테스트 값이므로 실제 OAuth 로그인은 작동하지 않습니다.
                실제 테스트를 위해서는 아래의 데모 계정을 사용하세요.
              </p>
            </div>
          </div>
        )}

        {/* 데모 계정 정보 */}
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
            marginBottom: '20px'
          }}>
            🔑 데모 계정 정보
          </h2>
          
          <div style={{
            background: 'rgba(0, 212, 255, 0.1)',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            borderRadius: '10px',
            padding: '20px'
          }}>
            <div style={{
              display: 'grid',
              gap: '15px',
              fontSize: '14px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.2)',
                padding: '12px 16px',
                borderRadius: '8px'
              }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>👤 관리자 계정:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <code style={{ color: '#00d4ff', fontSize: '13px' }}>admin@workflow-visualizer.com</code>
                  <CopyButton text="admin@workflow-visualizer.com" label="admin-email" />
                </div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.2)',
                padding: '12px 16px',
                borderRadius: '8px'
              }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>🔑 비밀번호:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <code style={{ color: '#00d4ff', fontSize: '13px' }}>admin123!@#</code>
                  <CopyButton text="admin123!@#" label="admin-password" />
                </div>
              </div>
            </div>
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

export default OAuthHelper;