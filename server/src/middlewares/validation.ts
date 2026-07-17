import { Request, Response, NextFunction } from 'express';
import { Schema } from 'zod';
import { AppError } from '../utils/errors';

export const validateRequest = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const formattedErrors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return next(new AppError('Validation failed', 400, formattedErrors));
    }
    req.body = result.data;
    next();
  };
};
