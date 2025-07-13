import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number;    // 시간 윈도우 (밀리초)
  maxRequests: number; // 최대 요청 수
  message?: string;    // 제한 시 메시지
  skipSuccessfulRequests?: boolean; // 성공한 요청은 제외
  skipFailedRequests?: boolean;     // 실패한 요청은 제외
}

interface ClientInfo {
  count: number;
  resetTime: number;
  firstRequest: number;
}

class RateLimiter {
  private clients = new Map<string, ClientInfo>();
  private options: RateLimitOptions;

  constructor(options: RateLimitOptions) {
    this.options = {
      message: 'API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...options
    };

    // 주기적으로 만료된 클라이언트 정보 정리
    setInterval(() => {
      this.cleanup();
    }, this.options.windowMs);
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const clientId = this.getClientId(req);
      const now = Date.now();
      
      let client = this.clients.get(clientId);
      
      if (!client) {
        // 새 클라이언트
        client = {
          count: 1,
          resetTime: now + this.options.windowMs,
          firstRequest: now
        };
        this.clients.set(clientId, client);
        return next();
      }

      // 시간 윈도우가 지났으면 리셋
      if (now > client.resetTime) {
        client.count = 1;
        client.resetTime = now + this.options.windowMs;
        client.firstRequest = now;
        return next();
      }

      // 요청 수 증가
      client.count++;

      // 제한 확인
      if (client.count > this.options.maxRequests) {
        const remainingTime = Math.ceil((client.resetTime - now) / 1000);
        
        return res.status(429).json({
          success: false,
          error: this.options.message,
          retryAfter: remainingTime,
          limit: this.options.maxRequests,
          remaining: 0,
          reset: new Date(client.resetTime).toISOString()
        });
      }

      // 응답 헤더 설정
      res.set({
        'X-RateLimit-Limit': this.options.maxRequests.toString(),
        'X-RateLimit-Remaining': (this.options.maxRequests - client.count).toString(),
        'X-RateLimit-Reset': new Date(client.resetTime).toISOString(),
        'X-RateLimit-Window': this.options.windowMs.toString()
      });

      // 성공/실패 요청 스킵 처리
      const originalEnd = res.end;
      res.end = function(this: Response, ...args: any[]) {
        const statusCode = this.statusCode;
        
        if (
          (this.locals.rateLimiter?.options.skipSuccessfulRequests && statusCode < 400) ||
          (this.locals.rateLimiter?.options.skipFailedRequests && statusCode >= 400)
        ) {
          client!.count--;
        }
        
        return originalEnd.apply(this, args);
      };

      res.locals.rateLimiter = { options: this.options };
      next();
    };
  }

  private getClientId(req: Request): string {
    // IP 주소를 기반으로 클라이언트 식별
    const forwarded = req.headers['x-forwarded-for'] as string;
    const ip = forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress;
    
    // 인증된 사용자의 경우 사용자 ID 사용
    const user = (req as any).user;
    if (user && user.id) {
      return `user:${user.id}`;
    }
    
    return `ip:${ip}`;
  }

  private cleanup(): void {
    const now = Date.now();
    
    for (const [clientId, client] of this.clients.entries()) {
      if (now > client.resetTime) {
        this.clients.delete(clientId);
      }
    }
  }

  // 통계 정보
  getStats(): {
    totalClients: number;
    activeClients: number;
    topClients: Array<{ id: string; count: number; remaining: number }>;
  } {
    const now = Date.now();
    const activeClients = Array.from(this.clients.entries())
      .filter(([_, client]) => now <= client.resetTime)
      .map(([id, client]) => ({
        id,
        count: client.count,
        remaining: Math.max(0, this.options.maxRequests - client.count)
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalClients: this.clients.size,
      activeClients: activeClients.length,
      topClients: activeClients.slice(0, 10)
    };
  }
}

// 사전 정의된 제한 설정들
export const createRateLimiter = (options: RateLimitOptions) => {
  return new RateLimiter(options);
};

// 일반적인 API용 제한
export const rateLimitMiddleware = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15분
  maxRequests: 100,           // 15분당 100 요청
  message: 'API 호출 한도를 초과했습니다. 15분 후 다시 시도해주세요.'
}).middleware();

// 엄격한 제한 (인증, 중요한 작업)
export const strictRateLimitMiddleware = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15분
  maxRequests: 5,            // 15분당 5 요청
  message: '보안상 이 작업은 제한됩니다. 15분 후 다시 시도해주세요.'
}).middleware();

// 느슨한 제한 (공개 API, 읽기 전용)
export const lenientRateLimitMiddleware = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15분
  maxRequests: 1000,         // 15분당 1000 요청
  skipSuccessfulRequests: true
}).middleware();

// 파일 업로드용 제한
export const uploadRateLimitMiddleware = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1시간
  maxRequests: 10,           // 1시간당 10 업로드
  message: '파일 업로드 한도를 초과했습니다. 1시간 후 다시 시도해주세요.'
}).middleware();

// 분석 작업용 제한 (CPU 집약적)
export const analysisRateLimitMiddleware = createRateLimiter({
  windowMs: 5 * 60 * 1000,  // 5분
  maxRequests: 3,            // 5분당 3 분석
  message: '분석 작업 한도를 초과했습니다. 5분 후 다시 시도해주세요.'
}).middleware();

// IP별 제한 (DDoS 방지)
export const ipRateLimitMiddleware = createRateLimiter({
  windowMs: 1 * 60 * 1000,  // 1분
  maxRequests: 60,           // 1분당 60 요청
  message: '요청이 너무 빠릅니다. 잠시 후 다시 시도해주세요.'
}).middleware();

// 개발 환경용 (제한 없음)
export const devRateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  return rateLimitMiddleware(req, res, next);
};