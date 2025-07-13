const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class FileAnalysisService {
  constructor() {
    this.ANALYSIS_DIR = path.join(__dirname, '../../analysis_results');
  }

  /**
   * 분석 디렉토리 생성
   */
  async ensureAnalysisDir() {
    try {
      await fs.mkdir(this.ANALYSIS_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create analysis directory:', error);
      throw error;
    }
  }

  /**
   * 분석 결과 저장
   */
  async saveAnalysis(projectName, analysisData) {
    if (!projectName || !analysisData) {
      throw new Error('프로젝트명과 분석 데이터가 필요합니다.');
    }

    await this.ensureAnalysisDir();

    // 파일명 생성
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `${projectName}_analysis_${timestamp}.json`;
    const filePath = path.join(this.ANALYSIS_DIR, filename);

    // JSON 파일 저장
    await fs.writeFile(filePath, JSON.stringify(analysisData, null, 2), 'utf8');

    console.log(`✅ Analysis saved: ${filename}`);

    return {
      filename,
      path: filePath,
      size: Buffer.byteLength(JSON.stringify(analysisData))
    };
  }

  /**
   * 저장된 분석 결과 목록 조회
   */
  async listAnalyses() {
    await this.ensureAnalysisDir();
    
    const files = await fs.readdir(this.ANALYSIS_DIR);
    const analysisFiles = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(this.ANALYSIS_DIR, file);
        const stats = await fs.stat(filePath);
        
        analysisFiles.push({
          filename: file,
          size: stats.size,
          created: stats.mtime,
          project: file.split('_analysis_')[0]
        });
      }
    }

    // 최신 파일부터 정렬
    analysisFiles.sort((a, b) => b.created - a.created);

    return analysisFiles;
  }

  /**
   * 특정 분석 결과 로드
   */
  async loadAnalysis(filename) {
    // 보안을 위해 파일명 검증
    if (!filename.endsWith('.json') || filename.includes('..')) {
      throw new Error('잘못된 파일명입니다.');
    }

    const filePath = path.join(this.ANALYSIS_DIR, filename);
    
    // 파일 존재 확인
    await fs.access(filePath);
    
    // JSON 파일 읽기
    const content = await fs.readFile(filePath, 'utf8');
    const analysisData = JSON.parse(content);

    return {
      filename,
      data: analysisData
    };
  }

  /**
   * 파일 분석 - 언어, 프레임워크, 디렉토리 구조 등
   */
  analyzeFiles(files) {
    const languages = {};
    const frameworks = new Set();
    const topDirectories = new Map();
    const largeFiles = [];

    files.forEach(file => {
      // 파일 확장자 분석
      const ext = file.name.split('.').pop()?.toLowerCase();
      const langMap = {
        'js': 'JavaScript',
        'jsx': 'React',
        'ts': 'TypeScript', 
        'tsx': 'React TypeScript',
        'py': 'Python',
        'css': 'CSS',
        'html': 'HTML',
        'json': 'JSON',
        'md': 'Markdown'
      };
      
      if (langMap[ext]) {
        languages[langMap[ext]] = (languages[langMap[ext]] || 0) + 1;
      }
      
      // 프레임워크 감지
      if (file.name === 'package.json') frameworks.add('Node.js');
      if (file.name === 'requirements.txt') frameworks.add('Python');
      if (ext === 'jsx' || ext === 'tsx') frameworks.add('React');
      
      // 디렉토리 분석
      const pathParts = (file.path || '').split('/');
      if (pathParts.length > 1) {
        const dir = pathParts[0];
        topDirectories.set(dir, (topDirectories.get(dir) || 0) + 1);
      }
      
      // 대용량 파일
      if (file.size > 10 * 1024 * 1024) { // 10MB 이상
        largeFiles.push({
          name: file.name,
          size: file.size,
          path: file.path || file.name
        });
      }
    });

    return {
      languages,
      frameworks: Array.from(frameworks),
      topDirectories: Array.from(topDirectories.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([directory, fileCount]) => ({ directory, fileCount })),
      largeFiles: largeFiles.sort((a, b) => b.size - a.size).slice(0, 10)
    };
  }

  /**
   * TypeScript 컴파일 오류 검사
   */
  async checkTypeScriptErrors() {
    try {
      console.log('🔍 TypeScript 컴파일 오류 검사 시작...');
      const { stdout, stderr } = await execAsync('npm run typecheck', { 
        cwd: process.cwd(),
        timeout: 30000 
      });
      console.log('✅ TypeScript 검사 완료 - 오류 없음');
      return [];
    } catch (typescriptError) {
      console.log('🔴 TypeScript 오류 발견:', typescriptError.stdout || typescriptError.stderr);
      
      const errors = [];
      const errorOutput = typescriptError.stdout || typescriptError.stderr || '';
      const errorLines = errorOutput.split('\n').filter(line => 
        line.includes('error TS') && line.includes('):')
      );
      
      errorLines.forEach(line => {
        const match = line.match(/(.+?)\((\d+),(\d+)\):\s*error\s+(TS\d+):\s*(.+)/);
        if (match) {
          const [, filePath, lineNum, colNum, errorCode, message] = match;
          const fileName = filePath.split('/').pop() || filePath;
          
          errors.push({
            file: fileName,
            path: filePath,
            type: `TypeScript ${errorCode}`,
            message: message.trim(),
            severity: 'error',
            line: lineNum
          });
        }
      });
      
      console.log(`📊 파싱된 TypeScript 오류: ${errors.length}개`);
      return errors;
    }
  }
}

module.exports = FileAnalysisService;