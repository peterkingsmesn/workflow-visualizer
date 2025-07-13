const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const DeviceFingerprinting = require('./DeviceFingerprinting');

// 💰 데스크톱 라이선스 관리자 ($9.9/월 구독 검증)
class LicenseManager {
  constructor() {
    this.deviceFingerprinting = new DeviceFingerprinting();
    this.licenseFile = this.getLicenseFilePath();
    this.serverUrl = process.env.LICENSE_SERVER_URL || 'https://api.workflow-visualizer.com';
    this.maxOfflineDays = 30; // 최대 30일 오프라인 허용
  }

  // 💰 운영체제별 라이선스 파일 경로
  getLicenseFilePath() {
    const platform = process.platform;
    let appDataPath;
    
    if (platform === 'win32') {
      appDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'WorkflowVisualizer');
    } else if (platform === 'darwin') {
      appDataPath = path.join(os.homedir(), 'Library', 'Application Support', 'WorkflowVisualizer');
    } else {
      appDataPath = path.join(os.homedir(), '.config', 'workflow-visualizer');
    }
    
    return path.join(appDataPath, 'license.dat');
  }

  // 💰 메인 라이선스 검증 함수
  async validateLicense(newLicenseKey = null) {
    try {
      let licenseKey = newLicenseKey;
      
      if (!licenseKey) {
        // 저장된 라이선스 키 읽기
        const storedLicense = await this.readStoredLicense();
        if (!storedLicense) {
          return { valid: false, reason: 'NO_LICENSE' };
        }
        licenseKey = storedLicense.key;
      }

      // 1. 라이선스 키 포맷 검증
      if (!this.validateKeyFormat(licenseKey)) {
        return { valid: false, reason: 'INVALID_FORMAT' };
      }

      // 2. 온라인 검증 시도
      const onlineValidation = await this.validateOnline(licenseKey);
      if (onlineValidation.valid) {
        await this.storeLicense(licenseKey, onlineValidation.data);
        return { valid: true, data: onlineValidation.data };
      }

      // 3. 온라인 검증 실패 시 오프라인 검증
      const offlineValidation = await this.validateOffline();
      return offlineValidation;

    } catch (error) {
      console.error('라이선스 검증 오류:', error);
      return { valid: false, reason: 'VALIDATION_ERROR', error: error.message };
    }
  }

  // 💰 라이선스 키 포맷 검증 (WV2024-XXXXX-XXXXX-XXXXX-XXXXX)
  validateKeyFormat(licenseKey) {
    if (!licenseKey || typeof licenseKey !== 'string') {
      return false;
    }
    
    // WV2024-AB7CD-E9F12-GH3IJ-K4L56 형식 검증
    const keyPattern = /^WV2024-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;
    return keyPattern.test(licenseKey);
  }

  // 💰 서버 온라인 검증
  async validateOnline(licenseKey) {
    try {
      const deviceFingerprint = this.deviceFingerprinting.generateFingerprint();
      const platformInfo = this.deviceFingerprinting.getPlatformInfo();
      
      const requestBody = {
        licenseKey,
        deviceFingerprint,
        platform: platformInfo.platform,
        arch: platformInfo.arch,
        hostname: platformInfo.hostname,
        appVersion: this.getAppVersion()
      };

      console.log('서버 라이선스 검증 요청:', { licenseKey, deviceFingerprint });

      const response = await fetch(`${this.serverUrl}/api/billing/validate-license`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `WorkflowVisualizer-Desktop/${this.getAppVersion()}`,
        },
        body: JSON.stringify(requestBody),
        timeout: 10000 // 10초 타임아웃
      });

      if (!response.ok) {
        console.warn(`서버 응답 오류: HTTP ${response.status}`);
        return { valid: false, reason: 'SERVER_ERROR' };
      }

      const result = await response.json();
      console.log('서버 검증 결과:', result);
      return result;

    } catch (error) {
      console.warn('온라인 라이선스 검증 실패:', error.message);
      return { valid: false, reason: 'NETWORK_ERROR' };
    }
  }

  // 💰 오프라인 라이선스 검증
  async validateOffline() {
    try {
      const storedLicense = await this.readStoredLicense();
      if (!storedLicense) {
        return { valid: false, reason: 'NO_OFFLINE_LICENSE' };
      }

      // 오프라인 토큰 만료 검사
      if (Date.now() > storedLicense.expiresAt) {
        return { valid: false, reason: 'OFFLINE_TOKEN_EXPIRED' };
      }

      // 디바이스 바인딩 검사
      const currentFingerprint = this.deviceFingerprinting.generateFingerprint();
      if (storedLicense.deviceFingerprint !== currentFingerprint) {
        return { valid: false, reason: 'DEVICE_MISMATCH' };
      }

      // 구독 만료 검사
      if (Date.now() > new Date(storedLicense.validUntil).getTime()) {
        return { valid: false, reason: 'SUBSCRIPTION_EXPIRED' };
      }

      // 최대 오프라인 기간 검사 (30일)
      const maxOfflineMs = this.maxOfflineDays * 24 * 60 * 60 * 1000;
      if (Date.now() - storedLicense.lastOnlineCheck > maxOfflineMs) {
        return { valid: false, reason: 'OFFLINE_PERIOD_EXCEEDED' };
      }

      console.log('오프라인 라이선스 검증 성공');
      return { valid: true, data: storedLicense };

    } catch (error) {
      console.error('오프라인 검증 오류:', error);
      return { valid: false, reason: 'OFFLINE_VALIDATION_ERROR' };
    }
  }

  // 💰 라이선스 데이터 암호화 저장
  async storeLicense(licenseKey, validationData) {
    try {
      const licenseData = {
        key: licenseKey,
        deviceFingerprint: this.deviceFingerprinting.generateFingerprint(),
        planType: validationData.planType,
        validUntil: validationData.validUntil,
        maxDevices: validationData.maxDevices,
        features: validationData.features || {},
        lastOnlineCheck: Date.now(),
        expiresAt: Date.now() + (this.maxOfflineDays * 24 * 60 * 60 * 1000), // 30일 후 만료
        storedAt: Date.now(),
        version: '1.0'
      };

      // 암호화하여 저장
      const encryptedData = this.encryptLicenseData(licenseData);
      
      // 디렉토리 생성
      const licenseDir = path.dirname(this.licenseFile);
      await fs.mkdir(licenseDir, { recursive: true });
      
      // 파일 저장
      await fs.writeFile(this.licenseFile, encryptedData);
      
      console.log('라이선스 저장 완료:', this.licenseFile);

    } catch (error) {
      console.error('라이선스 저장 오류:', error);
      throw error;
    }
  }

  // 💰 저장된 라이선스 읽기
  async readStoredLicense() {
    try {
      const encryptedData = await fs.readFile(this.licenseFile, 'utf8');
      const decryptedData = this.decryptLicenseData(encryptedData);
      return decryptedData;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn('라이선스 파일 읽기 오류:', error.message);
      }
      return null;
    }
  }

  // 💰 라이선스 데이터 암호화
  encryptLicenseData(data) {
    try {
      const key = this.getDerivedKey();
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-cbc', key);
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('암호화 오류:', error);
      throw error;
    }
  }

  // 💰 라이선스 데이터 복호화
  decryptLicenseData(encryptedData) {
    try {
      const key = this.getDerivedKey();
      const parts = encryptedData.split(':');
      if (parts.length !== 2) {
        throw new Error('잘못된 라이선스 파일 형식');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedText = parts[1];
      
      const decipher = crypto.createDecipher('aes-256-cbc', key);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('복호화 오류:', error);
      throw new Error('라이선스 파일이 손상되었습니다.');
    }
  }

  // 💰 디바이스별 고유 키 생성
  getDerivedKey() {
    const fingerprint = this.deviceFingerprinting.generateFingerprint();
    const salt = 'WORKFLOW_VISUALIZER_2024_DESKTOP';
    return crypto.createHash('sha256').update(fingerprint + salt).digest('hex');
  }

  // 💰 현재 라이선스 정보 조회
  async getCurrentLicenseInfo() {
    const storedLicense = await this.readStoredLicense();
    if (!storedLicense) {
      throw new Error('라이선스가 없습니다.');
    }

    return {
      planType: storedLicense.planType,
      validUntil: new Date(storedLicense.validUntil).toLocaleDateString(),
      maxDevices: storedLicense.maxDevices,
      deviceCount: 1, // 현재 디바이스
      lastOnlineCheck: new Date(storedLicense.lastOnlineCheck).toLocaleDateString(),
      offlineDaysRemaining: Math.max(0, Math.floor(
        (storedLicense.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)
      ))
    };
  }

  // 💰 라이선스 삭제 (로그아웃 시)
  async removeLicense() {
    try {
      await fs.unlink(this.licenseFile);
      console.log('라이선스 파일 삭제 완료');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('라이선스 삭제 오류:', error);
      }
    }
  }

  // 💰 앱 버전 조회
  getAppVersion() {
    try {
      const packageJson = require('../../package.json');
      return packageJson.version;
    } catch (error) {
      return '1.0.0';
    }
  }

  // 💰 라이선스 상태 체크 (주기적 호출용)
  async checkLicenseStatus() {
    const validation = await this.validateLicense();
    
    if (!validation.valid) {
      console.warn('라이선스 검증 실패:', validation.reason);
      
      // UI에 경고 표시
      return {
        status: 'invalid',
        reason: validation.reason,
        message: this.getErrorMessage(validation.reason)
      };
    }

    return {
      status: 'valid',
      data: validation.data
    };
  }

  // 💰 오류 메시지 변환
  getErrorMessage(reason) {
    const messages = {
      'NO_LICENSE': '라이선스 키가 없습니다. 구독을 확인해주세요.',
      'INVALID_FORMAT': '잘못된 라이선스 키 형식입니다.',
      'NETWORK_ERROR': '서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.',
      'SERVER_ERROR': '라이선스 서버에서 오류가 발생했습니다.',
      'INVALID_LICENSE': '유효하지 않은 라이선스 키입니다.',
      'SUBSCRIPTION_EXPIRED': '구독이 만료되었습니다. 구독을 갱신해주세요.',
      'DEVICE_LIMIT_EXCEEDED': '디바이스 제한을 초과했습니다.',
      'DEVICE_MISMATCH': '다른 디바이스에서 등록된 라이선스입니다.',
      'OFFLINE_PERIOD_EXCEEDED': '오프라인 사용 기간(30일)을 초과했습니다. 인터넷에 연결해주세요.',
      'OFFLINE_TOKEN_EXPIRED': '오프라인 토큰이 만료되었습니다.',
      'VALIDATION_ERROR': '라이선스 검증 중 오류가 발생했습니다.'
    };

    return messages[reason] || '알 수 없는 오류가 발생했습니다.';
  }
}

module.exports = LicenseManager;