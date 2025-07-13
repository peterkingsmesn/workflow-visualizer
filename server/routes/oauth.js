const express = require('express');
const passport = require('../lib/passport');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const router = express.Router();

// JWT 설정
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = '7d';

// 토큰 생성 함수
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Google OAuth 시작
router.get('/google', (req, res, next) => {
  // OAuth 설정 확인
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your-google-client-id-here') {
    return res.status(503).json({
      error: 'Google OAuth가 설정되지 않았습니다',
      message: '개발자가 Google OAuth 자격증명을 설정해야 합니다. .env 파일의 GOOGLE_CLIENT_ID와 GOOGLE_CLIENT_SECRET을 확인하세요.',
      developmentNote: '개발 환경에서는 이메일/비밀번호 로그인을 사용하거나, Google Cloud Console에서 OAuth 자격증명을 생성하세요.'
    });
  }
  
  // register 파라미터를 세션에 저장
  if (req.query.register === 'true') {
    req.session.isRegistration = true;
  }
  
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
});

// Google OAuth 콜백
router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const user = req.user;
      
      // JWT 토큰 생성
      const token = generateToken(user.id);

      // 세션 생성
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7일 후 만료

      await prisma.session.create({
        data: {
          userId: user.id,
          token,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          expiresAt
        }
      });

      // 활동 로그 기록
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'oauth_login',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: { provider: 'google' }
        }
      });

      // 프론트엔드로 리다이렉트 (토큰과 함께)
      const isRegistration = req.session.isRegistration || false;
      const redirectUrl = `${process.env.APP_URL}/auth/callback?token=${token}&success=true${isRegistration ? '&register=true' : ''}`;
      
      // 세션에서 registration 플래그 제거
      delete req.session.isRegistration;
      
      res.redirect(redirectUrl);

    } catch (error) {
      console.error('Google OAuth callback error:', error);
      const errorUrl = `${process.env.APP_URL}/auth/login?error=oauth_failed`;
      res.redirect(errorUrl);
    }
  }
);

// GitHub OAuth 시작
router.get('/github', (req, res, next) => {
  // OAuth 설정 확인
  if (!process.env.GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID === 'your-github-client-id-here') {
    return res.status(503).json({
      error: 'GitHub OAuth가 설정되지 않았습니다',
      message: '개발자가 GitHub OAuth 자격증명을 설정해야 합니다. .env 파일의 GITHUB_CLIENT_ID와 GITHUB_CLIENT_SECRET을 확인하세요.',
      developmentNote: '개발 환경에서는 이메일/비밀번호 로그인을 사용하거나, GitHub Settings > Developer settings에서 OAuth App을 생성하세요.'
    });
  }
  
  passport.authenticate('github', {
    scope: ['user:email']
  })(req, res, next);
});

// GitHub OAuth 콜백
router.get('/github/callback', 
  passport.authenticate('github', { session: false }),
  async (req, res) => {
    try {
      const user = req.user;
      
      // 사용자 구독 정보 포함하여 조회
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { subscription: true }
      });
      
      // JWT 토큰 생성
      const token = generateToken(user.id);

      // 세션 생성
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7일 후 만료

      await prisma.session.create({
        data: {
          userId: user.id,
          token,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          expiresAt
        }
      });

      // 활동 로그 기록
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'oauth_login',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: { provider: 'github' }
        }
      });

      // 프론트엔드로 리다이렉트 (토큰과 함께)
      const isRegistration = req.session.isRegistration || false;
      const redirectUrl = `${process.env.APP_URL}/auth/callback?token=${token}&success=true${isRegistration ? '&register=true' : ''}`;
      
      // 세션에서 registration 플래그 제거
      delete req.session.isRegistration;
      
      res.redirect(redirectUrl);

    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      const errorUrl = `${process.env.APP_URL}/auth/login?error=oauth_failed`;
      res.redirect(errorUrl);
    }
  }
);

// OAuth 계정 연결 해제
router.post('/disconnect/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // 토큰 검증
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 비밀번호가 없는 경우 연결 해제 불가
    if (!user.password) {
      return res.status(400).json({ 
        message: 'Cannot disconnect OAuth account without setting a password first' 
      });
    }

    // OAuth 정보 제거
    const updateData = {
      provider: 'email'
    };

    if (provider === 'google' || provider === 'github') {
      updateData.providerId = null;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });

    // 활동 로그 기록
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'oauth_disconnect',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { provider }
      }
    });

    res.json({ 
      message: `${provider} account disconnected successfully` 
    });

  } catch (error) {
    console.error('OAuth disconnect error:', error);
    res.status(500).json({ message: 'Failed to disconnect account' });
  }
});

// OAuth 설정 상태 확인 (인증 불필요)
router.get('/status', async (req, res) => {
  try {
    const status = {
      google: !!(process.env.GOOGLE_CLIENT_ID && 
                process.env.GOOGLE_CLIENT_SECRET && 
                process.env.GOOGLE_CLIENT_ID !== 'your-actual-google-client-id' &&
                process.env.GOOGLE_CLIENT_SECRET !== 'your-actual-google-client-secret'),
      github: !!(process.env.GITHUB_CLIENT_ID && 
                process.env.GITHUB_CLIENT_SECRET && 
                process.env.GITHUB_CLIENT_ID !== 'your-actual-github-client-id' &&
                process.env.GITHUB_CLIENT_SECRET !== 'your-actual-github-client-secret')
    };

    res.json(status);
  } catch (error) {
    console.error('OAuth status check error:', error);
    res.status(500).json({ 
      google: false, 
      github: false,
      error: 'Failed to check OAuth status' 
    });
  }
});

// 연결된 OAuth 계정 목록
router.get('/connected', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // 토큰 검증
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        provider: true,
        providerId: true,
        password: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const connected = {
      google: user.provider === 'google' && !!user.providerId,
      github: user.provider === 'github' && !!user.providerId,
      email: !!user.password
    };

    res.json({
      primary: user.provider,
      connected,
      hasPassword: !!user.password
    });

  } catch (error) {
    console.error('Get connected accounts error:', error);
    res.status(500).json({ message: 'Failed to get connected accounts' });
  }
});

module.exports = router;