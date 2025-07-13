import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon 
} from '@heroicons/react/24/outline';
import SocialLogin from '../../components/auth/SocialLogin';

interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');
    
    // 백엔드 없이 테스트용으로 간단히 처리
    setTimeout(() => {
      if (data.email === 'admin@workflow-visualizer.com' && data.password === 'admin123!@#') {
        const testUser = {
          id: '1',
          email: 'admin@workflow-visualizer.com',
          name: 'Admin User',
          role: 'ADMIN',
          subscription: 'PRO'
        };
        localStorage.setItem('token', 'test-token');
        localStorage.setItem('user', JSON.stringify(testUser));
        navigate('/dashboard');
      } else {
        setError('테스트 계정: admin@workflow-visualizer.com / admin123!@#');
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleSocialLogin = (provider: 'google' | 'github') => {
    window.location.href = `/api/oauth/${provider}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(45deg, #0f0f23, #1a1a2e, #16213e)',
      backgroundSize: '200% 200%',
      animation: 'gradientAnimation 10s ease infinite',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>
        {`
          @keyframes gradientAnimation {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
            100% { transform: translateY(0px); }
          }
        `}
      </style>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          background: 'rgba(26, 26, 46, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0, 212, 255, 0.3)',
          width: '100%',
          maxWidth: '450px',
          padding: '40px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Logo and Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            background: 'linear-gradient(45deg, #00d4ff, #ff6b9d)',
            borderRadius: '20px',
            marginBottom: '20px',
            boxShadow: '0 10px 30px rgba(0, 212, 255, 0.4)',
            animation: 'float 3s ease-in-out infinite'
          }}>
            <span style={{ fontSize: '40px' }}>🔄</span>
          </div>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 900,
            background: 'linear-gradient(45deg, #00d4ff, #ff6b9d, #ffeb3b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '10px'
          }}>{t('auth.login.title')}</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '16px' }}>{t('auth.login.subtitle')}</p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{
              background: 'rgba(255, 71, 87, 0.1)',
              border: '1px solid rgba(255, 71, 87, 0.3)',
              color: '#ff4757',
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '24px',
              fontSize: '14px'
            }}
          >
            {error}
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email Field */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '8px'
            }}>
              {t('auth.login.email')}
            </label>
            <div className="relative">
              <EnvelopeIcon style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                height: '20px',
                width: '20px',
                color: 'rgba(255, 255, 255, 0.5)'
              }} />
              <input
                {...register('email', {
                  required: t('auth.login.errors.emailRequired'),
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: t('auth.login.errors.invalidEmail')
                  }
                })}
                type="email"
                style={{
                  paddingLeft: '44px',
                  width: '100%',
                  padding: '12px 16px 12px 44px',
                  border: errors.email ? '1px solid rgba(255, 71, 87, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                placeholder="you@example.com"
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(0, 212, 255, 0.5)';
                  e.target.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.3)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onBlur={(e) => {
                  if (!errors.email) {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.boxShadow = 'none';
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
              />
            </div>
            {errors.email && (
              <p style={{
                marginTop: '4px',
                fontSize: '12px',
                color: '#ff4757'
              }}>{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '8px'
            }}>
              {t('auth.login.password')}
            </label>
            <div className="relative">
              <LockClosedIcon style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                height: '20px',
                width: '20px',
                color: 'rgba(255, 255, 255, 0.5)'
              }} />
              <input
                {...register('password', {
                  required: t('auth.login.errors.passwordRequired'),
                  minLength: {
                    value: 6,
                    message: t('auth.login.errors.passwordTooShort')
                  }
                })}
                type={showPassword ? 'text' : 'password'}
                style={{
                  paddingLeft: '44px',
                  paddingRight: '44px',
                  width: '100%',
                  padding: '12px 44px',
                  border: errors.password ? '1px solid rgba(255, 71, 87, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                placeholder="••••••••"
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(0, 212, 255, 0.5)';
                  e.target.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.3)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onBlur={(e) => {
                  if (!errors.password) {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.boxShadow = 'none';
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
              >
                {showPassword ? (
                  <EyeSlashIcon style={{ height: '20px', width: '20px' }} />
                ) : (
                  <EyeIcon style={{ height: '20px', width: '20px' }} />
                )}
              </button>
            </div>
            {errors.password && (
              <p style={{
                marginTop: '4px',
                fontSize: '12px',
                color: '#ff4757'
              }}>{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                {...register('remember')}
                type="checkbox"
                style={{
                  width: '16px',
                  height: '16px',
                  marginRight: '8px',
                  cursor: 'pointer'
                }}
              />
              <label style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer'
              }}>
                {t('auth.login.rememberMe')}
              </label>
            </div>
            <Link
              to="/auth/forgot-password"
              style={{
                fontSize: '14px',
                color: '#00d4ff',
                textDecoration: 'none',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ff6b9d'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#00d4ff'}
            >
              {t('auth.login.forgotPassword')}
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              background: isLoading ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(45deg, #ff6b9d, #ee5a24)',
              color: 'white',
              padding: '14px 16px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '16px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: isLoading ? 0.5 : 1,
              boxShadow: isLoading ? 'none' : '0 10px 30px rgba(255, 107, 157, 0.4)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(255, 107, 157, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 107, 157, 0.4)';
              }
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('auth.login.submitting')}
              </span>
            ) : (
              t('auth.login.submit')
            )}
          </button>
        </form>

        {/* Social Login */}
        <div style={{ marginTop: '32px' }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center'
            }}>
              <div style={{
                width: '100%',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}></div>
            </div>
            <div style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              fontSize: '14px'
            }}>
              <span style={{
                padding: '0 16px',
                background: 'rgba(26, 26, 46, 0.8)',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>{t('auth.login.or')}</span>
            </div>
          </div>

          <div className="mt-6">
            <SocialLogin 
              onError={setError}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Additional Links */}
        <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '14px' }}>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '16px' }}>
            {t('auth.login.noAccount')}{' '}
            <Link 
              to="/auth/register" 
              style={{
                fontWeight: 600,
                color: '#00d4ff',
                textDecoration: 'none',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ff6b9d';
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#00d4ff';
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              {t('auth.login.signUp')}
            </Link>
          </p>
          
          <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            OAuth 로그인 문제가 있나요?{' '}
            <Link 
              to="/auth/oauth-helper" 
              style={{
                fontWeight: 600,
                color: '#ffeb3b',
                textDecoration: 'none',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ff6b9d';
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#ffeb3b';
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              OAuth 설정 도우미
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;