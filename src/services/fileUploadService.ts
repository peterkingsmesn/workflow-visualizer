interface ChunkUploadOptions {
  files: File[];
  chunkSize?: number;
  onProgress?: (progress: UploadProgress) => void;
  onChunkComplete?: (chunkIndex: number, response: any) => void;
  onComplete?: (responses: any[]) => void;
  onError?: (error: Error) => void;
}

interface UploadProgress {
  current: number;
  total: number;
  percentage: number;
  speed: number;
  timeRemaining: number;
  currentFileName?: string;
  chunkProgress?: {
    current: number;
    total: number;
  };
}

export class FileUploadService {
  private static instance: FileUploadService;
  private uploadAbortController: AbortController | null = null;

  static getInstance(): FileUploadService {
    if (!FileUploadService.instance) {
      FileUploadService.instance = new FileUploadService();
    }
    return FileUploadService.instance;
  }

  async uploadInChunks(options: ChunkUploadOptions): Promise<void> {
    const {
      files,
      chunkSize = 100,
      onProgress,
      onChunkComplete,
      onComplete,
      onError
    } = options;

    this.uploadAbortController = new AbortController();
    const responses: any[] = [];
    const startTime = Date.now();
    let processedSize = 0;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    try {
      // 파일을 청크로 나누기
      const chunks: File[][] = [];
      for (let i = 0; i < files.length; i += chunkSize) {
        chunks.push(files.slice(i, i + chunkSize));
      }

      // 각 청크 업로드
      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];
        const formData = new FormData();
        
        chunk.forEach(file => {
          formData.append('files', file);
          formData.append('paths', file.webkitRelativePath || file.name);
        });

        formData.append('chunkIndex', chunkIndex.toString());
        formData.append('totalChunks', chunks.length.toString());
        formData.append('projectName', this.extractProjectName(files));

        // 업로드 진행 상황 계산
        const chunkStartSize = processedSize;
        
        const response = await this.uploadChunk(formData, (loaded, total) => {
          const currentChunkProgress = chunkStartSize + loaded;
          const elapsedTime = (Date.now() - startTime) / 1000;
          const speed = currentChunkProgress / elapsedTime;
          const remainingSize = totalSize - currentChunkProgress;
          const timeRemaining = remainingSize / speed;

          if (onProgress) {
            onProgress({
              current: Math.min(chunkIndex * chunkSize + chunk.length, files.length),
              total: files.length,
              percentage: Math.round((currentChunkProgress / totalSize) * 100),
              speed,
              timeRemaining,
              currentFileName: chunk[Math.floor((loaded / total) * chunk.length)]?.name,
              chunkProgress: {
                current: chunkIndex + 1,
                total: chunks.length
              }
            });
          }
        });

        responses.push(response);
        processedSize += chunk.reduce((sum, file) => sum + file.size, 0);

        if (onChunkComplete) {
          onChunkComplete(chunkIndex, response);
        }
      }

      if (onComplete) {
        onComplete(responses);
      }
    } catch (error) {
      if (onError) {
        onError(error as Error);
      }
      throw error;
    } finally {
      this.uploadAbortController = null;
    }
  }

  private async uploadChunk(
    formData: FormData, 
    onProgress?: (loaded: number, total: number) => void
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // 이벤트 핸들러 정의
      const progressHandler = (event: ProgressEvent) => {
        if (event.lengthComputable && onProgress) {
          onProgress(event.loaded, event.total);
        }
      };

      const loadHandler = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
        cleanup();
      };

      const errorHandler = () => {
        reject(new Error('Network error during upload'));
        cleanup();
      };

      const abortHandler = () => {
        reject(new Error('Upload cancelled'));
        cleanup();
      };

      const abortControllerHandler = () => {
        xhr.abort();
      };

      // 정리 함수
      const cleanup = () => {
        xhr.upload.removeEventListener('progress', progressHandler);
        xhr.removeEventListener('load', loadHandler);
        xhr.removeEventListener('error', errorHandler);
        xhr.removeEventListener('abort', abortHandler);
        if (this.uploadAbortController) {
          this.uploadAbortController.signal.removeEventListener('abort', abortControllerHandler);
        }
      };

      // 이벤트 리스너 등록
      xhr.upload.addEventListener('progress', progressHandler);
      xhr.addEventListener('load', loadHandler);
      xhr.addEventListener('error', errorHandler);
      xhr.addEventListener('abort', abortHandler);

      xhr.open('POST', this.getUploadEndpoint());
      
      // 인증 토큰 추가
      const token = this.getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.send(formData);

      // Abort controller 연결
      if (this.uploadAbortController) {
        this.uploadAbortController.signal.addEventListener('abort', abortControllerHandler);
      }
    });
  }

  cancelUpload(): void {
    if (this.uploadAbortController) {
      this.uploadAbortController.abort();
    }
  }

  private extractProjectName(files: File[]): string {
    if (files.length === 0) return 'untitled';
    
    const firstFile = files[0];
    if (firstFile.webkitRelativePath) {
      return firstFile.webkitRelativePath.split('/')[0];
    }
    
    return 'uploaded-project';
  }

  private getUploadEndpoint(): string {
    return process.env.REACT_APP_API_URL 
      ? `${process.env.REACT_APP_API_URL}/api/upload/chunk`
      : '/api/upload/chunk';
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // 파일 읽기 유틸리티
  async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  // 텍스트 파일 여부 확인
  isTextFile(fileName: string): boolean {
    const textExtensions = [
      'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'rb', 'go',
      'rs', 'php', 'swift', 'kt', 'scala', 'r', 'html', 'htm', 'css', 'scss',
      'sass', 'less', 'json', 'xml', 'yaml', 'yml', 'md', 'txt', 'sql', 'sh',
      'bash', 'ps1', 'dockerfile', 'makefile', 'gitignore', 'env', 'config',
      'ini', 'toml', 'vue', 'svelte'
    ];
    
    const ext = fileName.split('.').pop()?.toLowerCase();
    return textExtensions.includes(ext || '');
  }
}