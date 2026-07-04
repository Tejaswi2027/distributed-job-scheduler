import { Request, Response, NextFunction } from 'express';
import { BaseError } from '../../../shared/errors';
import { logger } from '../../../infrastructure/logger/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof BaseError) {
    logger.warn(`API Error handling: ${err.message}`, 'ERROR_HANDLER', {
      statusCode: err.statusCode,
      details: err.details,
      path: req.originalUrl,
    });

    return res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  // Unhandled internal server error
  logger.error(`Critical Unhandled Exception: ${err.message}`, 'ERROR_HANDLER', err);

  return res.status(500).json({
    error: 'InternalServerError',
    message: 'An unexpected database or systems error has occurred.',
  });
}
