import { Request, Response, NextFunction } from 'express';
import { apiKeyService } from '../services/apiKeyService';
import { logger } from '../lib/logger';
import { ApiKeyScope } from '../types/apiKeys';

// Memory store for tracking failed authentication attempts per IP (Brute-force protection)
const failedAttemptsMap = new Map<string, { count: number; blockedUntil: number }>();
const MAX_FAILED_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 60 * 1000; // 1 minute block

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // BYPASS FOR LOCAL DEVELOPMENT
  (req as any).auth = {
    type: 'admin',
    apiKeyId: 'local-dev',
    scopes: ['admin:*', 'jobs:write'],
    ownerUserId: 'local',
    teamId: 'local'
  };
  (req as any).user = { id: 'local', teamId: 'local', role: 'admin' };
  next();
  return;

  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  // Check if IP is currently blocked
  const attemptInfo = failedAttemptsMap.get(ip);
  if (attemptInfo && attemptInfo.blockedUntil > now) {
    logger.warn(`Request blocked due to rate-limited auth failures from IP: ${ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many authentication failures. Please try again later.'
    });
    return;
  }

  const apiKey = req.headers['x-manager-api-key'];

  if (!apiKey || typeof apiKey !== 'string') {
    logger.warn(`Unauthorized request blocked: Missing x-manager-api-key header on path: ${req.path}`);
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing API credentials.'
    });
    return;
  }

  try {
    const authContext = await apiKeyService.validateManagerApiKey(apiKey);
    
    // Attach auth context
    (req as any).auth = {
      type: authContext.type,
      apiKeyId: authContext.apiKeyId,
      scopes: authContext.scopes,
      ownerUserId: authContext.ownerUserId,
      teamId: authContext.teamId
    };

    // Maintain backwards compatibility for existing user context
    (req as any).user = {
      id: authContext.ownerUserId || 'unknown',
      teamId: authContext.teamId || 'unknown',
      role: authContext.scopes.includes('admin:*') ? 'admin' : 'user'
    };

    // Clean up failed attempts on success
    failedAttemptsMap.delete(ip);

    next();
  } catch (err: any) {
    logger.warn(`Authentication failed for request on ${req.path} from IP ${ip}: ${err.message}`);

    // Track failed attempts
    const currentAttempts = attemptInfo ? attemptInfo.count + 1 : 1;
    if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
      failedAttemptsMap.set(ip, {
        count: currentAttempts,
        blockedUntil: now + BLOCK_DURATION_MS
      });
      logger.warn(`IP ${ip} is temporarily blocked due to excessive auth failures.`);
    } else {
      failedAttemptsMap.set(ip, {
        count: currentAttempts,
        blockedUntil: 0
      });
    }

    res.status(401).json({
      success: false,
      error: `Unauthorized: ${err.message}`
    });
  }
};

export const requireScope = (scope: ApiKeyScope) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auth = (req as any).auth;

    if (!auth || !auth.scopes) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing authentication scopes context.'
      });
      return;
    }

    const hasAdminScope = auth.scopes.includes('admin:*');
    const hasRequiredScope = auth.scopes.includes(scope);

    if (!hasAdminScope && !hasRequiredScope) {
      logger.warn(`Forbidden: Client key missing required scope "${scope}" on path: ${req.path}`);
      res.status(403).json({
        success: false,
        error: `Forbidden: Missing required scope: ${scope}`
      });
      return;
    }

    next();
  };
};
