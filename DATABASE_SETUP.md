# 데이터베이스 설정 가이드

이 문서는 Workflow Visualizer의 데이터베이스를 설정하는 방법을 안내합니다.

## 🚀 빠른 시작 (권장)

### 1. 클라우드 데이터베이스 사용 (가장 쉬운 방법)

#### Supabase (무료 플랜 500MB)
1. https://supabase.com 에서 계정 생성
2. "New Project" 클릭
3. 프로젝트 이름: `workflow-visualizer`
4. 데이터베이스 비밀번호 설정 (안전하게 보관)
5. 리전 선택 (Asia Pacific - Seoul 권장)
6. 프로젝트 생성 완료 후 Settings > Database로 이동
7. Connection string 복사 (URI 형태)

#### Railway (무료 플랜 500MB)
1. https://railway.app 에서 계정 생성
2. "New Project" > "Provision PostgreSQL"
3. 생성된 데이터베이스 클릭
4. Variables 탭에서 `DATABASE_URL` 값 복사

#### PlanetScale (무료 플랜 5GB)
1. https://planetscale.com 에서 계정 생성
2. "New database" 클릭
3. 데이터베이스 이름: `workflow-visualizer`
4. 리전 선택 (Asia Pacific - Seoul 권장)
5. 브랜치 생성 후 "Connect" 클릭
6. "Prisma" 선택하여 연결 문자열 복사

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```bash
# 복사한 데이터베이스 URL 사용
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# JWT 설정
JWT_SECRET="your-super-secret-jwt-key-please-change-in-production"
JWT_EXPIRES_IN="7d"

# 애플리케이션 URL
APP_URL="http://localhost:3000"
API_URL="http://localhost:5000"
```

### 3. 데이터베이스 초기화

```bash
# Prisma 클라이언트 생성
npm run db:generate

# 데이터베이스 스키마 생성
npm run db:push

# 샘플 데이터 생성 (선택사항)
npm run db:seed
```

### 4. 완료!

이제 개발 서버를 시작할 수 있습니다:
```bash
npm run dev
```

---

## 🐳 Docker로 로컬 데이터베이스 실행

Docker Desktop이 설치되어 있는 경우:

```bash
# PostgreSQL과 Redis 컨테이너 시작
docker compose -f docker-compose.dev.yml up -d

# 데이터베이스 스키마 생성
npm run db:push

# 샘플 데이터 생성
npm run db:seed

# 데이터베이스 GUI 도구 실행
npm run db:studio
```

---

## 💻 로컬 PostgreSQL 설치

### Windows
1. https://www.postgresql.org/download/windows/ 에서 다운로드
2. 설치 시 비밀번호 설정 (예: `password`)
3. 포트는 기본값 5432 사용
4. pgAdmin 설치 (선택사항)

### macOS
```bash
# Homebrew 사용
brew install postgresql
brew services start postgresql

# 데이터베이스 생성
createdb workflow_visualizer
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 데이터베이스 생성
sudo -u postgres createdb workflow_visualizer
```

### 환경 변수 설정
`.env` 파일에 다음 추가:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/workflow_visualizer"
```

---

## 🔧 데이터베이스 관리 명령어

### 개발 중 자주 사용하는 명령어
```bash
# 스키마 변경사항 즉시 적용 (개발용)
npm run db:push

# 마이그레이션 생성 및 적용 (프로덕션용)
npm run db:migrate:dev

# 데이터베이스 GUI 도구 실행
npm run db:studio

# 모든 데이터 삭제 후 재생성
npm run db:reset
```

### 샘플 데이터
시드 실행 후 다음 계정으로 로그인 가능:
- **관리자**: `admin@workflow-visualizer.com` / `admin123!@#`
- **일반 사용자**: `test@example.com` / `test123!@#`
- **프로 사용자**: `pro@example.com` / `pro123!@#`

---

## 🔍 문제 해결

### 연결 실패 (P1001)
```
Error: P1001: Can't reach database server at `localhost:5432`
```
**해결방법:**
1. PostgreSQL 서버가 실행 중인지 확인
2. 포트 번호가 올바른지 확인 (기본값: 5432)
3. 방화벽 설정 확인
4. Docker 컨테이너가 실행 중인지 확인

### 인증 실패 (P1017)
```
Error: P1017: Server has closed the connection
```
**해결방법:**
1. 데이터베이스 사용자명과 비밀번호 확인
2. SSL 설정 확인 (`?sslmode=require` 추가)
3. 클라우드 데이터베이스의 IP 화이트리스트 확인

### 스키마 동기화 오류
```
Error: P3006: Migration ... cannot be rolled back
```
**해결방법:**
```bash
# 개발 환경에서만 사용 (데이터 삭제됨)
npm run db:reset
```

### Prisma 클라이언트 오류
```
Error: Prisma Client could not be found
```
**해결방법:**
```bash
npm run db:generate
```

---

## 📊 데이터베이스 스키마 정보

### 주요 테이블
- `User`: 사용자 정보
- `Session`: 로그인 세션
- `Project`: 프로젝트 정보
- `Team`: 팀 정보
- `Subscription`: 구독 정보
- `Invoice`: 결제 정보
- `ActivityLog`: 활동 로그
- `Notification`: 알림

### 관계
- User ↔ Session (1:N)
- User ↔ Project (1:N)
- User ↔ Subscription (1:1)
- Team ↔ TeamMember (1:N)
- Project ↔ AnalysisResult (1:N)

---

## 🔐 보안 고려사항

### 프로덕션 환경
- 강력한 데이터베이스 비밀번호 사용
- SSL/TLS 연결 필수
- 정기적인 백업 설정
- 접근 IP 제한
- 모니터링 설정

### 개발 환경
- `.env` 파일을 버전 관리에 포함하지 않음
- 샘플 데이터의 비밀번호는 해시되어 저장됨
- 로컬 개발시에만 약한 비밀번호 사용

---

## 📈 성능 최적화

### 인덱스
주요 쿼리 성능을 위한 인덱스가 자동으로 생성됩니다:
- `User.email` (고유 인덱스)
- `Session.token` (고유 인덱스)
- `Project.userId` (외래 키 인덱스)

### 연결 풀링
Prisma가 자동으로 연결 풀링을 관리합니다.

---

## 🆘 추가 도움이 필요한 경우

1. **Prisma 공식 문서**: https://www.prisma.io/docs
2. **PostgreSQL 공식 문서**: https://www.postgresql.org/docs
3. **Discord 커뮤니티**: 개발자와 실시간 채팅
4. **GitHub Issues**: 버그 리포트 및 기능 요청

설정 과정에서 문제가 발생하면 언제든지 문의해주세요!