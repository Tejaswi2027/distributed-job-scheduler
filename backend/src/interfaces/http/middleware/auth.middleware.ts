import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthenticationError } from '../../../shared/errors';
import { env } from '../../../shared/env';
import { logger } from '../../../infrastructure/logger/logger';

// Extend Express Request type declaration to hold user session context
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Authentication rejected: missing or malformed Bearer token in headers.', 'AUTH_MIDDLEWARE');
    throw new AuthenticationError('Authentication required. Format: Bearer <token>');
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; email: string };
    
    // Attach validated credentials to request context
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (err: any) {
    logger.warn(`Authentication failed: invalid token signature or expired token. Error: ${err.message}`, 'AUTH_MIDDLEWARE');
    throw new AuthenticationError('Invalid or expired authentication token.');
  }
}
