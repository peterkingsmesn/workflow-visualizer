const { setCache, getCache, deleteCache, deleteCacheByPattern } = require('../lib/redis');

/**
 * 캐시 미들웨어 생성
 */
const createCacheMiddleware = (options = {}) => {
  const {
    ttl = 3600,           // 기본 TTL: 1시간
    keyGenerator = null,   // 캐시 키 생성 함수
    condition = null,      // 캐시 조건 함수
    skipCache = false      // 캐시 건너뛰기
  } = options;

  return async (req, res, next) => {
    if (skipCache) {
      return next();
    }

    // 캐시 키 생성
    const cacheKey = keyGenerator 
      ? keyGenerator(req)
      : `${req.method}:${req.originalUrl}`;

    // 캐시 조건 확인
    if (condition && !condition(req)) {
      return next();
    }

    try {
      // 캐시된 데이터 조회
      const cachedData = await getCache(cacheKey);
      
      if (cachedData) {
        // 캐시 히트
        res.setHeader('X-Cache', 'HIT');
        return res.json(cachedData);
      }

      // 캐시 미스 - 원본 응답 캐싱
      const originalSend = res.send;
      const originalJson = res.json;

      res.json = function(data) {
        // 성공적인 응답만 캐시
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setCache(cacheKey, data, ttl).catch(console.error);
        }
        res.setHeader('X-Cache', 'MISS');
        return originalJson.call(this, data);
      };

      res.send = function(data) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonData = JSON.parse(data);
            setCache(cacheKey, jsonData, ttl).catch(console.error);
          } catch (e) {
            // JSON이 아닌 데이터는 캐시하지 않음
          }
        }
        res.setHeader('X-Cache', 'MISS');
        return originalSend.call(this, data);
      };

      next();

    } catch (error) {
      console.error('캐시 미들웨어 오류:', error);
      next();
    }
  };
};

/**
 * 사용자별 캐시 키 생성
 */
const userCacheKey = (prefix) => (req) => {
  const userId = req.user?.id || 'anonymous';
  return `${prefix}:user:${userId}:${req.originalUrl}`;
};

/**
 * 쿼리 기반 캐시 키 생성
 */
const queryCacheKey = (prefix) => (req) => {
  const queryString = new URLSearchParams(req.query).toString();
  return `${prefix}:${req.path}:${queryString}`;
};

/**
 * 인증된 사용자만 캐시
 */
const authenticatedOnly = (req) => {
  return req.user != null;
};

/**
 * GET 요청만 캐시
 */
const getRequestsOnly = (req) => {
  return req.method === 'GET';
};

/**
 * 캐시 무효화 미들웨어
 */
const invalidateCache = (patterns) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;

    const invalidatePatterns = Array.isArray(patterns) ? patterns : [patterns];

    const performInvalidation = async () => {
      for (const pattern of invalidatePatterns) {
        const cachePattern = typeof pattern === 'function' ? pattern(req) : pattern;
        await deleteCacheByPattern(cachePattern);
      }
    };

    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        performInvalidation().catch(console.error);
      }
      return originalJson.call(this, data);
    };

    res.send = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        performInvalidation().catch(console.error);
      }
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * 구독 관련 캐시 미들웨어
 */
const subscriptionCache = createCacheMiddleware({
  ttl: 300, // 5분
  keyGenerator: userCacheKey('subscription'),
  condition: authenticatedOnly
});

/**
 * 사용량 관련 캐시 미들웨어
 */
const usageCache = createCacheMiddleware({
  ttl: 60, // 1분
  keyGenerator: userCacheKey('usage'),
  condition: authenticatedOnly
});

/**
 * 프로젝트 목록 캐시 미들웨어
 */
const projectListCache = createCacheMiddleware({
  ttl: 600, // 10분
  keyGenerator: userCacheKey('projects'),
  condition: authenticatedOnly
});

/**
 * 인보이스 목록 캐시 미들웨어
 */
const invoiceListCache = createCacheMiddleware({
  ttl: 1800, // 30분
  keyGenerator: userCacheKey('invoices'),
  condition: authenticatedOnly
});

/**
 * 사용자 정보 캐시 미들웨어
 */
const userInfoCache = createCacheMiddleware({
  ttl: 300, // 5분
  keyGenerator: userCacheKey('user'),
  condition: authenticatedOnly
});

/**
 * 캐시 무효화 패턴
 */
const invalidationPatterns = {
  // 사용자 관련 캐시 무효화
  userCache: (req) => `*:user:${req.user?.id}:*`,
  
  // 구독 관련 캐시 무효화
  subscriptionCache: (req) => `subscription:user:${req.user?.id}:*`,
  
  // 사용량 관련 캐시 무효화
  usageCache: (req) => `usage:user:${req.user?.id}:*`,
  
  // 프로젝트 관련 캐시 무효화
  projectCache: (req) => `projects:user:${req.user?.id}:*`,
  
  // 인보이스 관련 캐시 무효화
  invoiceCache: (req) => `invoices:user:${req.user?.id}:*`
};

/**
 * 캐시 통계 조회
 */
const getCacheStats = async () => {
  try {
    const info = await redisClient.info('memory');
    const keyspace = await redisClient.info('keyspace');
    
    return {
      memory: info,
      keyspace: keyspace,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('캐시 통계 조회 오류:', error);
    return null;
  }
};

/**
 * 캐시 플러시
 */
const flushCache = async (pattern = '*') => {
  try {
    await deleteCacheByPattern(pattern);
    return true;
  } catch (error) {
    console.error('캐시 플러시 오류:', error);
    return false;
  }
};

module.exports = {
  createCacheMiddleware,
  userCacheKey,
  queryCacheKey,
  authenticatedOnly,
  getRequestsOnly,
  invalidateCache,
  
  // 미리 정의된 캐시 미들웨어
  subscriptionCache,
  usageCache,
  projectListCache,
  invoiceListCache,
  userInfoCache,
  
  // 캐시 무효화 패턴
  invalidationPatterns,
  
  // 유틸리티 함수
  getCacheStats,
  flushCache
};