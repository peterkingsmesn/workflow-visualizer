const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

// 프로젝트 진단 실행
router.post('/run', async (req, res) => {
    try {
        const { targetDir, options = {} } = req.body;
        
        // 진단 스크립트 경로
        const diagnosePath = path.join(__dirname, '../../../complete_diagnose.py');
        
        // 진단 대상 디렉토리 (기본값: 현재 프로젝트 디렉토리)
        const projectDir = targetDir || path.join(__dirname, '../../../');
        
        // Python 프로세스 실행
        const args = ['--dir', projectDir];
        if (options.output) {
            args.push('--output', options.output);
        }
        
        const pythonProcess = spawn('python3', [diagnosePath, ...args], {
            cwd: projectDir,
            stdio: 'pipe',
            encoding: 'utf8'
        });
        
        let stdout = '';
        let stderr = '';
        
        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        pythonProcess.on('close', async (code) => {
            if (code === 0) {
                // 성공적으로 완료
                const reportPath = path.join(projectDir, 'diagnostic_report.html');
                
                try {
                    // 보고서 파일이 생성되었는지 확인
                    await fs.access(reportPath);
                    
                    // 보고서 내용 읽기 (선택사항)
                    let reportContent = null;
                    if (options.includeContent) {
                        reportContent = await fs.readFile(reportPath, 'utf8');
                    }
                    
                    res.json({
                        success: true,
                        message: '진단이 완료되었습니다',
                        reportPath: reportPath,
                        reportContent: reportContent,
                        output: stdout
                    });
                } catch (error) {
                    res.status(500).json({
                        success: false,
                        error: '보고서 파일을 찾을 수 없습니다',
                        output: stdout,
                        stderr: stderr
                    });
                }
            } else {
                // 실행 실패
                res.status(500).json({
                    success: false,
                    error: '진단 실행 중 오류가 발생했습니다',
                    code: code,
                    output: stdout,
                    stderr: stderr
                });
            }
        });
        
        pythonProcess.on('error', (error) => {
            res.status(500).json({
                success: false,
                error: `Python 프로세스 실행 실패: ${error.message}`
            });
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 생성된 보고서 가져오기
router.get('/report', async (req, res) => {
    try {
        const { path: reportPath } = req.query;
        
        if (!reportPath) {
            return res.status(400).json({
                success: false,
                error: '보고서 경로가 필요합니다'
            });
        }
        
        // 보안을 위해 경로 검증
        const absolutePath = path.resolve(reportPath);
        const projectDir = path.resolve(__dirname, '../../../');
        
        if (!absolutePath.startsWith(projectDir)) {
            return res.status(403).json({
                success: false,
                error: '허용되지 않는 경로입니다'
            });
        }
        
        // 파일 존재 확인
        await fs.access(absolutePath);
        
        // HTML 파일 서빙
        res.sendFile(absolutePath);
        
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.status(404).json({
                success: false,
                error: '보고서 파일을 찾을 수 없습니다'
            });
        } else {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
});

// 진단 상태 확인
router.get('/status', async (req, res) => {
    try {
        const projectDir = path.join(__dirname, '../../../');
        const reportPath = path.join(projectDir, 'diagnostic_report.html');
        
        try {
            const stats = await fs.stat(reportPath);
            res.json({
                success: true,
                exists: true,
                lastModified: stats.mtime,
                size: stats.size,
                path: reportPath
            });
        } catch (error) {
            res.json({
                success: true,
                exists: false,
                path: reportPath
            });
        }
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;