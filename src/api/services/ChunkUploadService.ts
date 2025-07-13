interface ChunkUploadOptions {
  file: File;
  chunkSize?: number;
  onProgress?: (progress: number) => void;
  onChunkComplete?: (chunkIndex: number, totalChunks: number) => void;
  onError?: (error: Error) => void;
  onComplete?: (result: any) => void;
}

interface ChunkInfo {
  index: number;
  start: number;
  end: number;
  size: number;
  data: Blob;
  hash?: string;
}

import { CONFIG, getApiUrl, API_ROUTES } from '../../config/constants';

export class ChunkUploadService {
  private static readonly DEFAULT_CHUNK_SIZE = CONFIG.UPLOAD.MAX_CHUNK_SIZE_MB * 1024 * 1024;
  private static readonly MAX_CONCURRENT_UPLOADS = CONFIG.UPLOAD.MAX_CONCURRENT_UPLOADS;
  private static readonly MAX_RETRY_COUNT = CONFIG.UPLOAD.RETRY_ATTEMPTS;

  /**
   * 파일을 chunk로 분할하여 업로드
   */
  async uploadFile(options: ChunkUploadOptions): Promise<void> {
    const {
      file,
      chunkSize = ChunkUploadService.DEFAULT_CHUNK_SIZE,
      onProgress,
      onChunkComplete,
      onError,
      onComplete
    } = options;

    try {
      // 1. 파일을 chunk로 분할
      const chunks = await this.createChunks(file, chunkSize);
      
      // 2. 업로드 세션 시작
      const uploadSession = await this.initializeUploadSession(file, chunks.length);
      
      // 3. 진행률 추적
      let completedChunks = 0;
      const totalChunks = chunks.length;
      
      // 4. 병렬 업로드 (최대 동시 업로드 수 제한)
      const uploadPromises = chunks.map(async (chunk, index) => {
        return this.uploadChunkWithRetry(uploadSession.id, chunk, index as any)
          .then(() => {
            completedChunks++;
            const progress = (completedChunks / totalChunks) * 100;
            onProgress?.(progress);
            onChunkComplete?.(index, totalChunks);
          })
          .catch((error) => {
            onError?.(new Error(`Chunk ${index} upload failed: ${error.message}`));
            throw error;
          });
      });

      // 5. 병렬 업로드 실행 (동시 업로드 수 제한)
      await this.executeWithConcurrencyLimit(uploadPromises, ChunkUploadService.MAX_CONCURRENT_UPLOADS);
      
      // 6. 업로드 완료 처리
      const result = await this.finalizeUpload(uploadSession.id);
      onComplete?.(result);
      
    } catch (error) {
      onError?.(error as Error);
      throw error;
    }
  }

  /**
   * 파일을 chunk로 분할
   */
  private async createChunks(file: File, chunkSize: number): Promise<ChunkInfo[]> {
    const chunks: ChunkInfo[] = [];
    const totalSize = file.size;
    let start = 0;
    let index = 0;

    while (start < totalSize) {
      const end = Math.min(start + chunkSize, totalSize);
      const chunkData = file.slice(start, end);
      
      // 각 chunk에 대한 해시 생성 (무결성 검증용)
      const hash = await this.calculateHash(chunkData);
      
      chunks.push({
        index,
        start,
        end,
        size: end - start,
        data: chunkData,
        hash
      });
      
      start = end;
      index++;
    }

    return chunks;
  }

  /**
   * 업로드 세션 초기화
   */
  private async initializeUploadSession(file: File, totalChunks: number): Promise<{id: string}> {
    const response = await fetch(getApiUrl(API_ROUTES.uploadInit()), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        totalChunks,
        fileType: file.type,
        lastModified: file.lastModified
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to initialize upload session: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 개별 chunk 업로드 (재시도 포함)
   */
  private async uploadChunkWithRetry(sessionId: string, chunk: ChunkInfo, maxRetries = ChunkUploadService.MAX_RETRY_COUNT): Promise<void> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.uploadChunk(sessionId, chunk);
        return; // 성공 시 반환
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          // 지수 백오프로 재시도 대기
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * 개별 chunk 업로드
   */
  private async uploadChunk(sessionId: string, chunk: ChunkInfo): Promise<void> {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('chunkIndex', chunk.index.toString());
    formData.append('chunkSize', chunk.size.toString());
    formData.append('chunkHash', chunk.hash || '');
    formData.append('chunk', chunk.data);

    const response = await fetch(getApiUrl(API_ROUTES.uploadChunk()), {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Chunk upload failed: ${response.statusText}`);
    }
  }

  /**
   * 업로드 완료 처리
   */
  private async finalizeUpload(sessionId: string): Promise<any> {
    const response = await fetch(getApiUrl(API_ROUTES.uploadFinalize()), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId })
    });

    if (!response.ok) {
      throw new Error(`Failed to finalize upload: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 병렬 실행 시 동시 실행 수 제한
   */
  private async executeWithConcurrencyLimit<T>(
    promises: Promise<T>[],
    concurrencyLimit: number
  ): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<any>[] = [];

    for (const promise of promises) {
      const wrappedPromise = promise.then(result => {
        results.push(result);
        return result;
      });

      executing.push(wrappedPromise);

      if (executing.length >= concurrencyLimit) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p === wrappedPromise), 1);
      }
    }

    await Promise.all(executing);
    return results;
  }

  /**
   * 파일 해시 계산 (무결성 검증용)
   */
  private async calculateHash(data: Blob): Promise<string> {
    const buffer = await data.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 업로드 중단
   */
  async cancelUpload(sessionId: string): Promise<void> {
    await fetch(getApiUrl(API_ROUTES.uploadCancel()), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId })
    });
  }

  /**
   * 업로드 재개 (중단된 업로드 계속)
   */
  async resumeUpload(sessionId: string): Promise<void> {
    // 서버에서 업로드된 chunk 정보 조회
    const response = await fetch(getApiUrl(API_ROUTES.uploadStatus(sessionId)));
    const status = await response.json();
    
    // 업로드되지 않은 chunk들만 재업로드
    // 구현 로직...
  }
}

// 사용 예시
/*
const chunkUploadService = new ChunkUploadService();

await chunkUploadService.uploadFile({
  file: selectedFile,
  chunkSize: 1024 * 1024, // 1MB
  onProgress: (progress) => {
    console.log(`Upload progress: ${progress}%`);
  },
  onChunkComplete: (chunkIndex, totalChunks) => {
    console.log(`Chunk ${chunkIndex + 1}/${totalChunks} completed`);
  },
  onError: (error) => {
    console.error('Upload error:', error);
  },
  onComplete: (result) => {
    console.log('Upload completed:', result);
  }
});
*/