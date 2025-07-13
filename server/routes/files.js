const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const { logger, logError, logInfo, logDebug, logWarn } = require('../utils/logger');

// 안전한 경로 확인
const isSafePath = (targetPath) => {
  const normalizedPath = path.normalize(targetPath);
  // 상위 디렉토리 접근 차단
  if (normalizedPath.includes('..')) {
    return false;
  }
  return true;
};

// 디렉토리 트리 가져오기
router.post('/tree', async (req, res) => {
  try {
    const { rootPath } = req.body;
    
    if (!rootPath || !isSafePath(rootPath)) {
      return res.status(400).json({ error: '유효하지 않은 경로입니다.' });
    }

    const absolutePath = path.resolve(rootPath);
    
    // 디렉토리 존재 확인
    try {
      const stats = await fs.stat(absolutePath);
      if (!stats.isDirectory()) {
        return res.status(400).json({ error: '디렉토리가 아닙니다.' });
      }
    } catch (error) {
      return res.status(404).json({ error: '디렉토리를 찾을 수 없습니다.' });
    }

    // 파일 트리 구성
    const buildTree = async (dirPath, depth = 0, maxDepth = 5) => {
      if (depth > maxDepth) return null;

      const items = await fs.readdir(dirPath);
      const tree = {
        name: path.basename(dirPath),
        path: dirPath,
        type: 'directory',
        children: []
      };

      for (const item of items) {
        // node_modules, .git 등 제외
        if (['node_modules', '.git', '.cache', 'dist', 'build'].includes(item)) {
          continue;
        }

        const itemPath = path.join(dirPath, item);
        const stats = await fs.stat(itemPath);

        if (stats.isDirectory()) {
          const subTree = await buildTree(itemPath, depth + 1, maxDepth);
          if (subTree) {
            tree.children.push(subTree);
          }
        } else if (stats.isFile()) {
          // 코드 파일만 포함
          const ext = path.extname(item).toLowerCase();
          if (['.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.scss', '.html', '.py', '.java', '.cpp', '.c', '.h'].includes(ext)) {
            tree.children.push({
              name: item,
              path: itemPath,
              type: 'file',
              extension: ext.slice(1),
              size: stats.size
            });
          }
        }
      }

      return tree;
    };

    const tree = await buildTree(absolutePath);
    res.json({ success: true, tree });

  } catch (error) {
    logError(error, { context: 'Building file tree failed' });
    res.status(500).json({ error: '파일 트리를 생성하는 중 오류가 발생했습니다.' });
  }
});

// 파일 내용 읽기
router.post('/read', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath || !isSafePath(filePath)) {
      return res.status(400).json({ error: '유효하지 않은 파일 경로입니다.' });
    }

    const absolutePath = path.resolve(filePath);
    
    // 파일 존재 확인
    try {
      const stats = await fs.stat(absolutePath);
      if (!stats.isFile()) {
        return res.status(400).json({ error: '파일이 아닙니다.' });
      }
    } catch (error) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    }

    // 파일 크기 제한 (10MB)
    const stats = await fs.stat(absolutePath);
    if (stats.size > 10 * 1024 * 1024) {
      return res.status(400).json({ error: '파일이 너무 큽니다. (최대 10MB)' });
    }

    const content = await fs.readFile(absolutePath, 'utf-8');
    res.json({ 
      success: true, 
      content,
      path: absolutePath,
      name: path.basename(absolutePath),
      extension: path.extname(absolutePath).slice(1)
    });

  } catch (error) {
    logError(error, { context: 'Reading file failed', filePath });
    res.status(500).json({ error: '파일을 읽는 중 오류가 발생했습니다.' });
  }
});

// 파일 검색
router.post('/search', async (req, res) => {
  try {
    const { rootPath, pattern, searchContent } = req.body;
    
    if (!rootPath || !isSafePath(rootPath)) {
      return res.status(400).json({ error: '유효하지 않은 경로입니다.' });
    }

    const absolutePath = path.resolve(rootPath);
    
    // glob 패턴으로 파일 찾기
    const files = await glob(pattern || '**/*.{js,jsx,ts,tsx,json}', {
      cwd: absolutePath,
      ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
      absolute: true,
      nodir: true
    });

    const results = [];
    
    for (const file of files) {
      const relativePath = path.relative(absolutePath, file);
      const result = {
        path: file,
        relativePath,
        name: path.basename(file)
      };

      // 내용 검색
      if (searchContent) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          if (content.includes(searchContent)) {
            const lines = content.split('\n');
            const matches = [];
            
            lines.forEach((line, index) => {
              if (line.includes(searchContent)) {
                matches.push({
                  line: index + 1,
                  content: line.trim(),
                  preview: line.slice(Math.max(0, line.indexOf(searchContent) - 20), line.indexOf(searchContent) + searchContent.length + 20)
                });
              }
            });
            
            result.matches = matches;
            results.push(result);
          }
        } catch (error) {
          logError(error, { context: 'File reading during search failed', file });
        }
      } else {
        results.push(result);
      }
    }

    res.json({ success: true, results });

  } catch (error) {
    logError(error, { context: 'File search failed' });
    res.status(500).json({ error: '파일 검색 중 오류가 발생했습니다.' });
  }
});

// 프로젝트 분석
router.post('/analyze', async (req, res) => {
  try {
    const { rootPath } = req.body;
    
    if (!rootPath || !isSafePath(rootPath)) {
      return res.status(400).json({ error: '유효하지 않은 경로입니다.' });
    }

    const absolutePath = path.resolve(rootPath);
    
    // 프로젝트 타입 감지
    const detectProjectType = async () => {
      const files = await fs.readdir(absolutePath);
      
      if (files.includes('package.json')) {
        const packageJson = JSON.parse(await fs.readFile(path.join(absolutePath, 'package.json'), 'utf-8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        if (deps.react) return 'react';
        if (deps.vue) return 'vue';
        if (deps.angular) return 'angular';
        if (deps.express || deps.fastify) return 'node-backend';
        return 'node';
      }
      
      if (files.includes('requirements.txt') || files.includes('setup.py')) return 'python';
      if (files.includes('pom.xml')) return 'java-maven';
      if (files.includes('build.gradle')) return 'java-gradle';
      
      return 'unknown';
    };

    const projectType = await detectProjectType();
    
    // 파일 통계
    const stats = {
      totalFiles: 0,
      fileTypes: {},
      totalLines: 0,
      largestFiles: []
    };

    const files = await glob('**/*', {
      cwd: absolutePath,
      ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
      absolute: true,
      nodir: true
    });

    for (const file of files) {
      stats.totalFiles++;
      const ext = path.extname(file) || 'no-extension';
      stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;
      
      const fileStat = await fs.stat(file);
      stats.largestFiles.push({
        path: path.relative(absolutePath, file),
        size: fileStat.size
      });
    }

    stats.largestFiles.sort((a, b) => b.size - a.size);
    stats.largestFiles = stats.largestFiles.slice(0, 10);

    // 실제 파일 스캔 및 오류 감지
    const errors = [];
    const warnings = [];
    const realFiles = [];
    const importConnections = [];
    
    logInfo('실제 파일 스캔 시작...');
    
    // src/ 폴더와 server/ 폴더의 중요 파일들만 스캔 (실제 코드 파일들)
    const sourceFiles = await glob('{src/**/*,server/**/*}.{ts,tsx,js,jsx,py,html,json,css,scss}', {
      cwd: absolutePath,
      absolute: true,
      nodir: true,
      ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**', '**/coverage/**', '**/.cache/**']
    });
    
    logInfo('발견된 소스 파일', { fileCount: sourceFiles.length });
    
    logInfo('전체 소스 파일 분석', { fileCount: sourceFiles.length });
    
    // 각 파일 분석 (전체 다 분석)
    for (const filePath of sourceFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const relativePath = path.relative(absolutePath, filePath);
        const fileName = path.basename(filePath);
        const fileSize = (await fs.stat(filePath)).size;
        
        // 파일 정보 저장
        realFiles.push({
          name: fileName,
          path: relativePath,
          size: fileSize,
          content: content.substring(0, 1000), // 처음 1000자만
          type: path.extname(fileName).slice(1)
        });
        
        // import 관계 분석 - 더 정확하게
        const lines = content.split('\n');
        lines.forEach((line, lineIndex) => {
          // import ... from '...' 형태 매칭
          const importMatch = line.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/);
          if (importMatch) {
            const importPath = importMatch[1];
            if (importPath.startsWith('.')) { // 로컬 import만
              // 상대 경로를 절대 경로로 변환
              const sourceDir = path.dirname(relativePath);
              let resolvedPath = path.resolve(sourceDir, importPath);
              
              // 프로젝트 루트 기준으로 변환
              resolvedPath = path.relative(absolutePath, resolvedPath);
              
              logDebug(`Import 발견: ${relativePath} -> ${importPath} (해결됨: ${resolvedPath})`);
              
              importConnections.push({
                from: relativePath,
                to: importPath,
                resolvedTo: resolvedPath,
                type: 'import',
                line: lineIndex + 1
              });
            } else if (!importPath.includes('node_modules') && !importPath.startsWith('@')) {
              // 절대 import도 프로젝트 내부면 포함
              logDebug(`절대 Import 발견: ${relativePath} -> ${importPath}`);
              
              importConnections.push({
                from: relativePath,
                to: importPath,
                resolvedTo: importPath,
                type: 'import',
                line: lineIndex + 1
              });
            }
          }
          
          // require() 형태도 분석
          const requireMatch = line.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
          if (requireMatch) {
            const requirePath = requireMatch[1];
            if (requirePath.startsWith('.')) {
              const sourceDir = path.dirname(relativePath);
              let resolvedPath = path.resolve(sourceDir, requirePath);
              resolvedPath = path.relative(absolutePath, resolvedPath);
              
              logDebug(`Require 발견: ${relativePath} -> ${requirePath} (해결됨: ${resolvedPath})`);
              
              importConnections.push({
                from: relativePath,
                to: requirePath,
                resolvedTo: resolvedPath,
                type: 'require',
                line: lineIndex + 1
              });
            }
          }
        });
        
        // 파일별 문제 감지
        if (content.includes('any')) {
          warnings.push({
            file: fileName,
            path: relativePath,
            type: 'Type Safety',
            message: 'Using "any" type detected',
            severity: 'warning',
            line: content.split('\n').findIndex(line => line.includes('any')) + 1
          });
        }
        
        if (fileName.endsWith('.tsx') && !content.includes('import React')) {
          errors.push({
            file: fileName,
            path: relativePath,
            type: 'Missing Import',
            message: 'React import missing in TSX file',
            severity: 'error',
            line: 1
          });
        }
        
      } catch (fileError) {
        logWarn(`파일 읽기 실패: ${filePath}`, { error: fileError.message });
      }
    }
    
    // 실제 TypeScript 오류 가져오기
    if (projectType === 'react' || projectType === 'node') {
      try {
        logInfo('TypeScript 컴파일 검사 시작...');
        const { stdout, stderr } = await execAsync('npm run typecheck', { 
          cwd: absolutePath,
          timeout: 15000 
        });
      } catch (tsError) {
        const errorOutput = tsError.stdout || tsError.stderr || '';
        const errorLines = errorOutput.split('\n').filter(line => 
          line.includes('error TS') && line.includes('):')
        );
        
        errorLines.slice(0, 20).forEach(line => { // 최대 20개 오류
          const match = line.match(/(.+?)\((\d+),(\d+)\):\s*error\s+(TS\d+):\s*(.+)/);
          if (match) {
            const [, filePath, lineNum, colNum, errorCode, message] = match;
            const fileName = path.basename(filePath);
            
            errors.push({
              file: fileName,
              path: filePath.replace(absolutePath + '/', ''),
              type: `TypeScript ${errorCode}`,
              message: message.trim(),
              severity: 'error',
              line: lineNum
            });
          }
        });
        
        logInfo('실제 TypeScript 오류', { errorCount: errors.length });
      }
    }
    
    // 대용량 파일 경고
    stats.largestFiles.forEach(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB 이상
        warnings.push({
          file: file.path.split('/').pop(),
          path: file.path,
          type: 'Large File',
          message: `Large file detected (${Math.round(file.size/1024/1024)}MB)`,
          severity: 'warning'
        });
      }
    });

    res.json({
      success: true,
      analysis: {
        projectType,
        rootPath: absolutePath,
        stats,
        errors: errors,
        warnings: warnings,
        errorCount: errors.length,
        warningCount: warnings.length,
        hasIssues: errors.length > 0 || warnings.length > 0,
        // 실제 파일 데이터 추가
        realFiles: realFiles,
        importConnections: importConnections,
        isRealAnalysis: true,
        scannedFiles: sourceFiles.length
      }
    });

  } catch (error) {
    logError(error, { context: 'Project analysis failed' });
    res.status(500).json({ error: '프로젝트 분석 중 오류가 발생했습니다.' });
  }
});

module.exports = router;