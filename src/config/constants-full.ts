// 🚀 Complete Client Configuration Constants - All Features Restored

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
    MAX_FILE_SIZE_MB: parseInt(import.meta.env.VITE_MAX_FILE_SIZE_MB) || 50,
    MAX_CHUNK_SIZE_MB: parseInt(import.meta.env.VITE_MAX_CHUNK_SIZE_MB) || 1,
    MAX_CONCURRENT_UPLOADS: parseInt(import.meta.env.VITE_MAX_CONCURRENT_UPLOADS) || 3,
    RETRY_ATTEMPTS: parseInt(import.meta.env.VITE_UPLOAD_RETRY_ATTEMPTS) || 3,
    MAX_FILES: parseInt(import.meta.env.VITE_MAX_UPLOAD_FILES) || 10
  },

  // Performance Configuration
  PERFORMANCE: {
    MONITOR_INTERVAL_MS: parseInt(import.meta.env.VITE_PERFORMANCE_MONITOR_INTERVAL_MS) || 5000,
    DATA_RETENTION_MS: parseInt(import.meta.env.VITE_PERFORMANCE_DATA_RETENTION_MS) || 86400000, // 24 hours
    THRESHOLDS: {
      MEMORY: parseFloat(import.meta.env.VITE_PERFORMANCE_MEMORY_THRESHOLD) || 0.8,
      RENDER_TIME_MS: parseInt(import.meta.env.VITE_PERFORMANCE_RENDER_TIME_MS) || 16,
      NETWORK_RESPONSE_MS: parseInt(import.meta.env.VITE_PERFORMANCE_NETWORK_RESPONSE_MS) || 2000,
      INTERACTION_RESPONSE_MS: parseInt(import.meta.env.VITE_PERFORMANCE_INTERACTION_RESPONSE_MS) || 100,
      CACHE_HIT_RATE: parseFloat(import.meta.env.VITE_PERFORMANCE_CACHE_HIT_RATE) || 0.8,
      ERROR_RATE: parseFloat(import.meta.env.VITE_PERFORMANCE_ERROR_RATE) || 0.02
    },
    SCORING: {
      MEMORY_PENALTY: parseInt(import.meta.env.VITE_PERFORMANCE_MEMORY_PENALTY) || 50,
      RENDER_PENALTY: parseInt(import.meta.env.VITE_PERFORMANCE_RENDER_PENALTY) || 2,
      NETWORK_DIVISOR: parseInt(import.meta.env.VITE_PERFORMANCE_NETWORK_DIVISOR) || 100,
      CACHE_BONUS: parseInt(import.meta.env.VITE_PERFORMANCE_CACHE_BONUS) || 20
    }
  },

  // Color Accessibility Configuration
  COLOR: {
    CONTRAST_RATIO_AA: parseFloat(import.meta.env.VITE_COLOR_CONTRAST_RATIO_AA) || 4.5,
    CONTRAST_RATIO_AAA: parseFloat(import.meta.env.VITE_COLOR_CONTRAST_RATIO_AAA) || 7.0,
    YIQ_BRIGHTNESS_THRESHOLD: parseInt(import.meta.env.VITE_COLOR_YIQ_BRIGHTNESS_THRESHOLD) || 128
  },

  // Rate Limiting Configuration
  RATE_LIMITING: {
    WINDOW: {
      GENERAL_MS: parseInt(import.meta.env.VITE_RATE_LIMIT_WINDOW_GENERAL_MS) || 900000, // 15분
      UPLOAD_MS: parseInt(import.meta.env.VITE_RATE_LIMIT_WINDOW_UPLOAD_MS) || 600000,   // 10분
      ANALYSIS_MS: parseInt(import.meta.env.VITE_RATE_LIMIT_WINDOW_ANALYSIS_MS) || 300000, // 5분
      IP_MS: parseInt(import.meta.env.VITE_RATE_LIMIT_WINDOW_IP_MS) || 86400000,       // 24시간
    },
    MAX: {
      GENERAL: parseInt(import.meta.env.VITE_RATE_LIMIT_MAX_GENERAL) || 100,
      STRICT: parseInt(import.meta.env.VITE_RATE_LIMIT_MAX_STRICT) || 20,
      LENIENT: parseInt(import.meta.env.VITE_RATE_LIMIT_MAX_LENIENT) || 200,
      UPLOAD: parseInt(import.meta.env.VITE_RATE_LIMIT_MAX_UPLOAD) || 50,
      ANALYSIS: parseInt(import.meta.env.VITE_RATE_LIMIT_MAX_ANALYSIS) || 30,
      IP: parseInt(import.meta.env.VITE_RATE_LIMIT_MAX_IP) || 1000
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
    MAX_ZOOM: parseFloat(import.meta.env.VITE_UI_MAX_ZOOM) || 3.0,
    MIN_ZOOM: parseFloat(import.meta.env.VITE_UI_MIN_ZOOM) || 0.1
  },

  // Session Configuration
  SESSION: {
    TIMEOUT_MS: parseInt(import.meta.env.VITE_SESSION_TIMEOUT_MS) || 1800000, // 30분
    HISTORY_MAX_SIZE: parseInt(import.meta.env.VITE_SESSION_HISTORY_MAX_SIZE) || 50
  },

  // Virtualization Configuration
  VIRTUALIZATION: {
    DEFAULT_ITEM_HEIGHT: 50,
    OVERSCAN_COUNT: 5,
    CACHE_SIZE: 1000,
    THRESHOLD_ITEMS: 100, // 100개 이상일 때 가상화 활성화
  },

  // Analysis Configuration
  ANALYSIS: {
    MAX_FILE_SIZE_FOR_PARSING: 10 * 1024 * 1024, // 10MB
    CHUNK_SIZE_FOR_LARGE_FILES: 1024 * 1024, // 1MB
    MAX_CONCURRENT_PARSERS: 4,
    TIMEOUT_MS: 30000,
  },

  // Feature Flags
  FEATURES: {
    ENABLE_VIRTUALIZATION: true,
    ENABLE_PERFORMANCE_MONITORING: true,
    ENABLE_ADVANCED_ANALYTICS: true,
    ENABLE_COLLABORATION: true,
    ENABLE_EXPORT: true,
    ENABLE_OFFLINE_MODE: true,
  }
};

// Helper functions
export const getApiUrl = (endpoint: string) => {
  return `${CONFIG.API.BASE_URL}${endpoint}`;
};

export const API_ROUTES = CONFIG.API.ENDPOINTS;

export default CONFIG;