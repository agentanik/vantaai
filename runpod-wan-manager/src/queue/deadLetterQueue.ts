import { jsonDbClient } from '../db/jsonDbClient';
import { GenerationJob } from '../types/jobs';
import { logger } from '../lib/logger';

export class DeadLetterQueue {
  private tableName = 'dead-letter-jobs';

  /**
   * Moves a failed job that exceeded max retries to the Dead Letter Queue table.
   */
  public async sendToDLQ(job: GenerationJob, reason: string): Promise<void> {
    try {
      const dlqJobs = await jsonDbClient.readTable<any>(this.tableName);
      dlqJobs.push({
        ...job,
        dlqReason: reason,
        sentToDlqAt: new Date().toISOString()
      });
      await jsonDbClient.writeTable(this.tableName, dlqJobs);
      logger.warn(`Job ${job.id} sent to DLQ (Dead Letter Queue). Reason: ${reason}`);
    } catch (err: any) {
      logger.error(`Failed to write to Dead Letter Queue: ${err.message}`);
    }
  }

  public async listDLQ(): Promise<any[]> {
    return await jsonDbClient.readTable<any>(this.tableName);
  }
}

export const deadLetterQueue = new DeadLetterQueue();
