import * as fs from 'fs/promises';
import { pathResolver } from '../../utils/pathResolver';

export interface AnalysisResult {
  errors: string[];
  warnings: string[];
  metadata: Record<string, any>;
}

export interface FileInfo {
  path: string;
  content: string;
  size: number;
  lastModified: Date;
  extension: string;
}

export abstract class BaseAnalyzer {
  protected cache: Map<string, any> = new Map();
  protected options: Record<string, any> = {};

  constructor(options: Record<string, any> = {}) {
    this.options = {
      enableCache: true,
      maxCacheSize: 1000,
      cacheTimeout: 300000, // 5분
      ...options
    };
  }

  /**
   * 분석 메인 메서드 - 하위 클래스에서 구현 필요
   */
  abstract analyze(filePaths: string[]): Promise<AnalysisResult>;

  /**
   * 파일 읽기 (캐싱 지원)
   */
  protected async readFile(filePath: string): Promise<string> {
    const cacheKey = `file:${filePath}`;
    
    if (this.options.enableCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.options.cacheTimeout) {
        return cached.content;
      }
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      if (this.options.enableCache) {
        this.setCacheItem(cacheKey, {
          content,
          timestamp: Date.now()
        });
      }
      
      return content;
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
  }

  /**
   * 파일 정보 가져오기
   */
  protected async getFileInfo(filePath: string): Promise<FileInfo> {
    const cacheKey = `info:${filePath}`;
    
    if (this.options.enableCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.options.cacheTimeout) {
        return cached.info;
      }
    }

    try {
      const [content, stats] = await Promise.all([
        this.readFile(filePath),
        fs.stat(filePath)
      ]);

      const info: FileInfo = {
        path: filePath,
        content,
        size: stats.size,
        lastModified: stats.mtime,
        extension: pathResolver.extname(filePath)
      };

      if (this.options.enableCache) {
        this.setCacheItem(cacheKey, {
          info,
          timestamp: Date.now()
        });
      }

      return info;
    } catch (error) {
      throw new Error(`Failed to get file info for ${filePath}: ${error}`);
    }
  }

  /**
   * 파일 필터링
   */
  protected filterFiles(filePaths: string[], extensions: string[]): string[] {
    return filePaths.filter(path => {
      const ext = pathResolver.extname(path);
      return extensions.includes(ext);
    });
  }

  /**
   * 정규식 매칭 헬퍼
   */
  protected findMatches(content: string, pattern: RegExp): RegExpMatchArray[] {
    const matches: RegExpMatchArray[] = [];
    let match: RegExpMatchArray | null;
    
    while ((match = pattern.exec(content)) !== null) {
      matches.push(match);
      if (!pattern.global) break;
    }
    
    return matches;
  }

  /**
   * 라인 번호 계산
   */
  protected getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * 컬럼 번호 계산
   */
  protected getColumnNumber(content: string, index: number): number {
    const lines = content.substring(0, index).split('\n');
    return lines[lines.length - 1].length + 1;
  }

  /**
   * 파일 확장자별 지원 여부 확인
   */
  protected supportsFile(filePath: string, supportedExtensions: string[]): boolean {
    const ext = pathResolver.extname(filePath);
    return supportedExtensions.includes(ext);
  }

  /**
   * AST 파싱 에러 처리
   */
  protected handleParsingError(error: any, filePath: string): void {
    console.warn(`Failed to parse ${filePath}:`, error.message);
    // 파싱 에러는 치명적이지 않으므로 로그만 남기고 계속 진행
  }

  /**
   * 배치 처리로 대용량 파일 처리
   */
  protected async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 10
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(item => processor(item))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * 진행 상황 콜백
   */
  protected progress(current: number, total: number, message?: string): void {
    if (this.options.onProgress) {
      this.options.onProgress({
        current,
        total,
        percentage: Math.round((current / total) * 100),
        message
      });
    }
  }

  /**
   * 캐시 관리
   */
  private setCacheItem(key: string, value: any): void {
    if (this.cache.size >= this.options.maxCacheSize) {
      // LRU 방식으로 가장 오래된 항목 제거
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  /**
   * 캐시 초기화
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * 캐시 통계
   */
  public getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.options.maxCacheSize,
      hitRate: 0 // 실제 구현에서는 히트율 계산
    };
  }

  /**
   * 분석 결과 검증
   */
  protected validateResult(result: AnalysisResult): AnalysisResult {
    return {
      errors: Array.isArray(result.errors) ? result.errors : [],
      warnings: Array.isArray(result.warnings) ? result.warnings : [],
      metadata: result.metadata || {}
    };
  }

  /**
   * 유틸리티: 코드에서 주석 제거
   */
  protected removeComments(code: string, language: 'javascript' | 'typescript' = 'javascript'): string {
    // 단일 라인 주석 제거
    code = code.replace(/\/\/.*$/gm, '');
    
    // 멀티 라인 주석 제거
    code = code.replace(/\/\*[\s\S]*?\*\//g, '');
    
    return code;
  }

  /**
   * 유틸리티: 문자열 리터럴에서 텍스트 추출
   */
  protected extractStringLiterals(code: string): string[] {
    const literals: string[] = [];
    const patterns = [
      /'([^'\\]|\\.)*'/g,  // 단일 따옴표
      /"([^"\\]|\\.)*"/g,  // 이중 따옴표
      /`([^`\\]|\\.)*`/g   // 백틱
    ];

    patterns.forEach(pattern => {
      const matches = this.findMatches(code, pattern);
      matches.forEach(match => {
        literals.push(match[0].slice(1, -1)); // 따옴표 제거
      });
    });

    return literals;
  }

  /**
   * 리소스 정리
   */
  public dispose(): void {
    this.clearCache();
  }
}