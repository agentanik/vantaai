import { jobRepository } from '../repositories/jobRepository';
import { podLifecycleService } from './podLifecycleService';
import { runpodClient } from '../lib/runpodClient';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { auditLogService } from './auditLogService';
import { creditService } from './creditService';

class WatchdogService {
  private intervalId: NodeJS.Timeout | null = null;
  private idleStartTime: number | null = null;
  private readonly checkIntervalMs = 30000; // Check every 30 seconds
  private readonly maxIdleSeconds = 300; // Stop if idle for 5 minutes

  public start(): void {
    if (this.intervalId) return;
    logger.info('Initializing idle watchdog containment daemon...');
    
    this.intervalId = setInterval(() => {
      this.checkIdleStatus().catch((err) => {
        logger.error(`Watchdog check iteration failed: ${err.message}`);
      });
    }, this.checkIntervalMs);
  }

  private async cleanupStaleJobs(): Promise<void> {
    const allJobs = await jobRepository.list();
    const activeStatuses = [
      'queued', 'starting_pod', 'waiting_for_pod', 'waiting_for_comfyui', 
      'submitting_to_comfyui', 'generating', 'collecting_output', 'upscaling'
    ];
    
    const now = Date.now();
    const staleThresholdMs = (env.generationTimeoutMinutes + 10) * 60 * 1000;

    for (const job of allJobs) {
      if (activeStatuses.includes(job.status)) {
        const lastUpdate = new Date(job.updatedAt).getTime();
        const durationMs = now - lastUpdate;
        
        if (durationMs > staleThresholdMs) {
          logger.warn(`Watchdog: Job ${job.id} has been active in status "${job.status}" for ${Math.round(durationMs / 60000)} minutes. Marking as timed out.`);
          
          await jobRepository.updateStatus(job.id, 'failed', {
            error: `Job timed out after exceeding maximum active duration of ${Math.round(staleThresholdMs / 60000)} minutes.`
          });
          
          try {
            await creditService.refundCredits(job.id);
          } catch (refundErr: any) {
            logger.error(`Watchdog failed to refund credits for timed out job ${job.id}: ${refundErr.message}`);
          }
          
          auditLogService.log('job_timeout_cleanup', { jobId: job.id, lastStatus: job.status }, job.userId, job.id);
        }
      }
    }
  }

  private async checkIdleStatus(): Promise<void> {
    const podId = env.runpodPodId;
    if (!podId) return;

    try {
      // Clean up any stale active jobs before checking idle pod status
      await this.cleanupStaleJobs();
      // 1. Fetch live container state
      const pod = await runpodClient.getPodStatus(podId);
      if (pod.status !== 'RUNNING') {
        // If pod is stopped, reset idle counter
        this.idleStartTime = null;
        return;
      }

      // 2. Scan job store for running or pending tasks
      const allJobs = await jobRepository.list();
      const activeJobs = allJobs.filter((job) => 
        ['queued', 'starting_pod', 'waiting_for_pod', 'waiting_for_comfyui', 'submitting_to_comfyui', 'generating', 'collecting_output', 'upscaling'].includes(job.status)
      );

      if (activeJobs.length > 0) {
        // Active pipeline runs detected, reset idle counter
        this.idleStartTime = null;
        return;
      }

      // 3. Increment or trigger idle countdown
      const now = Date.now();
      if (this.idleStartTime === null) {
        this.idleStartTime = now;
        logger.info(`Pod ${podId} detected idle. Starting watchdog cooldown.`);
        return;
      }

      const idleDurationSeconds = (now - this.idleStartTime) / 1000;
      logger.info(`Pod ${podId} has been idle for ${Math.round(idleDurationSeconds)}s / ${this.maxIdleSeconds}s`);

      if (idleDurationSeconds >= this.maxIdleSeconds) {
        logger.warn(`Watchdog trigger: Pod ${podId} exceeded idle timeout of ${this.maxIdleSeconds}s. Sending shutdown command.`);
        
        auditLogService.log('watchdog_auto_shutdown', { idleDurationSeconds }, 'system');
        await podLifecycleService.stopPodSafely(podId);
        
        this.idleStartTime = null; // Reset
      }

    } catch (error: any) {
      logger.error(`Watchdog failed to resolve pod lifecycle: ${error.message}`);
    }
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Watchdog daemon stopped.');
    }
  }
}

export const watchdogService = new WatchdogService();
export { WatchdogService };

