const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// 🔐 라이센스 시스템 클래스들
const LicenseService = require('./services/LicenseService');
const LicenseDialog = require('./components/LicenseDialog');

class WorkflowVisualizerApp {
  constructor() {
    this.mainWindow = null;
    this.licenseService = new LicenseService();
    this.licenseDialog = new LicenseDialog(this.licenseService);
    this.isQuitting = false;
    
    this.setupApp();
  }

  setupApp() {
    // 💰 앱 이벤트 설정
    app.whenReady().then(() => this.onReady());
    
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

    app.on('before-quit', () => {
      this.isQuitting = true;
    });

    // 💰 IPC 이벤트 핸들러 설정
    this.setupIpcHandlers();
    
    // 💰 자동 업데이트 설정
    this.setupAutoUpdater();
  }

  async onReady() {
    // 💰 앱 메뉴 설정
    this.createMenu();
    
    // 💰 라이선스 검증 후 메인 윈도우 생성
    await this.validateLicenseAndCreateWindow();
  }

  async validateLicenseAndCreateWindow() {
    try {
      // 🔐 저장된 라이센스 상태 확인
      const licenseStatus = this.licenseService.getLicenseStatus();
      
      if (licenseStatus.status === 'unlicensed' || licenseStatus.status === 'expired') {
        // 🔐 라이센스 없거나 만료된 경우 -> 라이센스 입력 창
        const result = await this.licenseDialog.show();
        
        if (result.success) {
          // 라이센스 활성화 성공 -> 메인 앱 실행
          this.createMainWindow();
        } else {
          // 라이센스 활성화 실패 -> 앱 종료
          app.quit();
        }
      } else {
        // 🔐 유효한 라이센스 -> 메인 앱 실행
        this.createMainWindow();
      }
    } catch (error) {
      console.error('라이센스 검증 오류:', error);
      const result = await this.licenseDialog.show();
      
      if (result.success) {
        this.createMainWindow();
      } else {
        app.quit();
      }
    }
  }


  createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1000,
      minHeight: 600,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: true
      },
      icon: this.getAppIcon(),
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
    });

    // 💰 메인 앱 로드
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      
      // 💰 자동 업데이트 확인
      if (!isDev) {
        autoUpdater.checkForUpdatesAndNotify();
      }
    });

    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting && process.platform === 'darwin') {
        event.preventDefault();
        this.mainWindow.hide();
      }
    });
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

  createMenu() {
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Project',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.mainWindow?.webContents.send('menu-new-project');
            }
          },
          {
            label: 'Open Project',
            accelerator: 'CmdOrCtrl+O',
            click: () => {
              this.mainWindow?.webContents.send('menu-open-project');
            }
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About',
            click: () => {
              this.showAboutDialog();
            }
          },
          {
            label: 'License Manager',
            click: () => {
              this.showLicenseManager();
            }
          },
          {
            label: 'License Info',
            click: () => {
              this.showLicenseInfo();
            }
          },
          {
            label: 'Check for Updates',
            click: () => {
              autoUpdater.checkForUpdatesAndNotify();
            }
          }
        ]
      }
    ];

    // 💰 macOS 메뉴 조정
    if (process.platform === 'darwin') {
      template.unshift({
        label: app.getName(),
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  setupIpcHandlers() {
    // 🔐 라이센스 관련 IPC는 LicenseDialog에서 처리됨

    // 💰 앱 정보 조회
    ipcMain.handle('app:getInfo', () => {
      return {
        version: app.getVersion(),
        name: app.getName(),
        platform: process.platform,
        arch: process.arch
      };
    });

    // 💰 파일 선택 다이얼로그
    ipcMain.handle('dialog:openDirectory', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow, {
        properties: ['openDirectory']
      });
      return result.filePaths;
    });

    // 💰 외부 링크 열기
    ipcMain.handle('shell:openExternal', async (event, url) => {
      await shell.openExternal(url);
    });
  }

  setupAutoUpdater() {
    // 💰 업데이트 이벤트 처리
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
      this.mainWindow?.webContents.send('update-progress', progressObj);
    });

    autoUpdater.on('update-downloaded', () => {
      this.showRestartDialog();
    });
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

  showAboutDialog() {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'About Workflow Visualizer',
      message: 'Workflow Visualizer Desktop',
      detail: `Version: ${app.getVersion()}\\nPlatform: ${process.platform}\\nLicense: Commercial ($9.9/month)`
    });
  }

  async showLicenseManager() {
    const licenseManagerWindow = new BrowserWindow({
      width: 700,
      height: 800,
      resizable: true,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      },
      title: 'License Manager',
      icon: this.getAppIcon(),
      parent: this.mainWindow,
      modal: true
    });

    licenseManagerWindow.loadFile(path.join(__dirname, 'pages/license-manager.html'));

    licenseManagerWindow.once('ready-to-show', () => {
      licenseManagerWindow.show();
    });
  }

  async showLicenseInfo() {
    try {
      const licenseStatus = this.licenseService.getLicenseStatus();
      
      if (licenseStatus.status === 'unlicensed') {
        dialog.showMessageBox(this.mainWindow, {
          type: 'warning',
          title: 'License Information',
          message: 'No License',
          detail: '라이센스가 활성화되지 않았습니다.'
        });
      } else {
        const license = licenseStatus.license;
        dialog.showMessageBox(this.mainWindow, {
          type: 'info',
          title: 'License Information',
          message: `Plan: ${license.plan}`,
          detail: `Valid until: ${license.expiresAt}\\nMachine ID: ${license.machineId}\\nStatus: ${licenseStatus.status}`
        });
      }
    } catch (error) {
      dialog.showErrorBox('License Error', '라이센스 정보를 가져올 수 없습니다.');
    }
  }
}

// 💰 앱 인스턴스 생성
new WorkflowVisualizerApp();