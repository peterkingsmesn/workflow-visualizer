const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { resolveImportPath, findTargetFile } = require('../utils/importResolver');
const { getApiMethod, checkApiContract } = require('../utils/apiContractValidator');

class CodeAnalysisService {
  /**
   * 파일 내용에서 오류와 경고 감지
   */
  detectIssuesInFile(file) {
    const errors = [];
    const warnings = [];
    const ext = file.name.split('.').pop()?.toLowerCase();
    const fileName = file.name.toLowerCase();
    const filePath = file.path || file.name;

    // TypeScript/JavaScript 파일 오류 감지
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
      if (file.content) {
        // React Hook 규칙 위반 감지
        if (file.content.includes('useCallback') && file.content.includes('useMemo')) {
          const useCallbackInUseMemo = file.content.match(/useMemo.*useCallback/s);
          if (useCallbackInUseMemo) {
            errors.push({
              file: fileName,
              path: filePath,
              type: 'React Hook Rules',
              message: 'useCallback inside useMemo detected',
              severity: 'error',
              line: 'unknown'
            });
          }
        }
        
        // 중복 변수 선언 감지
        const duplicateConst = file.content.match(/const\s+(\w+)[\s\S]*?const\s+\1/g);
        if (duplicateConst) {
          errors.push({
            file: fileName,
            path: filePath,
            type: 'Duplicate Declaration',
            message: `Duplicate variable declaration: ${duplicateConst[0]}`,
            severity: 'error',
            line: 'unknown'
          });
        }
        
        // import 누락 감지
        if (file.content.includes('useRef') && !file.content.includes('import.*useRef')) {
          errors.push({
            file: fileName,
            path: filePath,
            type: 'Missing Import',
            message: 'useRef used but not imported from React',
            severity: 'error',
            line: 'unknown'
          });
        }
        
        // Background variant 타입 오류
        if (file.content.includes('variant="dots"') && file.content.includes('Background')) {
          errors.push({
            file: fileName,
            path: filePath,
            type: 'Type Error',
            message: 'Background variant="dots" type incompatibility',
            severity: 'error',
            line: 'unknown'
          });
        }
      }
      
      // 파일명 기반 일반적인 문제 감지
      if (fileName.includes('canvas') || fileName.includes('workflow')) {
        warnings.push({
          file: fileName,
          path: filePath,
          type: 'Component Check',
          message: 'Canvas/Workflow component - verify React Hook compliance',
          severity: 'warning'
        });
      }
    }
    
    // API 연결 오류 감지
    if (fileName.includes('api') || fileName.includes('service')) {
      warnings.push({
        file: fileName,
        path: filePath,
        type: 'API Connection',
        message: 'API file detected - verify endpoint connectivity',
        severity: 'warning'
      });
    }
    
    // 큰 파일에 대한 경고
    if (file.size > 500 * 1024) { // 500KB 이상
      warnings.push({
        file: fileName,
        path: filePath,
        type: 'Large File',
        message: `Large file detected (${Math.round(file.size/1024)}KB) - consider splitting`,
        severity: 'warning'
      });
    }

    return { errors, warnings };
  }

  /**
   * Import 관계 분석
   */
  analyzeImports(files) {
    const importConnections = [];
    console.log(`🔍 Import 분석 시작: ${files.length}개 파일`);
    
    let filesWithContent = 0;
    let totalImportsFound = 0;
    
    files.forEach((file, index) => {
      const fileExtension = file.path?.split('.').pop()?.toLowerCase();
      const isCodeFile = ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'php', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'vue', 'svelte'].includes(fileExtension) || 
                        ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'php', 'py'].includes(file.type);
      
      if (file.content && isCodeFile) {
        filesWithContent++;
        
        // import/require 패턴 찾기 (HTML, CSS 포함)
        const importRegex = /(?:import\s+.*?from\s+['"`](.+?)['"`])|(?:require\s*\(\s*['"`](.+?)['"`]\s*\))|(?:import\s*\(\s*['"`](.+?)['"`]\s*\))|(?:<script.*?src\s*=\s*['"`](.+?)['"`])|(?:<link.*?href\s*=\s*['"`](.+?)['"`])|(?:@import\s+['"`](.+?)['"`])/g;
        let match;
        let fileImports = 0;
        
        while ((match = importRegex.exec(file.content)) !== null) {
          const importPath = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];
          fileImports++;
          
          if (importPath && importPath.startsWith('.')) {
            // 상대 경로 import 해석
            const sourcePath = file.path || file.name;
            const resolvedPath = resolveImportPath(sourcePath, importPath);
            
            // 타겟 파일 찾기
            const targetFile = resolvedPath ? findTargetFile(files, resolvedPath) : null;
            
            if (targetFile) {
              importConnections.push({
                source: file.path,
                target: targetFile.path,
                from: file.path,
                to: targetFile.path,
                type: 'import',
                importPath: importPath,
                status: 'success',
                hasError: false,
                hasWarning: false
              });
              totalImportsFound++;
            } else {
              // 타겟 파일을 찾지 못한 경우 경고로 추가
              importConnections.push({
                source: file.path,
                target: importPath,
                from: file.path,
                to: importPath,
                type: 'import',
                importPath: importPath,
                status: 'warning',
                hasError: false,
                hasWarning: true,
                warningMessage: `Target file not found: ${importPath}`
              });
            }
          }
        }
      }
    });
    
    console.log(`📊 Import 분석 결과:`);
    console.log(`  - 내용이 있는 파일: ${filesWithContent}개`);
    console.log(`  - 발견된 import: ${totalImportsFound}개`);
    console.log(`  - 총 import 연결: ${importConnections.length}개`);
    
    return importConnections;
  }

  /**
   * API 호출 분석
   */
  analyzeApiCalls(files) {
    const apiConnections = [];
    
    files.forEach(file => {
      const fileExtension = file.path?.split('.').pop()?.toLowerCase();
      const isCodeFile = ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'php', 'py'].includes(fileExtension) || 
                        ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'php', 'py'].includes(file.type);
      
      if (file.content && isCodeFile) {
        // API 호출 패턴 분석
        const apiPatterns = [
          /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g,
          /axios\.[a-z]+\s*\(\s*['"`]([^'"`]+)['"`]/g,
          /\.get\s*\(\s*['"`]([^'"`]+)['"`]/g,
          /\.post\s*\(\s*['"`]([^'"`]+)['"`]/g,
          /\.put\s*\(\s*['"`]([^'"`]+)['"`]/g,
          /\.delete\s*\(\s*['"`]([^'"`]+)['"`]/g
        ];
        
        apiPatterns.forEach(pattern => {
          let apiMatch;
          while ((apiMatch = pattern.exec(file.content)) !== null) {
            const apiUrl = apiMatch[1];
            if (apiUrl && (apiUrl.startsWith('/') || apiUrl.startsWith('http'))) {
              // API 계약 검증
              const isValidContract = checkApiContract(apiUrl, getApiMethod(pattern.source));
              
              apiConnections.push({
                source: file.path,
                target: apiUrl,
                from: file.path,
                to: apiUrl,
                type: 'api',
                method: getApiMethod(pattern.source),
                url: apiUrl,
                isValidContract: isValidContract,
                contractStatus: isValidContract ? 'valid' : 'invalid',
                status: isValidContract ? 'success' : 'error',
                hasError: !isValidContract,
                hasWarning: false,
                errorMessage: !isValidContract ? `Invalid API contract: ${apiUrl}` : null
              });
            }
          }
        });
      }
    });
    
    console.log(`  - 총 API 연결: ${apiConnections.length}개`);
    return apiConnections;
  }

  /**
   * Import 추출 (AST 사용)
   */
  extractImports(code, filePath) {
    const imports = [];
    
    try {
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'decorators-legacy'],
        errorRecovery: true
      });

      traverse(ast, {
        ImportDeclaration(path) {
          const source = path.node.source.value;
          const specifiers = path.node.specifiers.map(spec => {
            if (spec.type === 'ImportDefaultSpecifier') {
              return { name: spec.local.name, type: 'default' };
            } else if (spec.type === 'ImportSpecifier') {
              return { 
                name: spec.local.name, 
                imported: spec.imported.name,
                type: 'named' 
              };
            } else if (spec.type === 'ImportNamespaceSpecifier') {
              return { name: spec.local.name, type: 'namespace' };
            }
          });
          
          imports.push({
            source,
            specifiers,
            line: path.node.loc?.start.line
          });
        },
        CallExpression(path) {
          // require() 감지
          if (path.node.callee.name === 'require' && 
              path.node.arguments[0]?.type === 'StringLiteral') {
            imports.push({
              source: path.node.arguments[0].value,
              specifiers: [],
              type: 'require',
              line: path.node.loc?.start.line
            });
          }
        }
      });
    } catch (error) {
      console.error('Parse error:', error.message);
    }

    return imports;
  }

  /**
   * Export 추출 (AST 사용)
   */
  extractExports(code, filePath) {
    const exports = [];
    
    try {
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'decorators-legacy'],
        errorRecovery: true
      });

      traverse(ast, {
        ExportNamedDeclaration(path) {
          if (path.node.declaration) {
            // export const/function/class
            const decl = path.node.declaration;
            if (decl.type === 'VariableDeclaration') {
              decl.declarations.forEach(d => {
                if (d.id.type === 'Identifier') {
                  exports.push({
                    name: d.id.name,
                    type: 'named',
                    line: d.loc?.start.line
                  });
                }
              });
            } else if (decl.type === 'FunctionDeclaration' || 
                       decl.type === 'ClassDeclaration') {
              if (decl.id) {
                exports.push({
                  name: decl.id.name,
                  type: 'named',
                  line: decl.loc?.start.line
                });
              }
            }
          } else if (path.node.specifiers) {
            // export { a, b }
            path.node.specifiers.forEach(spec => {
              exports.push({
                name: spec.exported.name,
                local: spec.local.name,
                type: 'named',
                line: spec.loc?.start.line
              });
            });
          }
        },
        ExportDefaultDeclaration(path) {
          exports.push({
            name: 'default',
            type: 'default',
            line: path.node.loc?.start.line
          });
        }
      });
    } catch (error) {
      console.error('Parse error:', error.message);
    }

    return exports;
  }

  /**
   * 백엔드 API 엔드포인트 추출
   */
  extractBackendEndpoints(code, filePath) {
    const endpoints = [];
    
    // Express 라우트 패턴
    const patterns = [
      /app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /route\s*\(\s*['"`]([^'"`]+)['"`]\s*\)\s*\.(get|post|put|delete|patch)/g
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        endpoints.push({
          method: match[1].toUpperCase(),
          path: match[2] || match[1],
          file: filePath,
          line: code.substring(0, match.index).split('\n').length,
          type: 'rest'
        });
      }
    });
    
    // WebSocket 이벤트 패턴
    const wsPatterns = [
      /socket\.on\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /io\.on\s*\(\s*['"`]connection['"`][\s\S]*?socket\.on\s*\(\s*['"`]([^'"`]+)['"`]/g
    ];
    
    wsPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const event = match[1] || match[2];
        if (event && event !== 'connection') {
          endpoints.push({
            method: 'WS_IN',
            path: event,
            file: filePath,
            line: code.substring(0, match.index).split('\n').length,
            type: 'websocket'
          });
        }
      }
    });
    
    return endpoints;
  }

  /**
   * 프론트엔드 API 호출 추출
   */
  extractFrontendAPICalls(code, filePath) {
    const calls = [];
    
    // Axios/Fetch 패턴
    const patterns = [
      /axios\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /fetch\s*\(\s*['"`]([^'"`]+)['"`]\s*,?\s*\{[^}]*method\s*:\s*['"`](GET|POST|PUT|DELETE|PATCH)['"`]/gi,
      /\$\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const method = match[1] || match[2];
        const path = match[2] || match[1];
        
        if (path && path.includes('/')) {
          calls.push({
            method: method.toUpperCase(),
            path: path,
            file: filePath,
            line: code.substring(0, match.index).split('\n').length,
            type: 'rest'
          });
        }
      }
    });
    
    // WebSocket 이벤트
    const wsPatterns = [
      /socket\.emit\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /socket\.on\s*\(\s*['"`]([^'"`]+)['"`]/g
    ];
    
    wsPatterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const event = match[1];
        if (event && event !== 'connect' && event !== 'disconnect') {
          calls.push({
            method: index === 0 ? 'WS_OUT' : 'WS_IN',
            path: event,
            file: filePath,
            line: code.substring(0, match.index).split('\n').length,
            type: 'websocket'
          });
        }
      }
    });
    
    return calls;
  }
}

module.exports = CodeAnalysisService;