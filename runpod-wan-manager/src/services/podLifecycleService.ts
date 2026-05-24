import { runpodClient } from '../lib/runpodClient';
import { config } from '../lib/config';
import { logger } from '../lib/logger';
import { sleep } from '../lib/waitUtils';
import { RunPodError } from '../lib/errors';
import { PodResponse } from '../types/runpod';

export class PodLifecycleService {
  async getPodStatus(podId: string): Promise<PodResponse> {
    logger.debug(`Retrieving status for pod: ${podId}`);
    return await runpodClient.getPodStatus(podId);
  }

  async startPodIfNeeded(podId: string): Promise<boolean> {
    const pod = await this.getPodStatus(podId);
    
    if (pod.status === 'RUNNING') {
      logger.info(`Pod ${podId} is already running. No restart needed.`);
      return false; // Did not need starting
    }
    
    logger.info(`Pod ${podId} is in status "${pod.status}". Requesting start/resume...`);
    await runpodClient.startPod(podId);
    return true; // Start initiated
  }

  async waitForPodRunning(podId: string, timeoutMinutes: number = 10): Promise<PodResponse> {
    const startTime = Date.now();
    const timeoutMs = timeoutMinutes * 60 * 1000;
    logger.info(`Waiting for pod ${podId} to reach RUNNING state...`);

    while (Date.now() - startTime < timeoutMs) {
      const pod = await this.getPodStatus(podId);
      logger.debug(`Pod ${podId} current status: ${pod.status}`);
      
      if (pod.status === 'RUNNING') {
        logger.info(`Pod ${podId} is now RUNNING.`);
        return pod;
      }
      
      if (pod.status === 'TERMINATED' || pod.status === 'ERROR') {
        throw new RunPodError(`Pod reached a failed state: ${pod.status}`);
      }
      
      await sleep(10000); // Poll every 10 seconds
    }

    throw new RunPodError(`Timeout: Pod ${podId} did not start within ${timeoutMinutes} minutes.`);
  }

  async stopPod(podId: string): Promise<void> {
    logger.info(`Requesting pod stop for: ${podId}`);
    await runpodClient.stopPod(podId);
    logger.info(`Stop request sent for pod: ${podId}`);
  }

  async stopPodSafely(podId: string): Promise<void> {
    try {
      await this.stopPod(podId);
    } catch (error: any) {
      logger.error(`Failed to stop pod ${podId} during safety cleanup: ${error.message}`);
    }
  }
}

export const podLifecycleService = new PodLifecycleService();
