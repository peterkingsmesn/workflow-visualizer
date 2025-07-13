import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * JWT 인증 미들웨어
 */
export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // 개발 모드에서는 인증 스킵
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
      req.user = {
        id: 'dev-user',
        email: 'dev@example.com',
        role: 'user'
      };
      return next();
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: '인증 토큰이 필요합니다'
      });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: '유효한 토큰이 필요합니다'
      });
    }

    // JWT 토큰 검증
    const secret = process.env.JWT_SECRET || 'default-secret-key';
    const decoded = jwt.verify(token, secret) as any;

    if (!decoded.id || !decoded.email) {
      return res.status(401).json({
        success: false,
        error: '토큰 형식이 올바르지 않습니다'
      });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'user'
    };

    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: '토큰이 만료되었습니다'
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: '유효하지 않은 토큰입니다'
        });
      }
    }

    return res.status(500).json({
      success: false,
      error: '인증 처리 중 오류가 발생했습니다'
    });
  }
};

/**
 * 관리자 권한 확인 미들웨어
 */
export const adminMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: '관리자 권한이 필요합니다'
    });
  }
  next();
};

/**
 * API 키 인증 미들웨어 (서버 간 통신용)
 */
export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKey = process.env.API_KEY;

  if (!validApiKey) {
    return res.status(500).json({
      success: false,
      error: 'API 키가 설정되지 않았습니다'
    });
  }

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      success: false,
      error: '유효하지 않은 API 키입니다'
    });
  }

  next();
};

/**
 * 옵셔널 인증 미들웨어 (인증 없이도 접근 가능)
 */
export const optionalAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return next();
    }

    const secret = process.env.JWT_SECRET || 'default-secret-key';
    const decoded = jwt.verify(token, secret) as any;

    if (decoded.id && decoded.email) {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role || 'user'
      };
    }

    next();
  } catch (error) {
    // 토큰이 유효하지 않아도 계속 진행
    next();
  }
};