# 🚀 빠른 시작 가이드

## 1️⃣ 설치 (1분)

```bash
git clone https://github.com/your-repo/workflow-visualizer.git
cd workflow-visualizer
npm install
```

## 2️⃣ 환경 설정 (1분)

```bash
# 환경 파일 복사
cp .env.example .env.local

# 기본 설정 (그대로 사용해도 OK)
DATABASE_URL="postgresql://postgres:password@localhost:5432/workflow_visualizer"
JWT_SECRET="your-secret-key"
```

## 3️⃣ 데이터베이스 실행 (1분)

```bash
# Docker로 DB 실행
docker-compose -f docker-compose.dev.yml up -d

# DB 초기 설정
npm run db:setup
```

## 4️⃣ 서버 시작 (1분)

```bash
# 한 번에 실행
npm run dev
```

## 5️⃣ 사용하기 (1분)

1. **http://localhost:3000** 접속
2. **회원가입** 또는 **Google 로그인**
3. **프로젝트 폴더 드래그&드롭**
4. **결과 확인** 🎉

---

## 🚨 문제 발생시

### 포트 충돌
```bash
# 다른 포트 사용
PORT=3002 npm run dev
```

### 데이터베이스 연결 실패
```bash
# Docker 상태 확인
docker ps

# 없으면 다시 실행
docker-compose -f docker-compose.dev.yml up -d
```

### 모듈 오류
```bash
# 깨끗하게 재설치
rm -rf node_modules package-lock.json
npm install
```

---

## 💡 주요 기능 체험하기

### 1. 코드 분석
- 프로젝트 폴더를 드래그&드롭
- 파일 간 연결 관계 확인
- API 호출 추적

### 2. 팀 협업
- 세션 생성 → 링크 공유
- 실시간 채팅
- 동시 편집

### 3. AI 연동
- 분석 결과 → Export → JSON
- Claude/ChatGPT에 업로드
- 프로젝트 컨텍스트 활용

---

**총 소요시간: 5분** ⏰