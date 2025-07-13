const express = require('express');
const router = express.Router();
const FileAnalysisService = require('../services/FileAnalysisService');
const CodeAnalysisService = require('../services/CodeAnalysisService');
const WorkflowGeneratorService = require('../services/WorkflowGeneratorService');
const TranslationAnalysisService = require('../services/TranslationAnalysisService');
const { logger, logError, logInfo, logDebug, logWarn } = require('../utils/logger');

// 서비스 인스턴스 생성
const fileAnalysisService = new FileAnalysisService();
const codeAnalysisService = new CodeAnalysisService();
const workflowGeneratorService = new WorkflowGeneratorService();
const translationAnalysisService = new TranslationAnalysisService();

// 에러 핸들러 미들웨어
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 분석 결과 저장
 * POST /api/analysis/save
 */
router.post('/save', asyncHandler(async (req, res) => {
  const { projectName, analysisData } = req.body;
  
  if (!projectName || !analysisData) {
    return res.status(400).json({
      success: false,
      error: '프로젝트명과 분석 데이터가 필요합니다.'
    });
  }

  const result = await fileAnalysisService.saveAnalysis(projectName, analysisData);
  
  res.json({
    success: true,
    ...result
  });
}));

/**
 * 저장된 분석 결과 목록 조회
 * GET /api/analysis/list
 */
router.get('/list', asyncHandler(async (req, res) => {
  const analysisFiles = await fileAnalysisService.listAnalyses();
  
  res.json({
    success: true,
    files: analysisFiles,
    total: analysisFiles.length
  });
}));

/**
 * 특정 분석 결과 조회
 * GET /api/analysis/load/:filename
 */
router.get('/load/:filename', asyncHandler(async (req, res) => {
  const { filename } = req.params;
  
  try {
    const result = await fileAnalysisService.loadAnalysis(filename);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    if (error.message === '잘못된 파일명입니다.') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    if (error.code === 'ENOENT') {
      return res.status(404).json({
        success: false,
        error: '분석 파일을 찾을 수 없습니다.'
      });
    }
    throw error;
  }
}));

/**
 * 실시간 진행상황 스트리밍 엔드포인트
 * GET /api/analysis/analyze-stream/:sessionId
 */
router.get('/analyze-stream/:sessionId', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const sessionId = req.params.sessionId;
  
  // 세션별 이벤트 리스너 등록
  const sendProgress = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  
  // 전역 이벤트 이미터에 등록
  global.analysisEmitter = global.analysisEmitter || new (require('events').EventEmitter)();
  global.analysisEmitter.on(sessionId, sendProgress);
  
  req.on('close', () => {
    global.analysisEmitter.removeListener(sessionId, sendProgress);
  });
});

/**
 * 실제 프로젝트 분석 엔드포인트
 * POST /api/analysis/analyze
 */
router.post('/analyze', asyncHandler(async (req, res) => {
  const analysisResult = await workflowGeneratorService.analyzeWorkflow(
    req.body, 
    fileAnalysisService, 
    codeAnalysisService
  );
  
  logInfo('Analysis completed', { sessionId: req.body.sessionId });
  res.json(analysisResult);
}));

/**
 * 파일 의존성 분석
 * POST /api/analysis/dependencies
 */
router.post('/dependencies', asyncHandler(async (req, res) => {
  const { filePaths } = req.body;
  
  if (!filePaths || !Array.isArray(filePaths)) {
    return res.status(400).json({ 
      success: false,
      error: '파일 경로 배열이 필요합니다.' 
    });
  }

  const dependencies = await workflowGeneratorService.analyzeDependencies(
    filePaths, 
    codeAnalysisService
  );

  res.json({ 
    success: true, 
    dependencies 
  });
}));

/**
 * 순환 참조 감지
 * POST /api/analysis/circular-deps
 */
router.post('/circular-deps', asyncHandler(async (req, res) => {
  const { dependencies } = req.body;
  
  if (!dependencies || typeof dependencies !== 'object') {
    return res.status(400).json({ 
      success: false,
      error: '의존성 정보가 필요합니다.' 
    });
  }

  const cycles = workflowGeneratorService.detectCircularDependencies(dependencies);

  res.json({ 
    success: true, 
    cycles 
  });
}));

/**
 * API 엔드포인트 분석
 * POST /api/analysis/api-endpoints
 */
router.post('/api-endpoints', asyncHandler(async (req, res) => {
  const { filePaths } = req.body;
  
  if (!filePaths || !Array.isArray(filePaths)) {
    return res.status(400).json({ 
      success: false,
      error: '파일 경로 배열이 필요합니다.' 
    });
  }

  const endpoints = {
    backend: [],
    frontend: []
  };
  
  const fs = require('fs').promises;
  
  for (const filePath of filePaths) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // 백엔드 엔드포인트 추출
      const backendEndpoints = codeAnalysisService.extractBackendEndpoints(content, filePath);
      endpoints.backend.push(...backendEndpoints);
      
      // 프론트엔드 API 호출 추출
      const frontendCalls = codeAnalysisService.extractFrontendAPICalls(content, filePath);
      endpoints.frontend.push(...frontendCalls);
      
    } catch (error) {
      logError(error, { context: 'API endpoint analysis', filePath });
    }
  }

  // API 매칭 분석
  const matches = workflowGeneratorService.matchAPIs(endpoints.backend, endpoints.frontend);
  
  res.json({ 
    success: true, 
    endpoints,
    matches
  });
}));

/**
 * i18n 키 추출 및 커버리지 분석
 * POST /api/analysis/translation-keys
 */
router.post('/translation-keys', asyncHandler(async (req, res) => {
  const { filePaths, translationFiles } = req.body;
  
  if (!filePaths || !Array.isArray(filePaths)) {
    return res.status(400).json({ 
      success: false,
      error: '파일 경로 배열이 필요합니다.' 
    });
  }

  const translationKeys = await translationAnalysisService.analyzeTranslationCoverage(
    filePaths, 
    translationFiles
  );
  
  res.json({ 
    success: true, 
    translationKeys
  });
}));

// 에러 핸들러
router.use((error, req, res, next) => {
  logError(error, { context: 'Analysis route error', url: req.originalUrl });
  res.status(500).json({
    success: false,
    error: error.message || '서버 오류가 발생했습니다.'
  });
});

module.exports = router;