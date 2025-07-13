require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const prisma = require('./prisma');

// Google OAuth 2.0 Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_REDIRECT_URI || '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // 기존 사용자 찾기
    let user = await prisma.user.findUnique({
      where: { email: profile.emails[0].value }
    });

    if (user) {
      // 기존 사용자가 있으면 Google 계정 정보 업데이트
      if (user.provider !== 'google') {
        // 이메일로 가입한 사용자가 Google로 로그인하려는 경우
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            provider: 'google',
            providerId: profile.id,
            avatar: profile.photos[0]?.value || user.avatar,
            emailVerified: true // Google 계정은 이미 인증됨
          }
        });
      }
    } else {
      // 새 사용자 생성
      user = await prisma.user.create({
        data: {
          email: profile.emails[0].value,
          name: profile.displayName,
          avatar: profile.photos[0]?.value,
          provider: 'google',
          providerId: profile.id,
          emailVerified: true, // Google 계정은 이미 인증됨
          locale: profile._json.locale || 'en'
        }
      });

      // 환영 알림 생성
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'in_app',
          title: 'Welcome to Workflow Visualizer!',
          message: 'Welcome! Start analyzing your projects and visualize your code workflows.'
        }
      });
    }

    // 마지막 로그인 시간 업데이트
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    return done(null, user);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

// GitHub OAuth Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_REDIRECT_URI || '/api/oauth/github/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // 기존 사용자 찾기
    let user = await prisma.user.findUnique({
      where: { email: profile.emails[0].value }
    });

    if (user) {
      // 기존 사용자가 있으면 GitHub 계정 정보 업데이트
      if (user.provider !== 'github') {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            provider: 'github',
            providerId: profile.id,
            avatar: profile.photos[0]?.value || user.avatar,
            emailVerified: true // GitHub 계정은 이미 인증됨
          }
        });
      }
    } else {
      // 새 사용자 생성 - 기본 FREE 구독 생성
      user = await prisma.user.create({
        data: {
          email: profile.emails[0].value,
          name: profile.displayName || profile.username,
          avatar: profile.photos[0]?.value,
          provider: 'github',
          providerId: profile.id,
          emailVerified: true,
          subscription: {
            create: {
              plan: 'FREE',
              status: 'ACTIVE'
            }
          }
        },
        include: {
          subscription: true
        }
      });

      // 환영 알림 생성
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'IN_APP',
          title: 'Welcome to Workflow Visualizer!',
          message: 'Welcome! Start analyzing your projects and visualize your code workflows.',
          metadata: {
            source: 'github_signup'
          }
        }
      });
    }

    // 마지막 로그인 시간 업데이트
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    return done(null, user);
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return done(error, null);
  }
}));

// JWT Strategy
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET // Required from environment
}, async (payload, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { subscription: true }
    });

    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { subscription: true }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;