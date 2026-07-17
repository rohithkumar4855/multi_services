import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';
  const errors = err instanceof AppError ? err.errors : [];

  logger.error(`${req.method} ${req.url} - Error: ${message} (Status: ${statusCode})`);
  if (statusCode === 500 && err.stack) {
    logger.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
