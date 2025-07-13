// 파일 의존성 분석 유틸리티
export interface FileDependency {
  file: string;
  imports: string[];
  exports: string[];
  dependencies: string[];
}

export interface DependencyGraph {
  files: FileDependency[];
  connections: { from: string; to: string; type: string }[];
  duplicates: { pattern: string; files: string[] }[];
  cycles: string[][];
}

export class DependencyAnalyzer {
  // JavaScript/TypeScript import 패턴 분석
  private analyzeJSImports(content: string, fileName: string): string[] {
    const imports: string[] = [];
    
    // ES6 imports
    const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    // CommonJS requires
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    // Dynamic imports
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports.filter(imp => 
      // 상대 경로만 (프로젝트 내부 파일)
      imp.startsWith('./') || imp.startsWith('../') || imp.startsWith('/')
    );
  }

  // JavaScript/TypeScript export 패턴 분석
  private analyzeJSExports(content: string): string[] {
    const exports: string[] = [];
    
    // Named exports
    const namedExportRegex = /export\s+(?:const|let|var|function|class|interface|type)\s+(\w+)/g;
    let match;
    while ((match = namedExportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    // Export blocks
    const exportBlockRegex = /export\s*{([^}]+)}/g;
    while ((match = exportBlockRegex.exec(content)) !== null) {
      const exportItems = match[1].split(',').map(item => item.trim().split(' as ')[0]);
      exports.push(...exportItems);
    }
    
    // Default export
    if (/export\s+default/.test(content)) {
      exports.push('default');
    }
    
    return exports;
  }

  // Python import 패턴 분석
  private analyzePythonImports(content: string): string[] {
    const imports: string[] = [];
    
    // from ... import ...
    const fromImportRegex = /from\s+([.\w]+)\s+import/g;
    let match;
    while ((match = fromImportRegex.exec(content)) !== null) {
      if (match[1].startsWith('.')) { // 상대 import만
        imports.push(match[1]);
      }
    }
    
    // import ...
    const importRegex = /^import\s+([.\w]+)/gm;
    while ((match = importRegex.exec(content)) !== null) {
      if (match[1].startsWith('.')) { // 상대 import만
        imports.push(match[1]);
      }
    }
    
    return imports;
  }

  // 파일 내용 분석
  public analyzeFile(fileName: string, content: string): FileDependency {
    const extension = fileName.split('.').pop()?.toLowerCase();
    let imports: string[] = [];
    let exports: string[] = [];
    
    switch (extension) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        imports = this.analyzeJSImports(content, fileName);
        exports = this.analyzeJSExports(content);
        break;
      case 'py':
        imports = this.analyzePythonImports(content);
        // Python exports는 간단히 함수/클래스 정의로 분석
        const pyExportRegex = /^(?:def|class)\s+(\w+)/gm;
        let match;
        while ((match = pyExportRegex.exec(content)) !== null) {
          exports.push(match[1]);
        }
        break;
    }
    
    return {
      file: fileName,
      imports,
      exports,
      dependencies: imports
    };
  }

  // 중복 코드 패턴 검출
  public findDuplicatePatterns(files: { name: string; content: string }[]): { pattern: string; files: string[] }[] {
    const duplicates: { pattern: string; files: string[] }[] = [];
    const patterns = new Map<string, string[]>();
    
    files.forEach(file => {
      // 함수 정의 패턴 추출
      const functionRegex = /function\s+\w+\s*\([^)]*\)\s*{[^}]{20,}}/g;
      let match;
      while ((match = functionRegex.exec(file.content)) !== null) {
        const pattern = match[0].replace(/\s+/g, ' ').trim();
        if (pattern.length > 50) { // 충분히 긴 패턴만
          if (!patterns.has(pattern)) {
            patterns.set(pattern, []);
          }
          patterns.get(pattern)!.push(file.name);
        }
      }
      
      // 클래스 정의 패턴
      const classRegex = /class\s+\w+[^{]*{[^}]{30,}}/g;
      while ((match = classRegex.exec(file.content)) !== null) {
        const pattern = match[0].replace(/\s+/g, ' ').trim();
        if (pattern.length > 50) {
          if (!patterns.has(pattern)) {
            patterns.set(pattern, []);
          }
          patterns.get(pattern)!.push(file.name);
        }
      }
    });
    
    // 중복 패턴만 필터링
    patterns.forEach((filesList, pattern) => {
      if (filesList.length > 1) {
        duplicates.push({
          pattern: pattern.substring(0, 100) + '...', // 패턴 길이 제한
          files: [...new Set(filesList)] // 중복 제거
        });
      }
    });
    
    return duplicates;
  }

  // 순환 의존성 검출
  public findCycles(dependencies: FileDependency[]): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const dfs = (file: string, path: string[]): void => {
      visited.add(file);
      recursionStack.add(file);
      
      const fileDep = dependencies.find(d => d.file === file);
      if (fileDep) {
        for (const dep of fileDep.dependencies) {
          if (!visited.has(dep)) {
            dfs(dep, [...path, file]);
          } else if (recursionStack.has(dep)) {
            // 순환 의존성 발견
            const cycleStart = path.indexOf(dep);
            if (cycleStart !== -1) {
              cycles.push([...path.slice(cycleStart), file, dep]);
            }
          }
        }
      }
      
      recursionStack.delete(file);
    };
    
    for (const dep of dependencies) {
      if (!visited.has(dep.file)) {
        dfs(dep.file, []);
      }
    }
    
    return cycles;
  }

  // 전체 의존성 그래프 생성
  public createDependencyGraph(files: { name: string; content: string }[]): DependencyGraph {
    const fileDependencies = files.map(file => this.analyzeFile(file.name, file.content));
    
    const connections: { from: string; to: string; type: string }[] = [];
    fileDependencies.forEach(fileDep => {
      fileDep.dependencies.forEach(dep => {
        connections.push({
          from: fileDep.file,
          to: dep,
          type: 'import'
        });
      });
    });
    
    const duplicates = this.findDuplicatePatterns(files);
    const cycles = this.findCycles(fileDependencies);
    
    return {
      files: fileDependencies,
      connections,
      duplicates,
      cycles
    };
  }
}