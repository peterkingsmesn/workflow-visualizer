import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DownloadSection from '../components/landing/DownloadSection';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('landing');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
    window.location.reload();
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'es', name: 'Español', flag: '🇪🇸' }
  ];

  return (
    <div style={{ 
      fontFamily: "'JetBrains Mono', 'Courier New', monospace", 
      background: '#0d1117', 
      color: '#c9d1d9', 
      overflowX: 'hidden' 
    }}>
      {/* Header */}
      <header style={{
        background: '#161b22',
        borderBottom: '1px solid #30363d',
        padding: '15px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.4rem', fontWeight: 'bold' }}>
          <span style={{ 
            background: 'linear-gradient(to right, #60a5fa, #a78bfa, #60a5fa)', 
            WebkitBackgroundClip: 'text', 
            backgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}>
            🚀 Workflow Visualizer
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Language Selector */}
          <select 
            value={i18n.language} 
            onChange={(e) => handleLanguageChange(e.target.value)}
            style={{
              background: '#21262d',
              color: '#c9d1d9',
              border: '1px solid #30363d',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '14px'
            }}
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span>안녕하세요, {user.name}님</span>
              <button 
                onClick={handleLogout}
                style={{
                  background: '#f85149',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                로그아웃
              </button>
            </div>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              style={{
                background: 'linear-gradient(to right, #238636, #2ea043)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {t('hero.cta')}
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
        paddingTop: '80px'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '1200px', padding: '0 20px' }}>
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: 900,
            background: 'linear-gradient(45deg, #58a6ff, #7ee787)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '20px',
            lineHeight: 1.2
          }}>
            {t('hero.title')}
          </h1>
          
          <p style={{
            fontSize: '1.5rem',
            color: '#8b949e',
            marginBottom: '30px',
            maxWidth: '800px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            {t('hero.subtitle')}
          </p>

          {/* Stats */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '40px', 
            marginBottom: '40px', 
            flexWrap: 'wrap' 
          }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ 
                fontSize: '3rem', 
                fontWeight: 'bold', 
                color: '#f85149', 
                display: 'block' 
              }}>
                {t('hero.stats.failureRate')}
              </span>
              <span style={{ color: '#8b949e', fontSize: '14px' }}>
                {t('hero.stats.failureLabel')}
              </span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ 
                fontSize: '3rem', 
                fontWeight: 'bold', 
                color: '#7ee787', 
                display: 'block' 
              }}>
                {t('hero.stats.successRate')}
              </span>
              <span style={{ color: '#8b949e', fontSize: '14px' }}>
                {t('hero.stats.successLabel')}
              </span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ 
                fontSize: '3rem', 
                fontWeight: 'bold', 
                color: '#58a6ff', 
                display: 'block' 
              }}>
                {t('hero.stats.users')}
              </span>
              <span style={{ color: '#8b949e', fontSize: '14px' }}>
                {t('hero.stats.usersLabel')}
              </span>
            </div>
          </div>

          <button 
            onClick={() => navigate('/login')}
            style={{
              background: 'linear-gradient(45deg, #238636, #2ea043)',
              color: 'white',
              padding: '15px 35px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textDecoration: 'none',
              display: 'inline-block'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(35, 134, 54, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {t('hero.cta')}
          </button>
        </div>
      </section>

      {/* Problems Section */}
      <section id="problems" style={{ background: '#161b22', padding: '80px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <h2 style={{
            fontSize: '2.5rem',
            textAlign: 'center',
            marginBottom: '20px',
            color: '#f85149'
          }}>
            {t('problems.title')}
          </h2>
          <p style={{
            textAlign: 'center',
            color: '#8b949e',
            marginBottom: '50px',
            fontSize: '1.2rem'
          }}>
            {t('problems.subtitle')}
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '30px'
          }}>
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} style={{
                background: '#0d1117',
                border: '1px solid #30363d',
                borderRadius: '12px',
                padding: '30px 25px',
                transition: 'all 0.3s ease'
              }}>
                <h3 style={{
                  color: '#f85149',
                  marginBottom: '15px',
                  fontSize: '1.3rem'
                }}>
                  {t(`problems.items.${i}.title`)}
                </h3>
                <p style={{ color: '#8b949e', lineHeight: 1.6 }}>
                  {t(`problems.items.${i}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" style={{ background: '#0d1117', padding: '80px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <h2 style={{
            fontSize: '2.5rem',
            textAlign: 'center',
            marginBottom: '20px',
            color: '#7ee787'
          }}>
            {t('solutions.title')}
          </h2>
          <p style={{
            textAlign: 'center',
            color: '#8b949e',
            marginBottom: '50px',
            fontSize: '1.2rem'
          }}>
            {t('solutions.subtitle')}
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '30px'
          }}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} style={{
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: '12px',
                padding: '30px 25px',
                transition: 'all 0.3s ease'
              }}>
                <h3 style={{
                  color: '#7ee787',
                  marginBottom: '15px',
                  fontSize: '1.3rem'
                }}>
                  {t(`solutions.items.${i}.title`)}
                </h3>
                <p style={{ color: '#8b949e', lineHeight: 1.6 }}>
                  {t(`solutions.items.${i}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section style={{ background: '#161b22', padding: '80px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <h2 style={{
            fontSize: '2.5rem',
            textAlign: 'center',
            marginBottom: '20px',
            color: '#7ee787'
          }}>
            {t('testimonials.title')}
          </h2>
          <p style={{
            textAlign: 'center',
            color: '#8b949e',
            marginBottom: '50px',
            fontSize: '1.2rem'
          }}>
            {t('testimonials.subtitle')}
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '30px'
          }}>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} style={{
                background: '#0d1117',
                border: '1px solid #30363d',
                borderRadius: '12px',
                padding: '30px 25px'
              }}>
                <p style={{ 
                  color: '#c9d1d9', 
                  fontStyle: 'italic', 
                  marginBottom: '20px',
                  lineHeight: 1.6
                }}>
                  "{t(`testimonials.items.${i}.text`)}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    background: '#21262d',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    👤
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#c9d1d9' }}>
                      {t(`testimonials.items.${i}.author`)}
                    </div>
                    <div style={{ color: '#8b949e', fontSize: '14px' }}>
                      {t(`testimonials.items.${i}.role`)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ background: '#0d1117', padding: '80px 0' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
          <h2 style={{
            fontSize: '2.5rem',
            textAlign: 'center',
            marginBottom: '20px',
            color: '#58a6ff'
          }}>
            {t('pricing.title')}
          </h2>
          <p style={{
            textAlign: 'center',
            color: '#8b949e',
            marginBottom: '50px',
            fontSize: '1.2rem'
          }}>
            {t('pricing.subtitle')}
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '30px'
          }}>
            {/* Monthly Plan */}
            <div style={{
              background: '#161b22',
              border: '1px solid #30363d',
              borderRadius: '12px',
              padding: '40px 30px',
              textAlign: 'center'
            }}>
              <h3 style={{ 
                color: '#58a6ff', 
                fontSize: '1.5rem', 
                marginBottom: '20px' 
              }}>
                {t('pricing.monthly.title')}
              </h3>
              <div style={{ marginBottom: '30px' }}>
                <span style={{ 
                  fontSize: '3rem', 
                  fontWeight: 'bold', 
                  color: '#c9d1d9' 
                }}>
                  {t('pricing.monthly.price')}
                </span>
                <span style={{ color: '#8b949e' }}>
                  {t('pricing.monthly.period')}
                </span>
              </div>
              <button 
                onClick={() => navigate('/login')}
                style={{
                  background: 'linear-gradient(45deg, #238636, #2ea043)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 30px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                {t('pricing.monthly.cta')}
              </button>
            </div>

            {/* Yearly Plan */}
            <div style={{
              background: '#161b22',
              border: '2px solid #58a6ff',
              borderRadius: '12px',
              padding: '40px 30px',
              textAlign: 'center',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#58a6ff',
                color: '#0d1117',
                padding: '6px 20px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {t('pricing.yearly.discount')}
              </div>
              <h3 style={{ 
                color: '#58a6ff', 
                fontSize: '1.5rem', 
                marginBottom: '20px' 
              }}>
                {t('pricing.yearly.title')}
              </h3>
              <div style={{ marginBottom: '30px' }}>
                <span style={{ 
                  fontSize: '3rem', 
                  fontWeight: 'bold', 
                  color: '#c9d1d9' 
                }}>
                  {t('pricing.yearly.price')}
                </span>
                <span style={{ color: '#8b949e' }}>
                  {t('pricing.yearly.period')}
                </span>
              </div>
              <button 
                onClick={() => navigate('/login')}
                style={{
                  background: 'linear-gradient(45deg, #58a6ff, #7c3aed)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 30px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                {t('pricing.yearly.cta')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ 
        background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)', 
        padding: '80px 0' 
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
          <h2 style={{
            fontSize: '2.5rem',
            marginBottom: '20px',
            color: '#58a6ff'
          }}>
            {t('cta.title')}
          </h2>
          <p style={{
            fontSize: '1.2rem',
            color: '#8b949e',
            marginBottom: '40px'
          }}>
            {t('cta.subtitle')}
          </p>
          <button 
            onClick={() => navigate('/login')}
            style={{
              background: 'linear-gradient(45deg, #238636, #2ea043)',
              color: 'white',
              padding: '18px 40px',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1.3rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(35, 134, 54, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {t('cta.button')}
          </button>
        </div>
      </section>

      {/* Download Section */}
      <DownloadSection />

      {/* Footer */}
      <footer style={{ 
        background: '#161b22', 
        borderTop: '1px solid #30363d', 
        padding: '40px 0' 
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
          <p style={{ color: '#8b949e' }}>
            © 2024 Workflow Visualizer. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;