import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Users, CreditCard, BarChart, Settings } from 'lucide-react';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    totalProjects: 0
  });

  useEffect(() => {
    // Check admin authentication
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!token || !storedUser) {
        navigate('/auth/login');
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'ADMIN') {
          navigate('/');
          return;
        }
        setUser(parsedUser);
        
        // Fetch admin stats
        const response = await fetch('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(45deg, #0f0f23, #1a1a2e, #16213e)',
        backgroundSize: '200% 200%',
        animation: 'gradientAnimation 10s ease infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          animation: 'spin 1s linear infinite',
          width: '50px',
          height: '50px',
          border: '3px solid rgba(255, 255, 255, 0.3)',
          borderTopColor: '#00d4ff',
          borderRadius: '50%'
        }}></div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(45deg, #0f0f23, #1a1a2e, #16213e)',
      backgroundSize: '200% 200%',
      animation: 'gradientAnimation 10s ease infinite',
      color: 'white',
      padding: '20px'
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

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px',
          padding: '20px',
          background: 'rgba(26, 26, 46, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 900,
            background: 'linear-gradient(45deg, #00d4ff, #ff6b9d)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: 0
          }}>관리자 대시보드</h1>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '10px 20px',
                borderRadius: '10px',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              홈으로
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'linear-gradient(45deg, #00d4ff, #0099cc)',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                color: 'white',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0, 212, 255, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              대시보드
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          {/* Total Users */}
          <div style={{
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '100px',
              height: '100px',
              background: 'linear-gradient(45deg, #00d4ff, #0099cc)',
              borderRadius: '50%',
              opacity: 0.1
            }}></div>
            <Users size={30} style={{ color: '#00d4ff', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.7)', margin: '0 0 8px 0' }}>전체 사용자</h3>
            <p style={{ fontSize: '32px', fontWeight: 700, margin: 0 }}>{stats.totalUsers.toLocaleString()}</p>
          </div>

          {/* Active Subscriptions */}
          <div style={{
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '100px',
              height: '100px',
              background: 'linear-gradient(45deg, #ff6b9d, #ee5a24)',
              borderRadius: '50%',
              opacity: 0.1
            }}></div>
            <CreditCard size={30} style={{ color: '#ff6b9d', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.7)', margin: '0 0 8px 0' }}>활성 구독</h3>
            <p style={{ fontSize: '32px', fontWeight: 700, margin: 0 }}>{stats.activeSubscriptions.toLocaleString()}</p>
          </div>

          {/* Monthly Revenue */}
          <div style={{
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '100px',
              height: '100px',
              background: 'linear-gradient(45deg, #ffeb3b, #ff9800)',
              borderRadius: '50%',
              opacity: 0.1
            }}></div>
            <BarChart size={30} style={{ color: '#ffeb3b', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.7)', margin: '0 0 8px 0' }}>월 매출</h3>
            <p style={{ fontSize: '32px', fontWeight: 700, margin: 0 }}>${stats.monthlyRevenue.toLocaleString()}</p>
          </div>

          {/* Total Projects */}
          <div style={{
            background: 'rgba(26, 26, 46, 0.8)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '100px',
              height: '100px',
              background: 'linear-gradient(45deg, #10b981, #059669)',
              borderRadius: '50%',
              opacity: 0.1
            }}></div>
            <Settings size={30} style={{ color: '#10b981', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.7)', margin: '0 0 8px 0' }}>전체 프로젝트</h3>
            <p style={{ fontSize: '32px', fontWeight: 700, margin: 0 }}>{stats.totalProjects.toLocaleString()}</p>
          </div>
        </div>

        {/* Admin Actions */}
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
            marginBottom: '24px',
            background: 'linear-gradient(45deg, #00d4ff, #ff6b9d)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>관리 기능</h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px'
          }}>
            <button style={{
              background: 'rgba(0, 212, 255, 0.1)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              padding: '20px',
              borderRadius: '10px',
              color: '#00d4ff',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'left'
            }}>
              <Users size={20} style={{ marginBottom: '8px' }} />
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>사용자 관리</h3>
              <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>사용자 목록 및 권한 관리</p>
            </button>

            <button style={{
              background: 'rgba(255, 107, 157, 0.1)',
              border: '1px solid rgba(255, 107, 157, 0.3)',
              padding: '20px',
              borderRadius: '10px',
              color: '#ff6b9d',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'left'
            }}>
              <CreditCard size={20} style={{ marginBottom: '8px' }} />
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>결제 관리</h3>
              <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>구독 및 결제 내역 관리</p>
            </button>

            <button style={{
              background: 'rgba(255, 235, 59, 0.1)',
              border: '1px solid rgba(255, 235, 59, 0.3)',
              padding: '20px',
              borderRadius: '10px',
              color: '#ffeb3b',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'left'
            }}>
              <BarChart size={20} style={{ marginBottom: '8px' }} />
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>분석 리포트</h3>
              <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>사용 통계 및 분석</p>
            </button>

            <button style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '20px',
              borderRadius: '10px',
              color: '#10b981',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'left'
            }}>
              <Settings size={20} style={{ marginBottom: '8px' }} />
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>시스템 설정</h3>
              <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>서비스 설정 관리</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;