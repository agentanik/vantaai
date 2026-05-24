import { Request, Response } from 'express';
import { z } from 'zod';
import { apiKeyService } from '../services/apiKeyService';
import { logger } from '../lib/logger';

const createKeySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  scopes: z.array(
    z.enum([
      'admin:*',
      'pod:read',
      'pod:write',
      'video:generate',
      'video:read',
      'jobs:read',
      'jobs:write',
      'models:read',
      'models:write',
      'billing:read',
      'keys:read',
      'keys:write'
    ])
  ).min(1, 'At least one scope is required'),
  expiresAt: z.string().datetime().optional(),
  ownerUserId: z.string().optional(),
  teamId: z.string().optional()
});

const revokeKeySchema = z.object({
  reason: z.string().default('Revoked by user request')
});

export class ApiKeyController {
  public async createKey(req: Request, res: Response): Promise<void> {
    try {
      const parsedBody = createKeySchema.parse(req.body);
      const requesterId = (req as any).user?.id || 'unknown';

      // Enforce that only admins (or bootstrap) can create new API keys
      const auth = (req as any).auth;
      const isAdmin = auth?.scopes.includes('admin:*');
      if (!isAdmin) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Only admin keys can create new API keys.'
        });
        return;
      }

      const { rawKey, prefix, record } = await apiKeyService.createManagerApiKey({
        ...parsedBody,
        // If not specified by requester, default ownerUserId to requesterId
        ownerUserId: parsedBody.ownerUserId || requesterId
      });

      res.status(201).json({
        success: true,
        message: 'API Key generated successfully. Save this raw key, as it will never be displayed again.',
        data: {
          rawKey,
          prefix,
          record: {
            id: record.id,
            name: record.name,
            prefix: record.prefix,
            scopes: record.scopes,
            status: record.status,
            ownerUserId: record.ownerUserId,
            teamId: record.teamId,
            createdAt: record.createdAt,
            expiresAt: record.expiresAt
          }
        }
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, error: err.errors[0].message });
        return;
      }
      logger.error(`Error in createKey controller: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async listKeys(req: Request, res: Response): Promise<void> {
    try {
      // List keys is admin-only
      const auth = (req as any).auth;
      const isAdmin = auth?.scopes.includes('admin:*');
      if (!isAdmin) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Only admin keys can list API keys.'
        });
        return;
      }

      const keys = await apiKeyService.listManagerApiKeys();
      res.status(200).json({
        success: true,
        data: keys
      });
    } catch (err: any) {
      logger.error(`Error in listKeys controller: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async getKey(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const key = await apiKeyService.getApiKeyById(id);

      if (!key) {
        res.status(404).json({ success: false, error: 'API key not found.' });
        return;
      }

      // Enforce access control: Admin can read any key, non-admin can only read their own keys
      const auth = (req as any).auth;
      const requesterId = (req as any).user?.id || 'unknown';
      const isAdmin = auth?.scopes.includes('admin:*');
      if (!isAdmin && key.ownerUserId !== requesterId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Insufficient permissions to view this key.'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: key
      });
    } catch (err: any) {
      logger.error(`Error in getKey controller: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async revokeKey(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const parsedBody = revokeKeySchema.parse(req.body || {});
      const key = await apiKeyService.getApiKeyById(id);

      if (!key) {
        res.status(404).json({ success: false, error: 'API key not found.' });
        return;
      }

      // Enforce access control: Admin can revoke any key, non-admin can only revoke their own keys
      const auth = (req as any).auth;
      const requesterId = (req as any).user?.id || 'unknown';
      const isAdmin = auth?.scopes.includes('admin:*');
      if (!isAdmin && key.ownerUserId !== requesterId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Insufficient permissions to revoke this key.'
        });
        return;
      }

      await apiKeyService.revokeManagerApiKey(id, parsedBody.reason);
      res.status(200).json({
        success: true,
        message: 'API Key revoked successfully.'
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ success: false, error: err.errors[0].message });
        return;
      }
      logger.error(`Error in revokeKey controller: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public async rotateKey(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const key = await apiKeyService.getApiKeyById(id);

      if (!key) {
        res.status(404).json({ success: false, error: 'API key not found.' });
        return;
      }

      // Enforce access control: Admin can rotate any key, non-admin can only rotate their own keys
      const auth = (req as any).auth;
      const requesterId = (req as any).user?.id || 'unknown';
      const isAdmin = auth?.scopes.includes('admin:*');
      if (!isAdmin && key.ownerUserId !== requesterId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Insufficient permissions to rotate this key.'
        });
        return;
      }

      const { rawKey, record } = await apiKeyService.rotateManagerApiKey(id);
      res.status(200).json({
        success: true,
        message: 'API Key rotated successfully. Save this raw key, as it will never be displayed again.',
        data: {
          rawKey,
          record: {
            id: record.id,
            name: record.name,
            prefix: record.prefix,
            scopes: record.scopes,
            status: record.status,
            ownerUserId: record.ownerUserId,
            teamId: record.teamId,
            createdAt: record.createdAt,
            expiresAt: record.expiresAt
          }
        }
      });
    } catch (err: any) {
      logger.error(`Error in rotateKey controller: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const apiKeyController = new ApiKeyController();
