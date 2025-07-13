import { BaseAnalyzer, AnalysisResult } from './BaseAnalyzer';
import { WebSocketConnection, WebSocketEvent } from '../../types/workflow.types';

export interface WebSocketAnalysis extends AnalysisResult {
  connections: WebSocketConnection[];
  events: WebSocketEvent[];
  rooms: string[];
  namespaces: string[];
  middlewares: string[];
}

export class WebSocketAnalyzer extends BaseAnalyzer {
  async analyze(filePaths: string[]): Promise<WebSocketAnalysis> {
    const analysis: WebSocketAnalysis = {
      connections: [],
      events: [],
      rooms: [],
      namespaces: [],
      middlewares: [],
      errors: [],
      warnings: [],
      metadata: {}
    };

    for (const filePath of filePaths) {
      try {
        const content = await this.readFile(filePath);
        const fileAnalysis = this.analyzeFile(content, filePath);
        
        analysis.connections.push(...fileAnalysis.connections);
        analysis.events.push(...fileAnalysis.events);
        analysis.rooms.push(...fileAnalysis.rooms);
        analysis.namespaces.push(...fileAnalysis.namespaces);
        analysis.middlewares.push(...fileAnalysis.middlewares);
      } catch (error) {
        analysis.errors.push(`Failed to analyze ${filePath}: ${error}`);
      }
    }

    // 중복 제거
    analysis.rooms = [...new Set(analysis.rooms)];
    analysis.namespaces = [...new Set(analysis.namespaces)];
    analysis.middlewares = [...new Set(analysis.middlewares)];

    return analysis;
  }

  private analyzeFile(content: string, filePath: string): WebSocketAnalysis {
    const analysis: WebSocketAnalysis = {
      connections: [],
      events: [],
      rooms: [],
      namespaces: [],
      middlewares: [],
      errors: [],
      warnings: [],
      metadata: {}
    };

    // Socket.IO 서버 분석
    this.analyzeSocketIOServer(content, filePath, analysis);
    
    // Socket.IO 클라이언트 분석
    this.analyzeSocketIOClient(content, filePath, analysis);
    
    // 네이티브 WebSocket 분석
    this.analyzeNativeWebSocket(content, filePath, analysis);

    return analysis;
  }

  private analyzeSocketIOServer(content: string, filePath: string, analysis: WebSocketAnalysis): void {
    // Socket.IO 서버 초기화 패턴
    const serverPatterns = [
      /const\s+(\w+)\s*=\s*require\(['"]socket\.io['"]\)/g,
      /import\s+(?:\*\s+as\s+)?(\w+)\s+from\s+['"]socket\.io['"]/g,
      /io\s*=\s*require\(['"]socket\.io['"]\)/g
    ];

    serverPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        analysis.connections.push({
          id: `${filePath}-server-${match.index}`,
          type: 'server',
          name: match[1] || 'io',
          filePath,
          line: this.getLineNumber(content, match.index)
        });
      }
    });

    // 네임스페이스 분석
    const namespacePattern = /(?:io|socket)\.of\(['"]([^'"]+)['"]\)/g;
    let match;
    while ((match = namespacePattern.exec(content)) !== null) {
      analysis.namespaces.push(match[1]);
    }

    // 이벤트 리스너 분석
    const eventListenerPattern = /(?:io|socket)\.on\(['"]([^'"]+)['"],\s*(?:function|\(|\w+)/g;
    while ((match = eventListenerPattern.exec(content)) !== null) {
      analysis.events.push({
        id: `${filePath}-event-${match.index}`,
        name: match[1],
        type: 'listener',
        filePath,
        line: this.getLineNumber(content, match.index)
      });
    }

    // 룸 분석
    const roomPattern = /(?:socket|io)\.(?:join|leave|to|in)\(['"]([^'"]+)['"]\)/g;
    while ((match = roomPattern.exec(content)) !== null) {
      analysis.rooms.push(match[1]);
    }
  }

  private analyzeSocketIOClient(content: string, filePath: string, analysis: WebSocketAnalysis): void {
    // Socket.IO 클라이언트 초기화 패턴
    const clientPatterns = [
      /const\s+(\w+)\s*=\s*io\(/g,
      /import\s+(?:\*\s+as\s+)?(\w+)\s+from\s+['"]socket\.io-client['"]/g,
      /socket\s*=\s*io\(/g
    ];

    clientPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        analysis.connections.push({
          id: `${filePath}-client-${match.index}`,
          type: 'client',
          name: match[1] || 'socket',
          filePath,
          line: this.getLineNumber(content, match.index)
        });
      }
    });

    // 클라이언트 이벤트 분석
    const clientEventPattern = /socket\.(?:on|emit)\(['"]([^'"]+)['"]/g;
    let match;
    while ((match = clientEventPattern.exec(content)) !== null) {
      const isEmit = content.substr(match.index, 15).includes('emit');
      analysis.events.push({
        id: `${filePath}-client-event-${match.index}`,
        name: match[1],
        type: isEmit ? 'emit' : 'listener',
        filePath,
        line: this.getLineNumber(content, match.index)
      });
    }
  }

  private analyzeNativeWebSocket(content: string, filePath: string, analysis: WebSocketAnalysis): void {
    // 네이티브 WebSocket 분석
    const wsPattern = /new\s+WebSocket\(['"]([^'"]+)['"]\)/g;
    let match;
    while ((match = wsPattern.exec(content)) !== null) {
      analysis.connections.push({
        id: `${filePath}-ws-${match.index}`,
        type: 'native',
        name: 'WebSocket',
        url: match[1],
        filePath,
        line: this.getLineNumber(content, match.index)
      });
    }

    // WebSocket 이벤트 리스너
    const wsEventPattern = /(?:ws|socket)\.(?:addEventListener|on)\(['"]([^'"]+)['"]/g;
    while ((match = wsEventPattern.exec(content)) !== null) {
      analysis.events.push({
        id: `${filePath}-ws-event-${match.index}`,
        name: match[1],
        type: 'listener',
        filePath,
        line: this.getLineNumber(content, match.index)
      });
    }
  }

  /**
   * WebSocket 연결 상태 분석
   */
  analyzeConnectionHealth(connections: WebSocketConnection[]): {
    healthy: number;
    disconnected: number;
    errors: number;
  } {
    // 실제 구현에서는 런타임 상태를 확인해야 함
    return {
      healthy: connections.length,
      disconnected: 0,
      errors: 0
    };
  }

  /**
   * 이벤트 매핑 분석
   */
  analyzeEventMapping(events: WebSocketEvent[]): {
    matched: Array<{ emit: WebSocketEvent; listener: WebSocketEvent }>;
    unmatched: WebSocketEvent[];
  } {
    const emits = events.filter(e => e.type === 'emit');
    const listeners = events.filter(e => e.type === 'listener');
    
    const matched: Array<{ emit: WebSocketEvent; listener: WebSocketEvent }> = [];
    const unmatched: WebSocketEvent[] = [];

    emits.forEach(emit => {
      const matchingListener = listeners.find(l => l.name === emit.name);
      if (matchingListener) {
        matched.push({ emit, listener: matchingListener });
      } else {
        unmatched.push(emit);
      }
    });

    // 매칭되지 않은 리스너도 추가
    listeners.forEach(listener => {
      if (!matched.some(m => m.listener.id === listener.id)) {
        unmatched.push(listener);
      }
    });

    return { matched, unmatched };
  }

  /**
   * 보안 검사
   */
  analyzeSecurityIssues(analysis: WebSocketAnalysis): string[] {
    const issues: string[] = [];

    // CORS 설정 확인
    analysis.connections.forEach(conn => {
      if (conn.type === 'server' && conn.url && !conn.url.includes('cors')) {
        issues.push(`CORS 설정이 누락될 수 있습니다: ${conn.filePath}`);
      }
    });

    // 인증 확인
    if (analysis.middlewares.length === 0) {
      issues.push('인증 미들웨어가 설정되지 않았습니다.');
    }

    // 입력 검증
    analysis.events.forEach(event => {
      if (event.type === 'listener' && !event.validation) {
        issues.push(`이벤트 입력 검증이 누락됨: ${event.name} in ${event.filePath}`);
      }
    });

    return issues;
  }

  protected getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }
}