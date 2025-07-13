# 멀티 플랫폼 EXE 빌드 시스템

## 💰 가격 정책 업데이트

### 새로운 가격 구조
```
- FREE: $0/월 (10개 파일, 기본 분석)
- PRO: $9.9/월 (무제한 파일, 고급 분석, 3개 디바이스)
- ENTERPRISE: $49/월 (팀 관리, 온프레미스, 무제한 디바이스)
```

### Stripe 가격 ID 업데이트
```javascript
const PRICE_CONFIG = {
  PRO: {
    priceId: process.env.STRIPE_PRICE_ID_PRO_MONTHLY, // $9.9/월
    amount: 990, // $9.90 (센트 단위)
    currency: 'usd',
    interval: 'month'
  },
  ENTERPRISE: {
    priceId: process.env.STRIPE_PRICE_ID_ENTERPRISE_MONTHLY, // $49/월
    amount: 4900, // $49.00
    currency: 'usd', 
    interval: 'month'
  }
};
```

## 🖥️ 멀티 플랫폼 빌드 전략

### 1. 타겟 플랫폼
```
1. Windows (x64) - .exe
2. macOS (Intel + Apple Silicon) - .app + .dmg
3. Linux (x64) - .AppImage
```

### 2. 빌드 도구 선택

#### Electron (추천)
```javascript
// package.json
{
  "main": "src/electron/main.js",
  "scripts": {
    "electron:dev": "concurrently \"npm run web:dev\" \"electron .\"",
    "electron:build": "npm run web:build && electron-builder",
    "build:windows": "electron-builder --windows",
    "build:mac": "electron-builder --mac",
    "build:linux": "electron-builder --linux"
  },
  "build": {
    "appId": "com.workflowvisualizer.desktop",
    "productName": "Workflow Visualizer",
    "directories": {
      "output": "dist"
    },
    "files": [
      "dist/**/*",
      "src/electron/**/*",
      "node_modules/**/*"
    ],
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        }
      ],
      "icon": "assets/icon.ico",
      "publisherName": "Workflow Visualizer Inc."
    },
    "mac": {
      "target": [
        {
          "target": "dmg",
          "arch": ["x64", "arm64"]
        }
      ],
      "icon": "assets/icon.icns",
      "category": "public.app-category.developer-tools"
    },
    "linux": {
      "target": [
        {
          "target": "AppImage",
          "arch": ["x64"]
        }
      ],
      "icon": "assets/icon.png",
      "category": "Development"
    }
  }
}
```

### 3. Electron 메인 프로세스 구조

```javascript
// src/electron/main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

class WorkflowVisualizerApp {
  constructor() {
    this.mainWindow = null;
    this.licenseManager = new LicenseManager();
    this.setupEventHandlers();
  }

  async createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      icon: this.getAppIcon(),
      show: false // 라이선스 검증 후 표시
    });

    // 라이선스 검증
    const isLicenseValid = await this.licenseManager.validateLicense();
    if (!isLicenseValid) {
      this.showLicenseDialog();
      return;
    }

    // 메인 앱 로드
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    this.mainWindow.show();
  }

  getAppIcon() {
    const platform = process.platform;
    if (platform === 'win32') {
      return path.join(__dirname, '../assets/icon.ico');
    } else if (platform === 'darwin') {
      return path.join(__dirname, '../assets/icon.icns');
    } else {
      return path.join(__dirname, '../assets/icon.png');
    }
  }

  setupEventHandlers() {
    app.whenReady().then(() => this.createMainWindow());
    
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });

    // IPC 핸들러
    ipcMain.handle('license:validate', async (event, licenseKey) => {
      return await this.licenseManager.validateLicense(licenseKey);
    });

    ipcMain.handle('analysis:run', async (event, analysisData) => {
      return await this.runSecureAnalysis(analysisData);
    });
  }
}

new WorkflowVisualizerApp();
```

## 🔐 운영체제별 라이선스 시스템

### 1. 디바이스 핑거프린팅 (OS별)

```javascript
// src/electron/license/DeviceFingerprinting.js
const os = require('os');
const crypto = require('crypto');

class DeviceFingerprinting {
  generateFingerprint() {
    const platform = process.platform;
    
    switch (platform) {
      case 'win32':
        return this.generateWindowsFingerprint();
      case 'darwin':
        return this.generateMacFingerprint();
      case 'linux':
        return this.generateLinuxFingerprint();
      default:
        return this.generateGenericFingerprint();
    }
  }

  generateWindowsFingerprint() {
    const { execSync } = require('child_process');
    
    try {
      // Windows 고유 정보 수집
      const cpuId = execSync('wmic cpu get ProcessorId /value', { encoding: 'utf8' })
        .split('=')[1]?.trim();
      const motherboardSerial = execSync('wmic baseboard get SerialNumber /value', { encoding: 'utf8' })
        .split('=')[1]?.trim();
      const biosSerial = execSync('wmic bios get SerialNumber /value', { encoding: 'utf8' })
        .split('=')[1]?.trim();
      
      const hwInfo = {
        platform: 'win32',
        cpuId: cpuId || 'unknown',
        motherboardSerial: motherboardSerial || 'unknown',
        biosSerial: biosSerial || 'unknown',
        hostname: os.hostname(),
        arch: os.arch()
      };
      
      return this.hashFingerprint(hwInfo);
    } catch (error) {
      return this.generateGenericFingerprint();
    }
  }

  generateMacFingerprint() {
    const { execSync } = require('child_process');
    
    try {
      // macOS 고유 정보 수집
      const serialNumber = execSync('system_profiler SPHardwareDataType | grep "Serial Number"', { encoding: 'utf8' })
        .split(':')[1]?.trim();
      const macAddress = execSync('ifconfig en0 | grep ether', { encoding: 'utf8' })
        .split(' ')[1]?.trim();
      const hwUuid = execSync('system_profiler SPHardwareDataType | grep "Hardware UUID"', { encoding: 'utf8' })
        .split(':')[1]?.trim();
      
      const hwInfo = {
        platform: 'darwin',
        serialNumber: serialNumber || 'unknown',
        macAddress: macAddress || 'unknown',
        hwUuid: hwUuid || 'unknown',
        hostname: os.hostname(),
        arch: os.arch()
      };
      
      return this.hashFingerprint(hwInfo);
    } catch (error) {
      return this.generateGenericFingerprint();
    }
  }

  generateLinuxFingerprint() {
    const { execSync } = require('child_process');
    
    try {
      // Linux 고유 정보 수집
      const machineId = execSync('cat /etc/machine-id || cat /var/lib/dbus/machine-id', { encoding: 'utf8' })
        .trim();
      const cpuInfo = execSync('cat /proc/cpuinfo | grep "processor\\|model name" | head -2', { encoding: 'utf8' });
      const dmidecode = execSync('sudo dmidecode -s system-serial-number 2>/dev/null || echo "unknown"', { encoding: 'utf8' })
        .trim();
      
      const hwInfo = {
        platform: 'linux',
        machineId: machineId || 'unknown',
        cpuInfo: crypto.createHash('md5').update(cpuInfo).digest('hex').substring(0, 8),
        systemSerial: dmidecode || 'unknown',
        hostname: os.hostname(),
        arch: os.arch()
      };
      
      return this.hashFingerprint(hwInfo);
    } catch (error) {
      return this.generateGenericFingerprint();
    }
  }

  generateGenericFingerprint() {
    const hwInfo = {
      platform: process.platform,
      hostname: os.hostname(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalmem: os.totalmem(),
      userInfo: os.userInfo().username
    };
    
    return this.hashFingerprint(hwInfo);
  }

  hashFingerprint(hwInfo) {
    const fingerprint = crypto
      .createHash('sha256')
      .update(JSON.stringify(hwInfo, Object.keys(hwInfo).sort()))
      .digest('hex')
      .substring(0, 16);
    
    return fingerprint;
  }
}

module.exports = DeviceFingerprinting;
```

### 2. 라이선스 관리자

```javascript
// src/electron/license/LicenseManager.js
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class LicenseManager {
  constructor() {
    this.deviceFingerprinting = new DeviceFingerprinting();
    this.licenseFile = this.getLicenseFilePath();
    this.serverUrl = process.env.LICENSE_SERVER_URL || 'https://api.workflow-visualizer.com';
  }

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

      // 2. 온라인 검증
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
      return { valid: false, reason: 'VALIDATION_ERROR' };
    }
  }

  validateKeyFormat(licenseKey) {
    // WV2024-AB7CD-E9F12-GH3IJ-K4L56 형식 검증
    const keyPattern = /^WV2024-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;
    return keyPattern.test(licenseKey);
  }

  async validateOnline(licenseKey) {
    try {
      const deviceFingerprint = this.deviceFingerprinting.generateFingerprint();
      
      const response = await fetch(`${this.serverUrl}/desktop/license/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `WorkflowVisualizer-Desktop/${this.getAppVersion()}`,
        },
        body: JSON.stringify({
          licenseKey,
          deviceFingerprint,
          platform: process.platform,
          appVersion: this.getAppVersion()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.warn('온라인 라이선스 검증 실패:', error.message);
      return { valid: false, reason: 'NETWORK_ERROR' };
    }
  }

  async validateOffline() {
    try {
      const storedLicense = await this.readStoredLicense();
      if (!storedLicense) {
        return { valid: false, reason: 'NO_OFFLINE_LICENSE' };
      }

      // 토큰 만료 검사
      if (Date.now() > storedLicense.expiresAt) {
        return { valid: false, reason: 'OFFLINE_TOKEN_EXPIRED' };
      }

      // 디바이스 바인딩 검사
      const currentFingerprint = this.deviceFingerprinting.generateFingerprint();
      if (storedLicense.deviceFingerprint !== currentFingerprint) {
        return { valid: false, reason: 'DEVICE_MISMATCH' };
      }

      // 최대 오프라인 기간 검사 (30일)
      const maxOfflineMs = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - storedLicense.lastOnlineCheck > maxOfflineMs) {
        return { valid: false, reason: 'OFFLINE_PERIOD_EXCEEDED' };
      }

      return { valid: true, data: storedLicense };

    } catch (error) {
      return { valid: false, reason: 'OFFLINE_VALIDATION_ERROR' };
    }
  }

  async storeLicense(licenseKey, validationData) {
    try {
      const licenseData = {
        key: licenseKey,
        deviceFingerprint: this.deviceFingerprinting.generateFingerprint(),
        validUntil: validationData.validUntil,
        planType: validationData.planType,
        maxDevices: validationData.maxDevices,
        lastOnlineCheck: Date.now(),
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30일 후 만료
        storedAt: Date.now()
      };

      // 암호화하여 저장
      const encryptedData = this.encryptLicenseData(licenseData);
      
      // 디렉토리 생성
      const licenseDir = path.dirname(this.licenseFile);
      await fs.mkdir(licenseDir, { recursive: true });
      
      // 파일 저장
      await fs.writeFile(this.licenseFile, encryptedData);

    } catch (error) {
      console.error('라이선스 저장 오류:', error);
      throw error;
    }
  }

  async readStoredLicense() {
    try {
      const encryptedData = await fs.readFile(this.licenseFile, 'utf8');
      return this.decryptLicenseData(encryptedData);
    } catch (error) {
      return null;
    }
  }

  encryptLicenseData(data) {
    const key = this.getDerivedKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', key);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  decryptLicenseData(encryptedData) {
    const key = this.getDerivedKey();
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  getDerivedKey() {
    // 디바이스별 고유 키 생성
    const fingerprint = this.deviceFingerprinting.generateFingerprint();
    return crypto.createHash('sha256').update(fingerprint + 'WORKFLOW_VISUALIZER_2024').digest('hex');
  }

  getAppVersion() {
    const packageJson = require('../../package.json');
    return packageJson.version;
  }
}

module.exports = LicenseManager;
```

## 🔧 빌드 설정 및 배포

### 1. GitHub Actions 워크플로우

```yaml
# .github/workflows/desktop-build.yml
name: Desktop App Build

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build web app
        run: npm run build
      
      - name: Build Windows app
        if: matrix.os == 'windows-latest'
        run: npm run build:windows
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build macOS app
        if: matrix.os == 'macos-latest'
        run: npm run build:mac
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          CSC_LINK: ${{ secrets.MAC_CERTIFICATE }}
          CSC_KEY_PASSWORD: ${{ secrets.MAC_CERTIFICATE_PASSWORD }}
      
      - name: Build Linux app
        if: matrix.os == 'ubuntu-latest'
        run: npm run build:linux
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: desktop-app-${{ matrix.os }}
          path: dist/
```

### 2. 자동 업데이트 시스템

```javascript
// src/electron/updater/AutoUpdater.js
const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');

class AutoUpdater {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.setupUpdater();
  }

  setupUpdater() {
    // 업데이트 서버 설정
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'your-org',
      repo: 'workflow-visualizer',
      private: false
    });

    // 업데이트 이벤트 처리
    autoUpdater.on('checking-for-update', () => {
      console.log('업데이트 확인 중...');
    });

    autoUpdater.on('update-available', (info) => {
      console.log('업데이트 발견:', info.version);
      this.showUpdateDialog(info);
    });

    autoUpdater.on('update-not-available', () => {
      console.log('최신 버전입니다.');
    });

    autoUpdater.on('error', (err) => {
      console.error('업데이트 오류:', err);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      const logMessage = `다운로드 진행률: ${progressObj.percent}%`;
      console.log(logMessage);
      this.mainWindow.webContents.send('update-progress', progressObj);
    });

    autoUpdater.on('update-downloaded', () => {
      this.showRestartDialog();
    });
  }

  async checkForUpdates() {
    try {
      await autoUpdater.checkForUpdatesAndNotify();
    } catch (error) {
      console.error('업데이트 확인 실패:', error);
    }
  }

  showUpdateDialog(updateInfo) {
    const response = dialog.showMessageBoxSync(this.mainWindow, {
      type: 'question',
      buttons: ['업데이트', '나중에'],
      defaultId: 0,
      message: '새 업데이트가 있습니다',
      detail: `버전 ${updateInfo.version}이 발견되었습니다. 지금 다운로드하시겠습니까?`
    });

    if (response === 0) {
      autoUpdater.downloadUpdate();
    }
  }

  showRestartDialog() {
    const response = dialog.showMessageBoxSync(this.mainWindow, {
      type: 'question',
      buttons: ['재시작', '나중에'],
      defaultId: 0,
      message: '업데이트 완료',
      detail: '업데이트 설치를 완료하려면 앱을 재시작해야 합니다.'
    });

    if (response === 0) {
      autoUpdater.quitAndInstall();
    }
  }
}

module.exports = AutoUpdater;
```

## 📦 최종 배포 패키지

### 예상 배포 파일들:
```
# Windows
WorkflowVisualizer-Setup-1.0.0.exe (약 150MB)

# macOS  
WorkflowVisualizer-1.0.0.dmg (약 200MB)
WorkflowVisualizer-1.0.0-arm64.dmg (Apple Silicon)

# Linux
WorkflowVisualizer-1.0.0.AppImage (약 180MB)
```

### 다운로드 페이지 구성:
```markdown
## Workflow Visualizer Desktop - $9.9/월

### 지원 플랫폼:
- 🪟 Windows 10/11 (64-bit)
- 🍎 macOS 10.15+ (Intel & Apple Silicon)
- 🐧 Linux (Ubuntu 18.04+, AppImage)

### 기능:
- ✅ 오프라인 분석 (30일간)
- ✅ 무제한 프로젝트
- ✅ 고급 의존성 분석
- ✅ 3개 디바이스 동시 사용
- ✅ 자동 업데이트
```

이렇게 **$9.9/월**로 **3개 플랫폼 EXE**를 제공하면서 **안전한 라이선스 시스템**을 구축할 수 있습니다!