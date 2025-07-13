// 🔐 라이센스 검증 서비스
const crypto = require('crypto');
const { machineIdSync } = require('node-machine-id');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class LicenseService {
  constructor() {
    this.licenseFile = path.join(app.getPath('userData'), 'license.dat');
    this.licenseServerUrl = 'https://halowf.com/api/license'; // 나중에 구현
    this.encryptionKey = 'workflow-visualizer-2025-license-key'; // 실제로는 더 복잡한 키 사용
  }

  /**
   * 🎯 라이센스 키 검증
   */
  async validateLicense(licenseKey) {
    try {
      // 1. 라이센스 키 형식 검증
      if (!this.isValidLicenseFormat(licenseKey)) {
        return { valid: false, error: 'Invalid license format' };
      }

      // 2. 기기 ID 생성
      const machineId = this.getMachineId();
      
      // 3. 로컬 라이센스 파일 확인
      const localLicense = this.getLocalLicense();
      if (localLicense && localLicense.key === licenseKey) {
        // 만료일 확인
        if (this.isLicenseExpired(localLicense)) {
          return { valid: false, error: 'License expired' };
        }
        return { valid: true, license: localLicense };
      }

      // 4. 온라인 검증 (나중에 구현)
      const onlineValidation = await this.validateOnline(licenseKey, machineId);
      if (onlineValidation.valid) {
        // 로컬에 저장
        this.saveLicense({
          key: licenseKey,
          machineId: machineId,
          validatedAt: new Date().toISOString(),
          expiresAt: onlineValidation.expiresAt,
          plan: onlineValidation.plan || 'monthly',
          email: onlineValidation.email
        });
        return onlineValidation;
      }

      return { valid: false, error: 'License verification failed' };
    } catch (error) {
      console.error('License validation error:', error);
      return { valid: false, error: 'Validation error' };
    }
  }

  /**
   * 🔑 라이센스 키 형식 검증
   */
  isValidLicenseFormat(licenseKey) {
    // WF-XXXX-XXXX-XXXX-XXXX 형식
    const licensePattern = /^WF-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return licensePattern.test(licenseKey);
  }

  /**
   * 🖥️ 기기 ID 생성
   */
  getMachineId() {
    try {
      return machineIdSync();
    } catch (error) {
      // 폴백: 기본 식별자 생성
      return crypto.createHash('sha256')
        .update(require('os').hostname() + require('os').platform())
        .digest('hex')
        .substring(0, 32);
    }
  }

  /**
   * 💾 로컬 라이센스 정보 저장
   */
  saveLicense(licenseData) {
    try {
      const encrypted = this.encrypt(JSON.stringify(licenseData));
      fs.writeFileSync(this.licenseFile, encrypted);
      return true;
    } catch (error) {
      console.error('Failed to save license:', error);
      return false;
    }
  }

  /**
   * 📄 로컬 라이센스 정보 읽기
   */
  getLocalLicense() {
    try {
      if (!fs.existsSync(this.licenseFile)) {
        return null;
      }
      
      const encrypted = fs.readFileSync(this.licenseFile, 'utf8');
      const decrypted = this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to read license:', error);
      return null;
    }
  }

  /**
   * ⏰ 라이센스 만료 확인
   */
  isLicenseExpired(license) {
    if (!license.expiresAt) return false;
    return new Date() > new Date(license.expiresAt);
  }

  /**
   * 🌐 온라인 라이센스 검증 (나중에 구현)
   */
  async validateOnline(licenseKey, machineId) {
    try {
      // 실제 서버 구현시 사용할 코드
      /*
      const response = await fetch(this.licenseServerUrl + '/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          licenseKey,
          machineId,
          product: 'workflow-visualizer'
        })
      });
      
      const result = await response.json();
      return result;
      */

      // 임시: 개발용 라이센스 키
      if (licenseKey === 'WF-DEV0-TEST-LICE-NSE1') {
        return {
          valid: true,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30일
          plan: 'monthly',
          email: 'dev@example.com'
        };
      }

      return { valid: false, error: 'License not found' };
    } catch (error) {
      console.error('Online validation failed:', error);
      // 오프라인 모드에서는 로컬 라이센스 확인
      return { valid: false, error: 'Network error' };
    }
  }

  /**
   * 🔓 라이센스 제거
   */
  removeLicense() {
    try {
      if (fs.existsSync(this.licenseFile)) {
        fs.unlinkSync(this.licenseFile);
      }
      return true;
    } catch (error) {
      console.error('Failed to remove license:', error);
      return false;
    }
  }

  /**
   * 📊 라이센스 상태 확인
   */
  getLicenseStatus() {
    const license = this.getLocalLicense();
    if (!license) {
      return { status: 'unlicensed', message: 'No license found' };
    }

    if (this.isLicenseExpired(license)) {
      return { 
        status: 'expired', 
        message: 'License expired',
        expiresAt: license.expiresAt,
        license 
      };
    }

    const daysUntilExpiry = license.expiresAt ? 
      Math.ceil((new Date(license.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) : null;

    return {
      status: 'active',
      message: 'License active',
      license,
      daysUntilExpiry
    };
  }

  /**
   * 🔐 암호화
   */
  encrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * 🔓 복호화
   */
  decrypt(encryptedData) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * 🔄 라이센스 갱신 확인
   */
  async checkForRenewal() {
    const license = this.getLocalLicense();
    if (!license) return false;

    try {
      // 서버에서 갱신 상태 확인
      const renewal = await this.validateOnline(license.key, license.machineId);
      if (renewal.valid && renewal.expiresAt !== license.expiresAt) {
        // 라이센스가 갱신됨
        license.expiresAt = renewal.expiresAt;
        this.saveLicense(license);
        return true;
      }
    } catch (error) {
      console.error('Renewal check failed:', error);
    }

    return false;
  }
}

module.exports = LicenseService;