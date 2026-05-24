import { jsonDbClient } from '../db/jsonDbClient';
import { AIModel } from '../types/models';

export class ModelRepository {
  private tableName = 'model-registry';

  public async getById(id: string): Promise<AIModel | null> {
    const list = await this.list();
    return list.find((m) => m.id === id) || null;
  }

  public async list(): Promise<AIModel[]> {
    return await jsonDbClient.readTable<AIModel>(this.tableName);
  }

  public async save(model: AIModel): Promise<void> {
    const list = await this.list();
    const index = list.findIndex((m) => m.id === model.id);
    if (index >= 0) {
      list[index] = model;
    } else {
      list.push(model);
    }
    await jsonDbClient.writeTable(this.tableName, list);
  }
}

export const modelRepository = new ModelRepository();

