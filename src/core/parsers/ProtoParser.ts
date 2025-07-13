import { BaseAnalyzer, AnalysisResult } from '../analyzers/BaseAnalyzer';

export interface ProtoMessage {
  name: string;
  fields: ProtoField[];
  nested: ProtoMessage[];
  options: Record<string, any>;
  line: number;
}

export interface ProtoField {
  name: string;
  type: string;
  number: number;
  label: 'optional' | 'required' | 'repeated';
  options: Record<string, any>;
  line: number;
}

export interface ProtoService {
  name: string;
  methods: ProtoMethod[];
  options: Record<string, any>;
  line: number;
}

export interface ProtoMethod {
  name: string;
  inputType: string;
  outputType: string;
  clientStreaming: boolean;
  serverStreaming: boolean;
  options: Record<string, any>;
  line: number;
}

export interface ProtoEnum {
  name: string;
  values: Array<{
    name: string;
    number: number;
    options: Record<string, any>;
    line: number;
  }>;
  options: Record<string, any>;
  line: number;
}

export interface ProtoFile {
  syntax: string;
  package?: string;
  imports: string[];
  messages: ProtoMessage[];
  services: ProtoService[];
  enums: ProtoEnum[];
  options: Record<string, any>;
  metadata: {
    filePath: string;
    lineCount: number;
    packageCount: number;
    serviceCount: number;
    messageCount: number;
    enumCount: number;
  };
}

export interface ProtoAnalysis extends AnalysisResult {
  files: ProtoFile[];
  dependencies: Array<{
    from: string;
    to: string;
    type: 'import' | 'message_ref' | 'service_ref';
  }>;
  services: {
    total: number;
    methods: number;
    streamingMethods: number;
  };
  messages: {
    total: number;
    fields: number;
    nestedMessages: number;
  };
}

export class ProtoParser extends BaseAnalyzer {
  private currentLine = 1;
  private packageName = '';

  /**
   * Protocol Buffer 파일 분석
   */
  async analyze(filePaths: string[]): Promise<ProtoAnalysis> {
    const analysis: ProtoAnalysis = {
      files: [],
      dependencies: [],
      services: { total: 0, methods: 0, streamingMethods: 0 },
      messages: { total: 0, fields: 0, nestedMessages: 0 },
      errors: [],
      warnings: [],
      metadata: {}
    };

    const protoFiles = filePaths.filter(path => path.endsWith('.proto'));

    for (const filePath of protoFiles) {
      try {
        const file = await this.parseFile(filePath);
        analysis.files.push(file);

        // 통계 업데이트
        analysis.services.total += file.services.length;
        analysis.services.methods += file.services.reduce((sum, s) => sum + s.methods.length, 0);
        analysis.services.streamingMethods += file.services.reduce((sum, s) => 
          sum + s.methods.filter(m => m.clientStreaming || m.serverStreaming).length, 0
        );

        analysis.messages.total += file.messages.length;
        analysis.messages.fields += this.countFields(file.messages);
        analysis.messages.nestedMessages += this.countNestedMessages(file.messages);

        // 의존성 추출
        analysis.dependencies.push(...this.extractDependencies(file));

      } catch (error) {
        analysis.errors.push(`${filePath} 파싱 실패: ${error}`);
      }
    }

    return analysis;
  }

  /**
   * 단일 proto 파일 파싱
   */
  async parseFile(filePath: string): Promise<ProtoFile> {
    const content = await this.readFile(filePath);
    return this.parseContent(content, filePath);
  }

  /**
   * Proto 내용 파싱
   */
  parseContent(content: string, filePath: string): ProtoFile {
    this.currentLine = 1;
    this.packageName = '';

    const lines = content.split('\n');
    const cleanLines = this.preprocessLines(lines);

    const file: ProtoFile = {
      syntax: 'proto2', // 기본값
      imports: [],
      messages: [],
      services: [],
      enums: [],
      options: {},
      metadata: {
        filePath,
        lineCount: lines.length,
        packageCount: 0,
        serviceCount: 0,
        messageCount: 0,
        enumCount: 0
      }
    };

    let i = 0;
    while (i < cleanLines.length) {
      const line = cleanLines[i];
      
      try {
        if (line.startsWith('syntax')) {
          file.syntax = this.parseSyntax(line);
        } else if (line.startsWith('package')) {
          file.package = this.parsePackage(line);
          this.packageName = file.package;
          file.metadata.packageCount++;
        } else if (line.startsWith('import')) {
          file.imports.push(this.parseImport(line));
        } else if (line.startsWith('option')) {
          const option = this.parseOption(line);
          file.options[option.name] = option.value;
        } else if (line.startsWith('message')) {
          const message = this.parseMessage(cleanLines, i);
          file.messages.push(message.data);
          file.metadata.messageCount++;
          i = message.nextIndex - 1; // 다음 라인으로 이동
        } else if (line.startsWith('service')) {
          const service = this.parseService(cleanLines, i);
          file.services.push(service.data);
          file.metadata.serviceCount++;
          i = service.nextIndex - 1;
        } else if (line.startsWith('enum')) {
          const enumDef = this.parseEnum(cleanLines, i);
          file.enums.push(enumDef.data);
          file.metadata.enumCount++;
          i = enumDef.nextIndex - 1;
        }
      } catch (error) {
        console.warn(`라인 ${this.currentLine} 파싱 실패:`, error);
      }

      i++;
      this.currentLine++;
    }

    return file;
  }

  /**
   * gRPC 서비스 정보 추출
   */
  extractGRPCInfo(analysis: ProtoAnalysis): {
    services: Array<{
      name: string;
      package: string;
      methods: Array<{
        name: string;
        type: 'unary' | 'client_streaming' | 'server_streaming' | 'bidirectional_streaming';
        inputType: string;
        outputType: string;
      }>;
    }>;
    totalEndpoints: number;
  } {
    const services: any[] = [];
    let totalEndpoints = 0;

    analysis.files.forEach(file => {
      file.services.forEach(service => {
        const methods = service.methods.map(method => ({
          name: method.name,
          type: this.getMethodType(method),
          inputType: method.inputType,
          outputType: method.outputType
        }));

        services.push({
          name: service.name,
          package: file.package || '',
          methods
        });

        totalEndpoints += methods.length;
      });
    });

    return { services, totalEndpoints };
  }

  // Private parsing methods

  private preprocessLines(lines: string[]): string[] {
    return lines
      .map(line => line.trim())
      .filter(line => line !== '' && !line.startsWith('//'))
      .map(line => {
        // 인라인 주석 제거
        const commentIndex = line.indexOf('//');
        return commentIndex > 0 ? line.substring(0, commentIndex).trim() : line;
      });
  }

  private parseSyntax(line: string): string {
    const match = line.match(/syntax\s*=\s*["']([^"']+)["']\s*;/);
    return match ? match[1] : 'proto2';
  }

  private parsePackage(line: string): string {
    const match = line.match(/package\s+([^;]+)\s*;/);
    return match ? match[1].trim() : '';
  }

  private parseImport(line: string): string {
    const match = line.match(/import\s+["']([^"']+)["']\s*;/);
    return match ? match[1] : '';
  }

  private parseOption(line: string): { name: string; value: any } {
    const match = line.match(/option\s+([^=]+)\s*=\s*([^;]+)\s*;/);
    if (match) {
      const name = match[1].trim();
      const value = this.parseValue(match[2].trim());
      return { name, value };
    }
    return { name: '', value: null };
  }

  private parseMessage(lines: string[], startIndex: number): { data: ProtoMessage; nextIndex: number } {
    const startLine = lines[startIndex];
    const nameMatch = startLine.match(/message\s+(\w+)\s*{/);
    
    if (!nameMatch) {
      throw new Error(`Invalid message declaration: ${startLine}`);
    }

    const message: ProtoMessage = {
      name: nameMatch[1],
      fields: [],
      nested: [],
      options: {},
      line: this.currentLine + startIndex
    };

    let i = startIndex + 1;
    let braceCount = 1;

    while (i < lines.length && braceCount > 0) {
      const line = lines[i];

      if (line.includes('{')) braceCount++;
      if (line.includes('}')) braceCount--;

      if (braceCount === 0) break;

      if (line.startsWith('message')) {
        // 중첩 메시지
        const nested = this.parseMessage(lines, i);
        message.nested.push(nested.data);
        i = nested.nextIndex;
      } else if (line.startsWith('option')) {
        const option = this.parseOption(line);
        message.options[option.name] = option.value;
      } else if (this.isFieldDeclaration(line)) {
        const field = this.parseField(line);
        if (field) {
          field.line = this.currentLine + i;
          message.fields.push(field);
        }
      }

      i++;
    }

    return { data: message, nextIndex: i + 1 };
  }

  private parseField(line: string): ProtoField | null {
    // optional/required/repeated Type name = number [options];
    const fieldPattern = /^(optional|required|repeated)?\s*(\w+)\s+(\w+)\s*=\s*(\d+)(?:\s*\[[^\]]*\])?\s*;$/;
    const match = line.match(fieldPattern);

    if (match) {
      return {
        label: (match[1] as any) || 'optional',
        type: match[2],
        name: match[3],
        number: parseInt(match[4], 10),
        options: {},
        line: this.currentLine
      };
    }

    return null;
  }

  private parseService(lines: string[], startIndex: number): { data: ProtoService; nextIndex: number } {
    const startLine = lines[startIndex];
    const nameMatch = startLine.match(/service\s+(\w+)\s*{/);
    
    if (!nameMatch) {
      throw new Error(`Invalid service declaration: ${startLine}`);
    }

    const service: ProtoService = {
      name: nameMatch[1],
      methods: [],
      options: {},
      line: this.currentLine + startIndex
    };

    let i = startIndex + 1;
    let braceCount = 1;

    while (i < lines.length && braceCount > 0) {
      const line = lines[i];

      if (line.includes('{')) braceCount++;
      if (line.includes('}')) braceCount--;

      if (braceCount === 0) break;

      if (line.startsWith('rpc')) {
        const method = this.parseMethod(line);
        if (method) {
          method.line = this.currentLine + i;
          service.methods.push(method);
        }
      } else if (line.startsWith('option')) {
        const option = this.parseOption(line);
        service.options[option.name] = option.value;
      }

      i++;
    }

    return { data: service, nextIndex: i + 1 };
  }

  private parseMethod(line: string): ProtoMethod | null {
    // rpc MethodName (stream? RequestType) returns (stream? ResponseType);
    const methodPattern = /rpc\s+(\w+)\s*\(\s*(stream\s+)?(\w+)\s*\)\s*returns\s*\(\s*(stream\s+)?(\w+)\s*\)\s*;/;
    const match = line.match(methodPattern);

    if (match) {
      return {
        name: match[1],
        inputType: match[3],
        outputType: match[5],
        clientStreaming: !!match[2],
        serverStreaming: !!match[4],
        options: {},
        line: this.currentLine
      };
    }

    return null;
  }

  private parseEnum(lines: string[], startIndex: number): { data: ProtoEnum; nextIndex: number } {
    const startLine = lines[startIndex];
    const nameMatch = startLine.match(/enum\s+(\w+)\s*{/);
    
    if (!nameMatch) {
      throw new Error(`Invalid enum declaration: ${startLine}`);
    }

    const enumDef: ProtoEnum = {
      name: nameMatch[1],
      values: [],
      options: {},
      line: this.currentLine + startIndex
    };

    let i = startIndex + 1;
    let braceCount = 1;

    while (i < lines.length && braceCount > 0) {
      const line = lines[i];

      if (line.includes('{')) braceCount++;
      if (line.includes('}')) braceCount--;

      if (braceCount === 0) break;

      if (line.includes('=')) {
        const enumValue = this.parseEnumValue(line);
        if (enumValue) {
          enumValue.line = this.currentLine + i;
          enumDef.values.push(enumValue);
        }
      } else if (line.startsWith('option')) {
        const option = this.parseOption(line);
        enumDef.options[option.name] = option.value;
      }

      i++;
    }

    return { data: enumDef, nextIndex: i + 1 };
  }

  private parseEnumValue(line: string): { name: string; number: number; options: Record<string, any>; line: number } | null {
    const match = line.match(/(\w+)\s*=\s*(\d+)(?:\s*\[[^\]]*\])?\s*;/);
    
    if (match) {
      return {
        name: match[1],
        number: parseInt(match[2], 10),
        options: {},
        line: this.currentLine
      };
    }

    return null;
  }

  private parseValue(value: string): any {
    value = value.trim();

    // String
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }

    // Boolean
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Number
    if (/^\d+$/.test(value)) return parseInt(value, 10);
    if (/^\d+\.\d+$/.test(value)) return parseFloat(value);

    return value;
  }

  private isFieldDeclaration(line: string): boolean {
    return /^\s*(optional|required|repeated)?\s*\w+\s+\w+\s*=\s*\d+/.test(line);
  }

  private getMethodType(method: ProtoMethod): string {
    if (method.clientStreaming && method.serverStreaming) {
      return 'bidirectional_streaming';
    } else if (method.clientStreaming) {
      return 'client_streaming';
    } else if (method.serverStreaming) {
      return 'server_streaming';
    } else {
      return 'unary';
    }
  }

  private countFields(messages: ProtoMessage[]): number {
    return messages.reduce((sum, message) => {
      return sum + message.fields.length + this.countFields(message.nested);
    }, 0);
  }

  private countNestedMessages(messages: ProtoMessage[]): number {
    return messages.reduce((sum, message) => {
      return sum + message.nested.length + this.countNestedMessages(message.nested);
    }, 0);
  }

  private extractDependencies(file: ProtoFile): Array<{ from: string; to: string; type: 'import' | 'message_ref' | 'service_ref' }> {
    const dependencies: Array<{ from: string; to: string; type: 'import' | 'message_ref' | 'service_ref' }> = [];

    // Import 의존성
    file.imports.forEach(importPath => {
      dependencies.push({
        from: file.metadata.filePath,
        to: importPath,
        type: 'import'
      });
    });

    // 메시지 타입 참조 (간단한 버전)
    file.messages.forEach(message => {
      message.fields.forEach(field => {
        if (!this.isPrimitiveType(field.type)) {
          dependencies.push({
            from: message.name,
            to: field.type,
            type: 'message_ref'
          });
        }
      });
    });

    return dependencies;
  }

  private isPrimitiveType(type: string): boolean {
    const primitiveTypes = [
      'double', 'float', 'int32', 'int64', 'uint32', 'uint64',
      'sint32', 'sint64', 'fixed32', 'fixed64', 'sfixed32', 'sfixed64',
      'bool', 'string', 'bytes'
    ];
    return primitiveTypes.includes(type);
  }

  /**
   * Proto 파일 유효성 검사
   */
  validateProtoFile(content: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;

      if (line === '' || line.startsWith('//')) continue;

      // 문법 오류 체크
      if (line.includes('message') && !line.includes('{')) {
        errors.push(`라인 ${lineNumber}: 메시지 선언에 '{' 누락`);
      }

      if (line.includes('service') && !line.includes('{')) {
        errors.push(`라인 ${lineNumber}: 서비스 선언에 '{' 누락`);
      }

      // 필드 번호 중복 체크는 더 복잡한 파싱이 필요
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * gRPC 서비스 문서 생성
   */
  generateGRPCDocumentation(analysis: ProtoAnalysis): string {
    let doc = '# gRPC API 문서\n\n';

    const grpcInfo = this.extractGRPCInfo(analysis);

    doc += `## 📊 개요\n`;
    doc += `- 총 서비스: ${grpcInfo.services.length}\n`;
    doc += `- 총 메서드: ${grpcInfo.totalEndpoints}\n`;
    doc += `- 스트리밍 메서드: ${analysis.services.streamingMethods}\n\n`;

    grpcInfo.services.forEach(service => {
      doc += `## 🔧 ${service.name}\n`;
      if (service.package) {
        doc += `**패키지**: ${service.package}\n\n`;
      }

      service.methods.forEach(method => {
        doc += `### ${method.name}\n`;
        doc += `- **타입**: ${method.type}\n`;
        doc += `- **입력**: ${method.inputType}\n`;
        doc += `- **출력**: ${method.outputType}\n\n`;
      });
    });

    return doc;
  }
}