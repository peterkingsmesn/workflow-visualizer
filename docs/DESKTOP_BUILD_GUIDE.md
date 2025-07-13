# 🖥️ 데스크톱 EXE 빌드 가이드

## 🎯 개요

**$9.9/월 구독 기반 데스크톱 앱** - 3가지 운영체제별 실행파일 생성

### 📦 생성되는 파일들:
```
📁 dist/
├── 🪟 WorkflowVisualizer-Setup-1.0.0.exe     (Windows x64)
├── 🍎 WorkflowVisualizer-1.0.0-x64.dmg       (macOS Intel)
├── 🍎 WorkflowVisualizer-1.0.0-arm64.dmg     (macOS Apple Silicon)
└── 🐧 WorkflowVisualizer-1.0.0.AppImage      (Linux x64)
```

## 🔧 로컬 빌드

### 1. 환경 준비
```bash
# 데스크톱 의존성 설치
npm run desktop:install

# 또는 수동으로
cd desktop && npm install
```

### 2. 개발 모드 실행
```bash
# 웹 + 데스크톱 동시 실행
npm run desktop:dev

# 또는 수동으로
npm run dev                    # 웹 앱 실행 (localhost:3000)
cd desktop && npm run start    # 데스크톱 앱 실행
```

### 3. 개별 플랫폼 빌드

#### 🪟 Windows (.exe)
```bash
npm run desktop:build:windows
```
**요구사항**: Windows 환경 또는 Wine

**결과물**: 
- `WorkflowVisualizer-Setup-1.0.0.exe` (NSIS 인스톨러)
- 자동 업데이트 지원
- 시작 메뉴 바로가기 생성

#### 🍎 macOS (.dmg)
```bash
npm run desktop:build:mac
```
**요구사항**: macOS 환경

**결과물**:
- `WorkflowVisualizer-1.0.0-x64.dmg` (Intel Mac)
- `WorkflowVisualizer-1.0.0-arm64.dmg` (Apple Silicon)
- 코드 사이닝 설정 필요 (배포 시)

#### 🐧 Linux (.AppImage)
```bash
npm run desktop:build:linux
```
**요구사항**: Linux 환경

**결과물**:
- `WorkflowVisualizer-1.0.0.AppImage` (실행 권한 부여 후 실행)
- 시스템 라이브러리와 독립적

### 4. 전체 플랫폼 빌드
```bash
npm run desktop:build:all
```

## 🤖 GitHub Actions 자동 빌드

### 1. 태그 기반 자동 빌드
```bash
# 데스크톱 버전 태그 생성
git tag desktop-v1.0.0
git push origin desktop-v1.0.0
```

### 2. 수동 워크플로우 실행
1. GitHub → Actions 탭
2. "🖥️ Desktop App Build" 선택
3. "Run workflow" 클릭
4. 버전 입력 (예: 1.0.0)

### 3. 빌드 결과
- **Artifacts**: 각 플랫폼별 실행파일
- **Release**: 태그 빌드 시 자동 릴리즈 생성
- **Download**: GitHub Releases에서 다운로드 가능

## 🔐 코드 사이닝 설정

### Windows 코드 사이닝
```yaml
# GitHub Secrets 설정
WIN_CSC_LINK: <base64-encoded-certificate>
WIN_CSC_KEY_PASSWORD: <certificate-password>
```

### macOS 코드 사이닝
```yaml
# GitHub Secrets 설정
APPLE_ID: <apple-developer-id>
APPLE_APP_SPECIFIC_PASSWORD: <app-specific-password>
MAC_CSC_LINK: <base64-encoded-certificate>
MAC_CSC_KEY_PASSWORD: <certificate-password>
```

## 💰 라이선스 시스템 통합

### 1. 라이선스 검증 플로우
```
앱 시작 → 라이선스 확인 → 서버 검증 → 메인 앱 로드
    ↓               ↓               ↓
라이선스 없음    온라인 검증 실패   오프라인 검증
    ↓               ↓               ↓
라이선스 입력창   오프라인 모드      30일 제한
```

### 2. 구독 상태별 기능
- **FREE**: 10개 파일, 1개 디바이스
- **PRO ($9.9/월)**: 무제한 파일, 3개 디바이스
- **ENTERPRISE ($49/월)**: 팀 관리, 무제한 디바이스

### 3. 오프라인 지원
- 최대 30일간 오프라인 사용 가능
- 주기적 온라인 검증 필요
- 디바이스 바인딩으로 라이선스 보호

## 📱 멀티 플랫폼 특징

### Windows
- **설치**: NSIS 인스톨러 (.exe)
- **아이콘**: .ico 형식
- **경로**: `%APPDATA%/WorkflowVisualizer/`
- **시작**: 시작 메뉴 바로가기

### macOS  
- **설치**: DMG 디스크 이미지
- **아이콘**: .icns 형식
- **경로**: `~/Library/Application Support/WorkflowVisualizer/`
- **시작**: Applications 폴더

### Linux
- **설치**: AppImage (portable)
- **아이콘**: .png 형식  
- **경로**: `~/.config/workflow-visualizer/`
- **시작**: 실행 권한 부여 후 직접 실행

## 🚀 배포 과정

### 1. 로컬 테스트
```bash
# 빌드 테스트
npm run desktop:build:windows
npm run desktop:build:mac
npm run desktop:build:linux

# 실행 테스트
cd desktop/dist
./WorkflowVisualizer-Setup-1.0.0.exe        # Windows
open WorkflowVisualizer-1.0.0-x64.dmg       # macOS
chmod +x WorkflowVisualizer-1.0.0.AppImage && ./WorkflowVisualizer-1.0.0.AppImage  # Linux
```

### 2. GitHub Actions 빌드
```bash
# 버전 태그 생성
git tag desktop-v1.0.0
git push origin desktop-v1.0.0
```

### 3. 릴리즈 확인
1. GitHub Releases에서 파일 확인
2. 각 플랫폼에서 다운로드/설치 테스트
3. 라이선스 검증 테스트

## 🔧 문제해결

### 빌드 오류
```bash
# 캐시 정리
rm -rf desktop/node_modules
rm -rf desktop/dist
npm run desktop:install

# Electron 캐시 정리
rm -rf ~/.cache/electron
rm -rf ~/.cache/electron-builder
```

### 라이선스 오류
- 서버 URL 확인: `LICENSE_SERVER_URL`
- 네트워크 연결 확인
- 라이선스 키 형식 확인: `WV2024-XXXXX-XXXXX-XXXXX-XXXXX`

### 코드 사이닝 오류
- 인증서 만료일 확인
- 비밀번호 정확성 확인
- Apple Developer 계정 상태 확인

## 📊 빌드 시간 예상

| 플랫폼 | 로컬 빌드 | GitHub Actions |
|--------|-----------|----------------|
| Windows | 3-5분 | 8-12분 |
| macOS | 5-8분 | 12-18분 |
| Linux | 2-4분 | 6-10분 |

**전체 멀티 플랫폼**: 약 20-30분 (GitHub Actions)

---

🎉 **완료!** 이제 3가지 운영체제별 EXE 파일이 준비되었습니다!