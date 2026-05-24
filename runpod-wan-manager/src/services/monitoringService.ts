import fs from 'fs';
import path from 'path';
import { jobRepository } from '../repositories/jobRepository';
import { runpodClient } from '../lib/runpodClient';
import { getComfyBaseUrl, checkComfyHealth } from '../lib/comfyClient';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { modelRegistryService } from './modelRegistryService';

export interface PerformanceMetrics {
  queueLength: number;
  activeJobsCount: number;
  completedJobsCount: number;
  failedJobsCount: number;
  failureRatePercentage: number;
  averageRuntimeSeconds: number;
  estimatedCostTodayUsd: number;
  storageUsedBytes: number;
  comfyuiOnline: boolean;
  runpodOnline: boolean;
}

class MonitoringService {
  public async getMetrics(): Promise<PerformanceMetrics> {
    const allJobs = await jobRepository.list();
    const activeJobs = allJobs.filter(j => 
      ['queued', 'starting_pod', 'waiting_for_pod', 'waiting_for_comfyui', 'submitting_to_comfyui', 'generating', 'collecting_output', 'upscaling'].includes(j.status)
    );
    const completedJobs = allJobs.filter(j => j.status === 'completed');
    const failedJobs = allJobs.filter(j => j.status === 'failed');

    const totalResolved = completedJobs.length + failedJobs.length;
    const failureRatePercentage = totalResolved > 0 ? (failedJobs.length / totalResolved) * 100 : 0;

    // Calculate average runtime
    let totalRuntime = 0;
    completedJobs.forEach(j => {
      if (j.completedAt && j.createdAt) {
        const diff = (new Date(j.completedAt).getTime() - new Date(j.createdAt).getTime()) / 1000;
        totalRuntime += diff;
      }
    });
    const averageRuntimeSeconds = completedJobs.length > 0 ? totalRuntime / completedJobs.length : 0;

    // Daily costs
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    let estimatedCostTodayUsd = 0;
    allJobs.forEach(j => {
      const jobTime = new Date(j.createdAt).getTime();
      if (jobTime >= startOfToday) {
        estimatedCostTodayUsd += j.actualCostUsd || j.estimatedCostUsd || 0;
      }
    });

    // Storage footprint
    let storageUsedBytes = 0;
    const outputDir = env.outputDir;
    try {
      if (fs.existsSync(outputDir)) {
        const files = fs.readdirSync(outputDir);
        files.forEach(f => {
          const stats = fs.statSync(path.join(outputDir, f));
          if (stats.isFile()) {
            storageUsedBytes += stats.size;
          }
        });
      }
    } catch (err: any) {
      logger.error(`Storage monitor failed to read output dir: ${err.message}`);
    }

    // Health connections
    let runpodOnline = false;
    try {
      if (env.runpodApiKey) {
        await runpodClient.listPods();
        runpodOnline = true;
      }
    } catch {
      runpodOnline = false;
    }

    let comfyuiOnline = false;
    try {
      if (env.runpodPodId) {
        const ComfyBase = getComfyBaseUrl(env.runpodPodId);
        comfyuiOnline = await checkComfyHealth(ComfyBase);
      }
    } catch {
      comfyuiOnline = false;
    }

    return {
      queueLength: allJobs.filter(j => j.status === 'queued').length,
      activeJobsCount: activeJobs.length,
      completedJobsCount: completedJobs.length,
      failedJobsCount: failedJobs.length,
      failureRatePercentage: Math.round(failureRatePercentage * 10) / 10,
      averageRuntimeSeconds: Math.round(averageRuntimeSeconds),
      estimatedCostTodayUsd: Math.round(estimatedCostTodayUsd * 100) / 100,
      storageUsedBytes,
      comfyuiOnline,
      runpodOnline
    };
  }

  public async getStorageStatus(): Promise<Record<string, any>> {
    const metrics = await this.getMetrics();
    return {
      provider: env.storageProvider,
      localDir: env.outputDir,
      bytesUsed: metrics.storageUsedBytes,
      megabytesUsed: Math.round((metrics.storageUsedBytes / (1024 * 1024)) * 100) / 100
    };
  }

  public getModelStatus(): Record<string, any> {
    const list = modelRegistryService.listModels();
    return {
      totalCount: list.length,
      enabledCount: list.filter(m => m.enabled).length,
      models: list.map(m => ({ id: m.id, displayName: m.displayName, enabled: m.enabled }))
    };
  }
}

export const monitoringService = new MonitoringService();

