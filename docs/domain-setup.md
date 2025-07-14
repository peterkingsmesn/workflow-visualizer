# 🌐 도메인 DNS 설정 가이드

## 📋 개요

`halowf.com` 도메인을 Workflow Visualizer 서비스에 연결하기 위한 DNS 설정 가이드입니다.

## 🎯 도메인 구조

```
halowf.com                    → 메인 랜딩 페이지
api.halowf.com               → API 서버 (백엔드)
docs.halowf.com              → 문서 사이트
dashboard.halowf.com         → 사용자 대시보드
download.halowf.com          → 다운로드 페이지
```

## ☁️ 호스팅 인프라

### 추천 구성
- **Frontend**: Vercel (halowf.com)
- **Backend**: Railway/Render (api.halowf.com) 
- **Database**: Supabase/PlanetScale
- **CDN**: Cloudflare

## 🔧 DNS 레코드 설정

### A 레코드
```
Type: A
Name: @
Value: 76.76.19.61    # Vercel IP (예시)
TTL: 300
```

### CNAME 레코드
```
# API 서버
Type: CNAME
Name: api
Value: api-production-xxxx.up.railway.app
TTL: 300

# 문서 사이트
Type: CNAME  
Name: docs
Value: docs-workflow-visualizer.vercel.app
TTL: 300

# 대시보드
Type: CNAME
Name: dashboard
Value: dashboard-workflow-visualizer.vercel.app
TTL: 300

# 다운로드 페이지
Type: CNAME
Name: download
Value: download-workflow-visualizer.vercel.app
TTL: 300
```

### MX 레코드 (이메일)
```
Type: MX
Name: @
Value: mx1.improvmx.com    # 무료 이메일 포워딩
Priority: 10
TTL: 300

Type: MX
Name: @
Value: mx2.improvmx.com
Priority: 20
TTL: 300
```

### TXT 레코드
```
# 도메인 소유권 확인
Type: TXT
Name: @
Value: "v=spf1 include:_spf.google.com ~all"
TTL: 300

# DKIM (이메일 인증)
Type: TXT
Name: default._domainkey
Value: "v=DKIM1; k=rsa; p=YOUR_DKIM_PUBLIC_KEY"
TTL: 300
```

## 🚀 Vercel 배포 설정

### 1. Vercel 프로젝트 생성
```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 배포
cd /path/to/workflow-visualizer
vercel --prod
```

### 2. 커스텀 도메인 추가
```bash
# Vercel 대시보드에서:
# Settings → Domains → Add Domain
# halowf.com 입력 후 DNS 설정 안내 따르기
```

### 3. 환경 변수 설정
```bash
# Vercel 환경 변수
VITE_API_URL=https://api.halowf.com
VITE_GUMROAD_PRODUCT_URL=https://spiderverse10.gumroad.com/l/workflow-visualizer
VITE_DOWNLOAD_BASE_URL=https://github.com/peterkingsmesn/workflow-visualizer/releases/latest
```

## 🖥️ 백엔드 서버 배포

### Railway 배포
```bash
# Railway CLI 설치
npm install -g @railway/cli

# 로그인 및 프로젝트 생성
railway login
railway init
railway add

# 환경 변수 설정
railway variables set DATABASE_URL="postgresql://..."
railway variables set GUMROAD_API_KEY="your_key"
railway variables set SENDGRID_API_KEY="your_key"

# 배포
railway up
```

### 환경 변수 (백엔드)
```bash
# 데이터베이스
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Gumroad
GUMROAD_API_KEY=your_gumroad_api_key
GUMROAD_WEBHOOK_SECRET=your_webhook_secret

# 이메일
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@halowf.com

# 라이센스 암호화
LICENSE_ENCRYPTION_KEY=your_32_char_key
LICENSE_ENCRYPTION_IV=your_16_char_iv

# CORS
ALLOWED_ORIGINS=https://halowf.com,https://dashboard.halowf.com

# 세션
SESSION_SECRET=your_session_secret
```

## 🔒 SSL/TLS 인증서

### Cloudflare 설정 (추천)
1. **Cloudflare 계정 생성**
2. **도메인 추가** → NS 서버 변경
3. **SSL/TLS 설정**:
   - Encryption Mode: **Full (strict)**
   - Always Use HTTPS: **On**
   - HSTS: **Enable**

### Let's Encrypt (수동 설정)
```bash
# Certbot 설치 (Ubuntu/Debian)
sudo apt install certbot

# 인증서 발급
sudo certbot certonly --standalone -d halowf.com -d api.halowf.com
```

## 📧 이메일 설정

### ImprovMX (무료 이메일 포워딩)
1. **ImprovMX 계정 생성**: https://improvmx.com
2. **도메인 추가**: halowf.com
3. **이메일 별칭 설정**:
   ```
   support@halowf.com    → your-email@gmail.com
   noreply@halowf.com    → your-email@gmail.com
   admin@halowf.com      → your-email@gmail.com
   ```

### SendGrid DKIM 설정
1. **SendGrid 대시보드** → **Settings** → **Sender Authentication**
2. **Domain Authentication** → **Authenticate Your Domain**
3. **DNS 레코드 추가** (SendGrid 제공)

## 🧪 테스트 및 검증

### DNS 전파 확인
```bash
# DNS 조회 테스트
nslookup halowf.com
dig halowf.com
dig api.halowf.com

# 온라인 도구
# https://dnschecker.org
# https://www.whatsmydns.net
```

### SSL 인증서 확인
```bash
# SSL 상태 확인
curl -I https://halowf.com
openssl s_client -connect halowf.com:443 -servername halowf.com
```

### 이메일 테스트
```bash
# 이메일 전송 테스트
curl -X POST https://api.halowf.com/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## 📊 모니터링 설정

### Uptime 모니터링
- **UptimeRobot**: 무료 모니터링 서비스
- **체크 대상**:
  - https://halowf.com
  - https://api.halowf.com/health
  - https://dashboard.halowf.com

### 성능 모니터링
```javascript
// Google Analytics 4
gtag('config', 'GA_MEASUREMENT_ID', {
  page_title: 'Workflow Visualizer',
  page_location: 'https://halowf.com'
});

// 성능 메트릭
window.addEventListener('load', () => {
  const perfData = performance.getEntriesByType('navigation')[0];
  gtag('event', 'page_load_time', {
    value: Math.round(perfData.loadEventEnd - perfData.fetchStart)
  });
});
```

## 🔄 배포 자동화

### GitHub Actions (도메인 연결 후)
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
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          VITE_API_URL: https://api.halowf.com
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 📋 완료 체크리스트

### DNS 설정
- [ ] A 레코드 설정 (@ → Vercel IP)
- [ ] CNAME 레코드 설정 (api, docs, dashboard)
- [ ] MX 레코드 설정 (이메일)
- [ ] TXT 레코드 설정 (SPF, DKIM)

### 배포 설정
- [ ] Vercel 프로젝트 생성 및 배포
- [ ] 커스텀 도메인 연결
- [ ] 백엔드 서버 배포 (Railway/Render)
- [ ] 데이터베이스 연결

### 보안 설정
- [ ] SSL/TLS 인증서 설정
- [ ] HTTPS 강제 리디렉션
- [ ] CORS 설정
- [ ] 환경 변수 보안

### 이메일 설정
- [ ] 이메일 포워딩 설정
- [ ] SendGrid 도메인 인증
- [ ] 이메일 템플릿 설정

### 테스트
- [ ] DNS 전파 확인
- [ ] SSL 인증서 검증
- [ ] 이메일 발송 테스트
- [ ] API 엔드포인트 테스트

모든 설정이 완료되면 `halowf.com`으로 완전한 프로덕션 서비스를 제공할 수 있습니다! 🎉