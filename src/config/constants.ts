// Client Configuration Constants

export const CONFIG = {
  // API Configuration
  API: {
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    ENDPOINTS: {
      WORKFLOWS: '/api/workflows',
      FILES: '/api/files',
      COLLABORATION: '/api/collaboration',
      EXPORT: '/api/export',
      ANALYSIS: '/api/analysis',
      DIAGNOSE: '/api/diagnose',
      UPLOAD: '/api/upload',
      UPLOAD_INIT: '/api/upload/init',
      UPLOAD_CHUNK: '/api/upload/chunk',
      UPLOAD_FINALIZE: '/api/upload/finalize',
      UPLOAD_CANCEL: '/api/upload/cancel',
      UPLOAD_STATUS: '/api/upload/status'
    }
  },

  // Upload Configuration
  UPLOAD: {
    MAX_FILE_SIZE_MB: 50,
    MAX_CHUNK_SIZE_MB: 1,
    MAX_CONCURRENT_UPLOADS: 3,
    RETRY_ATTEMPTS: 3,
    MAX_FILES: 10
  },

  // Performance Configuration
  PERFORMANCE: {
    MONITOR_INTERVAL_MS: 5000,
    DATA_RETENTION_MS: 86400000, // 24 hours
    THRESHOLDS: {
      MEMORY: 0.8,
      RENDER_TIME_MS: 16,
      NETWORK_RESPONSE_MS: 2000,
      INTERACTION_RESPONSE_MS: 100,
      CACHE_HIT_RATE: 0.8,
      ERROR_RATE: 0.02
    },
    SCORING: {
      MEMORY_PENALTY: 50,
      RENDER_PENALTY: 2,
      NETWORK_DIVISOR: 100,
      CACHE_BONUS: 20
    }
  },

  // Color Accessibility Configuration
  COLOR: {
    CONTRAST_RATIO_AA: parseFloat(import.meta.env.VITE_COLOR_CONTRAST_RATIO_AA) || 4.5,
    CONTRAST_RATIO_AAA: parseFloat(import.meta.env.VITE_COLOR_CONTRAST_RATIO_AAA) || 7,
    YIQ_BRIGHTNESS_THRESHOLD: parseInt(import.meta.env.VITE_COLOR_YIQ_BRIGHTNESS_THRESHOLD) || 128
  },

  // Rate Limiting Configuration (for client-side awareness)
  RATE_LIMIT: {
    WINDOWS: {
      GENERAL_MS: parseInt(import.meta.env.VITE_RATE_LIMIT_WINDOW_GENERAL_MS) || 900000, // 15 minutes
      UPLOAD_MS: parseInt(import.meta.env.VITE_RATE_LIMIT_WINDOW_UPLOAD_MS) || 3600000, // 1 hour
      ANALYSIS_MS: parseInt(import.meta.env.VITE_RATE_LIMIT_WINDOW_ANALYSIS_MS) || 300000, // 5 minutes
      IP_MS: parseInt(import.meta.env.VITE_RATE_LIMIT_WINDOW_IP_MS) || 60000 // 1 minute
    },
    MAX_REQUESTS: {
      GENERAL: parseInt(import.meta.env.VITE_RATE_LIMIT_MAX_GENERAL) || 100,
      STRICT: parseInt(import.meta.env.VITE_RATE_LIMIT_MAX_STRICT) || 5,
      LENIENT: parseInt(import.meta.env.VITE_RATE_LIMIT_MAX_LENIENT) || 1000,
      UPLOAD: parseInt(import.meta.env.VITE_RATE_LIMIT_MAX_UPLOAD) || 10,
      ANALYSIS: parseInt(import.meta.env.VITE_RATE_LIMIT_MAX_ANALYSIS) || 3,
      IP: parseInt(import.meta.env.VITE_RATE_LIMIT_MAX_IP) || 60
    }
  },

  // WebSocket Configuration
  WEBSOCKET: {
    HEARTBEAT_INTERVAL: parseInt(import.meta.env.VITE_WS_HEARTBEAT_INTERVAL) || 30000,
    RECONNECT_DELAY: parseInt(import.meta.env.VITE_WS_RECONNECT_DELAY) || 3000,
    MAX_RECONNECT_ATTEMPTS: parseInt(import.meta.env.VITE_WS_MAX_RECONNECT_ATTEMPTS) || 5
  },

  // UI Configuration
  UI: {
    DEBOUNCE_DELAY: parseInt(import.meta.env.VITE_UI_DEBOUNCE_DELAY) || 300,
    TOAST_DURATION: parseInt(import.meta.env.VITE_UI_TOAST_DURATION) || 5000,
    ANIMATION_DURATION: parseInt(import.meta.env.VITE_UI_ANIMATION_DURATION) || 300,
    MAX_ZOOM: parseFloat(import.meta.env.VITE_UI_MAX_ZOOM) || 2,
    MIN_ZOOM: parseFloat(import.meta.env.VITE_UI_MIN_ZOOM) || 0.1
  },

  // Session Configuration
  SESSION: {
    TIMEOUT_MS: parseInt(import.meta.env.VITE_SESSION_TIMEOUT_MS) || 1800000, // 30 minutes
    HISTORY_MAX_SIZE: parseInt(import.meta.env.VITE_SESSION_HISTORY_MAX_SIZE) || 1000
  }
} as const;

// Error Messages
export const ERROR_MESSAGES = {
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
} as const;

// API Routes Helper
export const API_ROUTES = {
  workflows: () => CONFIG.API.ENDPOINTS.WORKFLOWS,
  files: () => CONFIG.API.ENDPOINTS.FILES,
  collaboration: () => CONFIG.API.ENDPOINTS.COLLABORATION,
  export: () => CONFIG.API.ENDPOINTS.EXPORT,
  analysis: () => CONFIG.API.ENDPOINTS.ANALYSIS,
  diagnose: () => CONFIG.API.ENDPOINTS.DIAGNOSE,
  upload: () => CONFIG.API.ENDPOINTS.UPLOAD,
  uploadInit: () => CONFIG.API.ENDPOINTS.UPLOAD_INIT,
  uploadChunk: () => CONFIG.API.ENDPOINTS.UPLOAD_CHUNK,
  uploadFinalize: () => CONFIG.API.ENDPOINTS.UPLOAD_FINALIZE,
  uploadCancel: () => CONFIG.API.ENDPOINTS.UPLOAD_CANCEL,
  uploadStatus: (uploadId: string) => `${CONFIG.API.ENDPOINTS.UPLOAD_STATUS}/${uploadId}`
} as const;

// Full URL Helper
export const getApiUrl = (endpoint: string): string => {
  return `${CONFIG.API.BASE_URL}${endpoint}`;
};