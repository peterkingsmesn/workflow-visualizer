// Server Configuration Constants
require('dotenv').config();

module.exports = {
  // Server Settings
  SERVER: {
    PORT: parseInt(process.env.SERVER_PORT) || 3001,
    NODE_ENV: process.env.NODE_ENV || 'development'
  },

  // Session Configuration
  SESSION: {
    TIMEOUT_MS: parseInt(process.env.SESSION_TIMEOUT_MS) || 1800000, // 30 minutes
    CLEANUP_INTERVAL_MS: parseInt(process.env.SESSION_CLEANUP_INTERVAL_MS) || 300000, // 5 minutes
    HISTORY_MAX_SIZE: parseInt(process.env.SESSION_HISTORY_MAX_SIZE) || 1000,
    SECRET: process.env.SESSION_SECRET // Required - no default value
  },

  // File Upload Configuration
  UPLOAD: {
    MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB) || 50,
    MAX_FILE_SIZE_BYTES: (parseInt(process.env.MAX_FILE_SIZE_MB) || 50) * 1024 * 1024,
    MAX_CHUNK_SIZE_MB: parseInt(process.env.MAX_CHUNK_SIZE_MB) || 1,
    MAX_CHUNK_SIZE_BYTES: (parseInt(process.env.MAX_CHUNK_SIZE_MB) || 1) * 1024 * 1024,
    MAX_CONCURRENT_UPLOADS: parseInt(process.env.MAX_CONCURRENT_UPLOADS) || 3,
    RETRY_ATTEMPTS: parseInt(process.env.UPLOAD_RETRY_ATTEMPTS) || 3,
    MAX_FILES: parseInt(process.env.MAX_UPLOAD_FILES) || 10,
    UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads'
  },

  // Rate Limiting Configuration
  RATE_LIMIT: {
    WINDOWS: {
      GENERAL_MS: parseInt(process.env.RATE_LIMIT_WINDOW_GENERAL_MS) || 900000, // 15 minutes
      UPLOAD_MS: parseInt(process.env.RATE_LIMIT_WINDOW_UPLOAD_MS) || 3600000, // 1 hour
      ANALYSIS_MS: parseInt(process.env.RATE_LIMIT_WINDOW_ANALYSIS_MS) || 300000, // 5 minutes
      IP_MS: parseInt(process.env.RATE_LIMIT_WINDOW_IP_MS) || 60000 // 1 minute
    },
    MAX_REQUESTS: {
      GENERAL: parseInt(process.env.RATE_LIMIT_MAX_GENERAL) || 100,
      STRICT: parseInt(process.env.RATE_LIMIT_MAX_STRICT) || 5,
      LENIENT: parseInt(process.env.RATE_LIMIT_MAX_LENIENT) || 1000,
      UPLOAD: parseInt(process.env.RATE_LIMIT_MAX_UPLOAD) || 10,
      ANALYSIS: parseInt(process.env.RATE_LIMIT_MAX_ANALYSIS) || 3,
      IP: parseInt(process.env.RATE_LIMIT_MAX_IP) || 60
    }
  },

  // API Endpoints
  API: {
    BASE_PATH: '/api',
    ENDPOINTS: {
      WORKFLOWS: '/workflows',
      FILES: '/files',
      COLLABORATION: '/collaboration',
      EXPORT: '/export',
      ANALYSIS: '/analysis',
      DIAGNOSE: '/diagnose',
      UPLOAD: '/upload'
    }
  },

  // Error Messages
  ERRORS: {
    FILE_NOT_UPLOADED: '파일이 업로드되지 않았습니다.',
    SESSION_NOT_FOUND: '세션을 찾을 수 없습니다.',
    SERVER_ERROR: '서버 오류가 발생했습니다.',
    RESOURCE_NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
    RATE_LIMIT_EXCEEDED: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
    API_LIMIT_EXCEEDED: 'API 호출 한도를 초과했습니다. 15분 후 다시 시도해주세요.',
    SECURITY_LIMIT_EXCEEDED: '보안상 이 작업은 제한됩니다. 15분 후 다시 시도해주세요.',
    LENIENT_LIMIT_EXCEEDED: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
    UPLOAD_LIMIT_EXCEEDED: '업로드 한도를 초과했습니다. 1시간 후 다시 시도해주세요.',
    ANALYSIS_LIMIT_EXCEEDED: '분석 작업 한도를 초과했습니다. 5분 후 다시 시도해주세요.',
    IP_LIMIT_EXCEEDED: 'IP별 요청 한도를 초과했습니다. 1분 후 다시 시도해주세요.'
  },

  // WebSocket Configuration
  WEBSOCKET: {
    HEARTBEAT_INTERVAL: parseInt(process.env.WS_HEARTBEAT_INTERVAL) || 30000,
    MAX_CONNECTIONS: parseInt(process.env.WS_MAX_CONNECTIONS) || 100
  },

  // Logging Configuration
  LOGGING: {
    LEVEL: process.env.LOG_LEVEL || 'info',
    FILE: process.env.LOG_FILE || './logs/app.log'
  },

  // Security Configuration
  SECURITY: {
    JWT_SECRET: process.env.JWT_SECRET, // Required - no default value
    ENABLE_CORS: process.env.ENABLE_CORS === 'true',
    ENABLE_HELMET: process.env.ENABLE_HELMET === 'true'
  },

  // Development Tools
  DEV_TOOLS: {
    ENABLE_MORGAN_LOGGING: process.env.ENABLE_MORGAN_LOGGING === 'true'
  },

  // Diagnose Configuration
  DIAGNOSE: {
    TIMEOUT: parseInt(process.env.DIAGNOSE_TIMEOUT) || 300000,
    MAX_FILES: parseInt(process.env.DIAGNOSE_MAX_FILES) || 1000
  }
};