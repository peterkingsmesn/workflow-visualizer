const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { validateInput, validations } = require('../middleware/security');
const { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } = require('../lib/email');
const { setSession, getSession, deleteSession, addUserSession, removeUserSession, deleteAllUserSessions } = require('../lib/redis');

const router = express.Router();

// JWT 설정
const JWT_SECRET = process.env.JWT_SECRET; // Required from environment
const JWT_EXPIRES_IN = '7d';

// 토큰 생성 함수
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// 회원가입
router.post('/register', validateInput([
  validations.name,
  validations.email,
  validations.password
]), async (req, res) => {
  try {
    const { name, email, password, marketing } = req.body;

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash(password, 10);

    // 이메일 인증 토큰 생성
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        provider: 'email',
        marketingEmails: marketing || false,
        emailVerifyToken,
        locale: req.headers['accept-language']?.split(',')[0] || 'en'
      }
    });

    // 활동 로그 기록
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'register',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    // 이메일 인증 메일 전송
    await sendVerificationEmail(email, name, emailVerifyToken);

    res.status(201).json({
      message: 'Account created successfully. Please check your email to verify your account.',
      userId: user.id
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Failed to create account' });
  }
});

// 로그인
router.post('/login', validateInput([
  validations.email,
  validations.password
]), async (req, res) => {
  try {
    const { email, password, remember } = req.body;

    // 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email },
      include: { subscription: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // OAuth 사용자인 경우
    if (!user.password && user.provider) {
      return res.status(400).json({ 
        message: `Please login with ${user.provider}` 
      });
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 이메일 인증 확인
    if (!user.emailVerified) {
      return res.status(403).json({ 
        message: 'Please verify your email before logging in' 
      });
    }

    // JWT 토큰 생성
    const token = generateToken(user.id);

    // 세션 생성 (데이터베이스)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (remember ? 30 : 7));

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        expiresAt
      }
    });

    // Redis 세션 생성
    const sessionData = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      loginAt: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };
    
    const ttl = remember ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30일 또는 7일
    await setSession(token, sessionData, ttl);
    await addUserSession(user.id, token);

    // 마지막 로그인 시간 업데이트
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // 활동 로그 기록
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'login',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    // 사용자 정보 반환 (민감한 정보 제외)
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      locale: user.locale,
      subscription: user.subscription
    };

    res.json({
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// 로그아웃
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      // 데이터베이스 세션 삭제
      const session = await prisma.session.findUnique({
        where: { token }
      });
      
      if (session) {
        await prisma.session.delete({
          where: { token }
        });
        
        // Redis 세션 삭제
        await deleteSession(token);
        await removeUserSession(session.userId, token);
      }
    }

    res.json({ message: 'Logged out successfully' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
});

// 이메일 인증
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'Invalid verification link' });
    }

    // 토큰으로 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { emailVerifyToken: token }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification link' });
    }

    // 이메일 인증 완료
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null
      }
    });

    // 환영 알림 생성
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'in_app',
        title: 'Welcome to Workflow Visualizer!',
        message: 'Your email has been verified. Start analyzing your projects now!'
      }
    });

    // 환영 이메일 전송
    await sendWelcomeEmail(user.email, user.name);

    res.redirect('/auth/login?verified=true');

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
});

// 비밀번호 재설정 요청
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // 보안을 위해 사용자가 없어도 성공 메시지 반환
      return res.json({ 
        message: 'If an account exists, a password reset link has been sent' 
      });
    }

    // 비밀번호 재설정 토큰 생성
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1시간 후 만료

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      }
    });

    // 비밀번호 재설정 메일 전송
    await sendPasswordResetEmail(email, user.name, resetToken);

    res.json({ 
      message: 'If an account exists, a password reset link has been sent' 
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Failed to process request' });
  }
});

// 비밀번호 재설정
router.post('/reset-password', validateInput([
  validations.password
]), async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired reset token' 
      });
    }

    // 새 비밀번호 해시
    const hashedPassword = await bcrypt.hash(password, 10);

    // 비밀번호 업데이트 및 토큰 제거
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    // 모든 세션 삭제 (보안)
    await prisma.session.deleteMany({
      where: { userId: user.id }
    });

    // 알림 생성
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'email',
        title: 'Password Reset Successful',
        message: 'Your password has been reset successfully. Please login with your new password.'
      }
    });

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// 토큰 갱신
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;

    // 기존 세션 확인
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    // 새 토큰 생성
    const newToken = generateToken(session.userId);

    // 새 세션 생성
    const newSession = await prisma.session.create({
      data: {
        userId: session.userId,
        token: newToken,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7일
      }
    });

    // 기존 세션 삭제
    await prisma.session.delete({
      where: { id: session.id }
    });

    res.json({ 
      token: newToken,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        avatar: session.user.avatar,
        role: session.user.role
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Failed to refresh token' });
  }
});

// 인증 미들웨어
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // JWT 검증
    const decoded = jwt.verify(token, JWT_SECRET);

    // Redis 세션 확인 (빠른 조회)
    const redisSession = await getSession(token);
    
    if (!redisSession) {
      // Redis에 세션이 없으면 데이터베이스 확인
      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true }
      });

      if (!session || session.expiresAt < new Date()) {
        return res.status(401).json({ message: 'Session expired' });
      }

      // Redis에 세션 복원
      const sessionData = {
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        loginAt: session.createdAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent
      };
      
      const ttl = Math.floor((session.expiresAt - new Date()) / 1000);
      if (ttl > 0) {
        await setSession(token, sessionData, ttl);
      }

      req.user = session.user;
      req.session = session;
    } else {
      // Redis 세션이 있으면 사용자 정보 조회
      const user = await prisma.user.findUnique({
        where: { id: redisSession.userId },
        include: { subscription: true }
      });

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = user;
      req.session = { ...redisSession, user };
    }

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};

// 현재 사용자 정보
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        subscription: true,
        _count: {
          select: {
            projects: true,
            teamMembers: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      locale: user.locale,
      timezone: user.timezone,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      subscription: user.subscription,
      projectCount: user._count.projects,
      teamCount: user._count.teamMembers,
      createdAt: user.createdAt
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user information' });
  }
});

// 모든 세션 로그아웃
router.post('/logout-all', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // 데이터베이스의 모든 세션 삭제
    await prisma.session.deleteMany({
      where: { userId }
    });

    // Redis의 모든 사용자 세션 삭제
    await deleteAllUserSessions(userId);

    res.json({ message: 'All sessions logged out successfully' });

  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ message: 'Logout all failed' });
  }
});

// 활성 세션 목록 조회
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // 데이터베이스에서 활성 세션 조회
    const sessions = await prisma.session.findMany({
      where: { 
        userId,
        expiresAt: { gt: new Date() }
      },
      select: {
        id: true,
        token: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ sessions });

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ message: 'Failed to get sessions' });
  }
});

module.exports = { router, authenticate };