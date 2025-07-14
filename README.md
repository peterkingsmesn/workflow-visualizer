# 🚀 Workflow Visualizer

> **AI 시대의 코드베이스 이해 도구** - 복잡한 워크플로우를 명확하고 인터랙티브한 시각화로 변환

[![Latest Release](https://img.shields.io/github/v/release/peterkingsmesn/workflow-visualizer)](https://github.com/peterkingsmesn/workflow-visualizer/releases/latest)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/peterkingsmesn/workflow-visualizer/build-desktop.yml)](https://github.com/peterkingsmesn/workflow-visualizer/actions)
[![License](https://img.shields.io/badge/license-Commercial-blue.svg)](https://halowf.com/pricing)

## 📋 개요

Workflow Visualizer는 개발자와 팀이 복잡한 코드베이스를 쉽게 이해할 수 있도록 도와주는 강력한 시각화 도구입니다. AI 기반 분석으로 코드 구조, 의존성, 워크플로우를 자동으로 파악하고 인터랙티브한 다이어그램으로 표현합니다.

### 🎯 주요 기능

- **🔍 스마트 코드 분석**: AI 기반으로 패턴, 의존성, 잠재적 문제를 즉시 감지
- **📊 시각적 워크플로우 매핑**: 복잡한 코드 구조를 직관적인 다이어그램으로 변환
- **⚡ 성능 인사이트**: 병목 현상, 순환 의존성, 최적화 기회를 한눈에 파악
- **👥 팀 협업**: 실시간 협업 및 인사이트 공유
- **🌍 다국어 지원**: 한국어, 영어, 일본어, 중국어, 스페인어
- **🖥️ 크로스 플랫폼**: Windows, macOS, Linux 데스크톱 앱

## 💰 가격 정책

**월 $9.9 구독** - 모든 고급 기능 이용 가능

✅ **포함 기능:**
- 무제한 프로젝트 분석
- 무제한 파일 크기
- 모든 AI 분석 기능  
- 로컬 설치 및 사용
- 최대 3대 기기 지원
- 업데이트 및 기술 지원

## 📥 다운로드

### 🚀 최신 버전: v1.1.0

| 플랫폼 | 다운로드 링크 | 시스템 요구사항 |
|--------|--------------|-----------------|
| **Windows** | [📦 .exe 다운로드](https://github.com/peterkingsmesn/workflow-visualizer/releases/latest) | Windows 10/11 (64-bit) |
| **macOS** | [📦 .dmg 다운로드](https://github.com/peterkingsmesn/workflow-visualizer/releases/latest) | macOS 10.15+ (Intel/Apple Silicon) |
| **Linux** | [📦 .AppImage 다운로드](https://github.com/peterkingsmesn/workflow-visualizer/releases/latest) | Ubuntu 18.04+ 또는 호환 배포판 |

### 🔑 라이센스 활성화

1. **구독**: [Gumroad에서 구독](https://halowf.com/pricing) ($9.9/월)
2. **라이센스 키**: 이메일로 받은 키 입력
3. **활성화**: 앱 실행 후 키 입력으로 모든 기능 활성화

## 🛠️ 기술 스택

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** + **Headless UI**
- **ReactFlow** (다이어그램 렌더링)
- **Zustand** (상태 관리)
- **i18next** (다국어)

### Backend
- **Node.js** + **Express**
- **Prisma** + **PostgreSQL**
- **Socket.io** (실시간 협업)
- **Gumroad** (결제 시스템)

### Desktop
- **Electron** (크로스플랫폼)
- **라이센스 검증 시스템**
- **자동 업데이트**

### DevOps
- **GitHub Actions** (CI/CD)
- **Docker** (컨테이너화)
- **Vercel** (웹 배포)

## 🏗️ 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │ Desktop App     │    │   Backend API   │
│                 │    │                 │    │                 │
│ • React + TS    │◄──►│ • Electron      │◄──►│ • Node.js       │
│ • Vite          │    │ • License UI    │    │ • Express       │
│ • Tailwind      │    │ • Auto Update   │    │ • Prisma        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN (Vercel)  │    │ GitHub Releases │    │  Database       │
│                 │    │                 │    │                 │
│ • Static Assets │    │ • .exe/.dmg     │    │ • PostgreSQL    │
│ • Global Cache  │    │ • .AppImage     │    │ • User Data     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 개발 환경 설정

### 전체 프로젝트 실행

```bash
# 저장소 클론
git clone https://github.com/peterkingsmesn/workflow-visualizer.git
cd workflow-visualizer

# 의존성 설치
npm install

# 개발 서버 시작 (프론트엔드 + 백엔드)
npm run dev
```

### 데스크톱 앱 개발

```bash
# 데스크톱 의존성 설치
cd desktop
npm install

# 데스크톱 앱 개발 모드
npm run dev
```

### 빌드

```bash
# 웹 빌드
npm run build

# 데스크톱 앱 빌드
npm run desktop:build

# 모든 플랫폼 빌드
npm run desktop:build:all
```

## 📦 배포

### 자동 릴리스

```bash
# 새 버전 릴리스 (자동 빌드 + GitHub Release)
npm run release:patch   # 1.0.0 → 1.0.1
npm run release:minor   # 1.0.0 → 1.1.0  
npm run release:major   # 1.0.0 → 2.0.0
```

### 수동 배포

```bash
# 태그 생성 후 자동 빌드
git tag v1.1.0
git push origin v1.1.0
```

## 🔧 설정

### 환경 변수

```bash
# .env 파일 생성
VITE_API_URL=http://localhost:3001
DATABASE_URL=postgresql://username:password@localhost:5432/workflow_visualizer
GUMROAD_WEBHOOK_SECRET=your_webhook_secret
SENDGRID_API_KEY=your_sendgrid_key
```

### 개발 명령어

자세한 명령어는 [CLAUDE.md](./CLAUDE.md) 파일을 참조하세요.

## 🛡️ 보안

- **라이센스 암호화**: AES-256-CBC 암호화
- **기기 바인딩**: 머신 ID 기반 라이센스 바인딩
- **웹훅 검증**: Gumroad 서명 검증
- **SQL 인젝션 방지**: Prisma ORM 사용
- **XSS 방지**: React 내장 보안 기능

## 📊 모니터링

- **GitHub Actions**: 자동 빌드 및 테스트
- **보안 스캔**: CodeQL, Dependabot
- **라이센스 추적**: 다운로드 및 활성화 통계
- **오류 추적**: Electron 크래시 리포트

## 🤝 기여 방법

1. 이슈 생성 또는 기존 이슈 확인
2. 기능 브랜치 생성: `git checkout -b feature/amazing-feature`
3. 변경사항 커밋: `git commit -m 'feat: add amazing feature'`
4. 브랜치 푸시: `git push origin feature/amazing-feature`
5. Pull Request 생성

## 📞 지원

- **이메일**: support@halowf.com
- **이슈**: [GitHub Issues](https://github.com/peterkingsmesn/workflow-visualizer/issues)
- **문서**: [CLAUDE.md](./CLAUDE.md)

## 📄 라이센스

이 프로젝트는 상용 라이센스입니다. 사용하려면 구독이 필요합니다.

**구독**: [https://halowf.com/pricing](https://halowf.com/pricing)

---

<div align="center">

**🚀 Made with [Claude Code](https://claude.ai/code)**

[다운로드](https://github.com/peterkingsmesn/workflow-visualizer/releases/latest) • [구독](https://halowf.com/pricing) • [문서](./CLAUDE.md) • [지원](mailto:support@halowf.com)

</div>