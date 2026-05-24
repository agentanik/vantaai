import { jsonDbClient } from '../db/jsonDbClient';
import { ProviderDefinition } from '../types/providers';

export class ProviderRepository {
  private tableName = 'provider-registry';

  public async getById(id: string): Promise<ProviderDefinition | null> {
    const list = await this.list();
    return list.find((p) => p.id === id) || null;
  }

  public async list(): Promise<ProviderDefinition[]> {
    return await jsonDbClient.readTable<ProviderDefinition>(this.tableName);
  }

  public async save(provider: ProviderDefinition): Promise<void> {
    const list = await this.list();
    const index = list.findIndex((p) => p.id === provider.id);
    if (index >= 0) {
      list[index] = provider;
    } else {
      list.push(provider);
    }
    await jsonDbClient.writeTable(this.tableName, list);
  }
}

export const providerRepository = new ProviderRepository();
