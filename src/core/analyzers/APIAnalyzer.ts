import { BaseAnalyzer, AnalysisResult } from './BaseAnalyzer';
import { APIEndpoint, APICall, APIMatch, APIParameter, APIResponse } from '../../types/workflow.types';

export interface APIAnalysis extends AnalysisResult {
  endpoints: APIEndpoint[];
  calls: APICall[];
  matches: APIMatch[];
  orphanedEndpoints: APIEndpoint[];
  orphanedCalls: APICall[];
  mismatches: Array<{
    call: APICall;
    issues: string[];
  }>;
}

export class APIAnalyzer extends BaseAnalyzer {
  private supportedExtensions = ['.js', '.ts', '.jsx', '.tsx'];

  async analyze(filePaths: string[]): Promise<APIAnalysis> {
    const analysis: APIAnalysis = {
      endpoints: [],
      calls: [],
      matches: [],
      orphanedEndpoints: [],
      orphanedCalls: [],
      mismatches: [],
      errors: [],
      warnings: [],
      metadata: {}
    };

    const relevantFiles = this.filterFiles(filePaths, this.supportedExtensions);
    
    this.progress(0, relevantFiles.length, 'API 분석 시작...');

    // 파일 처리
    for (let i = 0; i < relevantFiles.length; i++) {
      const filePath = relevantFiles[i];
      this.progress(i + 1, relevantFiles.length, `분석 중: ${filePath}`);
      
      try {
        const fileAnalysis = await this.analyzeFile(filePath);
        analysis.endpoints.push(...fileAnalysis.endpoints);
        analysis.calls.push(...fileAnalysis.calls);
      } catch (error) {
        analysis.errors.push(`${filePath} 분석 실패: ${error}`);
      }
    }

    // API 매칭 수행
    analysis.matches = this.matchAPIs(analysis.endpoints, analysis.calls);
    analysis.orphanedEndpoints = this.findOrphanedEndpoints(analysis.endpoints, analysis.matches);
    analysis.orphanedCalls = this.findOrphanedCalls(analysis.calls, analysis.matches);
    analysis.mismatches = this.findMismatches(analysis.calls, analysis.endpoints);

    // 메타데이터 설정
    analysis.metadata = {
      totalEndpoints: analysis.endpoints.length,
      totalCalls: analysis.calls.length,
      matchedAPIs: analysis.matches.filter(m => m.matched).length,
      orphanedEndpoints: analysis.orphanedEndpoints.length,
      orphanedCalls: analysis.orphanedCalls.length,
      mismatchCount: analysis.mismatches.length
    };

    return this.validateResult(analysis) as APIAnalysis;
  }

  private async analyzeFile(filePath: string): Promise<{ endpoints: APIEndpoint[]; calls: APICall[] }> {
    const content = await this.readFile(filePath);
    const cleanContent = this.removeComments(content);
    
    return {
      endpoints: this.extractEndpoints(cleanContent, filePath),
      calls: this.extractAPICalls(cleanContent, filePath)
    };
  }

  /**
   * API 엔드포인트 추출 (Express, Fastify 등)
   */
  private extractEndpoints(content: string, filePath: string): APIEndpoint[] {
    const endpoints: APIEndpoint[] = [];

    // Express 스타일 라우트
    const expressPatterns = [
      /(?:router|app)\.(?:get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*([^)]+)\)/g,
      /(?:router|app)\.route\s*\(\s*['"`]([^'"`]+)['"`]\s*\)\.(?:get|post|put|delete|patch)\s*\(([^)]+)\)/g
    ];

    expressPatterns.forEach(pattern => {
      const matches = this.findMatches(content, pattern);
      matches.forEach(match => {
        const method = this.extractHTTPMethod(match[0]);
        const path = match[1];
        const handler = match[2]?.trim();

        if (method && path) {
          endpoints.push({
            id: `${filePath}:${method}:${path}:${match.index}`,
            method: method as any,
            path,
            handler,
            filePath,
            line: this.getLineNumber(content, match.index!),
            parameters: this.extractParameters(match[0]),
            responses: this.extractResponses(content, match.index!)
          });
        }
      });
    });

    // Fastify 스타일
    const fastifyPattern = /fastify\.(?:get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]\s*,/g;
    const fastifyMatches = this.findMatches(content, fastifyPattern);
    fastifyMatches.forEach(match => {
      const method = this.extractHTTPMethod(match[0]);
      const path = match[1];

      if (method && path) {
        endpoints.push({
          id: `${filePath}:${method}:${path}:${match.index}`,
          method: method as any,
          path,
          filePath,
          line: this.getLineNumber(content, match.index!)
        });
      }
    });

    // NestJS 데코레이터
    const nestjsPattern = /@(?:Get|Post|Put|Delete|Patch)\s*\(\s*['"`]?([^'"`\)]*)['"`]?\s*\)/g;
    const nestjsMatches = this.findMatches(content, nestjsPattern);
    nestjsMatches.forEach(match => {
      const method = match[0].match(/@(\w+)/)?.[1]?.toUpperCase();
      const path = match[1] || '/';

      if (method) {
        endpoints.push({
          id: `${filePath}:${method}:${path}:${match.index}`,
          method: method as any,
          path,
          filePath,
          line: this.getLineNumber(content, match.index!)
        });
      }
    });

    return endpoints;
  }

  /**
   * API 호출 추출 (fetch, axios 등)
   */
  private extractAPICalls(content: string, filePath: string): APICall[] {
    const calls: APICall[] = [];

    // fetch API
    const fetchPattern = /fetch\s*\(\s*['"`]([^'"`]+)['"`]\s*(?:,\s*{[^}]*method\s*:\s*['"`](\w+)['"`][^}]*})?\s*\)/g;
    const fetchMatches = this.findMatches(content, fetchPattern);
    fetchMatches.forEach(match => {
      const url = match[1];
      const method = match[2] || 'GET';

      calls.push({
        id: `${filePath}:fetch:${url}:${match.index}`,
        method: method.toUpperCase(),
        url,
        filePath,
        line: this.getLineNumber(content, match.index!)
      });
    });

    // axios
    const axiosPatterns = [
      /axios\.(?:get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /axios\s*\(\s*{\s*method\s*:\s*['"`](\w+)['"`]\s*,\s*url\s*:\s*['"`]([^'"`]+)['"`]/g
    ];

    axiosPatterns.forEach(pattern => {
      const matches = this.findMatches(content, pattern);
      matches.forEach(match => {
        let method: string;
        let url: string;

        if (match[0].includes('axios.')) {
          method = this.extractHTTPMethod(match[0]) || 'GET';
          url = match[1];
        } else {
          method = match[1].toUpperCase();
          url = match[2];
        }

        calls.push({
          id: `${filePath}:axios:${url}:${match.index}`,
          method,
          url,
          filePath,
          line: this.getLineNumber(content, match.index!)
        });
      });
    });

    // jQuery AJAX
    const jqueryPattern = /\$\.ajax\s*\(\s*{\s*[^}]*url\s*:\s*['"`]([^'"`]+)['"`][^}]*(?:type|method)\s*:\s*['"`](\w+)['"`]/g;
    const jqueryMatches = this.findMatches(content, jqueryPattern);
    jqueryMatches.forEach(match => {
      calls.push({
        id: `${filePath}:jquery:${match[1]}:${match.index}`,
        method: match[2].toUpperCase(),
        url: match[1],
        filePath,
        line: this.getLineNumber(content, match.index!)
      });
    });

    return calls;
  }

  /**
   * API 매칭
   */
  matchAPIs(endpoints: APIEndpoint[], calls: APICall[]): APIMatch[] {
    const matches: APIMatch[] = [];

    endpoints.forEach(endpoint => {
      const matchingCalls = calls.filter(call => 
        this.isAPIMatch(endpoint, call)
      );

      matches.push({
        endpoint,
        calls: matchingCalls,
        matched: matchingCalls.length > 0
      });
    });

    return matches;
  }

  /**
   * API 매칭 로직
   */
  private isAPIMatch(endpoint: APIEndpoint, call: APICall): boolean {
    // 메서드 확인
    if (endpoint.method !== call.method) {
      return false;
    }

    // URL 패턴 매칭
    const endpointPattern = this.convertToRegex(endpoint.path);
    const callUrl = this.extractPath(call.url);
    
    return endpointPattern.test(callUrl);
  }

  /**
   * Express 경로를 정규식으로 변환
   */
  private convertToRegex(path: string): RegExp {
    // :id 같은 파라미터를 정규식으로 변환
    const regexPath = path
      .replace(/:[^/]+/g, '[^/]+')  // :id -> [^/]+
      .replace(/\*/g, '.*')         // * -> .*
      .replace(/\?/g, '\\?');       // ? -> \?
    
    return new RegExp(`^${regexPath}$`);
  }

  /**
   * URL에서 경로만 추출
   */
  private extractPath(url: string): string {
    try {
      const urlObj = new URL(url, 'http://localhost');
      return urlObj.pathname;
    } catch {
      // 상대 경로인 경우
      return url.split('?')[0];
    }
  }

  /**
   * HTTP 메서드 추출
   */
  private extractHTTPMethod(code: string): string | null {
    const methodMatch = code.match(/\.(get|post|put|delete|patch)\b|method\s*:\s*['"`](\w+)['"`]/i);
    return methodMatch ? (methodMatch[1] || methodMatch[2]).toUpperCase() : null;
  }

  /**
   * 파라미터 추출
   */
  private extractParameters(routeCode: string): APIParameter[] {
    const parameters: APIParameter[] = [];
    
    // URL 파라미터 (:id)
    const urlParams = routeCode.match(/:(\w+)/g);
    if (urlParams) {
      urlParams.forEach(param => {
        parameters.push({
          name: param.substring(1),
          type: 'string',
          required: true,
          location: 'path'
        });
      });
    }

    return parameters;
  }

  /**
   * 응답 형태 추출
   */
  private extractResponses(content: string, startIndex: number): APIResponse[] {
    // 간단한 응답 패턴 찾기
    const responses: APIResponse[] = [];
    
    // res.json(), res.send() 등을 찾기
    const responsePattern = /res\.(?:json|send|status)\s*\(\s*(\d+)?\s*\)/g;
    const matches = this.findMatches(content.substring(startIndex, startIndex + 500), responsePattern);
    
    matches.forEach(match => {
      const status = match[1] ? parseInt(match[1]) : 200;
      responses.push({
        status,
        description: `HTTP ${status} response`
      });
    });

    return responses.length > 0 ? responses : [{ status: 200, description: 'Default response' }];
  }

  /**
   * 고아 엔드포인트 찾기
   */
  private findOrphanedEndpoints(endpoints: APIEndpoint[], matches: APIMatch[]): APIEndpoint[] {
    const matchedEndpoints = new Set(matches.filter(m => m.matched).map(m => m.endpoint.id));
    return endpoints.filter(endpoint => !matchedEndpoints.has(endpoint.id));
  }

  /**
   * 고아 API 호출 찾기
   */
  private findOrphanedCalls(calls: APICall[], matches: APIMatch[]): APICall[] {
    const matchedCalls = new Set();
    matches.forEach(match => {
      match.calls.forEach(call => matchedCalls.add(call.id));
    });
    
    return calls.filter(call => !matchedCalls.has(call.id));
  }

  /**
   * API 불일치 찾기
   */
  private findMismatches(calls: APICall[], endpoints: APIEndpoint[]): Array<{ call: APICall; issues: string[] }> {
    const mismatches: Array<{ call: APICall; issues: string[] }> = [];

    calls.forEach(call => {
      const issues: string[] = [];
      const callPath = this.extractPath(call.url);
      
      // 비슷한 경로의 엔드포인트 찾기
      const similarEndpoints = endpoints.filter(endpoint => {
        const similarity = this.calculatePathSimilarity(callPath, endpoint.path);
        return similarity > 0.5 && similarity < 1.0;
      });

      if (similarEndpoints.length > 0) {
        similarEndpoints.forEach(endpoint => {
          if (endpoint.method !== call.method) {
            issues.push(`메서드 불일치: ${call.method} vs ${endpoint.method}`);
          }
          
          const pathDiff = this.getPathDifference(callPath, endpoint.path);
          if (pathDiff) {
            issues.push(`경로 차이: ${pathDiff}`);
          }
        });
      }

      if (issues.length > 0) {
        mismatches.push({ call, issues });
      }
    });

    return mismatches;
  }

  /**
   * 백엔드 API 찾기 (public 메서드)
   */
  async findBackendAPIs(projectPath: string): Promise<APIEndpoint[]> {
    // 간단한 구현 - 실제로는 프로젝트 파일을 스캔해야 함
    const analysis = await this.analyze([]);
    return analysis.endpoints;
  }

  /**
   * 프론트엔드 API 호출 찾기 (public 메서드)
   */
  async findFrontendAPICalls(projectPath: string): Promise<APICall[]> {
    // 간단한 구현 - 실제로는 프로젝트 파일을 스캔해야 함
    const analysis = await this.analyze([]);
    return analysis.calls;
  }

  /**
   * 경로 유사도 계산
   */
  private calculatePathSimilarity(path1: string, path2: string): number {
    const parts1 = path1.split('/').filter(Boolean);
    const parts2 = path2.split('/').filter(Boolean);
    
    const maxLength = Math.max(parts1.length, parts2.length);
    if (maxLength === 0) return 1;
    
    let matches = 0;
    const minLength = Math.min(parts1.length, parts2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (parts1[i] === parts2[i] || parts2[i].startsWith(':')) {
        matches++;
      }
    }
    
    return matches / maxLength;
  }

  /**
   * 경로 차이점 분석
   */
  private getPathDifference(path1: string, path2: string): string | null {
    const parts1 = path1.split('/').filter(Boolean);
    const parts2 = path2.split('/').filter(Boolean);
    
    if (parts1.length !== parts2.length) {
      return `세그먼트 개수 차이: ${parts1.length} vs ${parts2.length}`;
    }
    
    for (let i = 0; i < parts1.length; i++) {
      if (parts1[i] !== parts2[i] && !parts2[i].startsWith(':')) {
        return `세그먼트 차이: '${parts1[i]}' vs '${parts2[i]}'`;
      }
    }
    
    return null;
  }

  /**
   * API 문서 생성
   */
  generateAPIDocumentation(analysis: APIAnalysis): string {
    let doc = '# API 분석 결과\n\n';
    
    doc += `## 요약\n`;
    doc += `- 총 엔드포인트: ${analysis.endpoints.length}\n`;
    doc += `- 총 API 호출: ${analysis.calls.length}\n`;
    doc += `- 매칭된 API: ${analysis.matches.filter(m => m.matched).length}\n`;
    doc += `- 고아 엔드포인트: ${analysis.orphanedEndpoints.length}\n`;
    doc += `- 고아 호출: ${analysis.orphanedCalls.length}\n\n`;

    if (analysis.orphanedEndpoints.length > 0) {
      doc += `## 🚨 사용되지 않는 엔드포인트\n`;
      analysis.orphanedEndpoints.forEach(endpoint => {
        doc += `- \`${endpoint.method} ${endpoint.path}\` (${endpoint.filePath}:${endpoint.line})\n`;
      });
      doc += '\n';
    }

    if (analysis.orphanedCalls.length > 0) {
      doc += `## 🔍 매칭되지 않는 API 호출\n`;
      analysis.orphanedCalls.forEach(call => {
        doc += `- \`${call.method} ${call.url}\` (${call.filePath}:${call.line})\n`;
      });
      doc += '\n';
    }

    return doc;
  }
}