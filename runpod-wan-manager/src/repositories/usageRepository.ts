import { jsonDbClient } from '../db/jsonDbClient';
import { UsageLedgerEntry } from '../types/costs';

export class UsageRepository {
  private tableName = 'usage-ledger';

  public async list(): Promise<UsageLedgerEntry[]> {
    return await jsonDbClient.readTable<UsageLedgerEntry>(this.tableName);
  }

  public async getByUserId(userId: string): Promise<UsageLedgerEntry[]> {
    const list = await this.list();
    return list.filter((item) => item.userId === userId);
  }

  public async getByJobId(jobId: string): Promise<UsageLedgerEntry | null> {
    const list = await this.list();
    return list.find((item) => item.jobId === jobId) || null;
  }

  public async save(entry: UsageLedgerEntry): Promise<void> {
    const list = await this.list();
    const index = list.findIndex((item) => item.id === entry.id);
    if (index >= 0) {
      list[index] = entry;
    } else {
      list.push(entry);
    }
    await jsonDbClient.writeTable(this.tableName, list);
  }
}

export const usageRepository = new UsageRepository();
