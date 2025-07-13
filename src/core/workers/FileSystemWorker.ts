/**
 * FileSystemWorker - 백그라운드에서 파일 시스템 작업을 처리하는 워커
 * 
 * 주요 기능:
 * - 대용량 디렉토리 스캔
 * - 파일 내용 분석
 * - 배치 파일 작업
 * - 진행 상황 보고
 */

// Worker 인터페이스 정의
export interface WorkerMessage {
  id: string;
  type: 'scan' | 'analyze' | 'batch' | 'progress' | 'complete' | 'error';
  payload: any;
}

export interface ScanRequest {
  rootPath: string;
  options: {
    maxDepth?: number;
    excludePatterns?: string[];
    includeHidden?: boolean;
    fileExtensions?: string[];
    maxFiles?: number;
  };
}

export interface AnalyzeRequest {
  filePaths: string[];
  analysisType: 'dependency' | 'api' | 'translation' | 'all';
}

export interface BatchRequest {
  operations: Array<{
    type: 'read' | 'write' | 'delete' | 'copy';
    source: string;
    target?: string;
    content?: string;
  }>;
}

export interface ProgressUpdate {
  current: number;
  total: number;
  message: string;
  percentage: number;
}

// 메인 스레드에서 사용할 Worker 클래스
export class FileSystemWorker {
  private worker: Worker | null = null;
  private messageCallbacks = new Map<string, (result: any) => void>();
  private errorCallbacks = new Map<string, (error: Error) => void>();
  private progressCallback: ((progress: ProgressUpdate) => void) | null = null;

  constructor() {
    if (typeof Worker !== 'undefined') {
      // 실제 환경에서는 별도 파일로 분리된 워커를 사용
      this.worker = new Worker(new URL('./fileSystemWorker.worker.ts', import.meta.url));
      this.setupMessageHandler();
    }
  }

  /**
   * 메시지 핸들러 설정
   */
  private setupMessageHandler(): void {
    if (!this.worker) return;

    this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const { id, type, payload } = event.data;

      switch (type) {
        case 'complete':
          const callback = this.messageCallbacks.get(id);
          if (callback) {
            callback(payload);
            this.messageCallbacks.delete(id);
            this.errorCallbacks.delete(id);
          }
          break;

        case 'error':
          const errorCallback = this.errorCallbacks.get(id);
          if (errorCallback) {
            errorCallback(new Error(payload.message));
            this.messageCallbacks.delete(id);
            this.errorCallbacks.delete(id);
          }
          break;

        case 'progress':
          if (this.progressCallback) {
            this.progressCallback(payload);
          }
          break;
      }
    };

    this.worker.onerror = (error) => {
      console.error('FileSystemWorker error:', error);
    };
  }

  /**
   * 디렉토리 스캔
   */
  async scanDirectory(request: ScanRequest): Promise<any> {
    return this.sendMessage('scan', request);
  }

  /**
   * 파일 분석
   */
  async analyzeFiles(request: AnalyzeRequest): Promise<any> {
    return this.sendMessage('analyze', request);
  }

  /**
   * 배치 작업
   */
  async batchOperations(request: BatchRequest): Promise<any> {
    return this.sendMessage('batch', request);
  }

  /**
   * 진행 상황 콜백 설정
   */
  setProgressCallback(callback: (progress: ProgressUpdate) => void): void {
    this.progressCallback = callback;
  }

  /**
   * 워커로 메시지 전송
   */
  private sendMessage(type: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        // 워커가 없는 경우 폴백 처리
        return this.fallbackOperation(type, payload).then(resolve).catch(reject);
      }

      const id = this.generateId();
      
      this.messageCallbacks.set(id, resolve);
      this.errorCallbacks.set(id, reject);

      const message: WorkerMessage = { id, type: type as any, payload };
      this.worker.postMessage(message);
    });
  }

  /**
   * 워커 없을 때 폴백 처리
   */
  private async fallbackOperation(type: string, payload: any): Promise<any> {
    // 워커를 사용할 수 없는 환경에서의 대안 구현
    switch (type) {
      case 'scan':
        return this.fallbackScan(payload as ScanRequest);
      case 'analyze':
        return this.fallbackAnalyze(payload as AnalyzeRequest);
      case 'batch':
        return this.fallbackBatch(payload as BatchRequest);
      default:
        throw new Error(`Unsupported operation: ${type}`);
    }
  }

  /**
   * 폴백 스캔 구현
   */
  private async fallbackScan(request: ScanRequest): Promise<any> {
    // Node.js 환경에서 직접 파일 시스템 스캔
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const result = {
        files: [],
        directories: [],
        totalSize: 0,
        errors: []
      };

      // 간단한 재귀 스캔 구현
      const scanRecursive = async (dirPath: string, depth = 0): Promise<void> => {
        if (depth > (request.options.maxDepth || 10)) return;

        try {
          const items = await fs.readdir(dirPath, { withFileTypes: true });
          
          for (const item of items) {
            const itemPath = path.join(dirPath, item.name);
            
            // 제외 패턴 체크
            if (request.options.excludePatterns?.some(pattern => 
              item.name.includes(pattern))) {
              continue;
            }

            if (item.isDirectory()) {
              result.directories.push(itemPath);
              await scanRecursive(itemPath, depth + 1);
            } else if (item.isFile()) {
              const stats = await fs.stat(itemPath);
              result.files.push({
                path: itemPath,
                name: item.name,
                size: stats.size,
                modified: stats.mtime
              });
              result.totalSize += stats.size;
            }
          }
        } catch (error) {
          result.errors.push(`Failed to scan ${dirPath}: ${error}`);
        }
      };

      await scanRecursive(request.rootPath);
      return result;
    } catch (error) {
      throw new Error(`Fallback scan failed: ${error}`);
    }
  }

  /**
   * 폴백 분석 구현
   */
  private async fallbackAnalyze(request: AnalyzeRequest): Promise<any> {
    // 간단한 파일 분석 구현
    const results = {
      files: request.filePaths.length,
      analysis: {},
      errors: []
    };

    try {
      const fs = await import('fs/promises');
      
      for (const filePath of request.filePaths) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const lines = content.split('\n').length;
          const size = Buffer.byteLength(content, 'utf-8');
          
          // 간단한 분석
          results.analysis[filePath] = {
            lines,
            size,
            hasImports: content.includes('import') || content.includes('require'),
            hasExports: content.includes('export') || content.includes('module.exports')
          };
        } catch (error) {
          results.errors.push(`Failed to analyze ${filePath}: ${error}`);
        }
      }
    } catch (error) {
      throw new Error(`Fallback analysis failed: ${error}`);
    }

    return results;
  }

  /**
   * 폴백 배치 처리 구현
   */
  private async fallbackBatch(request: BatchRequest): Promise<any> {
    const results = {
      completed: 0,
      failed: 0,
      errors: []
    };

    try {
      const fs = await import('fs/promises');
      
      for (const operation of request.operations) {
        try {
          switch (operation.type) {
            case 'read':
              await fs.readFile(operation.source, 'utf-8');
              break;
            case 'write':
              if (operation.content && operation.target) {
                await fs.writeFile(operation.target, operation.content);
              }
              break;
            case 'delete':
              await fs.unlink(operation.source);
              break;
            case 'copy':
              if (operation.target) {
                await fs.copyFile(operation.source, operation.target);
              }
              break;
          }
          results.completed++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Operation ${operation.type} on ${operation.source} failed: ${error}`);
        }
      }
    } catch (error) {
      throw new Error(`Fallback batch operation failed: ${error}`);
    }

    return results;
  }

  /**
   * 고유 ID 생성
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 워커 종료
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.messageCallbacks.clear();
    this.errorCallbacks.clear();
    this.progressCallback = null;
  }

  /**
   * 워커 상태 확인
   */
  isAvailable(): boolean {
    return this.worker !== null;
  }

  /**
   * 메모리 사용량 모니터링 (브라우저 환경)
   */
  getMemoryUsage(): { used: number; total: number } | null {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize
      };
    }
    return null;
  }

  /**
   * 성능 통계
   */
  getPerformanceStats(): {
    totalOperations: number;
    averageResponseTime: number;
    errorRate: number;
  } {
    // 실제 구현에서는 통계를 추적해야 함
    return {
      totalOperations: 0,
      averageResponseTime: 0,
      errorRate: 0
    };
  }
}

// 워커 스크립트용 유틸리티 (별도 파일에서 사용)
export const createWorkerScript = (): string => {
  return `
    // Worker 스크립트 내용
    self.onmessage = function(event) {
      const { id, type, payload } = event.data;
      
      try {
        switch (type) {
          case 'scan':
            handleScan(id, payload);
            break;
          case 'analyze':
            handleAnalyze(id, payload);
            break;
          case 'batch':
            handleBatch(id, payload);
            break;
          default:
            throw new Error('Unknown operation type: ' + type);
        }
      } catch (error) {
        self.postMessage({
          id,
          type: 'error',
          payload: { message: error.message }
        });
      }
    };

    function handleScan(id, request) {
      // 스캔 로직 구현
      self.postMessage({
        id,
        type: 'complete',
        payload: { message: 'Scan completed' }
      });
    }

    function handleAnalyze(id, request) {
      // 분석 로직 구현
      self.postMessage({
        id,
        type: 'complete',
        payload: { message: 'Analysis completed' }
      });
    }

    function handleBatch(id, request) {
      // 배치 처리 로직 구현
      self.postMessage({
        id,
        type: 'complete',
        payload: { message: 'Batch operation completed' }
      });
    }

    function reportProgress(current, total, message) {
      self.postMessage({
        id: 'progress',
        type: 'progress',
        payload: {
          current,
          total,
          message,
          percentage: Math.round((current / total) * 100)
        }
      });
    }
  `;
};