import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Custom hook: useScrollAnimation
const useScrollAnimation = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Loading screen
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    // Scroll handler
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);

    // Intersection Observer for animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    // Observe all animated elements after component mounts
    setTimeout(() => {
      document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right').forEach(el => {
        observer.observe(el);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const observeElements = useCallback(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right').forEach(el => {
      observer.observe(el);
    });

    return observer;
  }, []);

  return { scrollY, isLoading, observeElements };
};

// Custom hook: useParticles
const useParticles = (containerId: string = 'particles', particleCount: number = 50) => {
  useEffect(() => {
    const createParticles = () => {
      const particlesContainer = document.getElementById(containerId);
      if (!particlesContainer) return;
      
      // Clear existing particles
      particlesContainer.innerHTML = '';
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
        particlesContainer.appendChild(particle);
      }
    };

    createParticles();

    return () => {
      const particlesContainer = document.getElementById(containerId);
      if (particlesContainer) {
        particlesContainer.innerHTML = '';
      }
    };
  }, [containerId, particleCount]);
};

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('landing');
  const { scrollY, isLoading } = useScrollAnimation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Set default language to English if not set
    const currentLang = localStorage.getItem('i18nextLng');
    if (!currentLang || currentLang === 'ko-KR' || currentLang === 'ko') {
      i18n.changeLanguage('en');
      localStorage.setItem('i18nextLng', 'en');
    }
  }, [i18n]);

  useParticles('particles', 50);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
    window.location.reload();
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  // Get nav links from translation
  const NAV_LINKS = [
    { href: '#problems', text: t('nav.problems') },
    { href: '#solutions', text: t('nav.solutions') },
    { href: '#workflow', text: t('nav.workflow') },
    { href: '#features', text: t('nav.features') },
    { href: '#target', text: t('nav.target') },
    { href: '#pricing', text: t('nav.pricing') }
  ];

  // Styles
  const styles = {
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '0 20px',
    },
    bgAnimation: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      background: 'linear-gradient(45deg, #0f0f23, #1a1a2e, #16213e)',
      backgroundSize: '200% 200%',
      animation: 'gradientAnimation 10s ease infinite',
    },
    particles: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
    },
    nav: {
      position: 'fixed' as const,
      top: 0,
      width: '100%',
      zIndex: 1000,
      padding: '1rem 0',
      backdropFilter: 'blur(20px)',
      background: scrollY > 100 ? 'rgba(10, 10, 10, 0.95)' : 'rgba(10, 10, 10, 0.8)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      transition: 'all 0.3s ease',
    },
    navContent: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    logo: {
      fontSize: '1.8rem',
      fontWeight: 700,
      background: 'linear-gradient(45deg, #00d4ff, #ff6b9d)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    navLinks: {
      display: 'flex',
      gap: '2rem',
      alignItems: 'center',
    },
    hero: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      position: 'relative' as const,
      color: 'white',
      overflow: 'hidden',
    },
    heroContent: {
      position: 'relative' as const,
      zIndex: 2,
      width: '100%',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '4rem',
      alignItems: 'center',
    },
    heroText: {
      animation: 'slideInLeft 1s ease-out',
    },
    heroVisual: {
      position: 'relative' as const,
      height: '500px',
      animation: 'slideInRight 1s ease-out',
    },
    codeVisualization: {
      position: 'absolute' as const,
      width: '100%',
      height: '100%',
      perspective: '1000px',
    },
    codeBlock: {
      position: 'absolute' as const,
      background: 'rgba(0, 212, 255, 0.1)',
      border: '1px solid #00d4ff',
      borderRadius: '10px',
      padding: '1rem',
      fontFamily: '"Courier New", monospace',
      fontSize: '0.8rem',
      color: '#00d4ff',
      animation: 'float3d 6s infinite ease-in-out',
      backdropFilter: 'blur(10px)',
    },
    ctaButton: {
      display: 'inline-block',
      padding: '1.5rem 4rem',
      background: 'linear-gradient(45deg, #ff6b6b, #ff8e53, #ff6b9d)',
      color: 'white',
      textDecoration: 'none',
      borderRadius: '50px',
      fontSize: '1.3rem',
      fontWeight: 700,
      transition: 'all 0.4s ease',
      boxShadow: '0 15px 40px rgba(255, 107, 107, 0.4)',
      textTransform: 'uppercase' as const,
      letterSpacing: '2px',
      position: 'relative' as const,
      overflow: 'hidden',
    },
    sectionTitle: {
      textAlign: 'center' as const,
      fontSize: '3.5rem',
      marginBottom: '4rem',
      fontWeight: 900,
      background: 'linear-gradient(45deg, #ff6b6b, #ffeb3b, #00d4ff)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    loadingOverlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: '#0a0a0a',
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      transition: 'opacity 1s ease',
      opacity: isLoading ? 1 : 0,
      pointerEvents: isLoading ? 'auto' as const : 'none' as const,
    },
    loader: {
      width: '50px',
      height: '50px',
      border: '3px solid rgba(0, 212, 255, 0.3)',
      borderTop: '3px solid #00d4ff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    languageSelector: {
      display: 'flex',
      gap: '0.5rem',
    },
    languageButton: {
      background: 'transparent',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      color: 'rgba(255, 255, 255, 0.8)',
      padding: '0.3rem 0.6rem',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      transition: 'all 0.3s ease',
    },
    languageButtonActive: {
      background: 'rgba(0, 212, 255, 0.2)',
      borderColor: '#00d4ff',
      color: '#00d4ff',
    },
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', position: 'relative', overflow: 'hidden' }}>
      <style>
        {`
          @keyframes gradientAnimation {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          @keyframes float {
            0% {
              transform: translateY(100vh) scale(0);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translateY(-100px) scale(1);
              opacity: 0;
            }
          }
          
          @keyframes slideInLeft {
            from {
              opacity: 0;
              transform: translateX(-100px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(100px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes float3d {
            0%, 100% {
              transform: translateY(0) rotateX(0) rotateY(0);
            }
            33% {
              transform: translateY(-20px) rotateX(10deg) rotateY(5deg);
            }
            66% {
              transform: translateY(10px) rotateX(-5deg) rotateY(-5deg);
            }
          }
          
          @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes slideGrid {
            0% { transform: translateX(0) translateY(0); }
            100% { transform: translateX(20px) translateY(20px); }
          }
          
          .particle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: #00d4ff;
            border-radius: 50%;
            animation: float 6s infinite linear;
            box-shadow: 0 0 10px #00d4ff;
          }
          
          .fade-in {
            opacity: 0;
            transform: translateY(50px);
            transition: all 0.8s ease;
          }
          
          .fade-in.visible {
            opacity: 1;
            transform: translateY(0);
          }
          
          .slide-in-left {
            opacity: 0;
            transform: translateX(-100px);
            transition: all 0.8s ease;
          }
          
          .slide-in-left.visible {
            opacity: 1;
            transform: translateX(0);
          }
          
          .slide-in-right {
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.8s ease;
          }
          
          .slide-in-right.visible {
            opacity: 1;
            transform: translateX(0);
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            overflow-x: hidden;
            background: #0a0a0a;
            min-height: 100vh;
          }
        `}
      </style>

      {/* Loading Overlay */}
      {isLoading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loader}></div>
        </div>
      )}

      {/* Background Animation */}
      <div style={styles.bgAnimation}>
        <div style={styles.particles} id="particles"></div>
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.container}>
          <div style={styles.navContent}>
            <div style={styles.logo}>Halo_workflow</div>
            <div style={styles.navLinks}>
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  textDecoration: 'none', 
                  transition: 'all 0.3s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00d4ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                }}>{link.text}</a>
              ))}
              <Link to="/dashboard" style={{ 
                color: 'rgba(255, 255, 255, 0.8)', 
                textDecoration: 'none',
                borderBottom: '2px solid transparent', 
                paddingBottom: '2px', 
                transition: 'all 0.3s ease' 
              }}>{t('nav.dashboard')}</Link>
              
              {/* Language Selector */}
              <div style={styles.languageSelector}>
                <button
                  onClick={() => handleLanguageChange('en')}
                  style={{
                    ...styles.languageButton,
                    ...(i18n.language === 'en' ? styles.languageButtonActive : {})
                  }}
                >
                  EN
                </button>
                <button
                  onClick={() => handleLanguageChange('ko')}
                  style={{
                    ...styles.languageButton,
                    ...(i18n.language === 'ko' ? styles.languageButtonActive : {})
                  }}
                >
                  KO
                </button>
              </div>
              
              {user ? (
                <>
                  {user.role === 'ADMIN' && (
                    <Link to="/admin" style={{ 
                      borderBottom: '2px solid transparent', 
                      paddingBottom: '2px', 
                      transition: 'all 0.3s ease',
                      color: '#ffeb3b',
                      textDecoration: 'none'
                    }}>{t('nav.admin')}</Link>
                  )}
                  <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                    {user.name || user.email}
                  </span>
                  <button onClick={handleLogout} style={{ 
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '8px 16px', 
                    borderRadius: '20px',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontSize: '14px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }}>{t('nav.logout')}</button>
                </>
              ) : (
                <>
                  <Link to="/auth/login" style={{ 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    textDecoration: 'none',
                    borderBottom: '2px solid transparent', 
                    paddingBottom: '2px', 
                    transition: 'all 0.3s ease' 
                  }}>{t('nav.login')}</Link>
                  <Link to="/auth/oauth-helper" style={{ 
                    color: '#ffeb3b',
                    borderBottom: '2px solid transparent', 
                    paddingBottom: '2px', 
                    transition: 'all 0.3s ease',
                    fontSize: '14px',
                    textDecoration: 'none'
                  }}>{t('nav.oauthSetup')}</Link>
                  <Link to="/auth/register" style={{ 
                    background: 'linear-gradient(45deg, #00d4ff, #ff6b9d, #ffeb3b)', 
                    padding: '10px 20px', 
                    borderRadius: '30px',
                    fontWeight: 600,
                    color: '#0a0a0a',
                    boxShadow: '0 5px 20px rgba(0, 212, 255, 0.5)',
                    transition: 'all 0.3s ease',
                    textDecoration: 'none'
                  }}>{t('nav.register')}</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.container}>
          <div style={styles.heroContent}>
            <div style={styles.heroText}>
              <h1 style={{
                fontSize: '4rem',
                fontWeight: 900,
                marginBottom: '1.5rem',
                background: 'linear-gradient(45deg, #00d4ff, #ff6b9d, #ffeb3b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1.2,
              }}>{t('hero.title')}</h1>
              <p style={{
                fontSize: '1.3rem',
                marginBottom: '2rem',
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: 300,
              }}>{t('hero.subtitle')}</p>
              
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                padding: '2rem',
                borderRadius: '20px',
                margin: '2rem 0',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <span style={{
                  fontSize: '4rem',
                  fontWeight: 900,
                  background: 'linear-gradient(45deg, #ff6b6b, #ffeb3b)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  display: 'block',
                }}>{t('hero.stats.number')}</span>
                <p>{t('hero.stats.description')}</p>
              </div>
              
              {user ? (
                <Link to="/dashboard" style={styles.ctaButton}>{t('nav.dashboard')}</Link>
              ) : (
                <Link to="/auth/register" style={styles.ctaButton}>{t('nav.register')}</Link>
              )}
            </div>
            
            <div style={styles.heroVisual}>
              <div style={styles.codeVisualization}>
                {[0, 1, 2].map((index) => (
                  <div key={index} style={{
                    ...styles.codeBlock,
                    ...(index === 0 && { top: '10%', left: '10%', animationDelay: '0s' }),
                    ...(index === 1 && { top: '30%', right: '10%', animationDelay: '2s' }),
                    ...(index === 2 && { bottom: '20%', left: '20%', animationDelay: '4s' }),
                  }}>
                    {t(`hero.codeBlocks.${index}.content`).split('\n').map((line: string, lineIndex: number) => (
                      <React.Fragment key={lineIndex}>
                        {line}
                        {lineIndex < t(`hero.codeBlocks.${index}.content`).split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section style={{
        padding: '8rem 0',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
        position: 'relative',
      }} id="problems">
        <div style={styles.container}>
          <h2 className="fade-in" style={styles.sectionTitle}>{t('problems.title')}</h2>
          {t('problems.subtitle') && (
            <p style={{
              textAlign: 'center',
              fontSize: '1.2rem',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '3rem',
            }}>{t('problems.subtitle')}</p>
          )}
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '3rem',
            margin: '4rem 0',
          }}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <div key={index} className="fade-in" style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                padding: '3rem',
                borderRadius: '25px',
                border: '1px solid rgba(255, 107, 107, 0.3)',
                transition: 'all 0.6s ease',
                position: 'relative',
                overflow: 'hidden',
                color: 'white',
                transformStyle: 'preserve-3d',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-20px) rotateX(10deg)';
                e.currentTarget.style.borderColor = '#ff6b6b';
                e.currentTarget.style.boxShadow = '0 30px 80px rgba(255, 107, 107, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) rotateX(0)';
                e.currentTarget.style.borderColor = 'rgba(255, 107, 107, 0.3)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{
                  fontSize: '4rem',
                  marginBottom: '2rem',
                  position: 'relative',
                  zIndex: 2,
                }}>{t(`problems.items.${index}.icon`)}</div>
                <h3 style={{
                  fontSize: '1.6rem',
                  fontWeight: 700,
                  marginBottom: '1.5rem',
                  color: '#ff6b6b',
                  position: 'relative',
                  zIndex: 2,
                }}>{t(`problems.items.${index}.title`)}</h3>
                <p style={{
                  position: 'relative',
                  zIndex: 2,
                  fontSize: '1.1rem',
                  lineHeight: 1.6,
                  color: 'rgba(255, 255, 255, 0.8)',
                }}>{t(`problems.items.${index}.description`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section style={{
        padding: '8rem 0',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        color: 'white',
        position: 'relative',
      }} id="solutions">
        <div style={styles.container}>
          <h2 className="fade-in" style={styles.sectionTitle}>{t('solutions.title')}</h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '3rem',
            margin: '4rem 0',
          }}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
              <div 
                key={index} 
                className={index % 2 === 0 ? 'slide-in-left' : 'slide-in-right'}
                style={{
                  background: 'rgba(0, 212, 255, 0.05)',
                  backdropFilter: 'blur(20px)',
                  padding: '3rem',
                  borderRadius: '25px',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  transition: 'all 0.6s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  transformStyle: 'preserve-3d',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-20px) rotateY(10deg)';
                  e.currentTarget.style.borderColor = '#00d4ff';
                  e.currentTarget.style.boxShadow = '0 30px 80px rgba(0, 212, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) rotateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.3)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  fontSize: '4rem',
                  marginBottom: '2rem',
                  position: 'relative',
                  zIndex: 2,
                }}>{t(`solutions.items.${index}.icon`)}</div>
                <h3 style={{
                  fontSize: '1.8rem',
                  fontWeight: 700,
                  marginBottom: '1.5rem',
                  color: '#00d4ff',
                  position: 'relative',
                  zIndex: 2,
                }}>{t(`solutions.items.${index}.title`)}</h3>
                <p style={{
                  position: 'relative',
                  zIndex: 2,
                  fontSize: '1.1rem',
                  lineHeight: 1.6,
                  color: 'rgba(255, 255, 255, 0.8)',
                }}>{t(`solutions.items.${index}.description`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section style={{
        padding: '8rem 0',
        background: 'linear-gradient(135deg, #16213e 0%, #0f0f23 100%)',
        color: 'white',
        position: 'relative',
        zIndex: 1,
      }} id="workflow">
        <div style={styles.container}>
          <h2 className="fade-in" style={styles.sectionTitle}>{t('workflow.title')}</h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '4rem',
            margin: '4rem 0',
          }}>
            {[0, 1, 2].map((index) => (
              <div key={index} className="fade-in" style={{
                textAlign: 'center',
                position: 'relative',
                padding: '3rem',
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                borderRadius: '25px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.6s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-15px) scale(1.05)';
                e.currentTarget.style.borderColor = '#ffeb3b';
                e.currentTarget.style.boxShadow = '0 25px 60px rgba(255, 235, 59, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{
                  display: 'inline-block',
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(45deg, #ff6b9d, #00d4ff)',
                  color: 'white',
                  borderRadius: '50%',
                  lineHeight: '80px',
                  fontSize: '2rem',
                  fontWeight: 900,
                  marginBottom: '2rem',
                  position: 'relative',
                  boxShadow: '0 10px 30px rgba(255, 107, 157, 0.3)',
                }}>{t(`workflow.steps.${index}.number`)}</div>
                <h3 style={{
                  fontSize: '1.8rem',
                  fontWeight: 700,
                  marginBottom: '1.5rem',
                  color: '#ffeb3b',
                }}>{t(`workflow.steps.${index}.title`)}</h3>
                <p style={{
                  fontSize: '1.1rem',
                  lineHeight: 1.6,
                  color: 'rgba(255, 255, 255, 0.8)',
                }}>{t(`workflow.steps.${index}.description`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '8rem 0',
        background: 'linear-gradient(135deg, #0f0f23 0%, #16213e 50%, #1a1a2e 100%)',
        color: 'white',
        position: 'relative',
      }} id="features">
        <div style={styles.container}>
          <h2 className="fade-in" style={styles.sectionTitle}>{t('features.title')}</h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '3rem',
            margin: '4rem 0',
          }}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <div key={index} className="fade-in" style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                padding: '3rem',
                borderRadius: '25px',
                border: '1px solid rgba(0, 212, 255, 0.2)',
                transition: 'all 0.6s ease',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-15px)';
                e.currentTarget.style.borderColor = '#00d4ff';
                e.currentTarget.style.boxShadow = '0 25px 60px rgba(0, 212, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{
                  fontSize: '3.5rem',
                  marginBottom: '1.5rem',
                }}>{t(`features.items.${index}.icon`)}</div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  marginBottom: '1rem',
                  background: 'linear-gradient(45deg, #00d4ff, #ff6b9d)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>{t(`features.items.${index}.title`)}</h3>
                <p style={{
                  fontSize: '1.1rem',
                  lineHeight: 1.6,
                  color: 'rgba(255, 255, 255, 0.8)',
                }}>{t(`features.items.${index}.description`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Section */}
      <section style={{
        padding: '8rem 0',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: 'white',
        position: 'relative',
      }} id="target">
        <div style={styles.container}>
          <h2 className="fade-in" style={styles.sectionTitle}>{t('target.title')}</h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: '4rem',
            margin: '4rem 0',
          }}>
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="fade-in" style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                padding: '4rem',
                borderRadius: '25px',
                border: '2px solid rgba(255, 107, 157, 0.3)',
                transition: 'all 0.6s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-15px)';
                e.currentTarget.style.borderColor = '#ff6b9d';
                e.currentTarget.style.boxShadow = '0 30px 80px rgba(255, 107, 157, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255, 107, 157, 0.3)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <h3 style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  marginBottom: '2rem',
                  background: 'linear-gradient(45deg, #ff6b9d, #00d4ff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>{t(`target.audiences.${index}.title`)}</h3>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                }}>
                  {[0, 1, 2, 3, 4].map((featureIndex) => (
                    <li key={featureIndex} style={{
                      padding: '1rem 0',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      fontSize: '1.1rem',
                      color: 'rgba(255, 255, 255, 0.8)',
                      position: 'relative',
                      paddingLeft: '2rem',
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: 0,
                        top: '1rem',
                      }}>✨</span>
                      {t(`target.audiences.${index}.features.${featureIndex}`)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{
        padding: '8rem 0',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
        color: 'white',
      }} id="pricing">
        <div style={styles.container}>
          <h2 className="fade-in" style={styles.sectionTitle}>{t('pricing.title')}</h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '3rem',
            margin: '4rem 0',
            maxWidth: '800px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            {[0, 1].map((index) => {
              const plan = {
                badge: t(`pricing.plans.${index}.badge`),
                badgeColor: t(`pricing.plans.${index}.badgeColor`),
                name: t(`pricing.plans.${index}.name`),
                price: t(`pricing.plans.${index}.price`),
                period: t(`pricing.plans.${index}.period`),
                subPrice: t(`pricing.plans.${index}.subPrice`),
                ctaText: t(`pricing.plans.${index}.ctaText`),
                isHighlighted: t(`pricing.plans.${index}.isHighlighted`) === 'true',
              };

              return (
                <div 
                  key={index} 
                  className="fade-in"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    padding: '3rem',
                    borderRadius: '25px',
                    border: '2px solid rgba(0, 212, 255, 0.3)',
                    textAlign: 'center',
                    transition: 'all 0.6s ease',
                    position: 'relative',
                    transform: plan.isHighlighted ? 'scale(1.05)' : 'scale(1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-15px) scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 30px 80px rgba(0, 212, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = plan.isHighlighted ? 'scale(1.05)' : 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '-15px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '0.5rem 2rem',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    background: plan.badgeColor === 'blue' ? 'linear-gradient(45deg, #00d4ff, #ff6b9d)' : 'linear-gradient(45deg, #ffeb3b, #ff6b6b)',
                  }}>{plan.badge}</div>
                  <h3 style={{
                    fontSize: '2rem',
                    marginBottom: '1rem',
                    color: plan.badgeColor === 'blue' ? '#00d4ff' : '#ffeb3b',
                  }}>{plan.name}</h3>
                  <div style={{
                    fontSize: '4rem',
                    fontWeight: 900,
                    marginBottom: '1rem',
                    background: plan.badgeColor === 'yellow' ? 'linear-gradient(45deg, #ffeb3b, #ff6b6b)' : 'linear-gradient(45deg, #00d4ff, #ff6b9d)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>{plan.price}</div>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: '2rem',
                  }}>{plan.period}</p>
                  {plan.subPrice && plan.subPrice !== `pricing.plans.${index}.subPrice` && (
                    <p style={{
                      background: 'linear-gradient(45deg, #ff6b6b, #ffeb3b)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontWeight: 700,
                      marginBottom: '2rem',
                    }}>{plan.subPrice}</p>
                  )}
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    marginBottom: '2rem',
                  }}>
                    {[0, 1, 2, 3].map((featureIndex) => (
                      <li key={featureIndex} style={{
                        padding: '0.5rem 0',
                        color: 'rgba(255, 255, 255, 0.8)',
                      }}>{plan.badgeColor === 'yellow' ? '🚀' : '✨'} {t(`pricing.plans.${index}.features.${featureIndex}`)}</li>
                    ))}
                  </ul>
                  <Link 
                    to="/dashboard" 
                    style={{
                      display: 'inline-block',
                      padding: '1rem 2rem',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '50px',
                      fontWeight: 600,
                      transition: 'all 0.3s ease',
                      background: plan.badgeColor === 'blue' ? 'linear-gradient(45deg, #00d4ff, #0984e3)' : 'linear-gradient(45deg, #ffeb3b, #ff6b6b)',
                      fontSize: plan.badgeColor === 'yellow' ? '1.1rem' : '1rem',
                    }}
                  >{plan.ctaText}</Link>
                </div>
              );
            })}
          </div>
          
          <div style={{
            textAlign: 'center',
            marginTop: '3rem',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '1rem',
          }}>
            <p>{t('pricing.footer')}</p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section style={{
        padding: '8rem 0',
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 50%, #ff6b9d 100%)',
        color: 'white',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }} id="download">
        <div style={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid2" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid2)"/></svg>')`,
          animation: 'slideGrid 20s linear infinite',
        }}></div>
        <div style={styles.container}>
          <h2 style={{
            fontSize: '3.5rem',
            marginBottom: '2rem',
            fontWeight: 900,
            position: 'relative',
            zIndex: 2,
          }}>{t('finalCta.title')}</h2>
          <p style={{
            fontSize: '1.4rem',
            marginBottom: '3rem',
            opacity: 0.9,
            position: 'relative',
            zIndex: 2,
          }}>{t('finalCta.subtitle')}</p>
          <Link to="/dashboard" style={{
            ...styles.ctaButton,
            position: 'relative',
            zIndex: 2,
          }}>{t('finalCta.ctaText')}</Link>
        </div>
      </section>

      {/* Test Info Section */}
      <div style={{
        background: 'rgba(255, 193, 7, 0.1)',
        border: '1px solid rgba(255, 193, 7, 0.3)',
        padding: '20px',
        textAlign: 'center',
        borderTop: '1px solid rgba(255, 193, 7, 0.3)',
      }}>
        <div style={styles.container}>
          <h3 style={{
            color: '#ffeb3b',
            marginBottom: '10px',
            fontSize: '16px',
          }}>{t('testAccount.title')}</h3>
          <div style={{
            display: 'flex',
            gap: '40px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.8)',
          }}>
            {[0, 1, 2].map((index) => (
              <div key={index}>
                <strong style={{ color: t(`testAccount.accounts.${index}.color`) }}>
                  {t(`testAccount.accounts.${index}.type`)}:
                </strong> {t(`testAccount.accounts.${index}.email`)} / {t(`testAccount.accounts.${index}.password`)}
              </div>
            ))}
          </div>
          <p style={{
            marginTop: '10px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.5)',
          }}>
            {t('testAccount.disclaimer')}
          </p>
          <div style={{ marginTop: '15px' }}>
            <Link
              to="/auth/dev-login"
              style={{
                display: 'inline-block',
                padding: '8px 16px',
                background: 'linear-gradient(45deg, #ff6b9d, #ee5a24)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                boxShadow: '0 4px 15px rgba(255, 107, 157, 0.3)',
                transition: 'all 0.3s ease',
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
              {t('testAccount.quickLoginText')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;