import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

const requestCounts = new Map<string, { count: number; resetTime: number }>();
const LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 calls per minute

export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  const ipRecord = requestCounts.get(ip);
  
  if (!ipRecord || now > ipRecord.resetTime) {
    requestCounts.set(ip, {
      count: 1,
      resetTime: now + LIMIT_WINDOW_MS
    });
    return next();
  }
  
  ipRecord.count += 1;
  
  if (ipRecord.count > MAX_REQUESTS_PER_WINDOW) {
    logger.warn(`Rate limit exceeded for IP: ${ip} on path: ${req.path}`);
    res.status(429).json({
      success: false,
      error: 'Too Many Requests. Please slow down and try again later.'
    });
    return;
  }
  
  next();
};
