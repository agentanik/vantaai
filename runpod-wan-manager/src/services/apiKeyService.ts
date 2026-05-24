import { apiKeyRepository } from '../repositories/apiKeyRepository';
import { generateManagerApiKey, hashApiKey, timingSafeCompareHash } from '../security/apiKeyHash';
import { auditLogService } from './auditLogService';
import { env } from '../config/env';
import { idUtils } from '../lib/idUtils';
import { ManagerApiKey, ApiKeyScope } from '../types/apiKeys';

export class ApiKeyService {
  public async createManagerApiKey(input: {
    name: string;
    scopes: ApiKeyScope[];
    expiresAt?: string;
    ownerUserId?: string;
    teamId?: string;
  }): Promise<{ rawKey: string; prefix: string; record: ManagerApiKey }> {
    if (!input.name) {
      throw new Error('Name is required.');
    }
    if (!input.scopes || input.scopes.length === 0) {
      throw new Error('At least one scope is required.');
    }

    // Default to live mode, or test if specified
    const mode = process.env.NODE_ENV === 'test' ? 'test' : 'live';
    const { rawKey, prefix, hash } = generateManagerApiKey(mode);

    const record: ManagerApiKey = {
      id: idUtils.generateId('key'),
      name: input.name,
      prefix,
      keyHash: hash,
      scopes: input.scopes,
      status: 'active',
      ownerUserId: input.ownerUserId,
      teamId: input.teamId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: input.expiresAt
    };

    await apiKeyRepository.createApiKey(record);
    auditLogService.log('api_key_created', { apiKeyId: record.id }, input.ownerUserId);

    return { rawKey, prefix, record };
  }

  public async validateManagerApiKey(
    rawKey: string,
    requiredScope?: ApiKeyScope
  ): Promise<{
    type: 'bootstrap' | 'manager_api_key';
    apiKeyId?: string;
    scopes: ApiKeyScope[];
    ownerUserId?: string;
    teamId?: string;
  }> {
    // 1. Allow bootstrap key if configured
    if (env.managerApiKey && rawKey === env.managerApiKey) {
      return {
        type: 'bootstrap',
        scopes: ['admin:*'],
        ownerUserId: 'admin-user',
        teamId: 'admin-team'
      };
    }

    // 2. Resolve database-backed key
    const prefix = rawKey.substring(0, 13);
    const keyHash = hashApiKey(rawKey);
    const keys = await apiKeyRepository.listApiKeys();
    const keysWithPrefix = keys.filter((k) => k.prefix === prefix);

    let matchedKey: ManagerApiKey | null = null;
    for (const key of keysWithPrefix) {
      if (timingSafeCompareHash(key.keyHash, keyHash)) {
        matchedKey = key;
        break;
      }
    }

    if (!matchedKey) {
      auditLogService.log('api_key_auth_failed', { prefix, reason: 'Invalid API key credentials' });
      throw new Error('Invalid API credentials.');
    }

    // 3. Check status
    if (matchedKey.status === 'revoked') {
      auditLogService.log('api_key_auth_failed', { apiKeyId: matchedKey.id, prefix, reason: 'Key has been revoked' }, matchedKey.ownerUserId);
      throw new Error('API key has been revoked.');
    }

    if (matchedKey.status === 'expired') {
      auditLogService.log('api_key_auth_failed', { apiKeyId: matchedKey.id, prefix, reason: 'Key has expired' }, matchedKey.ownerUserId);
      throw new Error('API key has expired.');
    }

    // 4. Check expiration datetime
    if (matchedKey.expiresAt && new Date(matchedKey.expiresAt) < new Date()) {
      await apiKeyRepository.updateApiKey(matchedKey.id, { status: 'expired' });
      auditLogService.log('api_key_expired', { apiKeyId: matchedKey.id }, matchedKey.ownerUserId);
      auditLogService.log('api_key_auth_failed', { apiKeyId: matchedKey.id, prefix, reason: 'Key expired' }, matchedKey.ownerUserId);
      throw new Error('API key has expired.');
    }

    // 5. Check permissions/scopes
    if (requiredScope) {
      const hasAdminScope = matchedKey.scopes.includes('admin:*');
      const hasDirectScope = matchedKey.scopes.includes(requiredScope);
      if (!hasAdminScope && !hasDirectScope) {
        auditLogService.log(
          'api_key_auth_failed',
          { apiKeyId: matchedKey.id, prefix, reason: `Missing required scope: ${requiredScope}` },
          matchedKey.ownerUserId
        );
        throw new Error(`Insufficient permissions. Required scope: ${requiredScope}`);
      }
    }

    // 6. Record usage and timestamp
    await apiKeyRepository.markApiKeyUsed(matchedKey.id);
    auditLogService.log('api_key_used', { apiKeyId: matchedKey.id }, matchedKey.ownerUserId);

    return {
      type: 'manager_api_key',
      apiKeyId: matchedKey.id,
      scopes: matchedKey.scopes,
      ownerUserId: matchedKey.ownerUserId,
      teamId: matchedKey.teamId
    };
  }

  public async revokeManagerApiKey(id: string, reason: string): Promise<void> {
    const key = await apiKeyRepository.getApiKeyById(id);
    if (!key) {
      throw new Error('Key not found.');
    }

    await apiKeyRepository.revokeApiKey(id, reason);
    auditLogService.log('api_key_revoked', { apiKeyId: id, reason }, key.ownerUserId);
  }

  public async rotateManagerApiKey(id: string): Promise<{ rawKey: string; record: ManagerApiKey }> {
    const oldKey = await apiKeyRepository.getApiKeyById(id);
    if (!oldKey) {
      throw new Error('Key not found.');
    }

    // Revoke old key
    await apiKeyRepository.revokeApiKey(id, 'Rotated');
    auditLogService.log('api_key_revoked', { apiKeyId: id, reason: 'Rotated' }, oldKey.ownerUserId);

    // Create new key
    const mode = oldKey.prefix.startsWith('mgr_live_') ? 'live' : 'test';
    const { rawKey, prefix, hash } = generateManagerApiKey(mode);

    const record: ManagerApiKey = {
      id: idUtils.generateId('key'),
      name: `${oldKey.name} rotated`,
      prefix,
      keyHash: hash,
      scopes: oldKey.scopes,
      status: 'active',
      ownerUserId: oldKey.ownerUserId,
      teamId: oldKey.teamId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: oldKey.expiresAt
    };

    await apiKeyRepository.createApiKey(record);
    auditLogService.log('api_key_rotated', { oldKeyId: id, newKeyId: record.id }, oldKey.ownerUserId);

    return { rawKey, record };
  }

  public async listManagerApiKeys(): Promise<Omit<ManagerApiKey, 'keyHash'>[]> {
    const keys = await apiKeyRepository.listApiKeys();
    return keys.map(({ keyHash, ...safeKey }) => safeKey);
  }

  public async getApiKeyById(id: string): Promise<Omit<ManagerApiKey, 'keyHash'> | null> {
    const key = await apiKeyRepository.getApiKeyById(id);
    if (!key) return null;
    const { keyHash, ...safeKey } = key;
    return safeKey;
  }
}

export const apiKeyService = new ApiKeyService();
