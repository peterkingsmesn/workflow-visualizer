# 서버 과부하 방지를 위한 확장성 가이드

## 1. 프론트엔드 최적화

### 코드 스플리팅
```javascript
// React.lazy를 사용한 동적 임포트
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Editor = React.lazy(() => import('./pages/Editor'));
```

### 이미지 최적화
- WebP 포맷 사용
- 레이지 로딩 구현
- 적절한 크기로 리사이징

### 번들 크기 최소화
```bash
# 빌드 최적화
npm run build -- --analyze
```

## 2. 백엔드 아키텍처

### 로드 밸런싱
```nginx
upstream backend {
    least_conn;
    server backend1.example.com weight=5;
    server backend2.example.com;
    server backend3.example.com;
}
```

### 캐싱 전략
1. **CDN 사용** (CloudFlare, AWS CloudFront)
2. **Redis 캐싱**
```javascript
// Redis 캐싱 예제
const cached = await redis.get(key);
if (cached) return cached;
```

3. **브라우저 캐싱**
```javascript
// Service Worker 캐싱
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

## 3. 데이터베이스 최적화

### 인덱싱
```sql
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_created_at ON logs(created_at);
```

### 연결 풀링
```javascript
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'mydb'
});
```

## 4. 서버 구성

### Auto Scaling (AWS 예제)
```yaml
# Auto Scaling 설정
MinSize: 2
MaxSize: 10
DesiredCapacity: 4
TargetCPUUtilization: 70
```

### 컨테이너화 (Docker)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### Kubernetes 배포
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: workflow-visualizer
spec:
  replicas: 3
  selector:
    matchLabels:
      app: workflow-visualizer
  template:
    metadata:
      labels:
        app: workflow-visualizer
    spec:
      containers:
      - name: app
        image: workflow-visualizer:latest
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

## 5. 모니터링 및 알림

### 성능 모니터링
- **New Relic** 또는 **Datadog** 사용
- **Prometheus** + **Grafana** 구성

### 로그 수집
```javascript
// Winston 로거 설정
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## 6. API Rate Limiting

```javascript
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100개 요청
  message: "Too many requests from this IP"
});

app.use('/api/', limiter);
```

## 7. 비용 최적화

### 서버리스 아키텍처
- AWS Lambda
- Vercel Functions
- Netlify Functions

### 정적 사이트 생성 (SSG)
```javascript
// Next.js 예제
export async function getStaticProps() {
  const data = await fetchData();
  return {
    props: { data },
    revalidate: 3600 // 1시간마다 재생성
  };
}
```

## 8. 유료 서비스 구현

### 사용량 기반 과금
```javascript
// 사용량 추적
async function trackUsage(userId, action) {
  await db.usage.create({
    userId,
    action,
    timestamp: new Date()
  });
  
  // 한도 확인
  const usage = await getUserUsage(userId);
  if (usage > plan.limit) {
    throw new Error('Usage limit exceeded');
  }
}
```

### 플랜별 기능 제한
```javascript
const plans = {
  free: {
    maxProjects: 3,
    maxUsers: 1,
    features: ['basic']
  },
  pro: {
    maxProjects: 50,
    maxUsers: 10,
    features: ['basic', 'advanced', 'api']
  },
  enterprise: {
    maxProjects: Infinity,
    maxUsers: Infinity,
    features: ['all']
  }
};
```

## 9. 보안 강화

### DDoS 방어
- CloudFlare 사용
- AWS Shield 적용

### 입력 검증
```javascript
const validator = require('express-validator');

app.post('/api/data', [
  validator.body('email').isEmail(),
  validator.body('name').isLength({ min: 3 })
], (req, res) => {
  const errors = validator.validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
});
```

## 10. 성능 테스트

### 부하 테스트 도구
```bash
# Apache Bench
ab -n 10000 -c 100 http://localhost:3000/

# K6
k6 run load-test.js
```

### 테스트 시나리오
```javascript
// K6 테스트 스크립트
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 },
  ],
};

export default function() {
  let response = http.get('https://test.k6.io');
  check(response, {
    'status is 200': (r) => r.status === 200,
  });
}
```