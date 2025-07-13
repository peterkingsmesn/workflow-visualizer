import { BaseAnalyzer, AnalysisResult } from './BaseAnalyzer';
import { GraphQLSchema, GraphQLResolver, GraphQLType } from '../../types/workflow.types';

export interface GraphQLAnalysis extends AnalysisResult {
  schemas: GraphQLSchema[];
  resolvers: GraphQLResolver[];
  types: GraphQLType[];
  queries: string[];
  mutations: string[];
  subscriptions: string[];
}

export class GraphQLAnalyzer extends BaseAnalyzer {
  async analyze(filePaths: string[]): Promise<GraphQLAnalysis> {
    const analysis: GraphQLAnalysis = {
      schemas: [],
      resolvers: [],
      types: [],
      queries: [],
      mutations: [],
      subscriptions: [],
      errors: [],
      warnings: [],
      metadata: {}
    };

    for (const filePath of filePaths) {
      try {
        const content = await this.readFile(filePath);
        const fileAnalysis = this.analyzeFile(content, filePath);
        
        analysis.schemas.push(...fileAnalysis.schemas);
        analysis.resolvers.push(...fileAnalysis.resolvers);
        analysis.types.push(...fileAnalysis.types);
        analysis.queries.push(...fileAnalysis.queries);
        analysis.mutations.push(...fileAnalysis.mutations);
        analysis.subscriptions.push(...fileAnalysis.subscriptions);
      } catch (error) {
        analysis.errors.push(`Failed to analyze ${filePath}: ${error}`);
      }
    }

    return analysis;
  }

  private analyzeFile(content: string, filePath: string): GraphQLAnalysis {
    const analysis: GraphQLAnalysis = {
      schemas: [],
      resolvers: [],
      types: [],
      queries: [],
      mutations: [],
      subscriptions: [],
      errors: [],
      warnings: [],
      metadata: {}
    };

    // GraphQL 스키마 파일 분석
    if (filePath.endsWith('.graphql') || filePath.endsWith('.gql')) {
      this.analyzeGraphQLSchema(content, filePath, analysis);
    }

    // JavaScript/TypeScript 파일에서 GraphQL 분석
    this.analyzeGraphQLInCode(content, filePath, analysis);

    return analysis;
  }

  private analyzeGraphQLSchema(content: string, filePath: string, analysis: GraphQLAnalysis): void {
    // Type 정의 분석
    const typePattern = /type\s+(\w+)\s*{([^}]*)}/g;
    let match;
    while ((match = typePattern.exec(content)) !== null) {
      const typeName = match[1];
      const fields = this.parseFields(match[2]);
      
      analysis.types.push({
        id: `${filePath}-type-${typeName}`,
        name: typeName,
        kind: 'OBJECT',
        fields,
        filePath,
        line: this.getLineNumber(content, match.index)
      });
    }

    // Query 정의 분석
    const queryPattern = /type\s+Query\s*{([^}]*)}/g;
    while ((match = queryPattern.exec(content)) !== null) {
      const queries = this.parseQueries(match[1]);
      analysis.queries.push(...queries);
    }

    // Mutation 정의 분석
    const mutationPattern = /type\s+Mutation\s*{([^}]*)}/g;
    while ((match = mutationPattern.exec(content)) !== null) {
      const mutations = this.parseMutations(match[1]);
      analysis.mutations.push(...mutations);
    }

    // Subscription 정의 분석
    const subscriptionPattern = /type\s+Subscription\s*{([^}]*)}/g;
    while ((match = subscriptionPattern.exec(content)) !== null) {
      const subscriptions = this.parseSubscriptions(match[1]);
      analysis.subscriptions.push(...subscriptions);
    }

    // Interface 분석
    const interfacePattern = /interface\s+(\w+)\s*{([^}]*)}/g;
    while ((match = interfacePattern.exec(content)) !== null) {
      const interfaceName = match[1];
      const fields = this.parseFields(match[2]);
      
      analysis.types.push({
        id: `${filePath}-interface-${interfaceName}`,
        name: interfaceName,
        kind: 'INTERFACE',
        fields,
        filePath,
        line: this.getLineNumber(content, match.index)
      });
    }

    // Union 분석
    const unionPattern = /union\s+(\w+)\s*=\s*([^;\n]+)/g;
    while ((match = unionPattern.exec(content)) !== null) {
      const unionName = match[1];
      const unionTypes = match[2].split('|').map(t => t.trim());
      
      analysis.types.push({
        id: `${filePath}-union-${unionName}`,
        name: unionName,
        kind: 'UNION',
        possibleTypes: unionTypes,
        filePath,
        line: this.getLineNumber(content, match.index)
      });
    }

    // Enum 분석
    const enumPattern = /enum\s+(\w+)\s*{([^}]*)}/g;
    while ((match = enumPattern.exec(content)) !== null) {
      const enumName = match[1];
      const enumValues = match[2].split(/[,\n]/).map(v => v.trim()).filter(Boolean);
      
      analysis.types.push({
        id: `${filePath}-enum-${enumName}`,
        name: enumName,
        kind: 'ENUM',
        enumValues,
        filePath,
        line: this.getLineNumber(content, match.index)
      });
    }
  }

  private analyzeGraphQLInCode(content: string, filePath: string, analysis: GraphQLAnalysis): void {
    // Apollo Server 분석
    const apolloServerPattern = /new\s+ApolloServer\s*\({([^}]*)}\)/g;
    let match;
    while ((match = apolloServerPattern.exec(content)) !== null) {
      analysis.schemas.push({
        id: `${filePath}-apollo-${match.index}`,
        name: 'ApolloServer',
        filePath,
        line: this.getLineNumber(content, match.index)
      });
    }

    // GraphQL 태그 분석
    const gqlTagPattern = /gql`([^`]*)`/g;
    while ((match = gqlTagPattern.exec(content)) !== null) {
      const gqlContent = match[1];
      this.analyzeGraphQLInTemplate(gqlContent, filePath, analysis, match.index);
    }

    // Resolver 함수 분석
    const resolverPattern = /const\s+(\w+)\s*=\s*{[^}]*(?:Query|Mutation|Subscription)[^}]*}/g;
    while ((match = resolverPattern.exec(content)) !== null) {
      analysis.resolvers.push({
        id: `${filePath}-resolver-${match[1]}`,
        name: match[1],
        filePath,
        line: this.getLineNumber(content, match.index)
      });
    }

    // useQuery, useMutation 훅 분석 (Apollo Client)
    const hookPattern = /use(?:Query|Mutation|Subscription)\s*\(\s*([^,)]+)/g;
    while ((match = hookPattern.exec(content)) !== null) {
      const hookType = match[0].includes('Query') ? 'query' : 
                      match[0].includes('Mutation') ? 'mutation' : 'subscription';
      
      if (hookType === 'query') {
        analysis.queries.push(match[1].trim());
      } else if (hookType === 'mutation') {
        analysis.mutations.push(match[1].trim());
      } else {
        analysis.subscriptions.push(match[1].trim());
      }
    }
  }

  private analyzeGraphQLInTemplate(gqlContent: string, filePath: string, analysis: GraphQLAnalysis, offset: number): void {
    // Query 분석
    const queryMatch = gqlContent.match(/query\s+(\w+)?/);
    if (queryMatch) {
      analysis.queries.push(queryMatch[1] || 'anonymous');
    }

    // Mutation 분석
    const mutationMatch = gqlContent.match(/mutation\s+(\w+)?/);
    if (mutationMatch) {
      analysis.mutations.push(mutationMatch[1] || 'anonymous');
    }

    // Subscription 분석
    const subscriptionMatch = gqlContent.match(/subscription\s+(\w+)?/);
    if (subscriptionMatch) {
      analysis.subscriptions.push(subscriptionMatch[1] || 'anonymous');
    }
  }

  private parseFields(fieldsStr: string): Array<{ name: string; type: string; args?: any[] }> {
    const fields: Array<{ name: string; type: string; args?: any[] }> = [];
    const fieldPattern = /(\w+)(?:\([^)]*\))?\s*:\s*([^,\n]+)/g;
    
    let match;
    while ((match = fieldPattern.exec(fieldsStr)) !== null) {
      fields.push({
        name: match[1],
        type: match[2].trim()
      });
    }
    
    return fields;
  }

  private parseQueries(queryStr: string): string[] {
    const queries: string[] = [];
    const queryPattern = /(\w+)(?:\([^)]*\))?\s*:\s*[^,\n]+/g;
    
    let match;
    while ((match = queryPattern.exec(queryStr)) !== null) {
      queries.push(match[1]);
    }
    
    return queries;
  }

  private parseMutations(mutationStr: string): string[] {
    const mutations: string[] = [];
    const mutationPattern = /(\w+)(?:\([^)]*\))?\s*:\s*[^,\n]+/g;
    
    let match;
    while ((match = mutationPattern.exec(mutationStr)) !== null) {
      mutations.push(match[1]);
    }
    
    return mutations;
  }

  private parseSubscriptions(subscriptionStr: string): string[] {
    const subscriptions: string[] = [];
    const subscriptionPattern = /(\w+)(?:\([^)]*\))?\s*:\s*[^,\n]+/g;
    
    let match;
    while ((match = subscriptionPattern.exec(subscriptionStr)) !== null) {
      subscriptions.push(match[1]);
    }
    
    return subscriptions;
  }

  /**
   * 스키마 일관성 검사
   */
  validateSchemaConsistency(analysis: GraphQLAnalysis): string[] {
    const issues: string[] = [];

    // 타입 참조 검사
    analysis.types.forEach(type => {
      if (type.fields) {
        type.fields.forEach(field => {
          const fieldType = field.type.replace(/[!\[\]]/g, '');
          const typeExists = analysis.types.some(t => t.name === fieldType) || 
                           this.isBuiltinType(fieldType);
          
          if (!typeExists) {
            issues.push(`Undefined type '${fieldType}' in ${type.name}.${field.name}`);
          }
        });
      }
    });

    // Resolver 매칭 검사
    analysis.queries.forEach(query => {
      const hasResolver = analysis.resolvers.some(r => 
        r.name.includes('Query') || r.name.includes(query)
      );
      if (!hasResolver) {
        issues.push(`Missing resolver for query: ${query}`);
      }
    });

    return issues;
  }

  /**
   * 성능 분석
   */
  analyzePerformance(analysis: GraphQLAnalysis): {
    complexQueries: string[];
    deepNesting: string[];
    suggestions: string[];
  } {
    return {
      complexQueries: [],
      deepNesting: [],
      suggestions: [
        'Consider using DataLoader for N+1 query prevention',
        'Implement query depth limiting',
        'Add query complexity analysis'
      ]
    };
  }

  private isBuiltinType(type: string): boolean {
    const builtinTypes = ['String', 'Int', 'Float', 'Boolean', 'ID', 'Date', 'DateTime'];
    return builtinTypes.includes(type);
  }

  protected getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }
}