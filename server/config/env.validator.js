// 환경 변수 검증 시스템
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'SESSION_SECRET',
  'REDIS_URL',
  'SENDGRID_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_ID_PRO',
  'STRIPE_PRICE_ID_ENTERPRISE',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'CLIENT_URL',
  'SERVER_URL'
];

const optionalEnvVars = [
  'LOG_LEVEL',
  'SENTRY_DSN',
  'ANALYTICS_KEY'
];

class EnvValidator {
  static validate() {
    const missing = [];
    const warnings = [];

    // 필수 환경 변수 검증
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        missing.push(envVar);
      }
    }

    // 보안 검증
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      warnings.push('JWT_SECRET should be at least 32 characters long');
    }

    if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
      warnings.push('SESSION_SECRET should be at least 32 characters long');
    }

    // 프로덕션 환경 추가 검증
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.SENTRY_DSN) {
        warnings.push('SENTRY_DSN is recommended for production error tracking');
      }
      
      if (process.env.CLIENT_URL && process.env.CLIENT_URL.includes('localhost')) {
        warnings.push('CLIENT_URL contains localhost in production');
      }
    }

    return { missing, warnings };
  }

  static generateSecureSecret() {
    const crypto = require('crypto');
    return crypto.randomBytes(64).toString('hex');
  }

  static printValidationReport() {
    const { missing, warnings } = this.validate();

    if (missing.length > 0) {
      console.error('\n❌ Missing required environment variables:');
      missing.forEach(envVar => {
        console.error(`   - ${envVar}`);
      });
      console.error('\n💡 Create a .env file with these variables or set them in your environment.');
      console.error('   Example: cp .env.example .env\n');
      
      // 시크릿 생성 도움말
      if (missing.includes('JWT_SECRET') || missing.includes('SESSION_SECRET')) {
        console.log('🔐 Generate secure secrets with:');
        console.log(`   JWT_SECRET="${this.generateSecureSecret()}"`);
        console.log(`   SESSION_SECRET="${this.generateSecureSecret()}"\n`);
      }
      
      process.exit(1);
    }

    if (warnings.length > 0) {
      console.warn('\n⚠️  Environment warnings:');
      warnings.forEach(warning => {
        console.warn(`   - ${warning}`);
      });
      console.warn('');
    }

    console.log('✅ Environment variables validated successfully\n');
  }
}

module.exports = EnvValidator;