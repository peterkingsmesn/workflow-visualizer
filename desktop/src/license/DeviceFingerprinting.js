const os = require('os');
const crypto = require('crypto');
const { execSync } = require('child_process');

// 💰 운영체제별 디바이스 핑거프린팅 (고유 하드웨어 식별)
class DeviceFingerprinting {
  constructor() {
    this.platform = process.platform;
  }

  generateFingerprint() {
    try {
      switch (this.platform) {
        case 'win32':
          return this.generateWindowsFingerprint();
        case 'darwin':
          return this.generateMacFingerprint();
        case 'linux':
          return this.generateLinuxFingerprint();
        default:
          return this.generateGenericFingerprint();
      }
    } catch (error) {
      console.warn('하드웨어 핑거프린트 생성 실패, 일반 방식 사용:', error.message);
      return this.generateGenericFingerprint();
    }
  }

  // 💰 Windows 고유 핑거프린트
  generateWindowsFingerprint() {
    try {
      // Windows 고유 하드웨어 정보 수집
      const cpuId = this.getWindowsCpuId();
      const motherboardSerial = this.getWindowsMotherboardSerial();
      const biosSerial = this.getWindowsBiosSerial();
      const diskSerial = this.getWindowsDiskSerial();
      
      const hwInfo = {
        platform: 'win32',
        cpuId: cpuId || 'unknown',
        motherboardSerial: motherboardSerial || 'unknown',
        biosSerial: biosSerial || 'unknown',
        diskSerial: diskSerial || 'unknown',
        hostname: os.hostname(),
        arch: os.arch(),
        totalMem: os.totalmem()
      };
      
      return this.hashFingerprint(hwInfo);
    } catch (error) {
      console.warn('Windows 핑거프린트 생성 실패:', error.message);
      return this.generateGenericFingerprint();
    }
  }

  getWindowsCpuId() {
    try {
      const output = execSync('wmic cpu get ProcessorId /value', { 
        encoding: 'utf8',
        timeout: 5000
      });
      const match = output.match(/ProcessorId=(.+)/);
      return match ? match[1].trim() : null;
    } catch (error) {
      return null;
    }
  }

  getWindowsMotherboardSerial() {
    try {
      const output = execSync('wmic baseboard get SerialNumber /value', { 
        encoding: 'utf8',
        timeout: 5000
      });
      const match = output.match(/SerialNumber=(.+)/);
      return match ? match[1].trim() : null;
    } catch (error) {
      return null;
    }
  }

  getWindowsBiosSerial() {
    try {
      const output = execSync('wmic bios get SerialNumber /value', { 
        encoding: 'utf8',
        timeout: 5000
      });
      const match = output.match(/SerialNumber=(.+)/);
      return match ? match[1].trim() : null;
    } catch (error) {
      return null;
    }
  }

  getWindowsDiskSerial() {
    try {
      const output = execSync('wmic diskdrive get SerialNumber /value', { 
        encoding: 'utf8',
        timeout: 5000
      });
      const match = output.match(/SerialNumber=(.+)/);
      return match ? match[1].trim() : null;
    } catch (error) {
      return null;
    }
  }

  // 💰 macOS 고유 핑거프린트
  generateMacFingerprint() {
    try {
      // macOS 고유 하드웨어 정보 수집
      const serialNumber = this.getMacSerialNumber();
      const hwUuid = this.getMacHardwareUUID();
      const macAddress = this.getMacAddress();
      
      const hwInfo = {
        platform: 'darwin',
        serialNumber: serialNumber || 'unknown',
        hwUuid: hwUuid || 'unknown',
        macAddress: macAddress || 'unknown',
        hostname: os.hostname(),
        arch: os.arch(),
        totalMem: os.totalmem()
      };
      
      return this.hashFingerprint(hwInfo);
    } catch (error) {
      console.warn('macOS 핑거프린트 생성 실패:', error.message);
      return this.generateGenericFingerprint();
    }
  }

  getMacSerialNumber() {
    try {
      const output = execSync('system_profiler SPHardwareDataType | grep "Serial Number"', { 
        encoding: 'utf8',
        timeout: 5000
      });
      const match = output.match(/Serial Number \\(system\\): (.+)/);
      return match ? match[1].trim() : null;
    } catch (error) {
      return null;
    }
  }

  getMacHardwareUUID() {
    try {
      const output = execSync('system_profiler SPHardwareDataType | grep "Hardware UUID"', { 
        encoding: 'utf8',
        timeout: 5000
      });
      const match = output.match(/Hardware UUID: (.+)/);
      return match ? match[1].trim() : null;
    } catch (error) {
      return null;
    }
  }

  getMacAddress() {
    try {
      const output = execSync('ifconfig en0 | grep ether', { 
        encoding: 'utf8',
        timeout: 5000
      });
      const match = output.match(/ether ([a-f0-9:]+)/);
      return match ? match[1].trim() : null;
    } catch (error) {
      return null;
    }
  }

  // 💰 Linux 고유 핑거프린트
  generateLinuxFingerprint() {
    try {
      // Linux 고유 하드웨어 정보 수집
      const machineId = this.getLinuxMachineId();
      const cpuInfo = this.getLinuxCpuInfo();
      const dmidecode = this.getLinuxDmidecode();
      
      const hwInfo = {
        platform: 'linux',
        machineId: machineId || 'unknown',
        cpuInfo: cpuInfo || 'unknown',
        systemSerial: dmidecode || 'unknown',
        hostname: os.hostname(),
        arch: os.arch(),
        totalMem: os.totalmem()
      };
      
      return this.hashFingerprint(hwInfo);
    } catch (error) {
      console.warn('Linux 핑거프린트 생성 실패:', error.message);
      return this.generateGenericFingerprint();
    }
  }

  getLinuxMachineId() {
    try {
      // machine-id는 Linux에서 고유한 시스템 식별자
      const output = execSync('cat /etc/machine-id 2>/dev/null || cat /var/lib/dbus/machine-id 2>/dev/null', { 
        encoding: 'utf8',
        timeout: 5000
      });
      return output.trim();
    } catch (error) {
      return null;
    }
  }

  getLinuxCpuInfo() {
    try {
      const output = execSync('cat /proc/cpuinfo | grep "processor\\\\|model name" | head -2', { 
        encoding: 'utf8',
        timeout: 5000
      });
      return crypto.createHash('md5').update(output).digest('hex').substring(0, 8);
    } catch (error) {
      return null;
    }
  }

  getLinuxDmidecode() {
    try {
      // dmidecode로 시스템 시리얼 번호 조회 (root 권한 필요할 수 있음)
      const output = execSync('sudo dmidecode -s system-serial-number 2>/dev/null || echo "unknown"', { 
        encoding: 'utf8',
        timeout: 5000
      });
      return output.trim();
    } catch (error) {
      return null;
    }
  }

  // 💰 일반 핑거프린트 (하드웨어 정보 접근 불가 시)
  generateGenericFingerprint() {
    const hwInfo = {
      platform: this.platform,
      hostname: os.hostname(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalmem: os.totalmem(),
      userInfo: os.userInfo().username,
      networkInterfaces: this.getNetworkInterfacesMac(),
      osRelease: os.release()
    };
    
    return this.hashFingerprint(hwInfo);
  }

  getNetworkInterfacesMac() {
    try {
      const interfaces = os.networkInterfaces();
      const macs = [];
      
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
            macs.push(iface.mac);
          }
        }
      }
      
      return macs.sort().join(',');
    } catch (error) {
      return 'unknown';
    }
  }

  // 💰 핑거프린트 해시 생성
  hashFingerprint(hwInfo) {
    // 일관된 순서로 정렬하여 해시 생성
    const sortedKeys = Object.keys(hwInfo).sort();
    const sortedInfo = {};
    sortedKeys.forEach(key => {
      sortedInfo[key] = hwInfo[key];
    });
    
    const fingerprint = crypto
      .createHash('sha256')
      .update(JSON.stringify(sortedInfo))
      .digest('hex')
      .substring(0, 16); // 16자리 핑거프린트
    
    console.log('디바이스 핑거프린트 생성:', fingerprint);
    return fingerprint;
  }

  // 💰 핑거프린트 검증 (디버깅용)
  validateFingerprint(fingerprint) {
    return typeof fingerprint === 'string' && 
           fingerprint.length === 16 && 
           /^[a-f0-9]+$/.test(fingerprint);
  }

  // 💰 현재 플랫폼 정보 반환
  getPlatformInfo() {
    return {
      platform: this.platform,
      arch: os.arch(),
      hostname: os.hostname(),
      osVersion: os.release()
    };
  }
}

module.exports = DeviceFingerprinting;