import { QueueAdapter } from './queueAdapter';
import { GenerationJob } from '../types/jobs';
import { logger } from '../lib/logger';

/**
 * BullMQ / Redis enterprise scaling queue adapter placeholder.
 */
export class BullMQQueueAdapter implements QueueAdapter {
  constructor() {
    logger.info('BullMQQueueAdapter placeholder initialized. (Not active)');
  }

  public async enqueue(job: GenerationJob): Promise<void> {
    logger.debug(`[BULLMQ-PLACEHOLDER] Push job to Redis queue: ${job.id}`);
    throw new Error('BullMQQueueAdapter is a placeholder. Switch QUEUE_ADAPTER=redis to use in production.');
  }

  public async getNextJob(): Promise<GenerationJob | null> {
    return null;
  }

  public async cancel(jobId: string): Promise<void> {
    logger.debug(`[BULLMQ-PLACEHOLDER] Remove job from Redis queue: ${jobId}`);
  }

  public async getQueueSize(): Promise<number> {
    return 0;
  }

  public async listPending(): Promise<GenerationJob[]> {
    return [];
  }
}

export const bullmqQueueAdapter = new BullMQQueueAdapter();
