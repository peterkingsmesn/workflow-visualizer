# 🍋 Gumroad 월 구독 설정 가이드

## 🎯 목표: $9.9/월 자동결제 시스템 구축

**사업자 등록 없이** Gumroad로 월 구독 시스템을 만들어봅시다!

---

## 📋 1단계: Gumroad 계정 생성 (5분)

### 🔗 계정 만들기:
1. **[gumroad.com](https://gumroad.com)** 접속
2. **"Start selling"** 버튼 클릭
3. 이메일 + 비밀번호 입력
4. 이메일 인증 완료

### ✅ 확인사항:
- ✅ 사업자등록증 필요 없음
- ✅ 개인도 바로 판매 가능
- ✅ PayPal 개인계좌로 수익 받기 가능

---

## 📦 2단계: 제품 생성 (10분)

### 🔧 제품 등록:
1. Gumroad 대시보드 → **"+ Add Product"**
2. **Product Type**: `Subscription` 선택 ⭐
3. 제품 정보 입력:

```
Product Name: Workflow Visualizer PRO
Description: 코드베이스 워크플로우 분석 도구 - 월 구독 서비스

✨ 주요 기능:
- 🔄 실시간 워크플로우 분석  
- 📊 고급 코드 메트릭
- 🔍 의존성 시각화
- 🚀 성능 인사이트
- 🛡️ 보안 스캐닝
- 📱 3개 디바이스 지원
- 🌐 30일 오프라인 사용

💰 Price: $9.90/month
🔄 Billing Cycle: Monthly  
🔁 Auto-renewal: Enabled
```

### 🎨 추가 설정:
```
Category: Software & Tools
Tags: developer-tools, code-analysis, workflow
Thumbnail: 제품 스크린샷 업로드
```

### ⚙️ 중요한 설정:
- **Subscription**: ✅ 활성화
- **Monthly billing**: ✅ 선택
- **Auto-renewal**: ✅ 활성화
- **Price**: `$9.90`

---

## 🔑 3단계: API 설정 (5분)

### 🔐 API 토큰 발급:
1. Gumroad 대시보드 → **"Settings"**
2. **"Advanced"** 탭 클릭
3. **"Generate access token"** 클릭
4. 토큰 복사 (한 번만 표시됨!)

### 📝 환경변수 설정:
```bash
# .env 파일에 추가
GUMROAD_ACCESS_TOKEN=gumroad_access_token_여기에_붙여넣기
GUMROAD_PRODUCT_ID=workflow-visualizer-pro
```

### 🔗 Product ID 확인:
1. Products → 생성한 제품 클릭
2. URL에서 ID 확인: `gumroad.com/products/여기가_product_id`
3. 또는 제품 설정에서 "Permalink" 확인

---

## 🔄 4단계: 웹훅 설정 (3분)

### 📡 웹훅 URL 설정:
1. Gumroad 대시보드 → **"Settings"** → **"Advanced"**
2. **"Ping URL"** 섹션
3. 웹훅 URL 입력:

```
https://your-domain.com/api/webhooks/gumroad
```

### 🧪 로컬 테스트용 (ngrok 사용):
```bash
# ngrok 설치 후
ngrok http 3001

# 나오는 URL을 웹훅에 설정
https://abcd1234.ngrok.io/api/webhooks/gumroad
```

---

## 🧪 5단계: 테스트 (10분)

### 🔧 서버 실행:
```bash
# 환경변수 설정 확인
echo $GUMROAD_ACCESS_TOKEN

# 서버 실행
npm run server:dev
```

### 🛒 테스트 구독:
1. 앱에서 "PRO 구독" 버튼 클릭
2. Gumroad 결제 페이지로 이동
3. **테스트 결제 정보 입력**:

```
카드번호: 4242 4242 4242 4242
만료일: 12/34
CVC: 123
이메일: 본인 이메일
```

### ✅ 확인사항:
- 웹훅이 서버로 전송되는지 확인
- 데이터베이스에 구독 정보 저장되는지 확인
- 라이선스 키 자동 생성되는지 확인

---

## 🔧 6단계: API 엔드포인트 테스트

### 📋 주요 API 엔드포인트:

```javascript
// 1. 구독 생성
POST /api/billing/create-gumroad-subscription
{
  "planType": "PRO"
}

// 2. 구독 상태 확인  
GET /api/billing/gumroad-subscription-status

// 3. 라이선스 키 생성
POST /api/billing/generate-gumroad-license-key

// 4. 구독 취소
POST /api/billing/cancel-gumroad-subscription
```

### 🧪 테스트 스크립트:
```bash
# 구독 생성 테스트
curl -X POST http://localhost:3001/api/billing/create-gumroad-subscription \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{"planType": "PRO"}'

# 구독 상태 확인
curl -X GET http://localhost:3001/api/billing/gumroad-subscription-status \
  -H "Authorization: Bearer your_jwt_token"
```

---

## 💰 7단계: 수익 수취 설정

### 💳 PayPal 연결:
1. Gumroad → **"Settings"** → **"Payouts"**
2. **"Connect PayPal"** 클릭
3. PayPal 개인계정 연결
4. 자동 정산 설정 (주간/월간)

### 📊 매출 확인:
```
Gumroad Dashboard → Analytics
- 일별/월별 매출
- 구독자 수
- 이탈률
- 환불률
```

---

## 🔒 8단계: 보안 및 최적화

### 🛡️ 웹훅 보안:
```javascript
// webhooks-gumroad.js에서 IP 검증 추가
const GUMROAD_IPS = [
  '44.236.72.85',
  '44.236.95.103', 
  '44.236.65.3'
];

router.use('/gumroad', (req, res, next) => {
  const clientIP = req.ip;
  if (!GUMROAD_IPS.includes(clientIP)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
});
```

### 📈 모니터링:
- 구독 성공/실패율 추적
- 라이선스 키 발급 성공률
- 웹훅 수신 실패 알림

---

## 🎉 완료! 결과 확인

### ✅ 성공 지표:
- [x] Gumroad 계정 생성 완료
- [x] $9.9/월 구독 제품 생성
- [x] API 연동 및 자동결제 동작
- [x] 웹훅으로 구독 상태 실시간 동기화
- [x] 라이선스 키 자동 발급
- [x] PayPal로 수익 수취

### 🚀 다음 단계:
1. **데스크톱 앱 연동**: 라이선스 키로 EXE 인증
2. **실제 론칭**: 도메인 연결 및 프로덕션 배포  
3. **마케팅**: 제품 홍보 및 고객 확보

---

## 💡 자주 묻는 질문

### ❓ 수수료는 얼마인가요?
```
Gumroad 수수료: 3.5% + $0.30
PayPal 수수료: 2.9% + $0.30
총 수수료: 약 6.4% + $0.60

예시: $9.90 → 실수령액 약 $8.67
```

### ❓ 환불은 어떻게 하나요?
```
Gumroad 대시보드 → Sales → 해당 판매 → Refund
자동으로 구독 취소 및 라이선스 비활성화
```

### ❓ 세금 신고는?
```
연 매출 500만원 이하: 신고 의무 없음
그 이상: 5월 종합소득세 신고
Gumroad에서 매출 리포트 제공
```

🎉 **축하합니다! Gumroad 월 구독 시스템이 완성되었어요!**