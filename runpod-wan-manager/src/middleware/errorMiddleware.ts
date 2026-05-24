import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';
import { safeApiError } from '../utils/safeApiError';
import { v4 as uuidv4 } from 'uuid';

export function errorMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
  const requestId = (req as any).requestId || uuidv4();
  
  // Log the real error to the server side (logger redactSecrets will clean it)
  logger.error(`[${requestId}] Unhandled Error in ${req.method} ${req.path}: ${err.message}`, err);

  const safeResponse = safeApiError(err, requestId);
  const status = err.status || err.statusCode || 500;
  
  res.status(status).json(safeResponse);
}
