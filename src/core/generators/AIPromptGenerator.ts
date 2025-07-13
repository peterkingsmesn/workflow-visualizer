import { WorkflowAnalysis, AIContext, AIPrompt, Node, Edge } from '../../types/workflow.types';

export interface ProjectContext {
  name: string;
  type: string;
  description: string;
  architecture: string;
  frameworks: string[];
  patterns: string[];
  fileStructure: FileStructureInfo;
  dependencies: DependencyInfo;
  apiEndpoints: APIEndpointInfo[];
  metrics: ProjectMetrics;
}

export interface FileStructureInfo {
  totalFiles: number;
  fileTypes: Record<string, number>;
  directories: string[];
  keyFiles: Array<{
    path: string;
    purpose: string;
    importance: 'high' | 'medium' | 'low';
  }>;
}

export interface DependencyInfo {
  external: Record<string, string>;
  internal: Array<{
    from: string;
    to: string;
    type: string;
  }>;
  circular: string[][];
}

export interface APIEndpointInfo {
  method: string;
  path: string;
  handler: string;
  status: 'implemented' | 'called' | 'orphaned';
}

export interface ProjectMetrics {
  complexity: 'low' | 'medium' | 'high';
  maintainability: number;
  testCoverage: number;
  codeQuality: number;
  technicalDebt: number;
}

export class AIPromptGenerator {
  /**
   * 프로젝트 컨텍스트를 AI가 이해하기 쉬운 형태로 생성
   */
  generateProjectContext(
    nodes: Node[],
    edges: Edge[],
    analysis: WorkflowAnalysis,
    additionalInfo?: Partial<ProjectContext>
  ): ProjectContext {
    const context: ProjectContext = {
      name: additionalInfo?.name || 'Unknown Project',
      type: this.detectProjectType(nodes),
      description: additionalInfo?.description || 'Auto-generated from workflow analysis',
      architecture: this.detectArchitecture(nodes, edges),
      frameworks: this.extractFrameworks(nodes),
      patterns: this.detectPatterns(nodes, edges),
      fileStructure: this.analyzeFileStructure(nodes),
      dependencies: this.analyzeDependencies(edges),
      apiEndpoints: this.extractAPIEndpoints(nodes),
      metrics: this.calculateMetrics(analysis),
      ...additionalInfo
    };

    return context;
  }

  /**
   * AI 프롬프트 생성
   */
  generateAIPrompt(
    context: ProjectContext,
    analysis: WorkflowAnalysis,
    userIntent: string,
    options: {
      includeCodeExamples?: boolean;
      includeErrorContext?: boolean;
      maxLength?: number;
    } = {}
  ): AIPrompt {
    const prompt: AIPrompt = {
      context: this.buildAIContext(context),
      analysis,
      userIntent,
      suggestions: this.generateSuggestions(context, analysis, userIntent)
    };

    return prompt;
  }

  /**
   * 코드 개선을 위한 컨텍스트 생성
   */
  generateCodeImprovementContext(
    context: ProjectContext,
    analysis: WorkflowAnalysis,
    targetFiles?: string[]
  ): string {
    let prompt = `# 프로젝트 컨텍스트\n\n`;
    
    prompt += `## 📋 프로젝트 정보\n`;
    prompt += `- **이름**: ${context.name}\n`;
    prompt += `- **타입**: ${context.type}\n`;
    prompt += `- **아키텍처**: ${context.architecture}\n`;
    prompt += `- **주요 프레임워크**: ${context.frameworks.join(', ')}\n`;
    prompt += `- **설계 패턴**: ${context.patterns.join(', ')}\n\n`;

    prompt += `## 📁 파일 구조\n`;
    prompt += `- 총 파일 수: ${context.fileStructure.totalFiles}\n`;
    prompt += `- 파일 타입별 분포:\n`;
    Object.entries(context.fileStructure.fileTypes).forEach(([type, count]) => {
      prompt += `  - ${type}: ${count}개\n`;
    });
    prompt += '\n';

    if (context.fileStructure.keyFiles.length > 0) {
      prompt += `### 🔑 핵심 파일들\n`;
      context.fileStructure.keyFiles.forEach(file => {
        prompt += `- **${file.path}** (${file.importance}): ${file.purpose}\n`;
      });
      prompt += '\n';
    }

    prompt += `## 🔗 의존성 분석\n`;
    prompt += `- 외부 의존성: ${Object.keys(context.dependencies.external).length}개\n`;
    prompt += `- 내부 의존성: ${context.dependencies.internal.length}개\n`;
    
    if (context.dependencies.circular.length > 0) {
      prompt += `- ⚠️ 순환 의존성 ${context.dependencies.circular.length}개 발견\n`;
      context.dependencies.circular.forEach((cycle, index) => {
        prompt += `  ${index + 1}. ${cycle.join(' → ')}\n`;
      });
    }
    prompt += '\n';

    if (context.apiEndpoints.length > 0) {
      prompt += `## 🌐 API 엔드포인트\n`;
      const implementedAPIs = context.apiEndpoints.filter(api => api.status === 'implemented');
      const orphanedAPIs = context.apiEndpoints.filter(api => api.status === 'orphaned');
      
      prompt += `- 구현된 엔드포인트: ${implementedAPIs.length}개\n`;
      prompt += `- 고아 엔드포인트: ${orphanedAPIs.length}개\n`;
      
      if (orphanedAPIs.length > 0) {
        prompt += `\n### ⚠️ 사용되지 않는 API 엔드포인트\n`;
        orphanedAPIs.slice(0, 5).forEach(api => {
          prompt += `- \`${api.method} ${api.path}\`\n`;
        });
      }
      prompt += '\n';
    }

    prompt += `## 📊 품질 지표\n`;
    prompt += `- 복잡도: ${context.metrics.complexity}\n`;
    prompt += `- 유지보수성: ${context.metrics.maintainability}/100\n`;
    prompt += `- 코드 품질: ${context.metrics.codeQuality}/100\n`;
    prompt += `- 기술 부채: ${context.metrics.technicalDebt}/100\n\n`;

    if (analysis.errors.length > 0) {
      prompt += `## ❌ 발견된 문제점\n`;
      analysis.errors.slice(0, 10).forEach((error, index) => {
        prompt += `${index + 1}. **${error.type}**: ${error.message}\n`;
        if (error.suggestion) {
          prompt += `   💡 제안: ${error.suggestion}\n`;
        }
      });
      prompt += '\n';
    }

    if (analysis.warnings.length > 0) {
      prompt += `## ⚠️ 경고사항\n`;
      analysis.warnings.slice(0, 5).forEach((warning, index) => {
        prompt += `${index + 1}. ${warning.message}\n`;
      });
      prompt += '\n';
    }

    prompt += `## 💡 개선 제안\n`;
    analysis.suggestions.forEach((suggestion, index) => {
      prompt += `${index + 1}. ${suggestion}\n`;
    });

    return prompt;
  }

  /**
   * 새로운 기능 개발을 위한 컨텍스트 생성
   */
  generateFeatureDevelopmentContext(
    context: ProjectContext,
    featureDescription: string,
    relatedFiles?: string[]
  ): string {
    let prompt = `# 새 기능 개발 컨텍스트\n\n`;
    
    prompt += `## 🎯 요청된 기능\n`;
    prompt += `${featureDescription}\n\n`;

    prompt += `## 🏗️ 현재 프로젝트 구조\n`;
    prompt += `이 프로젝트는 ${context.type} 타입이며, ${context.architecture} 아키텍처를 사용합니다.\n\n`;

    prompt += `### 사용 중인 기술 스택\n`;
    context.frameworks.forEach(framework => {
      prompt += `- ${framework}\n`;
    });
    prompt += '\n';

    prompt += `### 적용된 설계 패턴\n`;
    context.patterns.forEach(pattern => {
      prompt += `- ${pattern}\n`;
    });
    prompt += '\n';

    if (relatedFiles && relatedFiles.length > 0) {
      prompt += `### 📁 관련 파일들\n`;
      relatedFiles.forEach(file => {
        prompt += `- ${file}\n`;
      });
      prompt += '\n';
    }

    prompt += `### 📐 코딩 컨벤션\n`;
    prompt += `이 프로젝트에서는 다음과 같은 컨벤션을 따릅니다:\n`;
    prompt += `- 파일 명명: ${this.getFileNamingConvention(context)}\n`;
    prompt += `- 컴포넌트 구조: ${this.getComponentStructure(context)}\n`;
    prompt += `- 상태 관리: ${this.getStateManagementPattern(context)}\n\n`;

    prompt += `## 🎨 구현 가이드라인\n`;
    prompt += `새로운 기능을 구현할 때 다음 사항들을 고려해주세요:\n\n`;

    prompt += `1. **기존 패턴 준수**: 현재 사용 중인 ${context.patterns.join(', ')} 패턴을 따라주세요.\n`;
    prompt += `2. **의존성 최소화**: 새로운 외부 의존성 추가를 최소화해주세요.\n`;
    prompt += `3. **테스트 작성**: 새로운 기능에 대한 테스트 코드를 포함해주세요.\n`;
    prompt += `4. **에러 처리**: 적절한 에러 처리 로직을 포함해주세요.\n`;
    prompt += `5. **성능 고려**: 기존 시스템의 성능에 영향을 주지 않도록 해주세요.\n\n`;

    if (context.apiEndpoints.length > 0) {
      prompt += `## 🌐 기존 API 패턴\n`;
      prompt += `현재 프로젝트에서 사용 중인 API 패턴:\n`;
      const apiPatterns = this.analyzeAPIPatterns(context.apiEndpoints);
      apiPatterns.forEach(pattern => {
        prompt += `- ${pattern}\n`;
      });
      prompt += '\n';
    }

    return prompt;
  }

  /**
   * 버그 수정을 위한 컨텍스트 생성
   */
  generateBugFixContext(
    context: ProjectContext,
    analysis: WorkflowAnalysis,
    bugDescription: string,
    affectedFiles?: string[]
  ): string {
    let prompt = `# 버그 수정 컨텍스트\n\n`;
    
    prompt += `## 🐛 버그 설명\n`;
    prompt += `${bugDescription}\n\n`;

    if (affectedFiles && affectedFiles.length > 0) {
      prompt += `## 📁 관련 파일들\n`;
      affectedFiles.forEach(file => {
        prompt += `- ${file}\n`;
      });
      prompt += '\n';
    }

    prompt += `## 🔍 관련 오류 및 경고\n`;
    const relatedErrors = analysis.errors.filter(error => 
      !affectedFiles || affectedFiles.some(file => error.message.includes(file))
    );
    
    if (relatedErrors.length > 0) {
      relatedErrors.forEach((error, index) => {
        prompt += `${index + 1}. **${error.type}**: ${error.message}\n`;
        if (error.suggestion) {
          prompt += `   💡 제안: ${error.suggestion}\n`;
        }
      });
    } else {
      prompt += `현재 분석된 오류 중 직접적으로 관련된 것이 없습니다.\n`;
    }
    prompt += '\n';

    prompt += `## 🏗️ 프로젝트 컨텍스트\n`;
    prompt += `- 아키텍처: ${context.architecture}\n`;
    prompt += `- 주요 프레임워크: ${context.frameworks.join(', ')}\n`;
    prompt += `- 설계 패턴: ${context.patterns.join(', ')}\n\n`;

    return prompt;
  }

  // Private helper methods

  private detectProjectType(nodes: Node[]): string {
    const nodeTypes = nodes.map(node => node.type);
    
    if (nodeTypes.includes('api') && nodeTypes.includes('websocket')) {
      return 'full-stack-web-application';
    } else if (nodeTypes.includes('api')) {
      return 'web-api';
    } else if (nodeTypes.includes('component')) {
      return 'frontend-application';
    } else {
      return 'general-application';
    }
  }

  private detectArchitecture(nodes: Node[], edges: Edge[]): string {
    const hasLayers = this.hasLayeredArchitecture(nodes);
    const hasMicroservices = this.hasMicroservicePattern(nodes);
    const hasComponents = nodes.some(node => node.type === 'component');
    
    if (hasMicroservices) return 'microservices';
    if (hasLayers) return 'layered-architecture';
    if (hasComponents) return 'component-based';
    return 'modular-monolith';
  }

  private extractFrameworks(nodes: Node[]): string[] {
    const frameworks = new Set<string>();
    
    // Node.js에서 일반적으로 사용되는 프레임워크들 감지
    nodes.forEach(node => {
      if (node.data.imports) {
        node.data.imports.forEach(imp => {
          if (imp.includes('react')) frameworks.add('React');
          if (imp.includes('express')) frameworks.add('Express');
          if (imp.includes('fastify')) frameworks.add('Fastify');
          if (imp.includes('next')) frameworks.add('Next.js');
          if (imp.includes('vue')) frameworks.add('Vue.js');
          if (imp.includes('angular')) frameworks.add('Angular');
          if (imp.includes('socket.io')) frameworks.add('Socket.IO');
          if (imp.includes('graphql')) frameworks.add('GraphQL');
        });
      }
    });
    
    return Array.from(frameworks);
  }

  private detectPatterns(nodes: Node[], edges: Edge[]): string[] {
    const patterns = new Set<string>();
    
    // 상태 관리 패턴
    if (nodes.some(node => node.type === 'store')) {
      patterns.add('State Management Pattern');
    }
    
    // Observer 패턴 (이벤트 기반)
    if (edges.some(edge => edge.type === 'websocket')) {
      patterns.add('Observer Pattern');
    }
    
    // Service Layer 패턴
    if (nodes.some(node => node.type === 'service')) {
      patterns.add('Service Layer Pattern');
    }
    
    // Component 패턴
    if (nodes.some(node => node.type === 'component')) {
      patterns.add('Component Pattern');
    }
    
    return Array.from(patterns);
  }

  private analyzeFileStructure(nodes: Node[]): FileStructureInfo {
    const fileTypes: Record<string, number> = {};
    const directories = new Set<string>();
    const keyFiles: Array<{ path: string; purpose: string; importance: 'high' | 'medium' | 'low' }> = [];
    
    nodes.forEach(node => {
      if (node.data.path) {
        const ext = node.data.path.substring(node.data.path.lastIndexOf('.'));
        fileTypes[ext] = (fileTypes[ext] || 0) + 1;
        
        const dir = node.data.path.substring(0, node.data.path.lastIndexOf('/'));
        if (dir) directories.add(dir);
        
        // 핵심 파일 식별
        if (node.data.path.includes('App.') || node.data.path.includes('index.')) {
          keyFiles.push({
            path: node.data.path,
            purpose: 'Application entry point',
            importance: 'high'
          });
        } else if (node.type === 'store') {
          keyFiles.push({
            path: node.data.path,
            purpose: 'State management',
            importance: 'high'
          });
        }
      }
    });
    
    return {
      totalFiles: nodes.length,
      fileTypes,
      directories: Array.from(directories),
      keyFiles
    };
  }

  private analyzeDependencies(edges: Edge[]): DependencyInfo {
    const internal = edges.map(edge => ({
      from: edge.source,
      to: edge.target,
      type: edge.type
    }));
    
    return {
      external: {}, // 외부 의존성은 별도 분석 필요
      internal,
      circular: [] // 순환 의존성은 별도 분석 필요
    };
  }

  private extractAPIEndpoints(nodes: Node[]): APIEndpointInfo[] {
    return nodes
      .filter(node => node.type === 'api')
      .map(node => ({
        method: 'GET', // 실제로는 노드 데이터에서 추출
        path: node.data.path || '/',
        handler: node.data.name,
        status: 'implemented' as const
      }));
  }

  private calculateMetrics(analysis: WorkflowAnalysis): ProjectMetrics {
    return {
      complexity: analysis.metrics.complexity,
      maintainability: 80, // 계산 로직 필요
      testCoverage: 0, // 별도 분석 필요
      codeQuality: 75, // 계산 로직 필요
      technicalDebt: analysis.errors.length * 10 // 간단한 계산
    };
  }

  private buildAIContext(context: ProjectContext): AIContext {
    return {
      projectType: context.type,
      architecture: context.architecture,
      mainFrameworks: context.frameworks,
      patterns: context.patterns,
      conventions: {
        naming: this.getFileNamingConvention(context),
        fileStructure: 'feature-based',
        stateManagement: this.getStateManagementPattern(context),
        styling: 'CSS modules'
      },
      dependencies: {
        ui: context.frameworks.filter(f => ['React', 'Vue.js', 'Angular'].includes(f)),
        backend: context.frameworks.filter(f => ['Express', 'Fastify'].includes(f)),
        database: [],
        utils: []
      }
    };
  }

  private generateSuggestions(
    context: ProjectContext,
    analysis: WorkflowAnalysis,
    userIntent: string
  ): string[] {
    const suggestions: string[] = [];
    
    // 컨텍스트 기반 제안
    if (context.metrics.complexity === 'high') {
      suggestions.push('복잡도가 높으므로 리팩토링을 고려해보세요');
    }
    
    if (context.dependencies.circular.length > 0) {
      suggestions.push('순환 의존성을 해결하여 코드 구조를 개선하세요');
    }
    
    // 사용자 의도 기반 제안
    if (userIntent.includes('성능')) {
      suggestions.push('성능 최적화를 위해 번들 크기와 로딩 시간을 확인하세요');
    }
    
    if (userIntent.includes('테스트')) {
      suggestions.push('테스트 커버리지를 높이고 E2E 테스트를 추가하세요');
    }
    
    return suggestions;
  }

  private hasLayeredArchitecture(nodes: Node[]): boolean {
    const layers = ['controller', 'service', 'repository', 'model'];
    return layers.some(layer => 
      nodes.some(node => node.data.path?.includes(layer))
    );
  }

  private hasMicroservicePattern(nodes: Node[]): boolean {
    // 서비스 노드가 여러 개 있고 각각 독립적인 API를 가지는지 확인
    const serviceNodes = nodes.filter(node => node.type === 'service');
    return serviceNodes.length > 3;
  }

  private getFileNamingConvention(context: ProjectContext): string {
    if (context.frameworks.includes('React')) {
      return 'PascalCase for components, camelCase for utilities';
    }
    return 'camelCase';
  }

  private getComponentStructure(context: ProjectContext): string {
    if (context.frameworks.includes('React')) {
      return 'Functional components with hooks';
    }
    return 'Module-based structure';
  }

  private getStateManagementPattern(context: ProjectContext): string {
    if (context.frameworks.includes('React')) {
      return 'Context API or Redux/Zustand';
    }
    return 'Local state management';
  }

  private analyzeAPIPatterns(endpoints: APIEndpointInfo[]): string[] {
    const patterns: string[] = [];
    
    const restPattern = endpoints.every(ep => 
      ['GET', 'POST', 'PUT', 'DELETE'].includes(ep.method)
    );
    
    if (restPattern) {
      patterns.push('RESTful API design');
    }
    
    return patterns;
  }
}