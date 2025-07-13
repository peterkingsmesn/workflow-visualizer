// 🔐 라이센스 입력 다이얼로그
const { BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

class LicenseDialog {
  constructor(licenseService) {
    this.licenseService = licenseService;
    this.window = null;
  }

  /**
   * 🎯 라이센스 다이얼로그 표시
   */
  async show() {
    return new Promise((resolve) => {
      this.window = new BrowserWindow({
        width: 500,
        height: 400,
        modal: true,
        resizable: false,
        minimizable: false,
        maximizable: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false
        },
        title: 'Workflow Visualizer - License Activation',
        icon: path.join(__dirname, '../assets/icon.png')
      });

      // 라이센스 다이얼로그 HTML 로드
      this.window.loadFile(path.join(__dirname, '../pages/license.html'));

      // 창 닫기 이벤트
      this.window.on('closed', () => {
        this.window = null;
        resolve({ success: false, reason: 'dialog_closed' });
      });

      // IPC 이벤트 핸들러
      this.setupIpcHandlers(resolve);
    });
  }

  /**
   * 📡 IPC 이벤트 핸들러 설정
   */
  setupIpcHandlers(resolve) {
    // 라이센스 검증 요청
    ipcMain.handle('validate-license', async (event, licenseKey) => {
      try {
        const result = await this.licenseService.validateLicense(licenseKey);
        
        if (result.valid) {
          // 성공시 다이얼로그 닫기
          setTimeout(() => {
            if (this.window) {
              this.window.close();
              resolve({ success: true, license: result.license });
            }
          }, 2000);
        }
        
        return result;
      } catch (error) {
        return { valid: false, error: error.message };
      }
    });

    // 라이센스 구매 페이지 열기
    ipcMain.handle('open-purchase-page', async () => {
      const { shell } = require('electron');
      await shell.openExternal('https://halowf.com/pricing');
      return true;
    });

    // 평가판 시작
    ipcMain.handle('start-trial', async () => {
      // 14일 평가판 라이센스 생성
      const trialLicense = {
        key: 'WF-TRIAL-' + Date.now(),
        machineId: this.licenseService.getMachineId(),
        validatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        plan: 'trial',
        email: 'trial@local'
      };

      const saved = this.licenseService.saveLicense(trialLicense);
      if (saved) {
        setTimeout(() => {
          if (this.window) {
            this.window.close();
            resolve({ success: true, license: trialLicense, trial: true });
          }
        }, 1000);
        return { success: true };
      }
      
      return { success: false, error: 'Failed to start trial' };
    });

    // 기기 ID 가져오기
    ipcMain.handle('get-machine-id', () => {
      return this.licenseService.getMachineId();
    });

    // 라이센스 상태 조회
    ipcMain.handle('get-license-status', () => {
      return this.licenseService.getLicenseStatus();
    });

    // 라이센스 비활성화
    ipcMain.handle('deactivate-license', () => {
      const removed = this.licenseService.removeLicense();
      return { success: removed };
    });
  }

  /**
   * 🚫 다이얼로그 닫기
   */
  close() {
    if (this.window) {
      this.window.close();
    }
  }
}

module.exports = LicenseDialog;