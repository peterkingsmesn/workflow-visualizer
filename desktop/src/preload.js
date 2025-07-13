const { contextBridge, ipcRenderer } = require('electron');

// 💰 보안: 메인 프로세스와 렌더러 프로세스 간 안전한 통신
contextBridge.exposeInMainWorld('electronAPI', {
  // 💰 라이선스 관련
  license: {
    validate: (licenseKey) => ipcRenderer.invoke('license:validate', licenseKey),
    getInfo: () => ipcRenderer.invoke('license:getInfo')
  },

  // 💰 디바이스 정보
  device: {
    getFingerprint: () => ipcRenderer.invoke('device:getFingerprint')
  },

  // 💰 앱 정보
  app: {
    getInfo: () => ipcRenderer.invoke('app:getInfo'),
    getVersion: () => ipcRenderer.invoke('app:getVersion')
  },

  // 💰 파일 시스템
  dialog: {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    openFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
    saveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options)
  },

  // 💰 시스템
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url)
  },

  // 💰 이벤트 리스너
  on: (channel, callback) => {
    const validChannels = [
      'menu-new-project',
      'menu-open-project', 
      'update-progress',
      'license-validated'
    ];
    
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, callback);
    }
  },

  // 💰 이벤트 전송
  send: (channel, data) => {
    const validChannels = [
      'license-validated',
      'project-opened'
    ];
    
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  // 💰 일회성 이벤트 리스너
  once: (channel, callback) => {
    const validChannels = [
      'license-validated',
      'update-downloaded'
    ];
    
    if (validChannels.includes(channel)) {
      ipcRenderer.once(channel, callback);
    }
  },

  // 💰 이벤트 리스너 제거
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// 💰 개발 모드에서만 개발자 도구 노출
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('electronDev', {
    openDevTools: () => ipcRenderer.invoke('dev:openDevTools'),
    getEnvironment: () => process.env.NODE_ENV
  });
}