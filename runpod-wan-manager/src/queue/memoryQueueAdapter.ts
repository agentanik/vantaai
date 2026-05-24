import { QueueAdapter } from './queueAdapter';
import { GenerationJob } from '../types/jobs';
import { jobRepository } from '../repositories/jobRepository';
import { logger } from '../lib/logger';

export class MemoryQueueAdapter implements QueueAdapter {
  public async enqueue(job: GenerationJob): Promise<void> {
    job.status = 'queued';
    job.updatedAt = new Date().toISOString();
    await jobRepository.save(job);
    logger.info(`Job ${job.id} enqueued successfully. (Priority: ${job.priority})`);
  }

  public async getNextJob(): Promise<GenerationJob | null> {
    const jobs = await jobRepository.list();
    // Get all pending/queued jobs
    const queuedJobs = jobs.filter((j) => j.status === 'queued');
    if (queuedJobs.length === 0) return null;

    // Sort by priority (critical > high > medium > low) and then by createdAt (FIFO)
    const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
    
    queuedJobs.sort((a, b) => {
      const weightA = priorityWeight[a.priority] || 2;
      const weightB = priorityWeight[b.priority] || 2;
      if (weightA !== weightB) {
        return weightB - weightA; // Higher priority first
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); // Older first
    });

    return queuedJobs[0];
  }

  public async cancel(jobId: string): Promise<void> {
    const job = await jobRepository.getById(jobId);
    if (job && (job.status === 'queued' || job.status === 'created')) {
      await jobRepository.updateStatus(jobId, 'cancelled');
      logger.info(`Job ${jobId} cancelled while in queue.`);
    }
  }

  public async getQueueSize(): Promise<number> {
    const pending = await this.listPending();
    return pending.length;
  }

  public async listPending(): Promise<GenerationJob[]> {
    const jobs = await jobRepository.list();
    return jobs.filter((j) => j.status === 'queued');
  }
}

export const memoryQueueAdapter = new MemoryQueueAdapter();
