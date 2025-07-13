const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss');
const validator = require('validator');
const { body, validationResult } = require('express-validator');

// Rate limiting configurations
const createRateLimiter = (windowMs, max, message) => {
  // 개발 환경에서는 rate limiting 비활성화
  if (process.env.NODE_ENV === 'development') {
    return (req, res, next) => next();
  }
  
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: message,
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

// General API rate limiting
const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again later'
);

// Strict rate limiting for authentication endpoints
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 requests per windowMs
  'Too many authentication attempts, please try again later'
);

// File upload rate limiting
const uploadLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10, // limit each IP to 10 uploads per hour
  'Too many file uploads, please try again later'
);

// XSS protection middleware
const xssProtection = (req, res, next) => {
  // Clean request body
  if (req.body) {
    const cleanBody = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        cleanBody[key] = xss(value, {
          whiteList: {}, // No HTML tags allowed
          stripIgnoreTag: true,
          stripIgnoreTagBody: ['script']
        });
      } else {
        cleanBody[key] = value;
      }
    }
    req.body = cleanBody;
  }

  // Clean query parameters
  if (req.query) {
    const cleanQuery = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        cleanQuery[key] = xss(value, {
          whiteList: {},
          stripIgnoreTag: true,
          stripIgnoreTagBody: ['script']
        });
      } else {
        cleanQuery[key] = value;
      }
    }
    req.query = cleanQuery;
  }

  next();
};

// SQL injection protection middleware
const sqlInjectionProtection = (req, res, next) => {
  const checkForSQLInjection = (str) => {
    if (typeof str !== 'string') return false;
    
    const sqlPatterns = [
      /(\bSELECT\b|\bUNION\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
      /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,
      /['"]\s*;\s*--/i,
      /['"]\s*;\s*\/\*/i,
      /\bxp_\w+/i,
      /\bsp_\w+/i,
      /\bEXEC\b|\bEXECUTE\b/i
    ];
    
    return sqlPatterns.some(pattern => pattern.test(str));
  };

  // Check all string values in request
  const checkObject = (obj, path = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'string' && checkForSQLInjection(value)) {
        return res.status(400).json({
          error: 'Potential SQL injection detected',
          field: currentPath,
          message: 'Request contains suspicious SQL patterns'
        });
      }
      
      if (typeof value === 'object' && value !== null) {
        const result = checkObject(value, currentPath);
        if (result) return result;
      }
    }
  };

  if (req.body) checkObject(req.body);
  if (req.query) checkObject(req.query);
  if (req.params) checkObject(req.params);

  next();
};

// Input validation middleware
const validateInput = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(err => ({
          field: err.param,
          message: err.msg,
          value: err.value
        }))
      });
    }

    next();
  };
};

// Common validation rules
const validations = {
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email address'),
  
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  name: body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces')
};

// File upload security
const fileUploadSecurity = (req, res, next) => {
  const allowedMimeTypes = [
    'text/plain', 'text/javascript', 'text/css', 'text/html',
    'application/json', 'application/xml', 'application/zip',
    'application/x-zip-compressed', 'application/gzip',
    'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'
  ];

  const allowedExtensions = [
    'txt', 'js', 'jsx', 'ts', 'tsx', 'json', 'xml', 'css', 'html', 'htm',
    'py', 'java', 'c', 'cpp', 'h', 'hpp', 'php', 'cs', 'swift', 'kt',
    'scala', 'sh', 'bash', 'ps1', 'dockerfile', 'makefile', 'gradle',
    'pom', 'lock', 'gitignore', 'zip', 'tar', 'gz', 'jpg', 'jpeg', 'png', 'gif', 'svg'
  ];

  const files = req.files ? Object.values(req.files).flat() : [req.file];
  
  for (const file of files) {
    if (!file) continue;

    // Check file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      return res.status(400).json({
        error: 'File too large',
        message: 'Maximum file size is 100MB'
      });
    }

    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'File type not allowed'
      });
    }

    // Check file extension
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return res.status(400).json({
        error: 'Invalid file extension',
        message: 'File extension not allowed'
      });
    }
  }

  next();
};

// Security headers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

// Request logging for security monitoring
const securityLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request details
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${req.ip}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400) {
      console.warn(`[SECURITY] Error response: ${res.statusCode} ${req.method} ${req.path} - IP: ${req.ip} - Duration: ${duration}ms`);
    }
  });
  
  next();
};

module.exports = {
  // Rate limiters
  generalLimiter,
  authLimiter,
  uploadLimiter,
  
  // Security middleware
  xssProtection,
  sqlInjectionProtection,
  fileUploadSecurity,
  securityHeaders,
  securityLogger,
  
  // Validation
  validateInput,
  validations
};