import { jsonDbClient } from '../db/jsonDbClient';
import { GenerationJob, JobStatus } from '../types/jobs';
import { logger } from '../lib/logger';

export class JobRepository {
  private tableName = 'jobs';

  public async getById(id: string): Promise<GenerationJob | null> {
    const jobs = await this.list();
    return jobs.find((job) => job.id === id) || null;
  }

  public async list(): Promise<GenerationJob[]> {
    return await jsonDbClient.readTable<GenerationJob>(this.tableName);
  }

  public async save(job: GenerationJob): Promise<void> {
    const jobs = await this.list();
    const index = jobs.findIndex((j) => j.id === job.id);
    if (index >= 0) {
      jobs[index] = job;
    } else {
      jobs.push(job);
    }
    await jsonDbClient.writeTable(this.tableName, jobs);
  }

  public async updateStatus(id: string, status: JobStatus, details?: Partial<GenerationJob>): Promise<GenerationJob | null> {
    const jobs = await this.list();
    const index = jobs.findIndex((j) => j.id === id);
    if (index >= 0) {
      const updatedJob: GenerationJob = {
        ...jobs[index],
        status,
        updatedAt: new Date().toISOString(),
        ...details
      };
      jobs[index] = updatedJob;
      await jsonDbClient.writeTable(this.tableName, jobs);
      logger.info(`Job status transitioned: ${id} -> ${status}`);
      return updatedJob;
    }
    return null;
  }
}

export const jobRepository = new JobRepository();
