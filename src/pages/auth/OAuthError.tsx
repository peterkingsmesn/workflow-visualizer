import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home, User } from 'lucide-react';

const OAuthError: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(45deg, #0f0f23, #1a1a2e, #16213e)',
      backgroundSize: '200% 200%',
      animation: 'gradientAnimation 10s ease infinite',
      padding: '20px'
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

      <div style={{
        maxWidth: '600px',
        width: '100%',
        background: 'rgba(26, 26, 46, 0.8)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '40px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 60px rgba(255, 71, 87, 0.3)',
        textAlign: 'center'
      }}>
        <AlertCircle size={80} style={{ color: '#ff4757', marginBottom: '20px' }} />
        
        <h1 style={{
          fontSize: '32px',
          fontWeight: 800,
          color: '#ff4757',
          marginBottom: '16px'
        }}>
          OAuth 설정이 필요합니다
        </h1>
        
        <p style={{
          fontSize: '18px',
          color: 'rgba(255, 255, 255, 0.8)',
          marginBottom: '20px',
          lineHeight: '1.6'
        }}>
          OAuth 로그인이 설정되지 않았습니다. 아래 데모 계정을 이용해 테스트하세요.
        </p>

        {/* 데모 계정 정보 */}
        <div style={{
          background: 'rgba(0, 212, 255, 0.1)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ 
            color: '#00d4ff', 
            marginBottom: '15px', 
            fontSize: '18px',
            fontWeight: 600
          }}>
            🔑 데모 계정 (이메일 로그인)
          </h3>
          <div style={{
            display: 'grid',
            gap: '10px',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.2)',
              padding: '10px 15px',
              borderRadius: '6px'
            }}>
              <span>👤 관리자:</span>
              <code style={{ color: '#00d4ff' }}>admin@workflow-visualizer.com</code>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.2)',
              padding: '10px 15px',
              borderRadius: '6px'
            }}>
              <span>🔑 비밀번호:</span>
              <code style={{ color: '#00d4ff' }}>admin123!@#</code>
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 71, 87, 0.1)',
          border: '1px solid rgba(255, 71, 87, 0.3)',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '30px',
          textAlign: 'left'
        }}>
          <h3 style={{ color: '#ff4757', marginBottom: '15px', fontSize: '16px' }}>
            개발자를 위한 설정 가이드:
          </h3>
          <ol style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px',
            lineHeight: '1.6',
            paddingLeft: '20px'
          }}>
            <li>Google Cloud Console에서 OAuth 2.0 클라이언트 ID 생성</li>
            <li>승인된 리디렉션 URI: <code style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              padding: '2px 6px', 
              borderRadius: '4px' 
            }}>http://localhost:3001/api/oauth/google/callback</code></li>
            <li>.env 파일에 GOOGLE_CLIENT_ID와 GOOGLE_CLIENT_SECRET 추가</li>
            <li>서버 재시작</li>
          </ol>
        </div>

        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
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
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            <Home size={16} />
            홈으로 돌아가기
          </Link>

          <Link
            to="/auth/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
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
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 212, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 212, 255, 0.3)';
            }}
          >
            <User size={16} />
            이메일로 로그인
          </Link>

          {process.env.NODE_ENV === 'development' && (
            <Link
              to="/auth/dev-login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: 'linear-gradient(45deg, #ff6b9d, #ee5a24)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: '0 4px 15px rgba(255, 107, 157, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 157, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 107, 157, 0.3)';
              }}
            >
              🚀 관리자로 빠른 로그인
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default OAuthError;