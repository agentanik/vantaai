import { Request, Response, NextFunction } from 'express';
import { providerRegistryService } from '../services/providerRegistryService';
import { runpodClient } from '../lib/runpodClient';
import { env } from '../config/env';
import { z } from 'zod';
import { auditLogService } from '../services/auditLogService';
import { jobRepository } from '../repositories/jobRepository';
import { creditService } from '../services/creditService';
import { logger } from '../lib/logger';

const PodActionSchema = z.object({
  podId: z.string().min(1).optional()
});

export class ProviderController {
  public static listProviders(req: Request, res: Response, next: NextFunction): void {
    try {
      const providers = providerRegistryService.listProviders();
      res.json({ success: true, count: providers.length, data: providers });
    } catch (err) {
      next(err);
    }
  }

  public static async listPods(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pods = await runpodClient.listPods();
      res.json({ success: true, count: pods.length, data: pods });
    } catch (err) {
      next(err);
    }
  }

  public static async startPod(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = PodActionSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
        return;
      }
      
      const podId = result.data.podId || env.runpodPodId;
      if (!podId) {
        res.status(400).json({ success: false, error: 'Missing parameter: podId' });
        return;
      }
      const state = await runpodClient.startPod(podId);
      auditLogService.log('gpu_start_initiated_manual', { podId, provider: 'runpod' }, 'admin');
      res.json({ success: true, message: `Pod ${podId} startup initiated.`, data: state });
    } catch (err) {
      next(err);
    }
  }

  public static async stopPod(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = PodActionSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
        return;
      }
      
      const podId = result.data.podId || env.runpodPodId;
      if (!podId) {
        res.status(400).json({ success: false, error: 'Missing parameter: podId' });
        return;
      }
      const state = await runpodClient.stopPod(podId);
      auditLogService.log('gpu_stop_initiated_manual', { podId, provider: 'runpod' }, 'admin');
      res.json({ success: true, message: `Pod ${podId} stop command sent.`, data: state });
    } catch (err) {
      next(err);
    }
  }

  public static async emergencyStop(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.warn('EMERGENCY SHUTDOWN REQUESTED! Cancelling all running jobs and stopping GPU pods.');

      // 1. Fetch all jobs
      const jobs = await jobRepository.list();
      const activeJobs = jobs.filter(
        (job) => !['completed', 'failed', 'cancelled'].includes(job.status)
      );

      // 2. Transition active jobs to failed and refund credits
      const cancelledJobIds: string[] = [];
      for (const job of activeJobs) {
        await jobRepository.updateStatus(job.id, 'failed', {
          error: 'Emergency system shutdown requested.'
        });
        try {
          await creditService.refundCredits(job.id);
        } catch (creditErr: any) {
          logger.error(`Failed to refund credits for job ${job.id} during emergency shutdown: ${creditErr.message}`);
        }
        cancelledJobIds.push(job.id);
      }

      // 3. Stop the active pod
      const podId = env.runpodPodId;
      let podStopped = false;
      let stopResult: any = null;
      if (podId) {
        try {
          stopResult = await runpodClient.stopPod(podId);
          podStopped = true;
          auditLogService.log('emergency_shutdown_initiated', { podId, cancelledJobCount: cancelledJobIds.length, cancelledJobIds }, 'admin');
        } catch (podErr: any) {
          logger.error(`Failed to stop pod ${podId} during emergency shutdown: ${podErr.message}`);
        }
      }

      res.json({
        success: true,
        message: 'Emergency shutdown completed successfully.',
        data: {
          podStopped,
          podId,
          stopResult,
          cancelledJobCount: cancelledJobIds.length,
          cancelledJobIds
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public static async createOrConnectPod(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let podId = env.runpodPodId;
      let status = 'unknown';
      let gpuType = env.runpodGpuType;
      let proxyUrl = '';
      const volumeInfo = env.runpodNetworkVolumeId ? `Volume ID: ${env.runpodNetworkVolumeId}` : 'No Network Volume attached (Models will be re-downloaded)';
      let createdNew = false;
      let warning = '';

      if (!env.runpodNetworkVolumeId || env.runpodNetworkVolumeId === 'your_network_volume_id_here' || env.runpodNetworkVolumeId === '') {
        warning = 'Warning: RUNPOD_NETWORK_VOLUME_ID is missing or using placeholder in your environment configuration. Without a network volume, model downloads will not persist between pod restarts.';
      }

      if (podId && podId !== 'your_runpod_pod_id_here' && podId !== '') {
        // Verify pod exists
        try {
          const pod = await runpodClient.getPodStatus(podId);
          status = pod.status || 'unknown';
          gpuType = pod.gpuName || gpuType;
          proxyUrl = `https://${podId}-${env.runpodComfyuiPort}.proxy.runpod.net`;
        } catch (err: any) {
          logger.warn(`Configured RUNPOD_POD_ID ${podId} not found or inaccessible: ${err.message}`);
          // Fall back to creating a new one
          podId = ''; 
        }
      }

      if (!podId || podId === '') {
        // Create new pod
        const name = 'runpod-wan-manager-pod';
        const volumeId = env.runpodNetworkVolumeId && env.runpodNetworkVolumeId !== 'your_network_volume_id_here' ? env.runpodNetworkVolumeId : undefined;
        
        // Map GPU to RunPod GPU type ID
        let gpuTypeId = 'NVIDIA GeForce RTX 4090';
        const searchGpu = env.runpodGpuType.toLowerCase();
        if (searchGpu.includes('4090')) {
          gpuTypeId = 'NVIDIA GeForce RTX 4090';
        } else if (searchGpu.includes('3090')) {
          gpuTypeId = 'NVIDIA GeForce RTX 3090';
        } else if (searchGpu.includes('a100')) {
          gpuTypeId = 'NVIDIA A100-SXM4-80GB';
        } else {
          gpuTypeId = env.runpodGpuType;
        }

        logger.info(`Creating new RunPod pod: name=${name}, gpu=${gpuTypeId}, volume=${volumeId}`);
        const pod = await runpodClient.createPod(name, gpuTypeId, volumeId);
        podId = pod.id;
        status = pod.status || 'STARTING';
        gpuType = pod.gpuName || gpuType;
        proxyUrl = `https://${podId}-${env.runpodComfyuiPort}.proxy.runpod.net`;
        createdNew = true;
        
        auditLogService.log('gpu_pod_created', { podId, gpuType, volumeId }, 'admin');
      }

      res.status(200).json({
        success: true,
        data: {
          podId,
          status,
          gpuType,
          proxyUrl,
          volumeInfo,
          createdNew,
          warning: warning || undefined,
          instruction: createdNew ? `IMPORTANT: A new pod has been created with ID "${podId}". Please copy this ID and add it into your local .env file as RUNPOD_POD_ID=${podId}` : undefined
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public static getComfyUrl(req: Request, res: Response, next: NextFunction): void {
    try {
      const podId = env.runpodPodId;
      if (!podId || podId === 'your_runpod_pod_id_here' || podId === '') {
        res.status(400).json({
          success: false,
          error: 'No active RUNPOD_POD_ID is configured in the environment variables.'
        });
        return;
      }
      const proxyUrl = `https://${podId}-${env.runpodComfyuiPort}.proxy.runpod.net`;
      res.status(200).json({
        success: true,
        proxyUrl
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getAdminOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const podId = env.runpodPodId;
      let podStatus = 'not_configured';
      if (podId && podId !== 'your_runpod_pod_id_here' && podId !== '') {
        try {
          const pod = await runpodClient.getPodStatus(podId);
          podStatus = pod.status || 'unknown';
        } catch (err: any) {
          podStatus = `error: ${err.message}`;
        }
      }

      const allJobs = await jobRepository.list();
      const activeJobs = allJobs.filter(j => 
        ['queued', 'starting_pod', 'waiting_for_pod', 'waiting_for_comfyui', 'submitting_to_comfyui', 'generating', 'collecting_output', 'upscaling'].includes(j.status)
      );

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      let estimatedCostTodayUsd = 0;
      allJobs.forEach(j => {
        const jobTime = new Date(j.createdAt).getTime();
        if (jobTime >= startOfToday) {
          estimatedCostTodayUsd += j.actualCostUsd || j.estimatedCostUsd || 0;
        }
      });

      const failedJobs = allJobs.filter(j => j.status === 'failed');
      const lastError = failedJobs.length > 0 ? failedJobs[failedJobs.length - 1].error : 'none';

      res.status(200).json({
        success: true,
        data: {
          podId,
          podStatus,
          activeJobs: activeJobs.map(j => ({ id: j.id, status: j.status, modelId: j.modelId })),
          queueLength: allJobs.filter(j => j.status === 'queued').length,
          estimatedCostTodayUsd: Math.round(estimatedCostTodayUsd * 100) / 100,
          lastError
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getPodStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const podId = req.query.podId as string || env.runpodPodId;
      if (!podId || podId === 'your_runpod_pod_id_here' || podId === '') {
        res.status(400).json({
          success: false,
          error: 'No active RUNPOD_POD_ID is configured or provided.'
        });
        return;
      }
      const pod = await runpodClient.getPodStatus(podId);
      res.status(200).json({
        success: true,
        data: pod
      });
    } catch (err: any) {
      next(err);
    }
  }
}

