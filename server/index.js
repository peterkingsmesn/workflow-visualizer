const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const session = require('express-session');
const passport = require('./lib/passport');
const prisma = require('./lib/prisma');
const { logger, logError, logInfo, logDebug, logWarn } = require('./utils/logger');
const {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  xssProtection,
  sqlInjectionProtection,
  fileUploadSecurity,
  securityHeaders,
  securityLogger,
  validateInput,
  validations
} = require('./middleware/security');

// 환경 변수 로드
require('dotenv').config();

// 환경 변수 검증
const EnvValidator = require('./config/env.validator');
EnvValidator.printValidationReport();

// 설정 상수 가져오기
const CONFIG = require('./config/constants');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// 보안 미들웨어 설정
app.use(securityHeaders);
app.use(securityLogger);
app.use(generalLimiter);
app.use(xssProtection);
app.use(sqlInjectionProtection);
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true
}));
app.use(express.json({ limit: `${CONFIG.UPLOAD.MAX_FILE_SIZE_MB}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${CONFIG.UPLOAD.MAX_FILE_SIZE_MB}mb` }));

// 세션 설정 (메모리 기반으로 간단히 설정)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24시간
  },
  name: 'workflow-visualizer-session'
}));

// Passport 초기화
app.use(passport.initialize());
app.use(passport.session());

// 정적 파일 제공 (개발 모드에서는 Vite가 처리)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
} else {
  // 개발 모드에서는 index.html을 직접 서빙
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      return next();
    }
    res.sendFile(path.join(__dirname, '../index.html'));
  });
}

// 파일 업로드 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: CONFIG.UPLOAD.MAX_FILE_SIZE_BYTES
  }
});

// 기본 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 라우트 설정 (보안 미들웨어 적용)
const { router: authRouter, authenticate } = require('./routes/auth');
const oauthRouter = require('./routes/oauth');
const billingRouter = require('./routes/billing');
const billingGumroadRouter = require('./routes/billing-gumroad'); // 💰 Gumroad 월 구독
const webhooksGumroadRouter = require('./routes/webhooks-gumroad'); // 💰 Gumroad 웹훅

// /api/auth/me 엔드포인트는 일반 rate limit 적용
app.get('/api/auth/me', generalLimiter, async (req, res) => {
  try {
    // 개발 환경에서 임시로 mock 사용자 반환
    if (process.env.NODE_ENV === 'development') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        return res.json({
          id: '1',
          email: 'test@workflow-visualizer.com',
          name: 'Test User',
          avatar: null,
          role: 'USER',
          locale: 'en',
          timezone: 'UTC',
          emailVerified: true,
          twoFactorEnabled: false,
          subscription: {
            id: '1',
            plan: 'PRO',
            status: 'ACTIVE'
          },
          projectCount: 0,
          teamCount: 0,
          createdAt: new Date()
        });
      }
    }

    // 프로덕션 환경에서는 실제 인증 사용
    const authenticateResult = await new Promise((resolve) => {
      authenticate(req, res, (err) => {
        if (err) resolve({ error: err });
        else resolve({ success: true });
      });
    });

    if (authenticateResult.error) {
      return res.status(401).json({ message: 'Authentication required' });
    }

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

// 나머지 인증 라우트에 엄격한 제한 적용
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/oauth', oauthRouter);
app.use('/api/billing', generalLimiter, billingRouter);
app.use('/api/billing', generalLimiter, billingGumroadRouter); // 💰 Gumroad 결제
app.use('/api/webhooks', webhooksGumroadRouter); // 💰 Gumroad 웹훅
app.use(`${CONFIG.API.BASE_PATH}${CONFIG.API.ENDPOINTS.WORKFLOWS}`, require('./routes/workflows'));
app.use(`${CONFIG.API.BASE_PATH}${CONFIG.API.ENDPOINTS.FILES}`, require('./routes/files'));
app.use(`${CONFIG.API.BASE_PATH}${CONFIG.API.ENDPOINTS.COLLABORATION}`, require('./routes/collaboration'));
app.use(`${CONFIG.API.BASE_PATH}${CONFIG.API.ENDPOINTS.EXPORT}`, require('./routes/export'));
app.use(`${CONFIG.API.BASE_PATH}${CONFIG.API.ENDPOINTS.ANALYSIS}`, require('./routes/analysis'));
app.use(`${CONFIG.API.BASE_PATH}${CONFIG.API.ENDPOINTS.DIAGNOSE}`, require('./routes/diagnose'));

// 파일 업로드 엔드포인트 (보안 미들웨어 적용)
app.post(`${CONFIG.API.BASE_PATH}${CONFIG.API.ENDPOINTS.UPLOAD}`, 
  uploadLimiter,
  fileUploadSecurity,
  upload.single('file'), 
  (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: CONFIG.ERRORS.FILE_NOT_UPLOADED });
  }
  
  res.json({
    success: true,
    file: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      path: req.file.path
    }
  });
});

// 실시간 협업 기능
const sessions = new Map();
const userSockets = new Map();
const activeUsers = new Map();

// 세션 정리를 위한 주기적 작업
setInterval(() => {
  const now = Date.now();
  
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.lastActivity > CONFIG.SESSION.TIMEOUT_MS && session.users.size === 0) {
      sessions.delete(sessionId);
      logDebug(`세션 ${sessionId} 정리됨`);
    }
  }
}, CONFIG.SESSION.CLEANUP_INTERVAL_MS);

io.on('connection', (socket) => {
  logInfo('사용자 연결됨', { socketId: socket.id });
  
  // 사용자 인증 정보 설정
  const user = {
    id: socket.handshake.auth.userId || socket.id,
    name: socket.handshake.auth.userName || 'Anonymous',
    avatar: socket.handshake.auth.userAvatar,
    color: socket.handshake.auth.userColor || '#3b82f6',
    socketId: socket.id,
    lastActive: Date.now()
  };
  
  socket.user = user;
  activeUsers.set(socket.id, user);

  // 세션 생성
  socket.on('create-session', (data, callback) => {
    try {
      const { name, workflow } = data;
      const sessionId = generateSessionId();
      
      const session = {
        id: sessionId,
        name: name.trim(),
        users: new Map(),
        workflow: workflow || null,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        createdBy: user.id,
        history: [],
        locks: new Map() // 노드 잠금 관리
      };
      
      sessions.set(sessionId, session);
      socket.join(sessionId);
      socket.sessionId = sessionId;
      
      session.users.set(socket.id, user);
      
      logInfo('세션 생성됨', { sessionId, userName: user.name });
      
      callback({
        success: true,
        session: {
          id: session.id,
          name: session.name,
          users: Array.from(session.users.values()),
          workflow: session.workflow,
          createdAt: session.createdAt,
          updatedAt: session.lastActivity
        }
      });
    } catch (error) {
      logError(error, { context: 'Session creation failed' });
      callback({ success: false, error: '세션 생성에 실패했습니다.' });
    }
  });

  // 세션 참가
  socket.on('join-session', (data, callback) => {
    try {
      const { sessionId } = data;
      const session = sessions.get(sessionId);
      
      if (!session) {
        callback({ success: false, error: CONFIG.ERRORS.SESSION_NOT_FOUND });
        return;
      }
      
      socket.join(sessionId);
      socket.sessionId = sessionId;
      
      session.users.set(socket.id, user);
      session.lastActivity = Date.now();
      
      // 다른 사용자들에게 알림
      socket.to(sessionId).emit('user-joined', user);
      
      logInfo('사용자 세션 참가', { userName: user.name, sessionId });
      
      callback({
        success: true,
        session: {
          id: session.id,
          name: session.name,
          users: Array.from(session.users.values()),
          workflow: session.workflow,
          createdAt: session.createdAt,
          updatedAt: session.lastActivity
        }
      });
    } catch (error) {
      logError(error, { context: 'Session join failed' });
      callback({ success: false, error: '세션 참가에 실패했습니다.' });
    }
  });

  // 세션 나가기
  socket.on('leave-session', (data, callback) => {
    try {
      const { sessionId } = data;
      const session = sessions.get(sessionId);
      
      if (session) {
        session.users.delete(socket.id);
        session.lastActivity = Date.now();
        
        // 잠긴 노드들 해제
        for (const [nodeId, lockInfo] of session.locks.entries()) {
          if (lockInfo.userId === user.id) {
            session.locks.delete(nodeId);
            socket.to(sessionId).emit('node-unlocked', { nodeId });
          }
        }
        
        socket.leave(sessionId);
        socket.sessionId = null;
        
        // 다른 사용자들에게 알림
        socket.to(sessionId).emit('user-left', user.id);
        
        logInfo('사용자 세션 나감', { userName: user.name, sessionId });
      }
      
      if (callback) callback({ success: true });
    } catch (error) {
      logError(error, { context: 'Session leave failed' });
      if (callback) callback({ success: false, error: CONFIG.ERRORS.SESSION_NOT_FOUND });
    }
  });

  // 동기화 이벤트 처리
  socket.on('sync-event', (event) => {
    try {
      const { sessionId, type, data, timestamp } = event;
      const session = sessions.get(sessionId);
      
      if (!session) {
        return;
      }
      
      // 이벤트 히스토리 저장
      session.history.push({
        ...event,
        receivedAt: Date.now()
      });
      
      // 최대 히스토리 크기까지만 저장
      if (session.history.length > CONFIG.SESSION.HISTORY_MAX_SIZE) {
        session.history = session.history.slice(-CONFIG.SESSION.HISTORY_MAX_SIZE);
      }
      
      session.lastActivity = Date.now();
      
      // 워크플로우 업데이트인 경우 세션 상태 업데이트
      if (type === 'workflow-update') {
        session.workflow = { ...session.workflow, ...data };
      }
      
      // 다른 사용자들에게 전송
      socket.to(sessionId).emit('sync-event', event);
      
      // 충돌 감지 및 해결
      handleConflictResolution(session, event);
      
    } catch (error) {
      logError(error, { context: 'Sync event processing failed' });
    }
  });

  // 노드 잠금 요청
  socket.on('lock-node', (data) => {
    try {
      const { sessionId, nodeId } = data;
      const session = sessions.get(sessionId);
      
      if (!session) {
        return;
      }
      
      const existingLock = session.locks.get(nodeId);
      
      if (existingLock && existingLock.userId !== user.id) {
        // 이미 다른 사용자가 잠금
        socket.emit('lock-denied', { nodeId, lockedBy: existingLock.userId });
        return;
      }
      
      // 잠금 설정
      session.locks.set(nodeId, {
        userId: user.id,
        timestamp: Date.now()
      });
      
      socket.emit('lock-granted', { nodeId });
      socket.to(sessionId).emit('node-locked', { nodeId, userId: user.id });
      
    } catch (error) {
      logError(error, { context: 'Node lock failed' });
    }
  });

  // 노드 잠금 해제
  socket.on('unlock-node', (data) => {
    try {
      const { sessionId, nodeId } = data;
      const session = sessions.get(sessionId);
      
      if (!session) {
        return;
      }
      
      const existingLock = session.locks.get(nodeId);
      
      if (existingLock && existingLock.userId === user.id) {
        session.locks.delete(nodeId);
        socket.to(sessionId).emit('node-unlocked', { nodeId });
      }
      
    } catch (error) {
      logError(error, { context: 'Node unlock failed' });
    }
  });

  // 활성 세션 목록 요청
  socket.on('get-active-sessions', (data, callback) => {
    try {
      const activeSessions = Array.from(sessions.values())
        .filter(session => session.users.size > 0)
        .map(session => ({
          id: session.id,
          name: session.name,
          userCount: session.users.size,
          users: Array.from(session.users.values()),
          createdAt: session.createdAt,
          lastActivity: session.lastActivity
        }));
      
      callback({ success: true, sessions: activeSessions });
    } catch (error) {
      logError(error, { context: 'Get active sessions failed' });
      callback({ success: false, error: '세션 목록을 가져올 수 없습니다.' });
    }
  });

  // 채팅 메시지
  socket.on('chat-message', (data) => {
    try {
      if (socket.sessionId) {
        const message = {
          id: generateMessageId(),
          user: socket.user,
          message: data.message,
          timestamp: Date.now()
        };
        
        io.to(socket.sessionId).emit('chat-message', message);
      }
    } catch (error) {
      logError(error, { context: 'Chat message failed' });
    }
  });

  // 연결 해제
  socket.on('disconnect', () => {
    logInfo('사용자 연결 해제됨', { socketId: socket.id });
    
    activeUsers.delete(socket.id);
    
    if (socket.sessionId) {
      const session = sessions.get(socket.sessionId);
      if (session) {
        session.users.delete(socket.id);
        session.lastActivity = Date.now();
        
        // 잠긴 노드들 해제
        for (const [nodeId, lockInfo] of session.locks.entries()) {
          if (lockInfo.userId === user.id) {
            session.locks.delete(nodeId);
            socket.to(socket.sessionId).emit('node-unlocked', { nodeId });
          }
        }
        
        // 다른 사용자들에게 알림
        socket.to(socket.sessionId).emit('user-left', user.id);
        
        // 빈 세션 정리 (즉시 삭제하지 않고 타임아웃 후 정리)
        if (session.users.size === 0) {
          session.lastActivity = Date.now();
        }
      }
    }
  });
});

// 유틸리티 함수들
function generateSessionId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function generateMessageId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function handleConflictResolution(session, event) {
  // 충돌 해결 로직 구현
  // 현재는 단순히 타임스탬프 기반으로 최신 것을 적용
  // 실제 구현에서는 더 정교한 충돌 해결 알고리즘 필요
}

// 기본 라우트 (SPA 지원)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// 에러 핸들링
app.use((err, req, res, next) => {
  logError(err, { context: 'Unhandled server error', url: req.originalUrl });
  res.status(500).json({ error: '서버 오류가 발생했습니다.' });
});

// 404 핸들링
app.use((req, res) => {
  res.status(404).json({ error: '요청한 리소스를 찾을 수 없습니다.' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logInfo(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});

// module.exports = app;