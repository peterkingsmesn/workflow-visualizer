# 데스크톱 EXE 앱 구독 시스템 아키텍처

## 🎯 목표
- 웹에서 구독/결제, 데스크톱에서 사용
- 오프라인 작업 지원하면서도 구독 상태 검증
- 크랙/해킹 방지 및 라이선스 보호
- 멀티 디바이스 지원

## 🏗️ 전체 아키텍처

### 1. 웹 기반 구독 관리
```
사용자 → 웹사이트 → Stripe 결제 → 라이선스 키 발급
```

### 2. 데스크톱 앱 인증
```
EXE 앱 → 라이선스 키 입력 → 서버 검증 → 로컬 토큰 저장
```

### 3. 하이브리드 검증
```
주기적 온라인 검증 + 오프라인 토큰 검증
```

## 📋 상세 구현 방안

### A. 라이선스 키 시스템

#### 1. 라이선스 키 구조
```
Format: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
Example: WV2024-AB7CD-E9F12-GH3IJ-K4L56

구성:
- WV2024: 제품코드 + 연도
- AB7CD: 사용자 ID 해시 (5자리)
- E9F12: 구독 타입 + 만료일 해시
- GH3IJ: 디바이스 제한 정보
- K4L56: 체크섬
```

#### 2. 라이선스 키 생성 로직
```javascript
// 서버사이드 라이선스 생성
function generateLicenseKey(userId, subscriptionId, planType) {
  const productCode = 'WV2024';
  const userHash = hashUserId(userId).substring(0, 5);
  const planHash = hashPlanData(planType, subscription.endDate);
  const deviceInfo = generateDeviceLimit(planType);
  const checksum = calculateChecksum(productCode + userHash + planHash + deviceInfo);
  
  return `${productCode}-${userHash}-${planHash}-${deviceInfo}-${checksum}`;
}
```

### B. 데스크톱 앱 인증 시스템

#### 1. 첫 설치 시 인증
```typescript
// EXE 앱 내부 인증 로직
class DesktopLicenseManager {
  async activateLicense(licenseKey: string): Promise<ActivationResult> {
    // 1. 라이선스 키 포맷 검증
    if (!this.validateKeyFormat(licenseKey)) {
      throw new Error('잘못된 라이선스 키 형식입니다.');
    }
    
    // 2. 서버 온라인 검증
    const serverValidation = await this.verifyWithServer(licenseKey);
    if (!serverValidation.valid) {
      throw new Error('라이선스 키가 유효하지 않습니다.');
    }
    
    // 3. 디바이스 정보 등록
    const deviceFingerprint = this.generateDeviceFingerprint();
    await this.registerDevice(licenseKey, deviceFingerprint);
    
    // 4. 로컬 인증 토큰 생성 및 저장
    const localToken = this.generateLocalToken(serverValidation);
    this.storeSecureToken(localToken);
    
    return { success: true, validUntil: serverValidation.validUntil };
  }
  
  private generateDeviceFingerprint(): string {\n    // 하드웨어 정보 기반 고유 식별자 생성\n    const hwInfo = {\n      cpuId: this.getCpuId(),\n      motherboardSerial: this.getMotherboardSerial(),\n      macAddress: this.getPrimaryMacAddress(),\n      diskSerial: this.getDiskSerial()\n    };\n    \n    return crypto.createHash('sha256')\n      .update(JSON.stringify(hwInfo))\n      .digest('hex')\n      .substring(0, 16);\n  }\n}\n```

#### 2. 주기적 온라인 검증
```typescript\nclass SubscriptionValidator {\n  private validationInterval = 24 * 60 * 60 * 1000; // 24시간\n  private maxOfflineDays = 30; // 최대 30일 오프라인 허용\n  \n  async startPeriodicValidation(): Promise<void> {\n    setInterval(async () => {\n      try {\n        await this.validateOnline();\n      } catch (error) {\n        // 온라인 검증 실패 시 오프라인 토큰으로 검증\n        const offlineValid = await this.validateOffline();\n        if (!offlineValid) {\n          this.showSubscriptionExpiredDialog();\n        }\n      }\n    }, this.validationInterval);\n  }\n  \n  private async validateOnline(): Promise<boolean> {\n    const localToken = this.getStoredToken();\n    const response = await fetch('https://api.workflow-visualizer.com/desktop/validate', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({\n        licenseKey: localToken.licenseKey,\n        deviceFingerprint: this.generateDeviceFingerprint(),\n        appVersion: this.getAppVersion()\n      })\n    });\n    \n    const result = await response.json();\n    if (result.valid) {\n      // 새로운 오프라인 토큰 갱신\n      this.updateOfflineToken(result.offlineToken);\n    }\n    \n    return result.valid;\n  }\n}\n```

### C. 오프라인 작업 지원

#### 1. 로컬 토큰 검증
```typescript\nclass OfflineValidator {\n  validateOfflineToken(token: OfflineToken): ValidationResult {\n    // 1. 토큰 무결성 검증\n    if (!this.verifyTokenSignature(token)) {\n      return { valid: false, reason: 'TOKEN_CORRUPTED' };\n    }\n    \n    // 2. 만료일 확인\n    if (Date.now() > token.expiresAt) {\n      return { valid: false, reason: 'SUBSCRIPTION_EXPIRED' };\n    }\n    \n    // 3. 디바이스 바인딩 확인\n    const currentFingerprint = this.generateDeviceFingerprint();\n    if (token.deviceFingerprint !== currentFingerprint) {\n      return { valid: false, reason: 'DEVICE_MISMATCH' };\n    }\n    \n    // 4. 최대 오프라인 기간 확인\n    const daysSinceLastOnlineCheck = (Date.now() - token.lastOnlineCheck) / (24 * 60 * 60 * 1000);\n    if (daysSinceLastOnlineCheck > this.maxOfflineDays) {\n      return { valid: false, reason: 'OFFLINE_PERIOD_EXCEEDED' };\n    }\n    \n    return { valid: true };\n  }\n}\n```

### D. 보안 및 크랙 방지

#### 1. 코드 난독화 및 보호\n```typescript\n// 중요한 검증 로직을 여러 곳에 분산\nclass SecurityManager {\n  // 런타임에 여러 번 검증\n  async performSecurityChecks(): Promise<boolean> {\n    const checks = [\n      this.validateProcessIntegrity(),\n      this.checkDebuggerPresence(),\n      this.verifyCodeSignature(),\n      this.validateLicenseConsistency(),\n      this.checkSystemClock()\n    ];\n    \n    const results = await Promise.all(checks);\n    return results.every(result => result === true);\n  }\n  \n  private validateProcessIntegrity(): boolean {\n    // 프로세스 메모리 무결성 검사\n    // DLL 주입 등 탐지\n    return this.checkMemoryIntegrity();\n  }\n  \n  private checkDebuggerPresence(): boolean {\n    // 디버거 연결 탐지\n    return !this.isDebuggerAttached();\n  }\n}\n```

#### 2. 네트워크 보안\n```typescript\nclass SecureNetworkManager {\n  async makeSecureRequest(endpoint: string, data: any): Promise<any> {\n    // 1. 요청 암호화\n    const encryptedData = this.encryptRequest(data);\n    \n    // 2. 요청 서명\n    const signature = this.signRequest(encryptedData);\n    \n    // 3. 타임스탬프 추가 (리플레이 공격 방지)\n    const timestamp = Date.now();\n    \n    const response = await fetch(endpoint, {\n      method: 'POST',\n      headers: {\n        'Content-Type': 'application/json',\n        'X-Signature': signature,\n        'X-Timestamp': timestamp.toString(),\n        'X-App-Version': this.getAppVersion()\n      },\n      body: JSON.stringify({ data: encryptedData, timestamp })\n    });\n    \n    return this.decryptResponse(await response.json());\n  }\n}\n```

## 📱 다중 디바이스 관리

### 1. 디바이스 등록 제한\n```typescript\ninterface DeviceRegistration {\n  deviceId: string;\n  deviceName: string;\n  osInfo: string;\n  registeredAt: Date;\n  lastActiveAt: Date;\n  isActive: boolean;\n}\n\nclass DeviceManager {\n  async registerDevice(licenseKey: string, deviceInfo: DeviceInfo): Promise<void> {\n    const subscription = await this.getSubscription(licenseKey);\n    const maxDevices = this.getMaxDevicesForPlan(subscription.planType);\n    \n    const activeDevices = await this.getActiveDevices(licenseKey);\n    if (activeDevices.length >= maxDevices) {\n      throw new Error(`최대 ${maxDevices}개 디바이스까지만 등록 가능합니다.`);\n    }\n    \n    await this.addDevice(licenseKey, deviceInfo);\n  }\n  \n  private getMaxDevicesForPlan(planType: string): number {\n    const limits = {\n      'FREE': 1,\n      'PRO': 3,\n      'ENTERPRISE': 10\n    };\n    return limits[planType] || 1;\n  }\n}\n```

## 🔄 구독 상태 동기화

### 1. 실시간 상태 업데이트\n```typescript\nclass SubscriptionSyncManager {\n  async syncSubscriptionStatus(): Promise<void> {\n    try {\n      const localLicense = this.getLocalLicense();\n      const serverStatus = await this.fetchServerStatus(localLicense.key);\n      \n      // 구독 상태 변경 감지\n      if (serverStatus.status !== localLicense.status) {\n        await this.handleStatusChange(serverStatus);\n      }\n      \n      // 플랜 변경 감지\n      if (serverStatus.planType !== localLicense.planType) {\n        await this.handlePlanChange(serverStatus);\n      }\n      \n    } catch (error) {\n      // 동기화 실패 시 로컬 상태 유지\n      console.warn('구독 상태 동기화 실패:', error.message);\n    }\n  }\n  \n  private async handleStatusChange(newStatus: SubscriptionStatus): Promise<void> {\n    switch (newStatus.status) {\n      case 'cancelled':\n        this.showCancellationNotice(newStatus.validUntil);\n        break;\n      case 'past_due':\n        this.showPaymentFailureNotice();\n        break;\n      case 'active':\n        this.updateLocalLicense(newStatus);\n        break;\n    }\n  }\n}\n```

## 🚀 배포 및 업데이트

### 1. 자동 업데이트 시스템\n```typescript\nclass AutoUpdater {\n  async checkForUpdates(): Promise<UpdateInfo | null> {\n    const currentVersion = this.getCurrentVersion();\n    const latestVersion = await this.getLatestVersion();\n    \n    if (this.isNewerVersion(latestVersion.version, currentVersion)) {\n      return latestVersion;\n    }\n    \n    return null;\n  }\n  \n  async downloadAndInstallUpdate(updateInfo: UpdateInfo): Promise<void> {\n    // 1. 업데이트 파일 다운로드\n    const updateFile = await this.downloadUpdate(updateInfo.downloadUrl);\n    \n    // 2. 디지털 서명 검증\n    if (!this.verifyUpdateSignature(updateFile, updateInfo.signature)) {\n      throw new Error('업데이트 파일 서명이 유효하지 않습니다.');\n    }\n    \n    // 3. 백그라운드 설치\n    await this.installUpdate(updateFile);\n    \n    // 4. 재시작 알림\n    this.showRestartNotification();\n  }\n}\n```\n\n## 💰 수익화 전략\n\n### 1. 플랜별 기능 제한\n```typescript\nclass FeatureLimiter {\n  canUseFeature(feature: string): boolean {\n    const subscription = this.getCurrentSubscription();\n    const limits = this.getFeatureLimits(subscription.planType);\n    \n    switch (feature) {\n      case 'advanced_analysis':\n        return limits.hasAdvancedAnalysis;\n      case 'bulk_processing':\n        return limits.maxBulkFiles > 0;\n      case 'export_formats':\n        return limits.exportFormats.length > 1;\n      default:\n        return true;\n    }\n  }\n  \n  private getFeatureLimits(planType: string) {\n    const limits = {\n      'FREE': {\n        maxProjectsPerMonth: 5,\n        maxFilesPerProject: 100,\n        hasAdvancedAnalysis: false,\n        maxBulkFiles: 0,\n        exportFormats: ['json']\n      },\n      'PRO': {\n        maxProjectsPerMonth: 100,\n        maxFilesPerProject: 1000,\n        hasAdvancedAnalysis: true,\n        maxBulkFiles: 50,\n        exportFormats: ['json', 'pdf', 'xlsx']\n      },\n      'ENTERPRISE': {\n        maxProjectsPerMonth: -1, // 무제한\n        maxFilesPerProject: -1,\n        hasAdvancedAnalysis: true,\n        maxBulkFiles: -1,\n        exportFormats: ['json', 'pdf', 'xlsx', 'custom']\n      }\n    };\n    return limits[planType] || limits['FREE'];\n  }\n}\n```\n\n## 🔧 구현 우선순위\n\n### Phase 1: 기본 인증 (2주)\n1. 라이선스 키 생성/검증 시스템\n2. 데스크톱 앱 기본 인증\n3. 웹 구독 연동\n\n### Phase 2: 보안 강화 (2주)\n1. 오프라인 토큰 시스템\n2. 디바이스 바인딩\n3. 기본 크랙 방지\n\n### Phase 3: 고급 기능 (3주)\n1. 다중 디바이스 관리\n2. 자동 업데이트\n3. 고급 보안 기능\n\n### Phase 4: 최적화 (1주)\n1. 성능 최적화\n2. 사용자 경험 개선\n3. 모니터링 및 분석\n\n이 아키텍처를 통해 웹 기반 구독과 데스크톱 앱 사용을 완벽하게 연동할 수 있습니다."