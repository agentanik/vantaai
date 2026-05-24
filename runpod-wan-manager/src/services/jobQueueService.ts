import { jobRepository } from '../repositories/jobRepository';
import { videoGenerationService } from './videoGenerationService';
import { creditService } from './creditService';
import { webhookService } from './webhookService';
import { logger } from '../lib/logger';
import { env } from '../config/env';
import { sleep } from '../lib/waitUtils';
import { JobPriority } from '../types/jobs';
import { runpodClient } from '../lib/runpodClient';

class JobQueueService {
  private activeJobsCount = 0;
  private running = false;

  public startQueueLoop(): void {
    if (this.running) return;
    this.running = true;
    logger.info('Starting production job queue worker daemon...');
    
    this.recoverZombieJobs()
      .then(() => {
        this.workerLoop().catch((err) => {
          logger.error(`Fatal error in job queue worker: ${err.message}`);
        });
      })
      .catch((err) => {
        logger.error(`Fatal error during job queue startup recovery: ${err.message}`);
        this.workerLoop().catch((loopErr) => {
          logger.error(`Fatal error in job queue worker: ${loopErr.message}`);
        });
      });
  }

  private async recoverZombieJobs(): Promise<void> {
    if (!env.zombiePodCheckOnStartup) {
      logger.info('Zombie pod startup recovery check is disabled in config.');
      return;
    }

    try {
      logger.info('Auditing for active zombie jobs from previous sessions...');
      const jobs = await jobRepository.list();
      const activeStatuses = [
        'starting_pod', 'waiting_for_pod', 'waiting_for_comfyui', 
        'submitting_to_comfyui', 'generating', 'collecting_output', 'upscaling'
      ];

      const zombieJobs = jobs.filter((j) => activeStatuses.includes(j.status));
      
      if (zombieJobs.length === 0) {
        logger.info('No zombie jobs found.');
        return;
      }

      logger.warn(`Found ${zombieJobs.length} active jobs left in processing states. Failing them and stopping pod to prevent resource leak...`);
      for (const job of zombieJobs) {
        logger.info(`Failing zombie job ${job.id} and initiating credit refund...`);
        await jobRepository.updateStatus(job.id, 'failed', {
          error: 'Job terminated due to server restart/crash.',
          completedAt: new Date().toISOString()
        });

        try {
          await creditService.refundCredits(job.id);
        } catch (refundErr: any) {
          logger.error(`Failed to refund credits for zombie job ${job.id}: ${refundErr.message}`);
        }
        
        await webhookService.sendCallback({
          ...job,
          status: 'failed',
          error: 'Job terminated due to server restart/crash.',
          completedAt: new Date().toISOString()
        });
      }

      const podId = env.runpodPodId;
      if (podId && podId !== 'your_runpod_pod_id_here' && podId !== '') {
        logger.warn(`Zombie jobs detected. Issuing stop command for Pod ${podId} to prevent ongoing billing...`);
        try {
          await runpodClient.stopPod(podId);
        } catch (stopErr: any) {
          logger.error(`Failed to stop pod ${podId} on zombie recovery: ${stopErr.message}`);
        }
      }
    } catch (err: any) {
      logger.error(`Failed to recover zombie jobs: ${err.message}`);
    }
  }

  private async workerLoop(): Promise<void> {
    while (this.running) {
      try {
        if (this.activeJobsCount >= env.maxConcurrentJobs) {
          await sleep(2000);
          continue;
        }

        const nextJob = await this.findNextJob();
        if (!nextJob) {
          await sleep(2000);
          continue;
        }

        // Lock job for execution
        this.activeJobsCount++;
        await jobRepository.updateStatus(nextJob.id, 'starting_pod');
        
        // Execute asynchronously
        this.runJob(nextJob.id).catch((err) => {
          logger.error(`Job run error for ${nextJob.id}: ${err.message}`);
        }).finally(() => {
          this.activeJobsCount--;
        });

      } catch (err: any) {
        logger.error(`Error in queue worker iteration: ${err.message}`);
        await sleep(5000);
      }
    }
  }

  private async findNextJob() {
    const jobs = await jobRepository.list();
    const queuedJobs = jobs.filter((j) => j.status === 'queued');
    
    if (queuedJobs.length === 0) {
      return null;
    }

    // Sort: high priority first (e.g. 'critical' > 'high' > 'medium' > 'low'), then oldest first
    const priorityWeights: Record<JobPriority, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1
    };

    return queuedJobs.sort((a, b) => {
      const weightA = priorityWeights[a.priority];
      const weightB = priorityWeights[b.priority];
      
      if (weightA !== weightB) {
        return weightB - weightA; // Descending weight
      }
      
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); // Ascending time (FIFO)
    })[0];
  }

  private async runJob(jobId: string): Promise<void> {
    const job = await jobRepository.getById(jobId);
    if (!job) return;
    logger.info(`Orchestrating queue slot for Job: ${jobId} (Model: ${job.modelId}, Priority: ${job.priority})`);
    
    try {
      // Execute the actual GPU processing workflow
      const result = await videoGenerationService.executeJob(job);
      
      // Finalize credits on successful run
      await creditService.finalizeCredits(jobId);
      
      const updatedJob = await jobRepository.updateStatus(jobId, 'completed', {
        outputUrl: result.outputUrl,
        actualCostUsd: result.actualCostUsd,
        completedAt: new Date().toISOString()
      });

      // Dispatch webhook
      if (updatedJob) {
        await webhookService.sendCallback(updatedJob);
      }

    } catch (error: any) {
      logger.error(`Execution failed for job ${jobId}: ${error.message}`);
      
      const updatedJob = await jobRepository.getById(jobId);
      if (!updatedJob) return;
      const nextRetryCount = (updatedJob.retries || 0) + 1;
      const maxRetries = updatedJob.maxRetries || 2;

      if (nextRetryCount <= maxRetries) {
        logger.warn(`Scheduling job ${jobId} for retry attempt ${nextRetryCount}/${maxRetries}`);
        await jobRepository.updateStatus(jobId, 'queued', {
          retries: nextRetryCount,
          error: error.message
        });
      } else {
        logger.error(`Max retries exceeded for job ${jobId}. Marking failed and refunding credits.`);
        const failedJob = await jobRepository.updateStatus(jobId, 'failed', {
          error: error.message,
          completedAt: new Date().toISOString()
        });
        
        // Refund reserved credits
        await creditService.refundCredits(jobId);
        
        // Dispatch failure callback
        if (failedJob) {
          await webhookService.sendCallback(failedJob);
        }
      }
    }
  }

  public stopQueueLoop(): void {
    this.running = false;
    logger.info('Stopped queue worker.');
  }
}

export const jobQueueService = new JobQueueService();
export { JobQueueService };

