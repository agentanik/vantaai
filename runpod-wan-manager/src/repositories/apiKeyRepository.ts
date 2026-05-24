import { jsonDbClient } from '../db/jsonDbClient';
import { ManagerApiKey } from '../types/apiKeys';

export class ApiKeyRepository {
  private tableName = 'api-keys';

  public async listApiKeys(): Promise<ManagerApiKey[]> {
    return await jsonDbClient.readTable<ManagerApiKey>(this.tableName);
  }

  public async getApiKeyById(id: string): Promise<ManagerApiKey | null> {
    const keys = await this.listApiKeys();
    return keys.find((key) => key.id === id) || null;
  }

  public async getApiKeyByPrefix(prefix: string): Promise<ManagerApiKey | null> {
    const keys = await this.listApiKeys();
    return keys.find((key) => key.prefix === prefix) || null;
  }

  public async createApiKey(record: ManagerApiKey): Promise<void> {
    const keys = await this.listApiKeys();
    keys.push(record);
    await jsonDbClient.writeTable(this.tableName, keys);
  }

  public async updateApiKey(id: string, patch: Partial<ManagerApiKey>): Promise<ManagerApiKey | null> {
    const keys = await this.listApiKeys();
    const index = keys.findIndex((key) => key.id === id);
    if (index >= 0) {
      const updated: ManagerApiKey = {
        ...keys[index],
        ...patch,
        updatedAt: new Date().toISOString()
      };
      keys[index] = updated;
      await jsonDbClient.writeTable(this.tableName, keys);
      return updated;
    }
    return null;
  }

  public async revokeApiKey(id: string, reason: string): Promise<ManagerApiKey | null> {
    return await this.updateApiKey(id, {
      status: 'revoked',
      revokedAt: new Date().toISOString(),
      revokedReason: reason
    });
  }

  public async markApiKeyUsed(id: string): Promise<void> {
    await this.updateApiKey(id, {
      lastUsedAt: new Date().toISOString()
    });
  }
}

export const apiKeyRepository = new ApiKeyRepository();
