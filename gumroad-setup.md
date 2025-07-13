# 🛒 Gumroad 설정 가이드

## 1. Gumroad 상품 등록

### 📦 상품 정보
- **상품명**: Workflow Visualizer Desktop License
- **가격**: $9.99/월 (구독)
- **설명**: 
```
🚀 Workflow Visualizer Desktop License

코드베이스를 시각화하고 워크플로우를 최적화하는 강력한 도구입니다.

✅ 포함 기능:
• 무제한 프로젝트 분석
• 무제한 파일 크기 
• 모든 AI 분석 기능
• 로컬 설치 및 사용
• 업데이트 및 기술 지원

🖥️ 지원 플랫폼:
• Windows 10/11
• macOS 10.15+  
• Linux (Ubuntu 18.04+)

📧 구매 후 라이센스 키가 이메일로 발송됩니다.
💿 다운로드: https://halowf.com/download

문의: support@halowf.com
```

### 🔧 상품 설정
1. **Product Type**: Digital Product
2. **Delivery Method**: Email delivery with license key
3. **Pricing**: $9.99/month (recurring subscription)
4. **File Upload**: 설치 가이드 PDF (선택사항)

## 2. 웹훅 설정

### 🔗 웹훅 URL 등록
- **URL**: `https://halowf.com/api/gumroad/webhook`
- **이벤트**: 
  - ✅ Sale
  - ✅ Subscription Created
  - ✅ Subscription Updated
  - ✅ Subscription Cancelled
  - ✅ Refund

### 🔐 웹훅 시크릿
```bash
# .env 파일에 추가
GUMROAD_WEBHOOK_SECRET=your_webhook_secret_here
GUMROAD_PRODUCT_ID=your_product_id_here
GUMROAD_API_KEY=your_api_key_here
```

## 3. API 키 설정

### 📋 필요한 권한
- Sales data access
- Subscription management
- Webhook management

### 🔑 API 키 위치
Gumroad 계정 → Settings → Advanced → Generate API Key

## 4. 이메일 템플릿 설정

### 📧 구매 확인 이메일
```html
<!DOCTYPE html>
<html>
<head>
    <title>🚀 Workflow Visualizer 라이센스</title>
</head>
<body>
    <h2>구매해주셔서 감사합니다!</h2>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h3>📋 라이센스 정보</h3>
        <p><strong>라이센스 키:</strong> <code>{{LICENSE_KEY}}</code></p>
        <p><strong>이메일:</strong> {{CUSTOMER_EMAIL}}</p>
        <p><strong>구매일:</strong> {{PURCHASE_DATE}}</p>
    </div>

    <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-top: 20px;">
        <h3>🚀 설치 방법</h3>
        <ol>
            <li><a href="https://halowf.com/download">Workflow Visualizer 다운로드</a></li>
            <li>프로그램 설치 및 실행</li>
            <li>라이센스 키 입력: <code>{{LICENSE_KEY}}</code></li>
            <li>모든 기능 이용!</li>
        </ol>
    </div>
</body>
</html>
```

## 5. 서버 환경 변수

### 🌐 환경 설정
```bash
# Gumroad 설정
GUMROAD_WEBHOOK_SECRET=your_secret_here
GUMROAD_PRODUCT_ID=your_product_id
GUMROAD_API_KEY=your_api_key

# 이메일 서비스 (SendGrid 또는 Nodemailer)
SENDGRID_API_KEY=your_sendgrid_key
EMAIL_FROM=noreply@halowf.com

# 데이터베이스
DATABASE_URL=postgresql://username:password@localhost:5432/workflow_visualizer

# JWT 시크릿
JWT_SECRET=your_jwt_secret_for_license_validation

# 앱 설정
APP_URL=https://halowf.com
API_URL=https://halowf.com/api
```

## 6. 테스트 절차

### 🧪 테스트 상품 생성
1. Gumroad에서 테스트 모드 활성화
2. 테스트 상품 생성 ($0.01)
3. 테스트 구매 진행
4. 웹훅 수신 확인
5. 라이센스 키 생성 확인
6. 이메일 발송 확인

### 🔍 검증 사항
- [ ] 웹훅 정상 수신
- [ ] 라이센스 키 생성
- [ ] 데이터베이스 저장
- [ ] 이메일 발송
- [ ] 라이센스 검증 API 동작
- [ ] 앱에서 라이센스 활성화

## 7. 모니터링 설정

### 📊 로그 모니터링
```javascript
// 웹훅 처리 로그
console.log('Gumroad webhook:', {
  type: event.type,
  orderId: event.data.order_id,
  email: event.data.purchaser_email,
  timestamp: new Date()
});

// 라이센스 검증 로그
console.log('License validation:', {
  licenseKey: key.substring(0, 8) + '***',
  machineId: machineId.substring(0, 8) + '***',
  success: result.valid,
  timestamp: new Date()
});
```

### 🔔 알림 설정
- 구매 완료시 Slack/Discord 알림
- 라이센스 검증 실패시 이메일 알림
- 월간 매출 리포트 자동 생성

## 8. 보안 고려사항

### 🛡️ 보안 설정
1. **HTTPS 필수**: 모든 API 엔드포인트
2. **웹훅 서명 검증**: Gumroad 서명 필수 확인
3. **라이센스 키 암호화**: 데이터베이스 저장시
4. **API 레이트 리미팅**: 악용 방지
5. **기기 바인딩**: 라이센스 공유 방지

### 🚫 차단 기능
- 의심스러운 IP 차단
- 과도한 검증 요청 차단
- 환불된 라이센스 즉시 비활성화

## 9. 고객 지원

### 📞 지원 프로세스
1. **라이센스 분실**: 이메일로 재발급
2. **기기 변경**: 기존 바인딩 해제 후 재바인딩
3. **환불 요청**: Gumroad 정책에 따라 처리
4. **기술 지원**: support@halowf.com

### 🔄 자동화
- 라이센스 만료 7일 전 알림
- 결제 실패시 자동 안내
- 구독 취소시 피드백 요청

## 10. 런칭 체크리스트

### ✅ 출시 전 확인사항
- [ ] Gumroad 상품 설정 완료
- [ ] 웹훅 연동 테스트 완료
- [ ] 라이센스 시스템 테스트 완료
- [ ] 이메일 발송 테스트 완료
- [ ] 앱 다운로드 페이지 준비
- [ ] 결제 플로우 테스트 완료
- [ ] 고객 지원 체계 구축
- [ ] 모니터링 시스템 구축
- [ ] 보안 점검 완료
- [ ] 백업 시스템 구축

### 🚀 출시 후 모니터링
- 첫 24시간 집중 모니터링
- 결제/라이센스 오류 즉시 대응
- 고객 피드백 수집 및 개선
- 매출 데이터 분석