import { ComputeInstance, ComputeProvider, ProviderType } from '../types/providers';
import { runpodClient } from '../lib/runpodClient';
import { logger } from '../lib/logger';
import { env } from '../config/env';

class RunpodComputeProvider implements ComputeProvider {
  type: ProviderType = 'runpod';

  async createCompute(gpuType: string, options: any): Promise<ComputeInstance> {
    logger.info(`RunpodProvider: Creating GPU pod of type: ${gpuType}`);
    const name = options.name || `ai-job-pod-${Date.now()}`;
    const pod = await runpodClient.createPod(name, gpuType, env.runpodNetworkVolumeId);
    return this.mapPodToComputeInstance(pod);
  }

  async startCompute(id: string): Promise<boolean> {
    logger.info(`RunpodProvider: Starting pod ${id}`);
    try {
      await runpodClient.startPod(id);
      return true;
    } catch (err: any) {
      logger.error(`RunpodProvider: Start failed for ${id}: ${err.message}`);
      throw err;
    }
  }

  async stopCompute(id: string): Promise<boolean> {
    logger.info(`RunpodProvider: Stopping pod ${id}`);
    try {
      await runpodClient.stopPod(id);
      return true;
    } catch (err: any) {
      logger.error(`RunpodProvider: Stop failed for ${id}: ${err.message}`);
      throw err;
    }
  }

  async getComputeStatus(id: string): Promise<ComputeInstance> {
    const pod = await runpodClient.getPodStatus(id);
    return this.mapPodToComputeInstance(pod);
  }

  async getPublicUrl(id: string, port: number): Promise<string> {
    // ComfyUI proxied public URL
    return `https://${id}-${port}.proxy.runpod.net`;
  }

  estimateCost(gpuType: string, durationMinutes: number): number {
    const hourlyRate = this.getHourlyRate(gpuType);
    return (hourlyRate / 60) * durationMinutes;
  }

  private getHourlyRate(gpuType: string): number {
    if (gpuType.includes('4090')) return 0.74; // $0.74/hr default
    if (gpuType.includes('A100')) return 2.20; // $2.20/hr
    if (gpuType.includes('H100')) return 4.50; // $4.50/hr
    return 0.50; // fallback $0.50/hr
  }

  private mapPodToComputeInstance(pod: any): ComputeInstance {
    let status: ComputeInstance['status'] = 'unknown';
    
    // Map runpod statuses
    const podStatus = pod.runtime?.status || pod.status || 'unknown';
    if (podStatus === 'RUNNING') {
      status = 'running';
    } else if (podStatus === 'STOPPED' || podStatus === 'EXITED') {
      status = 'stopped';
    } else if (podStatus === 'STARTING' || podStatus === 'INITIALIZING') {
      status = 'starting';
    } else if (podStatus === 'STOPPING') {
      status = 'stopping';
    } else if (podStatus === 'ERROR') {
      status = 'error';
    }

    const ipAddress = pod.runtime?.ports?.[0]?.ipAddress;
    const portMappings: Record<number, number> = {};
    if (pod.runtime?.ports) {
      pod.runtime.ports.forEach((p: any) => {
        if (p.isLocal) {
          portMappings[p.privatePort] = p.publicPort;
        }
      });
    }

    return {
      id: pod.id,
      provider: 'runpod',
      gpuType: pod.gpuName || env.runpodGpuType,
      vramGB: 24, // RTX 4090 vram
      status,
      ipAddress,
      portMappings,
      hourlyCostUsd: this.getHourlyRate(pod.gpuName || '')
    };
  }
}

class PlaceholderComputeProvider implements ComputeProvider {
  constructor(public type: ProviderType, private hourlyRate: number) {}

  async createCompute(gpuType: string, options: any): Promise<ComputeInstance> {
    logger.info(`${this.type} Provider: Creating mock node...`);
    return {
      id: `mock-${this.type}-${Date.now()}`,
      provider: this.type,
      gpuType,
      vramGB: 24,
      status: 'running',
      hourlyCostUsd: this.hourlyRate
    };
  }

  async startCompute(id: string): Promise<boolean> {
    logger.info(`${this.type} Provider: Start node ${id}`);
    return true;
  }

  async stopCompute(id: string): Promise<boolean> {
    logger.info(`${this.type} Provider: Stop node ${id}`);
    return true;
  }

  async getComputeStatus(id: string): Promise<ComputeInstance> {
    return {
      id,
      provider: this.type,
      gpuType: 'Mock GPU',
      vramGB: 24,
      status: 'running',
      hourlyCostUsd: this.hourlyRate
    };
  }

  async getPublicUrl(id: string, port: number): Promise<string> {
    return `http://localhost:${port}`;
  }

  estimateCost(gpuType: string, durationMinutes: number): number {
    return (this.hourlyRate / 60) * durationMinutes;
  }
}

class ProviderRegistryService {
  private providers: Map<ProviderType, ComputeProvider> = new Map();

  constructor() {
    this.providers.set('runpod', new RunpodComputeProvider());
    this.providers.set('runpod-serverless-placeholder', new PlaceholderComputeProvider('runpod-serverless-placeholder', 0.80));
    this.providers.set('vastai-placeholder', new PlaceholderComputeProvider('vastai-placeholder', 0.40));
    this.providers.set('lambdalabs-placeholder', new PlaceholderComputeProvider('lambdalabs-placeholder', 1.20));
    this.providers.set('local-gpu-placeholder', new PlaceholderComputeProvider('local-gpu-placeholder', 0.00));
  }

  public getProvider(type: ProviderType): ComputeProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Compute provider not registered: ${type}`);
    }
    return provider;
  }

  public listProviders(): { type: ProviderType; isPlaceholder: boolean }[] {
    return Array.from(this.providers.keys()).map((type) => ({
      type,
      isPlaceholder: type !== 'runpod'
    }));
  }
}

export const providerRegistryService = new ProviderRegistryService();
