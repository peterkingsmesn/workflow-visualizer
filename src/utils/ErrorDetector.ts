// 실제 코드 오류 및 문제점 검출 시스템
export interface CodeError {
  file: string;
  line?: number;
  type: 'syntax' | 'import' | 'api' | 'performance' | 'security' | 'unused' | 'circular';
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  code?: string;
}

export interface ProjectHealth {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByFile: Record<string, CodeError[]>;
  healthScore: number; // 0-100
  criticalIssues: CodeError[];
}

export class ErrorDetector {
  
  // JavaScript/TypeScript 문법 오류 검출
  private detectSyntaxErrors(fileName: string, content: string): CodeError[] {
    const errors: CodeError[] = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // 기본적인 문법 오류 패턴들
      const syntaxPatterns = [
        {
          pattern: /\)\s*{[^}]*$/m, // 닫히지 않은 중괄호
          message: '닫히지 않은 중괄호',
          type: 'syntax' as const
        },
        {
          pattern: /\([^)]*$/m, // 닫히지 않은 괄호
          message: '닫히지 않은 괄호',
          type: 'syntax' as const
        },
        {
          pattern: /console\.log\(/g, // console.log 남용
          message: 'console.log가 프로덕션 코드에 남아있음',
          type: 'performance' as const
        },
        {
          pattern: /var\s+/g, // var 사용
          message: 'var 대신 let/const 사용 권장',
          type: 'warning' as const
        }
      ];
      
      syntaxPatterns.forEach(({ pattern, message, type }) => {
        if (pattern.test(line)) {
          errors.push({
            file: fileName,
            line: lineNum,
            type: type as any,
            severity: type === 'syntax' ? 'error' : 'warning',
            message,
            code: line.trim()
          });
        }
      });
    });
    
    return errors;
  }

  // Import/Export 오류 검출
  private detectImportErrors(fileName: string, content: string, allFiles: string[]): CodeError[] {
    const errors: CodeError[] = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // 상대 경로 import 분석
      const importMatch = line.match(/import.*from\s+['"]([^'"]+)['"]/);
      if (importMatch) {
        const importPath = importMatch[1];
        
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
          // 파일 존재 여부 확인 (간단한 검증)
          const isLikelyMissing = !allFiles.some(file => 
            file.includes(importPath.replace('./', '').replace('../', ''))
          );
          
          if (isLikelyMissing) {
            errors.push({
              file: fileName,
              line: lineNum,
              type: 'import',
              severity: 'error',
              message: `Import 파일을 찾을 수 없음: ${importPath}`,
              suggestion: '파일 경로를 확인하거나 누락된 파일을 추가하세요',
              code: line.trim()
            });
          }
        }
      }

      // 사용되지 않는 import 검출
      const importVarMatch = line.match(/import\s+\{([^}]+)\}|import\s+(\w+)/);
      if (importVarMatch) {
        const importedVars = importVarMatch[1] 
          ? importVarMatch[1].split(',').map(v => v.trim())
          : [importVarMatch[2]];
          
        importedVars.forEach(varName => {
          if (varName && !content.includes(varName.split(' as ')[0])) {
            errors.push({
              file: fileName,
              line: lineNum,
              type: 'unused',
              severity: 'warning',
              message: `사용되지 않는 import: ${varName}`,
              suggestion: '사용하지 않는 import를 제거하세요',
              code: line.trim()
            });
          }
        });
      }
    });
    
    return errors;
  }

  // API 관련 오류 검출
  private detectAPIErrors(fileName: string, content: string): CodeError[] {
    const errors: CodeError[] = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // API 호출 패턴 분석
      const apiPatterns = [
        {
          pattern: /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g,
          type: 'fetch'
        },
        {
          pattern: /axios\.(get|post|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g,
          type: 'axios'
        },
        {
          pattern: /\$\.ajax\s*\(\s*{[^}]*url\s*:\s*['"`]([^'"`]+)['"`]/g,
          type: 'jquery'
        }
      ];
      
      apiPatterns.forEach(({ pattern, type }) => {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const url = match[1] || match[2];
          
          // 하드코딩된 URL 검출
          if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
            errors.push({
              file: fileName,
              line: lineNum,
              type: 'api',
              severity: 'warning',
              message: `하드코딩된 API URL: ${url}`,
              suggestion: '환경변수나 설정 파일에서 URL을 관리하세요',
              code: line.trim()
            });
          }
          
          // 에러 핸들링 없는 API 호출
          if (!content.includes('.catch') && !content.includes('try')) {
            errors.push({
              file: fileName,
              line: lineNum,
              type: 'api',
              severity: 'warning',
              message: 'API 호출에 에러 핸들링이 없음',
              suggestion: 'try-catch 또는 .catch()를 추가하세요',
              code: line.trim()
            });
          }
        }
      });
    });
    
    return errors;
  }

  // 성능 문제 검출
  private detectPerformanceIssues(fileName: string, content: string): CodeError[] {
    const errors: CodeError[] = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // 성능 문제 패턴들
      const performancePatterns = [
        {
          pattern: /for\s*\([^)]*\)\s*{[^}]*for\s*\([^)]*\)/g, // 중첩 루프
          message: '중첩된 for 루프 (O(n²) 복잡도)',
          suggestion: '알고리즘을 최적화하거나 Map/Set 사용 고려'
        },
        {
          pattern: /setInterval|setTimeout.*1\d{2,}/g, // 짧은 interval
          message: '너무 짧은 타이머 간격',
          suggestion: '타이머 간격을 늘리거나 requestAnimationFrame 사용'
        },
        {
          pattern: /\.innerHTML\s*=/g, // innerHTML 사용
          message: 'innerHTML 사용으로 인한 성능 이슈',
          suggestion: 'textContent 또는 DOM API 직접 사용'
        },
        {
          pattern: /document\.createElement.*appendChild/g, // DOM 조작
          message: 'DOM 직접 조작',
          suggestion: 'DocumentFragment 또는 가상 DOM 사용'
        }
      ];
      
      performancePatterns.forEach(({ pattern, message, suggestion }) => {
        if (pattern.test(line)) {
          errors.push({
            file: fileName,
            line: lineNum,
            type: 'performance',
            severity: 'warning',
            message,
            suggestion,
            code: line.trim()
          });
        }
      });
    });
    
    return errors;
  }

  // 보안 취약점 검출
  private detectSecurityIssues(fileName: string, content: string): CodeError[] {
    const errors: CodeError[] = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // 보안 취약점 패턴들
      const securityPatterns = [
        {
          pattern: /password\s*[:=]\s*['"`][^'"`]+['"`]/gi,
          message: '하드코딩된 비밀번호 발견',
          severity: 'error' as const
        },
        {
          pattern: /api[_-]?key\s*[:=]\s*['"`][^'"`]+['"`]/gi,
          message: '하드코딩된 API 키 발견',
          severity: 'error' as const
        },
        {
          pattern: /eval\s*\(/g,
          message: 'eval() 사용으로 인한 보안 위험',
          severity: 'error' as const
        },
        {
          pattern: /innerHTML\s*=.*user|innerHTML\s*=.*input/gi,
          message: '사용자 입력을 innerHTML에 직접 삽입 (XSS 위험)',
          severity: 'error' as const
        },
        {
          pattern: /document\.write/g,
          message: 'document.write() 사용 (XSS 위험)',
          severity: 'warning' as const
        }
      ];
      
      securityPatterns.forEach(({ pattern, message, severity }) => {
        if (pattern.test(line)) {
          errors.push({
            file: fileName,
            line: lineNum,
            type: 'security',
            severity,
            message,
            suggestion: '환경변수나 보안 설정으로 이동하세요',
            code: line.trim()
          });
        }
      });
    });
    
    return errors;
  }

  // 전체 프로젝트 분석
  public analyzeProject(files: { name: string; content: string }[]): ProjectHealth {
    const allErrors: CodeError[] = [];
    const errorsByFile: Record<string, CodeError[]> = {};
    const fileNames = files.map(f => f.name);
    
    files.forEach(file => {
      const fileErrors: CodeError[] = [];
      
      // 파일 확장자에 따른 분석
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (['js', 'jsx', 'ts', 'tsx'].includes(extension || '')) {
        fileErrors.push(
          ...this.detectSyntaxErrors(file.name, file.content),
          ...this.detectImportErrors(file.name, file.content, fileNames),
          ...this.detectAPIErrors(file.name, file.content),
          ...this.detectPerformanceIssues(file.name, file.content),
          ...this.detectSecurityIssues(file.name, file.content)
        );
      }
      
      if (fileErrors.length > 0) {
        errorsByFile[file.name] = fileErrors;
        allErrors.push(...fileErrors);
      }
    });
    
    // 오류 유형별 집계
    const errorsByType: Record<string, number> = {};
    allErrors.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
    });
    
    // 크리티컬 이슈 (에러 레벨)
    const criticalIssues = allErrors.filter(error => error.severity === 'error');
    
    // 건강도 점수 계산 (100점 만점)
    const totalFiles = files.length;
    const filesWithErrors = Object.keys(errorsByFile).length;
    const errorRate = filesWithErrors / totalFiles;
    const criticalRate = criticalIssues.length / allErrors.length;
    
    const healthScore = Math.max(0, Math.round(100 - (errorRate * 50) - (criticalRate * 30)));
    
    return {
      totalErrors: allErrors.length,
      errorsByType,
      errorsByFile,
      healthScore,
      criticalIssues
    };
  }

  // 특정 파일의 오류만 분석
  public analyzeFile(fileName: string, content: string, allFileNames: string[] = []): CodeError[] {
    const errors: CodeError[] = [];
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (['js', 'jsx', 'ts', 'tsx'].includes(extension || '')) {
      errors.push(
        ...this.detectSyntaxErrors(fileName, content),
        ...this.detectImportErrors(fileName, content, allFileNames),
        ...this.detectAPIErrors(fileName, content),
        ...this.detectPerformanceIssues(fileName, content),
        ...this.detectSecurityIssues(fileName, content)
      );
    }
    
    return errors;
  }
}