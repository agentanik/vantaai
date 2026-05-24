import { jsonDbClient } from '../db/jsonDbClient';
import { AuditLog } from '../types/audit';

export class AuditRepository {
  private tableName = 'audit-log';

  public async list(): Promise<AuditLog[]> {
    return await jsonDbClient.readTable<AuditLog>(this.tableName);
  }

  public async save(log: AuditLog): Promise<void> {
    const logs = await this.list();
    logs.push(log);
    // Keep only last 5000 logs locally to prevent memory overflow
    if (logs.length > 5000) {
      logs.shift();
    }
    await jsonDbClient.writeTable(this.tableName, logs);
  }
}

export const auditRepository = new AuditRepository();
