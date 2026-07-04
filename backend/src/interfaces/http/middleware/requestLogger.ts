import { Request, Response, NextFunction } from 'express';
import { logger } from '../../../infrastructure/logger/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startedAt = Date.now();

  res.on('finish', () => {
    const elapsed = Date.now() - startedAt;
    const logMsg = `${req.method} ${req.originalUrl} - ${res.statusCode} (${elapsed}ms)`;
    
    if (res.statusCode >= 500) {
      logger.error(logMsg, 'HTTP_REQ', { ip: req.ip, userAgent: req.headers['user-agent'] });
    } else if (res.statusCode >= 400) {
      logger.warn(logMsg, 'HTTP_REQ', { ip: req.ip });
    } else {
      logger.info(logMsg, 'HTTP_REQ', { elapsedMs: elapsed });
    }
  });

  next();
}
