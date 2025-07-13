// 🔑 라이센스 키 생성 유틸리티 (서버에서 사용)
const crypto = require('crypto');

class LicenseKeyGenerator {
  constructor() {
    this.secretKey = 'workflow-visualizer-license-secret-2025';
  }

  /**
   * 🎯 라이센스 키 생성
   */
  generateLicenseKey(email, plan = 'monthly', machineId = null) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    
    // 체크섬 생성
    const checksum = this.generateChecksum(email, plan, timestamp);
    
    // WF-XXXX-XXXX-XXXX-XXXX 형식으로 생성
    const part1 = checksum.substring(0, 4);
    const part2 = timestamp.toString(16).substring(0, 4).toUpperCase();
    const part3 = random.substring(0, 4);
    const part4 = this.encodePlan(plan) + this.generateRandomString(2);
    
    return `WF-${part1}-${part2}-${part3}-${part4}`;
  }

  /**
   * 🔍 라이센스 키 검증
   */
  validateLicenseKey(licenseKey, email, plan) {
    try {
      // 형식 검사
      if (!this.isValidFormat(licenseKey)) {
        return false;
      }

      const parts = licenseKey.split('-');
      const checksum = parts[1];
      const timestamp = parseInt(parts[2], 16);
      
      // 타임스탬프 유효성 검사 (너무 오래된 키 거부)
      const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
      if (timestamp < oneYearAgo) {
        return false;
      }

      // 체크섬 검증
      const expectedChecksum = this.generateChecksum(email, plan, timestamp);
      return checksum === expectedChecksum.substring(0, 4);
    } catch (error) {
      return false;
    }
  }

  /**
   * 🎲 체크섬 생성
   */
  generateChecksum(email, plan, timestamp) {
    const data = `${email}:${plan}:${timestamp}:${this.secretKey}`;
    return crypto.createHash('sha256').update(data).digest('hex').toUpperCase();
  }

  /**
   * 📝 플랜 인코딩
   */
  encodePlan(plan) {
    const planCodes = {
      'trial': 'T1',
      'monthly': 'M1',
      'yearly': 'Y1',
      'lifetime': 'L1'
    };
    return planCodes[plan] || 'M1';
  }

  /**
   * 🔤 랜덤 문자열 생성
   */
  generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * ✅ 형식 검증
   */
  isValidFormat(licenseKey) {
    const pattern = /^WF-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return pattern.test(licenseKey);
  }

  /**
   * 🎫 배치 라이센스 키 생성
   */
  generateBatchLicenses(count, email, plan = 'monthly') {
    const licenses = [];
    for (let i = 0; i < count; i++) {
      licenses.push({
        key: this.generateLicenseKey(email, plan),
        email,
        plan,
        createdAt: new Date().toISOString(),
        status: 'active'
      });
    }
    return licenses;
  }

  /**
   * 🔄 라이센스 갱신
   */
  renewLicense(oldLicenseKey, email, plan) {
    // 기존 라이센스 검증
    if (!this.validateLicenseKey(oldLicenseKey, email, plan)) {
      throw new Error('Invalid license key for renewal');
    }

    // 새 라이센스 키 생성
    return this.generateLicenseKey(email, plan);
  }

  /**
   * 📊 라이센스 정보 파싱
   */
  parseLicenseKey(licenseKey) {
    if (!this.isValidFormat(licenseKey)) {
      return null;
    }

    const parts = licenseKey.split('-');
    const timestamp = parseInt(parts[2], 16);
    const planCode = parts[4].substring(0, 2);
    
    const planMap = {
      'T1': 'trial',
      'M1': 'monthly', 
      'Y1': 'yearly',
      'L1': 'lifetime'
    };

    return {
      checksum: parts[1],
      timestamp: new Date(timestamp),
      plan: planMap[planCode] || 'monthly',
      random: parts[3]
    };
  }
}

module.exports = LicenseKeyGenerator;