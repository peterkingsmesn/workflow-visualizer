// 간단한 로깅 시스템 (winston 없이)
const fs = require('fs');
const path = require('path');

// 로그 레벨
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  HTTP: 3,
  DEBUG: 4,
};

// 현재 로그 레벨
const currentLevel = process.env.LOG_LEVEL ? 
  LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] : 
  (process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG);

// 색상 코드
const colors = {
  error: '\x1b[31m',
  warn: '\x1b[33m',
  info: '\x1b[32m',
  http: '\x1b[35m',
  debug: '\x1b[36m',
  reset: '\x1b[0m'
};

// 로그 포맷터
const formatLog = (level, message, data = {}) => {
  const timestamp = new Date().toISOString();
  const dataStr = Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : '';
  return `${timestamp} [${level.toUpperCase()}]: ${message}${dataStr}`;
};

// 콘솔에 색상과 함께 출력
const logToConsole = (level, message, data) => {
  if (LOG_LEVELS[level.toUpperCase()] <= currentLevel) {
    const color = colors[level] || colors.reset;
    console.log(`${color}${formatLog(level, message, data)}${colors.reset}`);
  }
};

// 파일에 로그 쓰기 (프로덕션 환경)
const logToFile = (level, message, data) => {
  if (process.env.NODE_ENV === 'production') {
    const logsDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const logFile = level === 'error' ? 'error.log' : 'combined.log';
    const logPath = path.join(logsDir, logFile);
    const logEntry = formatLog(level, message, data) + '\n';
    
    fs.appendFile(logPath, logEntry, (err) => {
      if (err) console.error('Failed to write log:', err);
    });
  }
};

// Logger 객체
const logger = {
  error: (message, data) => {
    logToConsole('error', message, data);
    logToFile('error', message, data);
  },
  warn: (message, data) => {
    logToConsole('warn', message, data);
    logToFile('warn', message, data);
  },
  info: (message, data) => {
    logToConsole('info', message, data);
    logToFile('info', message, data);
  },
  http: (message, data) => {
    logToConsole('http', message, data);
    logToFile('http', message, data);
  },
  debug: (message, data) => {
    logToConsole('debug', message, data);
  }
};

// Express 요청 로깅을 위한 미들웨어
const httpLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
    
    if (res.statusCode >= 400) {
      logger.error(message);
    } else if (res.statusCode >= 300) {
      logger.warn(message);
    } else {
      logger.http(message);
    }
  });
  
  next();
};

// 구조화된 로깅 헬퍼 함수
const logError = (error, context = {}) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    ...context
  };
  logger.error(error.message, errorData);
};

const logInfo = (message, data = {}) => {
  logger.info(message, data);
};

const logDebug = (message, data = {}) => {
  logger.debug(message, data);
};

const logWarn = (message, data = {}) => {
  logger.warn(message, data);
};

module.exports = {
  logger,
  httpLogger,
  logError,
  logInfo,
  logDebug,
  logWarn
};