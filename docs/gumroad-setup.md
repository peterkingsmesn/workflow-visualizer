# 🛒 Gumroad 구독 제품 설정 가이드

## 📋 개요

Workflow Visualizer의 월 $9.9 구독 시스템을 Gumroad에서 설정하는 완전한 가이드입니다.

## 🚀 1단계: Gumroad 계정 및 제품 생성

### 계정 설정
1. **Gumroad 계정 로그인**: https://gumroad.com
2. **판매자 프로필 완성**
3. **결제 정보 설정** (은행 계좌, PayPal 등)

### 제품 생성
1. **"Create New Product" 클릭**
2. **제품 정보 입력**:
   ```
   제품명: Workflow Visualizer Pro Subscription
   설명: AI-powered code analysis and visualization tool
   가격: $9.90 (월간 구독)
   카테고리: Software > Developer Tools
   ```

### 구독 설정
3. **"Subscription" 옵션 활성화**
4. **구독 주기**: Monthly (매월)
5. **무료 체험**: 7일 (선택사항)

## 🔧 2단계: 웹훅 설정

### 웹훅 URL 설정
1. **Gumroad 대시보드** → **Settings** → **Advanced**
2. **Webhook URL 추가**:
   ```
   Production: https://your-domain.com/api/gumroad/webhook
   Development: http://localhost:3001/api/gumroad/webhook
   ```

### 웹훅 이벤트 선택
다음 이벤트들을 활성화:
- ✅ `sale` - 새 구독 생성
- ✅ `subscription_updated` - 구독 갱신
- ✅ `subscription_cancelled` - 구독 취소
- ✅ `refund` - 환불 처리

## 🔑 3단계: API 키 및 보안 설정

### API 키 발급
1. **Gumroad 대시보드** → **Settings** → **Advanced**
2. **"Generate new token" 클릭**
3. **권한 설정**: 
   - ✅ View sales
   - ✅ View subscribers
   - ✅ Refund sales

### 환경 변수 설정
`.env` 파일에 추가:
```bash
# Gumroad 설정
GUMROAD_API_KEY=your_gumroad_api_key_here
GUMROAD_WEBHOOK_SECRET=your_webhook_secret_here
GUMROAD_PRODUCT_ID=your_product_id_here

# 이메일 설정 (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@your-domain.com

# 라이센스 암호화
LICENSE_ENCRYPTION_KEY=your_32_character_encryption_key
LICENSE_ENCRYPTION_IV=your_16_character_iv_key
```

## 📧 4단계: 이메일 템플릿 설정

### SendGrid 템플릿
1. **SendGrid 계정** → **Email Templates**
2. **새 템플릿 생성**: "License Key Delivery"
3. **템플릿 ID 저장** (환경 변수에 추가)

### 이메일 내용 템플릿
```html
<!DOCTYPE html>
<html>
<head>
    <title>Workflow Visualizer 라이센스 키</title>
</head>
<body>
    <h1>🎉 구독 완료! 라이센스 키를 받으세요</h1>
    
    <p>안녕하세요!</p>
    <p>Workflow Visualizer Pro 구독을 시작해주셔서 감사합니다.</p>
    
    <div style="background: #f0f0f0; padding: 15px; margin: 20px 0;">
        <h3>🔑 라이센스 키:</h3>
        <code style="font-size: 18px; font-weight: bold;">{{license_key}}</code>
    </div>
    
    <h3>📥 사용 방법:</h3>
    <ol>
        <li>Workflow Visualizer 앱 다운로드</li>
        <li>앱 실행 후 라이센스 키 입력</li>
        <li>모든 고급 기능 활성화!</li>
    </ol>
    
    <p><a href="https://github.com/peterkingsmesn/workflow-visualizer/releases/latest">지금 다운로드하기</a></p>
    
    <hr>
    <p>문의사항: support@halowf.com</p>
</body>
</html>
```

## 🧪 5단계: 테스트

### 로컬 테스트
1. **ngrok으로 로컬 서버 노출**:
   ```bash
   ngrok http 3001
   ```
2. **Gumroad 웹훅 URL을 ngrok URL로 설정**
3. **테스트 구매 진행**

### 프로덕션 배포 전 체크리스트
- [ ] Gumroad 제품 정보 완성
- [ ] 웹훅 URL 설정 완료
- [ ] API 키 설정 완료
- [ ] 이메일 템플릿 설정 완료
- [ ] 테스트 구매 성공
- [ ] 라이센스 키 자동 발송 확인
- [ ] 앱에서 라이센스 인증 테스트

## 🎯 6단계: 실제 제품 론칭

### 제품 정보 최종 점검
```
제품명: Workflow Visualizer Pro
설명: AI 시대의 코드베이스 이해 도구 - 복잡한 워크플로우를 명확하고 인터랙티브한 시각화로 변환

주요 기능:
✅ 스마트 코드 분석 (AI 기반)
✅ 시각적 워크플로우 매핑
✅ 성능 인사이트 및 최적화 제안
✅ 팀 협업 기능
✅ 5개 언어 지원
✅ 크로스 플랫폼 (Windows, macOS, Linux)

가격: $9.90/월
무료 체험: 7일
```

### 마케팅 자료
- 📸 **제품 스크린샷** (최소 5장)
- 🎥 **데모 비디오** (2-3분)
- 📝 **상세 설명** (기능, 혜택, 시스템 요구사항)
- 🎨 **제품 로고 및 배너**

## 🔍 모니터링 및 분석

### 주요 지표 추적
- 👥 **구독자 수**
- 💰 **월간 수익** (MRR)
- 📈 **전환율** (방문자 → 구독자)
- 🔄 **해지율** (Churn Rate)
- 📧 **이메일 발송 성공률**

### Gumroad 분석 도구
1. **Sales Analytics** - 매출 분석
2. **Customer Analytics** - 고객 분석
3. **Conversion Tracking** - 전환 추적

## 📞 고객 지원

### 지원 채널 설정
- ✉️ **이메일**: support@halowf.com
- 🐛 **이슈 추적**: GitHub Issues
- 📚 **문서**: README.md, CLAUDE.md
- 💬 **FAQ**: 자주 묻는 질문 페이지

### 일반적인 문의 대응
1. **라이센스 키 분실**: 재발송 프로세스
2. **설치 문제**: 시스템 요구사항 확인
3. **환불 요청**: Gumroad 정책에 따라 처리
4. **기술 지원**: 버그 리포트 및 기능 요청

---

이 가이드를 따라 설정하면 완전한 구독 기반 SaaS 시스템이 구축됩니다! 🚀