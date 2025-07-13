# 프로덕션 배포 가이드

이 가이드는 Workflow Visualizer 애플리케이션을 프로덕션 환경에 배포하는 방법을 설명합니다.

## 📋 목차

1. [배포 전 체크리스트](#배포-전-체크리스트)
2. [환경 구성](#환경-구성)
3. [도메인 및 SSL 설정](#도메인-및-ssl-설정)
4. [데이터베이스 구성](#데이터베이스-구성)
5. [배포 방법](#배포-방법)
6. [모니터링 및 로깅](#모니터링-및-로깅)
7. [보안 설정](#보안-설정)
8. [성능 최적화](#성능-최적화)
9. [백업 및 복구](#백업-및-복구)
10. [트러블슈팅](#트러블슈팅)

## 🔍 배포 전 체크리스트

### 필수 확인사항
- [ ] 모든 환경 변수가 설정되어 있는지 확인
- [ ] 데이터베이스 연결 테스트 완료
- [ ] 외부 서비스 API 키 유효성 확인
- [ ] 보안 설정 검토 완료
- [ ] 백업 시스템 구성 완료
- [ ] 도메인 및 SSL 인증서 준비
- [ ] 모니터링 도구 설정 완료

### 테스트 체크리스트
- [ ] 단위 테스트 통과
- [ ] 통합 테스트 통과
- [ ] 성능 테스트 완료
- [ ] 보안 테스트 완료
- [ ] 브라우저 호환성 테스트 완료

## 🌐 환경 구성

### 1. 프로덕션 환경 변수 설정

프로덕션 환경을 위한 `.env.production` 파일을 생성합니다:

```env
# 기본 설정
NODE_ENV=production
PORT=3001
APP_URL=https://workflow-visualizer.com
API_URL=https://api.workflow-visualizer.com

# 데이터베이스
DATABASE_URL=postgresql://username:password@db-host:5432/workflow_visualizer

# 인증
JWT_SECRET=your-strong-jwt-secret-here
JWT_EXPIRES_IN=7d

# OAuth 설정
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://workflow-visualizer.com/auth/google/callback

# Stripe 설정
STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID_PRO=price_your_pro_price_id

# SendGrid 설정
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@workflow-visualizer.com
FROM_NAME=Workflow Visualizer

# Redis 설정
REDIS_HOST=redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# 보안 설정
CORS_ORIGIN=https://workflow-visualizer.com
SESSION_SECRET=your-strong-session-secret
```

### 2. 시스템 요구사항

**최소 시스템 요구사항:**
- CPU: 2 코어 이상
- RAM: 4GB 이상
- 디스크: 20GB 이상 (SSD 권장)
- 네트워크: 100Mbps 이상

**권장 시스템 요구사항:**
- CPU: 4 코어 이상
- RAM: 8GB 이상
- 디스크: 50GB 이상 (SSD)
- 네트워크: 1Gbps 이상

## 🔒 도메인 및 SSL 설정

### 1. 도메인 구성

**메인 도메인:**
- `workflow-visualizer.com` - 프론트엔드
- `api.workflow-visualizer.com` - API 서버

**DNS 레코드 설정:**
```
A     workflow-visualizer.com      -> 서버 IP
A     api.workflow-visualizer.com  -> 서버 IP
CNAME www.workflow-visualizer.com  -> workflow-visualizer.com
```

### 2. SSL 인증서 설정

**Let's Encrypt 사용 (추천):**
```bash
# Certbot 설치
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# 인증서 발급
sudo certbot --nginx -d workflow-visualizer.com -d www.workflow-visualizer.com -d api.workflow-visualizer.com

# 자동 갱신 설정
sudo crontab -e
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🗄️ 데이터베이스 구성

### 1. PostgreSQL 설정

**프로덕션 PostgreSQL 설정:**
```sql
-- 데이터베이스 생성
CREATE DATABASE workflow_visualizer;

-- 전용 사용자 생성
CREATE USER workflow_user WITH ENCRYPTED PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE workflow_visualizer TO workflow_user;

-- 성능 설정
ALTER DATABASE workflow_visualizer SET timezone TO 'UTC';
ALTER DATABASE workflow_visualizer SET log_statement = 'all';
```

**postgresql.conf 최적화:**
```ini
# 연결 설정
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.7
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

### 2. 데이터베이스 마이그레이션

```bash
# 프로덕션 데이터베이스 마이그레이션
npm run db:migrate

# 초기 데이터 시딩
npm run db:seed
```

## 🚀 배포 방법

### 방법 1: Docker를 사용한 배포

**1. Docker 이미지 빌드:**
```bash
# 프로덕션 Docker 이미지 빌드
docker build -t workflow-visualizer:latest .

# 이미지 레지스트리에 푸시
docker tag workflow-visualizer:latest your-registry/workflow-visualizer:latest
docker push your-registry/workflow-visualizer:latest
```

**2. Docker Compose 설정:**
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    image: workflow-visualizer:latest
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=workflow_visualizer
      - POSTGRES_USER=workflow_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

**3. 배포 실행:**
```bash
# 프로덕션 환경 배포
docker-compose -f docker-compose.prod.yml up -d

# 헬스 체크
docker-compose -f docker-compose.prod.yml ps
```

### 방법 2: 전통적인 서버 배포

**1. 서버 준비:**
```bash
# Node.js 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 설치
npm install -g pm2

# 의존성 설치
npm ci --only=production
```

**2. 프로덕션 빌드:**
```bash
# 프론트엔드 빌드
npm run build

# 데이터베이스 마이그레이션
npm run db:migrate
```

**3. PM2로 애플리케이션 실행:**
```bash
# PM2 설정 파일 생성
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'workflow-visualizer',
    script: 'server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_file: '.env.production',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# 애플리케이션 시작
pm2 start ecosystem.config.js

# 부팅 시 자동 시작 설정
pm2 startup
pm2 save
```

## 🔧 Nginx 설정

**nginx.conf:**
```nginx
upstream app {
    server app:3001;
    keepalive 32;
}

server {
    listen 80;
    server_name workflow-visualizer.com www.workflow-visualizer.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name workflow-visualizer.com www.workflow-visualizer.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # 보안 헤더
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Gzip 압축
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # 정적 파일 처리
    location /static/ {
        alias /app/dist/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 프록시
    location /api/ {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # SPA 라우팅
    location / {
        try_files $uri $uri/ /index.html;
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 모니터링 및 로깅

### 1. 로그 설정

**Winston 로그 설정:**
```javascript
// server/lib/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

module.exports = logger;
```

### 2. 헬스 체크 엔드포인트

```javascript
// server/routes/health.js
const express = require('express');
const { redisClient } = require('../lib/redis');
const prisma = require('../lib/prisma');

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    // 데이터베이스 연결 확인
    await prisma.$queryRaw`SELECT 1`;
    
    // Redis 연결 확인
    await redisClient.ping();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;
```

### 3. 성능 모니터링

**New Relic 설정:**
```javascript
// newrelic.js
'use strict';

exports.config = {
  app_name: ['Workflow Visualizer'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info'
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization'
    ]
  }
};
```

## 🔐 보안 설정

### 1. 방화벽 설정

```bash
# UFW 방화벽 설정
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3001/tcp  # 직접 접근 차단
```

### 2. 보안 업데이트

```bash
# 자동 보안 업데이트 설정
sudo apt-get update
sudo apt-get install unattended-upgrades

# 설정 파일 편집
sudo dpkg-reconfigure unattended-upgrades
```

### 3. 침입 탐지 시스템

```bash
# Fail2ban 설치 및 설정
sudo apt-get install fail2ban

# 설정 파일 생성
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Nginx 로그 모니터링 설정
sudo cat > /etc/fail2ban/jail.local << EOF
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600
EOF
```

## ⚡ 성능 최적화

### 1. 캐시 전략

**Redis 캐시 설정:**
```javascript
// 캐시 전략 설정
const cacheStrategies = {
  userInfo: { ttl: 300 },      // 5분
  subscriptions: { ttl: 600 }, // 10분
  usage: { ttl: 60 },          // 1분
  invoices: { ttl: 1800 }      // 30분
};
```

### 2. 데이터베이스 최적화

```sql
-- 인덱스 생성
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);

-- 쿼리 성능 분석
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';
```

### 3. CDN 설정

**CloudFlare 설정:**
1. CloudFlare에 도메인 등록
2. DNS 설정 업데이트
3. 캐시 규칙 설정
4. 보안 규칙 설정

## 💾 백업 및 복구

### 1. 데이터베이스 백업

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="workflow_visualizer"

# 데이터베이스 백업
pg_dump -h localhost -U workflow_user -d $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# 파일 압축
gzip $BACKUP_DIR/db_backup_$DATE.sql

# 오래된 백업 파일 삭제 (7일 이상)
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

# 크론탭 설정
# 0 2 * * * /path/to/backup.sh
```

### 2. 자동 백업 스크립트

```bash
#!/bin/bash
# auto-backup.sh
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
S3_BUCKET="your-backup-bucket"

# 데이터베이스 백업
pg_dump -h localhost -U workflow_user -d workflow_visualizer | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Redis 백업
redis-cli --rdb $BACKUP_DIR/redis_$DATE.rdb

# S3에 업로드
aws s3 cp $BACKUP_DIR/db_$DATE.sql.gz s3://$S3_BUCKET/database/
aws s3 cp $BACKUP_DIR/redis_$DATE.rdb s3://$S3_BUCKET/redis/

# 로컬 백업 정리
find $BACKUP_DIR -name "*.sql.gz" -mtime +3 -delete
find $BACKUP_DIR -name "*.rdb" -mtime +3 -delete
```

## 🐛 트러블슈팅

### 1. 일반적인 문제 해결

**서버가 시작되지 않는 경우:**
```bash
# 로그 확인
pm2 logs workflow-visualizer

# 환경 변수 확인
pm2 env workflow-visualizer

# 포트 사용 확인
sudo netstat -tlnp | grep 3001
```

**데이터베이스 연결 문제:**
```bash
# PostgreSQL 상태 확인
sudo systemctl status postgresql

# 연결 테스트
psql -h localhost -U workflow_user -d workflow_visualizer
```

**Redis 연결 문제:**
```bash
# Redis 상태 확인
redis-cli ping

# Redis 로그 확인
tail -f /var/log/redis/redis-server.log
```

### 2. 성능 문제 해결

**높은 메모리 사용량:**
```bash
# 메모리 사용량 확인
pm2 monit

# 프로세스별 메모리 사용량
ps aux --sort=-%mem | head -20
```

**느린 응답 속도:**
```bash
# 네트워크 지연 확인
ping -c 4 your-domain.com

# 데이터베이스 성능 확인
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

## 📋 배포 후 확인사항

### 1. 기능 테스트
- [ ] 회원가입/로그인 테스트
- [ ] OAuth 로그인 테스트
- [ ] 결제 시스템 테스트
- [ ] 이메일 전송 테스트
- [ ] 파일 업로드 테스트

### 2. 성능 테스트
- [ ] 로드 테스트 실행
- [ ] 응답 시간 측정
- [ ] 동시 접속자 테스트
- [ ] 메모리 사용량 모니터링

### 3. 보안 테스트
- [ ] SSL 인증서 확인
- [ ] 보안 헤더 확인
- [ ] 취약점 스캔 실행
- [ ] 로그 모니터링 확인

## 🔄 지속적인 배포

### 1. CI/CD 파이프라인 설정

**GitHub Actions 설정:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /app
          git pull origin main
          npm ci --only=production
          npm run build
          pm2 restart workflow-visualizer
```

### 2. 롤백 계획

```bash
#!/bin/bash
# rollback.sh
BACKUP_DIR="/app/backups"
CURRENT_DIR="/app/current"
PREVIOUS_VERSION=$(ls -1 $BACKUP_DIR | tail -2 | head -1)

echo "롤백 시작: $PREVIOUS_VERSION"

# 현재 버전 백업
cp -r $CURRENT_DIR $BACKUP_DIR/rollback_$(date +%Y%m%d_%H%M%S)

# 이전 버전 복구
cp -r $BACKUP_DIR/$PREVIOUS_VERSION/* $CURRENT_DIR/

# 애플리케이션 재시작
pm2 restart workflow-visualizer

echo "롤백 완료"
```

## 📞 지원 및 문의

배포 과정에서 문제가 발생하거나 추가 도움이 필요한 경우:

- **이메일**: support@workflow-visualizer.com
- **문서**: https://docs.workflow-visualizer.com
- **GitHub Issues**: https://github.com/workflow-visualizer/issues

---

이 가이드를 따라 안전하고 효율적인 프로덕션 배포를 완료하세요. 배포 후에는 지속적인 모니터링과 유지보수가 중요합니다.