import { GenerationJob, JobStatus } from '../types/jobs';
import { ResourceNotFoundError } from '../lib/errors';
import { logger } from '../lib/logger';
import { timeUtils } from '../lib/timeUtils';
import { jobRepository } from '../repositories/jobRepository';

class JobStore {
  // Sync fallback cache for endpoints that expect synchronous reads
  private syncCache: Map<string, GenerationJob> = new Map();

  constructor() {
    this.refreshCache();
  }

  private refreshCache() {
    jobRepository.list().then((list) => {
      list.forEach((job) => this.syncCache.set(job.id, job));
    }).catch((err) => {
      logger.error(`Failed to seed jobStore sync cache: ${err.message}`);
    });
  }

  public create(
    id: string,
    userId: string,
    modelId: string,
    priority: GenerationJob['priority'],
    request: any,
    estimatedCostUsd: number,
    creditsCharged: number
  ): GenerationJob {
    const now = timeUtils.now();
    
    const job: GenerationJob = {
      id,
      userId,
      modelId,
      priority,
      status: 'created',
      request,
      retries: 0,
      maxRetries: request.maxRetries || 2,
      estimatedCostUsd,
      creditsCharged,
      callbackUrl: request.callbackUrl,
      createdAt: now,
      updatedAt: now
    };
    
    this.syncCache.set(id, job);
    jobRepository.save(job).catch((err) => {
      logger.error(`Async repository save failed for job ${id}: ${err.message}`);
    });
    
    logger.info(`Job created: ${id}`);
    return job;
  }

  public get(id: string): GenerationJob {
    const job = this.syncCache.get(id);
    if (!job) {
      throw new ResourceNotFoundError(`Job ${id} not found in database.`);
    }
    return job;
  }

  public update(id: string, updates: Partial<Omit<GenerationJob, 'id' | 'createdAt'>>): GenerationJob {
    const job = this.get(id);
    const updatedJob: GenerationJob = {
      ...job,
      ...updates,
      updatedAt: timeUtils.now()
    };
    
    this.syncCache.set(id, updatedJob);
    jobRepository.save(updatedJob).catch((err) => {
      logger.error(`Async repository update failed for job ${id}: ${err.message}`);
    });

    logger.info(`Job ${id} updated status to: ${updatedJob.status}`);
    return updatedJob;
  }

  public list(): GenerationJob[] {
    return Array.from(this.syncCache.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

export const jobStore = new JobStore();
export { JobStatus };

