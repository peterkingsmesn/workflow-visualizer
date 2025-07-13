import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Success: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(45deg, #0f0f23, #1a1a2e, #16213e)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(255,255,255,0.3)',
            borderTop: '3px solid #00d4ff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p>결제 확인 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(45deg, #0f0f23, #1a1a2e, #16213e)',
      padding: '20px',
      color: 'white'
    }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '40px',
          background: 'linear-gradient(45deg, #00d4ff, #ff6b9d)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          결제 완료
        </h1>
        
        <div style={{
          background: 'rgba(26, 26, 46, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '40px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px'
          }}>
            ✅
          </div>
          
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '16px'
          }}>
            결제가 성공적으로 완료되었습니다!
          </h2>
          
          <p style={{
            fontSize: '16px',
            opacity: 0.8,
            marginBottom: '30px'
          }}>
            이제 모든 프리미엄 기능을 이용하실 수 있습니다.
          </p>
          
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(45deg, #00d4ff, #0099cc)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
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
              대시보드로 이동
            </button>
            
            <button
              onClick={() => navigate('/billing')}
              style={{
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                color: 'white',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              결제 관리
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Success;