import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { 
  UserIcon,
  EnvelopeIcon, 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
  marketing: boolean;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    watch,
    formState: { errors } 
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError('');
    
    // 백엔드 없이 테스트용으로 간단히 처리
    setTimeout(() => {
      if (data.email && data.password && data.name) {
        const testUser = {
          id: '2',
          email: data.email,
          name: data.name,
          role: 'USER',
          subscription: 'FREE'
        };
        localStorage.setItem('token', 'test-token');
        localStorage.setItem('user', JSON.stringify(testUser));
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError('모든 필드를 입력해주세요.');
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleSocialRegister = (provider: 'google' | 'github') => {
    window.location.href = `/api/oauth/${provider}?register=true`;
  };

  const passwordStrength = (password: string) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };

  const getPasswordStrengthText = (strength: number) => {
    switch (strength) {
      case 0: return 'Too weak';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };

  const getPasswordStrengthColor = (strength: number) => {
    switch (strength) {
      case 0: return '#ff4757';
      case 1: return '#ff6348';
      case 2: return '#ffeb3b';
      case 3: return '#00d4ff';
      case 4: return '#10b981';
      default: return 'rgba(255, 255, 255, 0.2)';
    }
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
          maxWidth: '500px',
          padding: '40px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          maxHeight: '90vh',
          overflowY: 'auto'
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
          }}>Create Account</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '16px' }}>Start visualizing your workflows today</p>
        </div>

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '14px'
            }}
          >
            <CheckCircleIcon style={{ height: '20px', width: '20px', marginRight: '8px' }} />
            Account created successfully! Redirecting to login...
          </motion.div>
        )}

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

        {/* Register Form */}
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Name Field */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '8px'
            }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <UserIcon style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                height: '20px',
                width: '20px',
                color: 'rgba(255, 255, 255, 0.5)'
              }} />
              <input
                {...register('name', {
                  required: 'Name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters'
                  }
                })}
                type="text"
                style={{
                  paddingLeft: '44px',
                  width: '100%',
                  padding: '12px 16px 12px 44px',
                  border: errors.name ? '1px solid rgba(255, 71, 87, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                placeholder="John Doe"
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(0, 212, 255, 0.5)';
                  e.target.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.3)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onBlur={(e) => {
                  if (!errors.name) {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.boxShadow = 'none';
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
              />
            </div>
            {errors.name && (
              <p style={{
                marginTop: '4px',
                fontSize: '12px',
                color: '#ff4757'
              }}>{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '8px'
            }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
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
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
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
              Password
            </label>
            <div style={{ position: 'relative' }}>
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
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
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
            
            {/* Password Strength Indicator */}
            {password && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      style={{
                        height: '4px',
                        flex: 1,
                        borderRadius: '2px',
                        background: passwordStrength(password) >= level
                          ? getPasswordStrengthColor(passwordStrength(password))
                          : 'rgba(255, 255, 255, 0.2)',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  ))}
                </div>
                <p style={{
                  fontSize: '12px',
                  marginTop: '4px',
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  {getPasswordStrengthText(passwordStrength(password))}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '8px'
            }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
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
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
                type={showConfirmPassword ? 'text' : 'password'}
                style={{
                  paddingLeft: '44px',
                  paddingRight: '44px',
                  width: '100%',
                  padding: '12px 44px',
                  border: errors.confirmPassword ? '1px solid rgba(255, 71, 87, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
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
                  if (!errors.confirmPassword) {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.boxShadow = 'none';
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                {showConfirmPassword ? (
                  <EyeSlashIcon style={{ height: '20px', width: '20px' }} />
                ) : (
                  <EyeIcon style={{ height: '20px', width: '20px' }} />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p style={{
                marginTop: '4px',
                fontSize: '12px',
                color: '#ff4757'
              }}>{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Terms and Marketing */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <input
                {...register('terms', {
                  required: 'You must accept the terms and conditions'
                })}
                type="checkbox"
                style={{
                  width: '16px',
                  height: '16px',
                  marginTop: '2px',
                  marginRight: '8px',
                  cursor: 'pointer',
                  accentColor: '#00d4ff'
                }}
              />
              <label style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: '1.5'
              }}>
                I agree to the{' '}
                <Link 
                  to="/terms" 
                  style={{
                    color: '#00d4ff',
                    textDecoration: 'none',
                    transition: 'color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ff6b9d'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#00d4ff'}
                >
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link 
                  to="/privacy" 
                  style={{
                    color: '#00d4ff',
                    textDecoration: 'none',
                    transition: 'color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ff6b9d'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#00d4ff'}
                >
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.terms && (
              <p style={{
                fontSize: '12px',
                color: '#ff4757',
                marginTop: '-8px',
                marginLeft: '24px'
              }}>{errors.terms.message}</p>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <input
                {...register('marketing')}
                type="checkbox"
                style={{
                  width: '16px',
                  height: '16px',
                  marginTop: '2px',
                  marginRight: '8px',
                  cursor: 'pointer',
                  accentColor: '#00d4ff'
                }}
              />
              <label style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: '1.5'
              }}>
                I want to receive marketing emails about new features and updates
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || success}
            style={{
              width: '100%',
              background: isLoading || success ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(45deg, #00d4ff, #0099cc)',
              color: 'white',
              padding: '14px 16px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '16px',
              fontWeight: 600,
              cursor: isLoading || success ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: isLoading || success ? 0.5 : 1,
              boxShadow: isLoading || success ? 'none' : '0 10px 30px rgba(0, 212, 255, 0.4)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (!isLoading && !success) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 212, 255, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading && !success) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 212, 255, 0.4)';
              }
            }}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ animation: 'spin 1s linear infinite', marginRight: '12px', height: '20px', width: '20px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Social Register */}
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
              }}>Or register with</span>
            </div>
          </div>

          <div style={{
            marginTop: '24px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
            <button
              onClick={() => handleSocialRegister('google')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 16px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.9)',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 5px 20px rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <svg style={{ width: '20px', height: '20px', marginRight: '8px' }} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>

            <button
              onClick={() => handleSocialRegister('github')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 16px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.9)',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 5px 20px rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <svg style={{ width: '20px', height: '20px', marginRight: '8px' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
              GitHub
            </button>
          </div>
        </div>

        {/* Sign In Link */}
        <p style={{
          marginTop: '32px',
          textAlign: 'center',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          Already have an account?{' '}
          <Link 
            to="/auth/login" 
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
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;