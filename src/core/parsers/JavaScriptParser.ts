import * as fs from 'fs/promises';
import * as path from 'path';

export interface ParseResult {
  imports: string[];
  exports: string[];
  functions: FunctionInfo[];
  classes: ClassInfo[];
  variables: VariableInfo[];
}

interface FunctionInfo {
  name: string;
  params: string[];
  async: boolean;
  line: number;
}

interface ClassInfo {
  name: string;
  methods: string[];
  line: number;
}

interface VariableInfo {
  name: string;
  type: 'const' | 'let' | 'var';
  exported: boolean;
  line: number;
}

export class JavaScriptParser {
  async parse(filePath: string): Promise<ParseResult> {
    const content = await fs.readFile(filePath, 'utf-8');
    
    const result: ParseResult = {
      imports: [],
      exports: [],
      functions: [],
      classes: [],
      variables: []
    };

    // Parse imports
    result.imports = this.parseImports(content);
    
    // Parse exports
    result.exports = this.parseExports(content);
    
    // Parse functions
    result.functions = this.parseFunctions(content);
    
    // Parse classes
    result.classes = this.parseClasses(content);
    
    // Parse variables
    result.variables = this.parseVariables(content);

    return result;
  }

  protected parseImports(content: string): string[] {
    const imports: string[] = [];
    
    // ES6 imports
    const es6ImportRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = es6ImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    // CommonJS requires
    const requireRegex = /require\s*\(['"]([^'"]+)['"]\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    // Dynamic imports
    const dynamicImportRegex = /import\s*\(['"]([^'"]+)['"]\)/g;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return [...new Set(imports)]; // Remove duplicates
  }

  protected parseExports(content: string): string[] {
    const exports: string[] = [];
    
    // Named exports
    const namedExportRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
    let match;
    while ((match = namedExportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    // Export statements
    const exportStmtRegex = /export\s*\{([^}]+)\}/g;
    while ((match = exportStmtRegex.exec(content)) !== null) {
      const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0]);
      exports.push(...names);
    }
    
    // Default export
    if (/export\s+default\s+/.test(content)) {
      exports.push('default');
    }
    
    // CommonJS exports
    const commonJsRegex = /module\.exports\s*=\s*\{([^}]+)\}/g;
    while ((match = commonJsRegex.exec(content)) !== null) {
      const names = match[1].split(',').map(n => n.trim().split(':')[0]);
      exports.push(...names);
    }
    
    return [...new Set(exports)];
  }

  private parseFunctions(content: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    const lines = content.split('\n');
    
    // Function declarations
    const funcDeclRegex = /(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g;
    let match;
    while ((match = funcDeclRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      functions.push({
        name: match[1],
        params: match[2] ? match[2].split(',').map(p => p.trim()) : [],
        async: match[0].startsWith('async'),
        line: lineNumber
      });
    }
    
    // Arrow functions
    const arrowFuncRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g;
    while ((match = arrowFuncRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      functions.push({
        name: match[1],
        params: [], // Simplified for now
        async: match[0].includes('async'),
        line: lineNumber
      });
    }
    
    return functions;
  }

  private parseClasses(content: string): ClassInfo[] {
    const classes: ClassInfo[] = [];
    
    const classRegex = /class\s+(\w+)(?:\s+extends\s+\w+)?\s*\{/g;
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const className = match[1];
      
      // Find class body and extract methods
      const classStart = match.index + match[0].length;
      const classBody = this.extractClassBody(content, classStart);
      const methods = this.extractClassMethods(classBody);
      
      classes.push({
        name: className,
        methods,
        line: lineNumber
      });
    }
    
    return classes;
  }

  private parseVariables(content: string): VariableInfo[] {
    const variables: VariableInfo[] = [];
    
    const varRegex = /(const|let|var)\s+(\w+)/g;
    let match;
    while ((match = varRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const isExported = content.substring(Math.max(0, match.index - 20), match.index).includes('export');
      
      variables.push({
        name: match[2],
        type: match[1] as 'const' | 'let' | 'var',
        exported: isExported,
        line: lineNumber
      });
    }
    
    return variables;
  }

  private extractClassBody(content: string, startIndex: number): string {
    let braceCount = 1;
    let i = startIndex;
    
    while (i < content.length && braceCount > 0) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') braceCount--;
      i++;
    }
    
    return content.substring(startIndex, i - 1);
  }

  private extractClassMethods(classBody: string): string[] {
    const methods: string[] = [];
    const methodRegex = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/g;
    let match;
    
    while ((match = methodRegex.exec(classBody)) !== null) {
      if (match[1] !== 'constructor') {
        methods.push(match[1]);
      }
    }
    
    return methods;
  }
}