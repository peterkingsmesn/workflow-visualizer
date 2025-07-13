// Simple Client Configuration Constants

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

  // Color Configuration
  COLOR: {
    YIQ_BRIGHTNESS_THRESHOLD: 128,
    CONTRAST_RATIO_AA: 4.5,
    CONTRAST_RATIO_AAA: 7.0,
  }
};

export const API_ROUTES = CONFIG.API.ENDPOINTS;

export const getApiUrl = (endpoint: string) => {
  return `${CONFIG.API.BASE_URL}${endpoint}`;
};
