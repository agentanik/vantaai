import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user;

  if (!user || user.role !== 'admin') {
    logger.warn(`Forbidden: User ${user?.id || 'unknown'} attempted to access admin endpoint: ${req.path}`);
    res.status(403).json({
      success: false,
      error: 'Access denied: Administrative privileges required.'
    });
    return;
  }

  next();
};
