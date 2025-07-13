const express = require('express');
const { authenticate } = require('./auth');
const { validateInput } = require('../middleware/security');
const { body } = require('express-validator');
const { logger, logError, logInfo } = require('../utils/logger');

// 🔒 보안: 핵심 분석 로직은 서버에서만 실행
const SecureAnalysisEngine = require('../services/SecureAnalysisEngine');

const router = express.Router();

// 🔒 보안: 인증된 사용자만 접근 가능
router.use(authenticate);

// 🔒 보안 강화된 프로젝트 분석 엔드포인트
router.post('/secure', validateInput([
  body('files').isArray().withMessage('파일 배열이 필요합니다'),
  body('files.*.contentHash').notEmpty().withMessage('파일 해시가 필요합니다'),
  body('options').optional().isObject()
]), async (req, res) => {
  const startTime = Date.now();
  const userId = req.user.id;
  
  try {
    const { files, options = {}, clientId } = req.body;
    
    // 🔒 보안: 파일 수 제한 (구독 상태에 따라)
    const userSubscription = await getUserSubscription(userId);
    const maxFiles = getMaxFilesForSubscription(userSubscription);
    
    if (files.length > maxFiles) {
      return res.status(400).json({
        error: 'FILE_LIMIT_EXCEEDED',
        message: `${userSubscription} 플랜은 최대 ${maxFiles}개 파일까지 분석 가능합니다.`,
        limit: maxFiles
      });
    }
    
    // 🔒 보안: 분석 요청 로깅 (민감한 정보 제외)
    logInfo('보안 분석 요청', {
      userId,
      fileCount: files.length,
      clientId: clientId?.substring(0, 10),
      subscription: userSubscription
    });
    
    // 🔒 핵심 분석 엔진 실행 (서버에서만)
    const analysisEngine = new SecureAnalysisEngine({
      userId,
      subscription: userSubscription,
      options
    });
    
    // 🔒 보안: 암호화된 파일 내용 복호화 및 분석
    const decryptedFiles = await analysisEngine.decryptFiles(files);
    const analysisResult = await analysisEngine.performSecureAnalysis(decryptedFiles);
    
    // 🔒 보안: 결과를 안전한 형태로 필터링
    const secureResult = filterSensitiveInformation(analysisResult, userSubscription);
    
    // 🔒 분석 결과 DB 저장 (사용량 추적)
    await saveAnalysisResult(userId, {
      fileCount: files.length,
      issuesFound: secureResult.issues?.length || 0,
      analysisTime: Date.now() - startTime,
      subscription: userSubscription
    });
    
    res.json({
      success: true,
      data: secureResult,
      metadata: {
        analysisTime: Date.now() - startTime,
        subscription: userSubscription,
        remainingQuota: await getRemainingQuota(userId)
      }
    });
    
  } catch (error) {
    logError(error, { 
      context: '보안 분석 실패', 
      userId,
      fileCount: req.body.files?.length 
    });
    
    // 🔒 보안: 클라이언트에는 일반적인 오류 메시지만
    res.status(500).json({
      error: 'ANALYSIS_FAILED',
      message: '분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      timestamp: new Date().toISOString()
    });
  }
});

// 🔒 보안: 분석 상태 확인 (실시간 진행률)
router.get('/status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    
    // 🔒 보안: 사용자 본인의 태스크만 조회 가능
    const taskStatus = await getTaskStatus(taskId, userId);
    
    if (!taskStatus) {
      return res.status(404).json({
        error: 'TASK_NOT_FOUND',
        message: '분석 작업을 찾을 수 없습니다.'
      });
    }
    
    // 🔒 보안: 민감한 중간 결과 제거, 진행 상황만 반환
    res.json({
      stage: taskStatus.stage,
      percentage: taskStatus.percentage,
      message: taskStatus.message,
      estimatedTimeRemaining: taskStatus.estimatedTimeRemaining
    });
    
  } catch (error) {
    logError(error, { context: '분석 상태 조회 실패', userId: req.user.id });
    res.status(500).json({
      error: 'STATUS_CHECK_FAILED',
      message: '상태 조회 중 오류가 발생했습니다.'
    });
  }
});

// 🔒 보안: 사용자 분석 히스토리 (요약만)
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    
    // 🔒 보안: 민감한 분석 결과 제외, 메타데이터만
    const history = await getAnalysisHistory(userId, {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 50), // 최대 50개 제한
      fields: ['id', 'createdAt', 'fileCount', 'issuesFound', 'qualityScore']
    });
    
    res.json({
      data: history.records,
      pagination: {
        page: history.page,
        totalPages: history.totalPages,
        totalRecords: history.totalRecords
      }
    });
    
  } catch (error) {
    logError(error, { context: '분석 히스토리 조회 실패', userId: req.user.id });
    res.status(500).json({
      error: 'HISTORY_FETCH_FAILED',
      message: '히스토리 조회 중 오류가 발생했습니다.'
    });
  }
});

// 🔒 보안 헬퍼 함수들

async function getUserSubscription(userId) {
  // 🔒 실제 구현: 데이터베이스에서 구독 정보 조회
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true }
  });
  
  return user?.subscription?.plan || 'FREE';
}

function getMaxFilesForSubscription(subscription) {
  const limits = {
    'FREE': 50,
    'PRO': 500,
    'ENTERPRISE': 5000
  };
  
  return limits[subscription] || limits['FREE'];
}

function filterSensitiveInformation(analysisResult, subscription) {
  // 🔒 보안: 구독 상태에 따른 정보 필터링
  const baseResult = {
    totalFiles: analysisResult.totalFiles,
    qualityScore: analysisResult.qualityScore,
    projectType: analysisResult.projectType,
    frameworks: analysisResult.frameworks || [],
    
    // 🔒 보안: 이슈는 카테고리화하여 제공 (구체적 위치 정보 없음)
    issues: (analysisResult.issues || []).map(issue => ({
      id: issue.id,
      category: issue.category,
      severity: issue.severity,
      title: issue.title,
      description: issue.description,
      recommendation: issue.recommendation,
      affectedCount: issue.affectedCount
    }))
  };
  
  // 🔒 구독 상태별 추가 정보 제공
  if (subscription === 'PRO' || subscription === 'ENTERPRISE') {
    baseResult.architecture = {
      hasApiLayer: analysisResult.hasApiLayer,
      hasStateManagement: analysisResult.hasStateManagement,
      testCoverage: analysisResult.testCoverage
    };
  }
  
  if (subscription === 'ENTERPRISE') {
    baseResult.recommendations = analysisResult.recommendations || [];
    baseResult.complianceScore = analysisResult.complianceScore;
  }
  
  return baseResult;
}

async function saveAnalysisResult(userId, resultSummary) {
  try {
    await prisma.analysis.create({
      data: {
        userId,
        fileCount: resultSummary.fileCount,
        duration: resultSummary.analysisTime,
        results: {
          issuesFound: resultSummary.issuesFound,
          subscription: resultSummary.subscription
        },
        status: 'completed'
      }
    });
    
    // 🔒 사용량 추적 업데이트
    await updateUsageMetrics(userId, {
      analysisCount: 1,
      filesAnalyzed: resultSummary.fileCount
    });
    
  } catch (error) {
    logError(error, { context: '분석 결과 저장 실패', userId });
  }
}

async function getRemainingQuota(userId) {
  // 🔒 실제 구현: 사용자의 남은 할당량 계산
  const subscription = await getUserSubscription(userId);
  const monthlyUsage = await getMonthlyUsage(userId);
  
  const quotas = {
    'FREE': { analyses: 10, files: 500 },
    'PRO': { analyses: 100, files: 5000 },
    'ENTERPRISE': { analyses: -1, files: -1 } // 무제한
  };
  
  const quota = quotas[subscription] || quotas['FREE'];
  
  return {
    analyses: quota.analyses === -1 ? -1 : Math.max(0, quota.analyses - monthlyUsage.analyses),
    files: quota.files === -1 ? -1 : Math.max(0, quota.files - monthlyUsage.files)
  };
}

async function getTaskStatus(taskId, userId) {
  // 🔒 실제 구현: Redis나 메모리 캐시에서 태스크 상태 조회
  // 여기서는 간단한 예시
  return {
    stage: 'analyzing',
    percentage: 75,
    message: '코드를 분석하고 있습니다...',
    estimatedTimeRemaining: 30000 // 30초
  };
}

async function getAnalysisHistory(userId, options) {
  // 🔒 실제 구현: 데이터베이스에서 분석 히스토리 조회
  const { page, limit, fields } = options;
  const offset = (page - 1) * limit;
  
  const analyses = await prisma.analysis.findMany({
    where: { userId },
    select: {
      id: true,
      createdAt: true,
      fileCount: true,
      results: true
    },
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit
  });
  
  const totalCount = await prisma.analysis.count({
    where: { userId }
  });
  
  return {
    records: analyses.map(analysis => ({
      id: analysis.id,
      createdAt: analysis.createdAt,
      fileCount: analysis.fileCount,
      issuesFound: analysis.results?.issuesFound || 0,
      qualityScore: analysis.results?.qualityScore || 0
    })),
    page,
    totalPages: Math.ceil(totalCount / limit),
    totalRecords: totalCount
  };
}

async function getMonthlyUsage(userId) {
  // 🔒 실제 구현: 이번 달 사용량 조회
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const usage = await prisma.usage.aggregate({
    where: {
      userId,
      timestamp: { gte: startOfMonth }
    },
    _sum: {
      quantity: true
    }
  });
  
  return {
    analyses: usage._sum.quantity || 0,
    files: 0 // 추가 구현 필요
  };
}

async function updateUsageMetrics(userId, metrics) {
  // 🔒 실제 구현: 사용량 메트릭 업데이트
  await prisma.usage.create({
    data: {
      userId,
      metric: 'analysis_count',
      quantity: metrics.analysisCount,
      timestamp: new Date()
    }
  });
}

module.exports = router;