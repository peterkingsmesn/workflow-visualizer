#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { logger, logError, logInfo, logDebug, logWarn } = require('../server/utils/logger');

class ProjectDiagnoser {
  constructor(projectPath) {
    this.projectPath = path.resolve(projectPath);
    this.issues = {
      security: [],
      performance: [],
      maintainability: [],
      codeQuality: []
    };
    this.stats = {
      totalFiles: 0,
      totalLines: 0,
      largeFiles: [],
      duplicates: [],
      complexFiles: []
    };
  }

  async diagnose() {
    logInfo(`프로젝트 진단 시작: ${this.projectPath}`);
    
    await this.checkSecurityIssues();
    await this.checkPerformanceIssues();
    await this.checkCodeQuality();
    await this.checkMaintainability();
    await this.analyzeProjectStructure();
    
    return this.generateReport();
  }

  async checkSecurityIssues() {
    logInfo('보안 문제 검사 중...');
    
    // 하드코딩된 시크릿 검사
    const patterns = [
      { pattern: /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi, type: 'API Key' },
      { pattern: /secret\s*[:=]\s*['"][^'"]+['"]/gi, type: 'Secret' },
      { pattern: /password\s*[:=]\s*['"][^'"]+['"]/gi, type: 'Password' },
      { pattern: /token\s*[:=]\s*['"][^'"]+['"]/gi, type: 'Token' }
    ];
    
    await this.scanFiles(async (filePath, content) => {
      for (const { pattern, type } of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          this.issues.security.push({
            file: path.relative(this.projectPath, filePath),
            type: `하드코딩된 ${type}`,
            severity: 'high',
            line: this.findLineNumber(content, matches[0])
          });
        }
      }
    });
  }

  async checkPerformanceIssues() {
    logInfo('성능 문제 검사 중...');
    
    await this.scanFiles(async (filePath, content) => {
      // 대용량 파일
      if (content.length > 50000) {
        this.issues.performance.push({
          file: path.relative(this.projectPath, filePath),
          type: '대용량 파일',
          severity: 'medium',
          size: `${Math.round(content.length / 1024)}KB`
        });
      }
      
      // useEffect 의존성 배열 누락
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        const useEffectWithoutDeps = /useEffect\s*\(\s*\(\)\s*=>\s*{[^}]+}\s*\)/g;
        if (useEffectWithoutDeps.test(content)) {
          this.issues.performance.push({
            file: path.relative(this.projectPath, filePath),
            type: 'useEffect 의존성 배열 누락',
            severity: 'medium'
          });
        }
      }
    });
  }

  async checkCodeQuality() {
    logInfo('코드 품질 검사 중...');
    
    await this.scanFiles(async (filePath, content) => {
      const lines = content.split('\n');
      
      // God Component (1000줄 이상)
      if (lines.length > 1000) {
        this.issues.codeQuality.push({
          file: path.relative(this.projectPath, filePath),
          type: 'God Component',
          severity: 'high',
          lines: lines.length
        });
        this.stats.largeFiles.push({
          file: path.relative(this.projectPath, filePath),
          lines: lines.length
        });
      }
      
      // TODO/FIXME 주석
      const todoCount = (content.match(/TODO|FIXME/g) || []).length;
      if (todoCount > 0) {
        this.issues.codeQuality.push({
          file: path.relative(this.projectPath, filePath),
          type: 'TODO/FIXME 주석',
          severity: 'low',
          count: todoCount
        });
      }
      
      // console.log 남아있는 경우
      const consoleCount = (content.match(/console\.(log|error|warn)/g) || []).length;
      if (consoleCount > 5) {
        this.issues.codeQuality.push({
          file: path.relative(this.projectPath, filePath),
          type: '과도한 console 사용',
          severity: 'low',
          count: consoleCount
        });
      }
    });
  }

  async checkMaintainability() {
    logInfo('유지보수성 검사 중...');
    
    // 중복 코드 패턴 찾기
    const codePatterns = new Map();
    
    await this.scanFiles(async (filePath, content) => {
      // 함수 시그니처 추출
      const functionPatterns = content.match(/(?:function|const|let|var)\s+(\w+)\s*[=:]\s*(?:async\s*)?\([^)]*\)\s*(?:=>|{)/g) || [];
      
      functionPatterns.forEach(pattern => {
        const normalized = pattern.replace(/\s+/g, ' ').trim();
        if (!codePatterns.has(normalized)) {
          codePatterns.set(normalized, []);
        }
        codePatterns.get(normalized).push(path.relative(this.projectPath, filePath));
      });
    });
    
    // 중복 패턴 찾기
    for (const [pattern, files] of codePatterns) {
      if (files.length > 2) {
        this.issues.maintainability.push({
          type: '중복 코드 패턴',
          pattern: pattern.substring(0, 50) + '...',
          files: files,
          severity: 'medium'
        });
      }
    }
  }

  async analyzeProjectStructure() {
    logInfo('프로젝트 구조 분석 중...');
    
    const structure = {
      components: 0,
      pages: 0,
      utils: 0,
      hooks: 0,
      services: 0
    };
    
    await this.scanFiles(async (filePath) => {
      const relativePath = path.relative(this.projectPath, filePath);
      
      if (relativePath.includes('components/')) structure.components++;
      else if (relativePath.includes('pages/')) structure.pages++;
      else if (relativePath.includes('utils/')) structure.utils++;
      else if (relativePath.includes('hooks/')) structure.hooks++;
      else if (relativePath.includes('services/')) structure.services++;
      
      this.stats.totalFiles++;
    });
    
    this.stats.structure = structure;
  }

  async scanFiles(callback) {
    const scanDir = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          if (!['node_modules', '.git', 'build', 'dist', '.backup'].includes(entry.name)) {
            await scanDir(fullPath);
          }
        } else if (entry.isFile()) {
          if (['.ts', '.tsx', '.js', '.jsx'].some(ext => entry.name.endsWith(ext))) {
            const content = await fs.readFile(fullPath, 'utf-8');
            this.stats.totalLines += content.split('\n').length;
            await callback(fullPath, content);
          }
        }
      }
    };
    
    await scanDir(this.projectPath);
  }

  findLineNumber(content, match) {
    const lines = content.substring(0, content.indexOf(match)).split('\n');
    return lines.length;
  }

  generateReport() {
    const report = [];
    
    report.push('# 🔍 Workflow Visualizer 프로젝트 진단 보고서\n');
    report.push(`생성 시간: ${new Date().toLocaleString('ko-KR')}\n`);
    
    // 요약
    report.push('## 📊 요약\n');
    report.push(`- 총 파일 수: ${this.stats.totalFiles}개`);
    report.push(`- 총 코드 라인: ${this.stats.totalLines.toLocaleString()}줄`);
    report.push(`- 평균 파일 크기: ${Math.round(this.stats.totalLines / this.stats.totalFiles)}줄\n`);
    
    // 프로젝트 구조
    if (this.stats.structure) {
      report.push('## 📁 프로젝트 구조\n');
      report.push(`- 컴포넌트: ${this.stats.structure.components}개`);
      report.push(`- 페이지: ${this.stats.structure.pages}개`);
      report.push(`- 유틸리티: ${this.stats.structure.utils}개`);
      report.push(`- 훅: ${this.stats.structure.hooks}개`);
      report.push(`- 서비스: ${this.stats.structure.services}개\n`);
    }
    
    // 이슈 섹션
    const sections = [
      { title: '🔐 보안 이슈', issues: this.issues.security },
      { title: '⚡ 성능 이슈', issues: this.issues.performance },
      { title: '📊 코드 품질 이슈', issues: this.issues.codeQuality },
      { title: '🔧 유지보수성 이슈', issues: this.issues.maintainability }
    ];
    
    sections.forEach(({ title, issues }) => {
      if (issues.length > 0) {
        report.push(`## ${title}\n`);
        
        const highPriority = issues.filter(i => i.severity === 'high');
        const mediumPriority = issues.filter(i => i.severity === 'medium');
        const lowPriority = issues.filter(i => i.severity === 'low');
        
        if (highPriority.length > 0) {
          report.push('### 🔴 높음\n');
          highPriority.forEach(issue => {
            report.push(`- **${issue.file || issue.type}**: ${issue.type}`);
            if (issue.lines) report.push(` (${issue.lines}줄)`);
            if (issue.size) report.push(` (${issue.size})`);
            if (issue.line) report.push(` (${issue.line}번째 줄)`);
            report.push('');
          });
        }
        
        if (mediumPriority.length > 0) {
          report.push('\n### 🟡 중간\n');
          mediumPriority.forEach(issue => {
            report.push(`- **${issue.file || issue.type}**: ${issue.type}`);
            if (issue.count) report.push(` (${issue.count}개)`);
            if (issue.files) report.push(`\n  - 파일: ${issue.files.slice(0, 3).join(', ')}${issue.files.length > 3 ? ` 외 ${issue.files.length - 3}개` : ''}`);
            report.push('');
          });
        }
        
        if (lowPriority.length > 0) {
          report.push('\n### 🟢 낮음\n');
          lowPriority.forEach(issue => {
            report.push(`- **${issue.file}**: ${issue.type} (${issue.count}개)`);
          });
        }
        
        report.push('');
      }
    });
    
    // 권장사항
    report.push('## 💡 권장사항\n');
    
    if (this.issues.security.length > 0) {
      report.push('### 보안');
      report.push('- 하드코딩된 시크릿을 환경변수로 이동');
      report.push('- 환경변수 검증 시스템 구축\n');
    }
    
    if (this.stats.largeFiles.length > 0) {
      report.push('### 코드 구조');
      report.push('- 1000줄 이상의 파일을 작은 컴포넌트로 분리');
      report.push('- 공통 로직을 커스텀 훅으로 추출\n');
    }
    
    if (this.issues.performance.length > 0) {
      report.push('### 성능');
      report.push('- useEffect 의존성 배열 검토');
      report.push('- 대용량 파일 코드 스플리팅 적용\n');
    }
    
    report.push('## ✅ 다음 단계\n');
    report.push('1. 높은 우선순위 보안 이슈 즉시 해결');
    report.push('2. God Component 리팩토링 진행');
    report.push('3. 중복 코드 제거 및 재사용 가능한 컴포넌트 생성');
    report.push('4. 성능 최적화를 위한 코드 스플리팅 적용');
    
    return report.join('\n');
  }
}

// CLI 실행
async function main() {
  const args = process.argv.slice(2);
  const projectPath = args[0] || '.';
  const outputPath = args[1] || './diagnose_report.md';
  
  try {
    const diagnoser = new ProjectDiagnoser(projectPath);
    const report = await diagnoser.diagnose();
    
    await fs.writeFile(outputPath, report, 'utf-8');
    logInfo(`진단 완료! 보고서가 생성되었습니다: ${outputPath}`);
    
    // 요약 출력
    logInfo('진단 요약', {
      보안이슈: diagnoser.issues.security.length,
      성능이슈: diagnoser.issues.performance.length,
      코드품질이슈: diagnoser.issues.codeQuality.length,
      유지보수성이슈: diagnoser.issues.maintainability.length
    });
    
  } catch (error) {
    logError(error, { context: 'Project diagnosis failed' });
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ProjectDiagnoser;