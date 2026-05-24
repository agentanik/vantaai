import path from 'path';
import fs from 'fs';
import { GenerationJob, JobStatus, JobPriority } from '../types/jobs';
import { JobNotFoundError } from './errors';
import { logger } from './logger';
import { readJsonFile, writeJsonFile } from './fileUtils';

const STORE_PATH = path.join(process.cwd(), 'outputs', 'jobs.json');

class JobStore {
  private jobs: Map<string, GenerationJob> = new Map();

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(STORE_PATH)) {
        const stored = readJsonFile<GenerationJob[]>(STORE_PATH);
        if (Array.isArray(stored)) {
          stored.forEach(job => this.jobs.set(job.id, job));
          logger.info(`Loaded ${stored.length} jobs from local store at ${STORE_PATH}`);
        }
      }
    } catch (error: any) {
      logger.error(`Failed to load jobs from disk:`, error.message);
    }
  }

  private saveToDisk() {
    try {
      const jobList = Array.from(this.jobs.values());
      writeJsonFile(STORE_PATH, jobList);
    } catch (error: any) {
      logger.error(`Failed to persist jobs to disk:`, error.message);
    }
  }

  create(
    id: string,
    userId: string,
    modelId: string,
    priority: JobPriority,
    request: any,
    estimatedCostUsd?: number,
    estimatedCredits?: number
  ): GenerationJob {
    const now = new Date().toISOString();
    
    const job: GenerationJob = {
      id,
      userId,
      modelId,
      priority,
      status: 'created',
      request,
      retries: 0,
      maxRetries: 3,
      estimatedCostUsd,
      creditsCharged: estimatedCredits,
      createdAt: now,
      updatedAt: now
    };
    
    this.jobs.set(id, job);
    this.saveToDisk();
    logger.info(`Job created: ${id}`);
    return job;
  }

  get(id: string): GenerationJob {
    const job = this.jobs.get(id);
    if (!job) {
      throw new JobNotFoundError(id);
    }
    return job;
  }

  update(id: string, updates: Partial<Omit<GenerationJob, 'id' | 'createdAt'>>): GenerationJob {
    const job = this.get(id);
    const updatedJob: GenerationJob = {
      ...job,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.jobs.set(id, updatedJob);
    this.saveToDisk();
    logger.info(`Job ${id} status updated to: ${updatedJob.status}`);
    return updatedJob;
  }

  list(): GenerationJob[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

export const jobStore = new JobStore();
