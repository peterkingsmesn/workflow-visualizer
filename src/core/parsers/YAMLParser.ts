import { BaseAnalyzer } from '../analyzers/BaseAnalyzer';

export interface YAMLParseResult {
  data: any;
  errors: string[];
  metadata: {
    lineCount: number;
    keyCount: number;
    nestedLevels: number;
    hasComments: boolean;
  };
}

export interface YAMLNode {
  key: string;
  value: any;
  type: 'scalar' | 'sequence' | 'mapping';
  line: number;
  column: number;
  children?: YAMLNode[];
}

export class YAMLParser extends BaseAnalyzer {
  private indentSize = 2;
  private currentLine = 1;
  private currentColumn = 1;

  /**
   * YAML 파일 파싱
   */
  async parseFile(filePath: string): Promise<YAMLParseResult> {
    try {
      const content = await this.readFile(filePath);
      return this.parseContent(content);
    } catch (error) {
      return {
        data: null,
        errors: [`파일 읽기 실패: ${error}`],
        metadata: {
          lineCount: 0,
          keyCount: 0,
          nestedLevels: 0,
          hasComments: false
        }
      };
    }
  }

  /**
   * YAML 문자열 파싱
   */
  parseContent(content: string): YAMLParseResult {
    const result: YAMLParseResult = {
      data: {},
      errors: [],
      metadata: {
        lineCount: 0,
        keyCount: 0,
        nestedLevels: 0,
        hasComments: false
      }
    };

    try {
      this.currentLine = 1;
      this.currentColumn = 1;

      const lines = content.split('\n');
      result.metadata.lineCount = lines.length;
      result.metadata.hasComments = lines.some(line => line.trim().startsWith('#'));

      const processedLines = this.preprocessLines(lines);
      const parsed = this.parseLines(processedLines);
      
      result.data = parsed.data;
      result.metadata.keyCount = parsed.keyCount;
      result.metadata.nestedLevels = parsed.maxDepth;
      
    } catch (error) {
      result.errors.push(`파싱 오류: ${error}`);
    }

    return result;
  }

  /**
   * 번역 파일 전용 파싱 (i18n)
   */
  parseTranslationFile(content: string): Record<string, string> {
    const result = this.parseContent(content);
    
    if (result.errors.length > 0) {
      throw new Error(`번역 파일 파싱 실패: ${result.errors.join(', ')}`);
    }

    return this.flattenObject(result.data);
  }

  /**
   * 설정 파일 파싱 (config)
   */
  parseConfigFile(content: string): any {
    const result = this.parseContent(content);
    
    if (result.errors.length > 0) {
      console.warn('설정 파일 파싱 경고:', result.errors);
    }

    return result.data;
  }

  /**
   * Docker Compose 파일 파싱
   */
  parseDockerCompose(content: string): {
    version: string;
    services: Record<string, any>;
    volumes?: Record<string, any>;
    networks?: Record<string, any>;
  } {
    const result = this.parseContent(content);
    
    if (result.errors.length > 0) {
      throw new Error(`Docker Compose 파싱 실패: ${result.errors.join(', ')}`);
    }

    return result.data;
  }

  /**
   * OpenAPI/Swagger 파일 파싱
   */
  parseOpenAPI(content: string): {
    openapi?: string;
    swagger?: string;
    info: any;
    paths: Record<string, any>;
    components?: any;
  } {
    const result = this.parseContent(content);
    
    if (result.errors.length > 0) {
      throw new Error(`OpenAPI 파싱 실패: ${result.errors.join(', ')}`);
    }

    return result.data;
  }

  // Private methods

  /**
   * 라인 전처리
   */
  private preprocessLines(lines: string[]): Array<{
    content: string;
    indent: number;
    lineNumber: number;
  }> {
    return lines.map((line, index) => ({
      content: line,
      indent: this.getIndentLevel(line),
      lineNumber: index + 1
    })).filter(line => {
      const trimmed = line.content.trim();
      // 빈 줄과 주석 제거
      return trimmed !== '' && !trimmed.startsWith('#');
    });
  }

  /**
   * 라인 파싱
   */
  private parseLines(lines: Array<{ content: string; indent: number; lineNumber: number }>): {
    data: any;
    keyCount: number;
    maxDepth: number;
  } {
    const stack: Array<{ data: any; indent: number }> = [{ data: {}, indent: -1 }];
    let keyCount = 0;
    let maxDepth = 0;

    for (const line of lines) {
      try {
        // 현재 들여쓰기 레벨에 맞는 부모 찾기
        while (stack.length > 1 && stack[stack.length - 1].indent >= line.indent) {
          stack.pop();
        }

        const parent = stack[stack.length - 1].data;
        const parsed = this.parseLine(line.content.trim());

        if (parsed.key) {
          keyCount++;
          maxDepth = Math.max(maxDepth, stack.length);

          if (parsed.isCollection) {
            const newObj = Array.isArray(parsed.value) ? [] : {};
            parent[parsed.key] = newObj;
            stack.push({ data: newObj, indent: line.indent });
          } else {
            parent[parsed.key] = parsed.value;
          }
        } else if (parsed.isArrayItem) {
          if (Array.isArray(parent)) {
            parent.push(parsed.value);
          }
        }
      } catch (error) {
        console.warn(`라인 ${line.lineNumber} 파싱 실패:`, error);
      }
    }

    return {
      data: stack[0].data,
      keyCount,
      maxDepth
    };
  }

  /**
   * 단일 라인 파싱
   */
  private parseLine(line: string): {
    key?: string;
    value: any;
    isCollection: boolean;
    isArrayItem: boolean;
  } {
    // 배열 아이템 체크
    if (line.startsWith('- ')) {
      const value = this.parseValue(line.substring(2).trim());
      return {
        value,
        isCollection: false,
        isArrayItem: true
      };
    }

    // 키-값 쌍 체크
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
      throw new Error(`Invalid YAML syntax: ${line}`);
    }

    const key = line.substring(0, colonIndex).trim();
    const valueStr = line.substring(colonIndex + 1).trim();

    // 빈 값 (컬렉션 시작)
    if (valueStr === '') {
      return {
        key,
        value: {},
        isCollection: true,
        isArrayItem: false
      };
    }

    // 배열 시작
    if (valueStr === '[]') {
      return {
        key,
        value: [],
        isCollection: true,
        isArrayItem: false
      };
    }

    // 일반 값
    const value = this.parseValue(valueStr);
    return {
      key,
      value,
      isCollection: false,
      isArrayItem: false
    };
  }

  /**
   * 값 파싱 (타입 변환)
   */
  private parseValue(value: string): any {
    if (value === '') {
      return null;
    }

    // Boolean
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Null
    if (value === 'null' || value === '~') return null;

    // Number
    if (/^-?\d+$/.test(value)) {
      return parseInt(value, 10);
    }
    if (/^-?\d+\.\d+$/.test(value)) {
      return parseFloat(value);
    }

    // String (따옴표 제거)
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }

    // 멀티라인 문자열 처리 (간단한 버전)
    if (value.startsWith('|') || value.startsWith('>')) {
      return value.substring(1).trim();
    }

    // 일반 문자열
    return value;
  }

  /**
   * 들여쓰기 레벨 계산
   */
  private getIndentLevel(line: string): number {
    let indent = 0;
    for (const char of line) {
      if (char === ' ') {
        indent++;
      } else if (char === '\t') {
        indent += this.indentSize;
      } else {
        break;
      }
    }
    return Math.floor(indent / this.indentSize);
  }

  /**
   * 중첩 객체 평면화
   */
  private flattenObject(obj: any, prefix = '', separator = '.'): Record<string, string> {
    const flattened: Record<string, string> = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}${separator}${key}` : key;
        const value = obj[key];

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          Object.assign(flattened, this.flattenObject(value, newKey, separator));
        } else if (Array.isArray(value)) {
          // 배열은 인덱스와 함께 평면화
          value.forEach((item, index) => {
            if (typeof item === 'object' && item !== null) {
              Object.assign(flattened, this.flattenObject(item, `${newKey}[${index}]`, separator));
            } else {
              flattened[`${newKey}[${index}]`] = String(item);
            }
          });
        } else {
          flattened[newKey] = String(value);
        }
      }
    }

    return flattened;
  }

  /**
   * YAML 유효성 검사
   */
  validateYAML(content: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // 빈 줄이나 주석은 스킵
      if (line.trim() === '' || line.trim().startsWith('#')) {
        continue;
      }

      // 탭 문자 체크
      if (line.includes('\t')) {
        errors.push(`라인 ${lineNumber}: 탭 문자 사용 금지 (공백 사용 권장)`);
      }

      // 들여쓰기 일관성 체크
      const indent = this.getIndentLevel(line);
      if (line.trim() !== '' && indent * this.indentSize !== line.search(/\S/)) {
        errors.push(`라인 ${lineNumber}: 들여쓰기가 일관되지 않음`);
      }

      // 기본 문법 체크
      if (!line.trim().startsWith('-') && line.includes(':')) {
        const colonIndex = line.indexOf(':');
        const key = line.substring(0, colonIndex).trim();
        
        if (key === '') {
          errors.push(`라인 ${lineNumber}: 빈 키는 허용되지 않음`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * YAML 문서 분석
   */
  analyze(filePaths: string[]): Promise<any> {
    return this.processBatch(
      filePaths.filter(path => path.endsWith('.yml') || path.endsWith('.yaml')),
      async (filePath) => {
        const result = await this.parseFile(filePath);
        return {
          path: filePath,
          ...result
        };
      }
    );
  }
}