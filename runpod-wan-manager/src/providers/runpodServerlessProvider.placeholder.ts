import { ProviderAdapter, GpuInstanceInfo } from './providerAdapter';
import { logger } from '../lib/logger';

export class RunPodServerlessProvider implements ProviderAdapter {
  constructor() {
    logger.info('RunPodServerlessProvider placeholder initialized. (Not active)');
  }

  public async startInstance(id: string): Promise<GpuInstanceInfo> {
    throw new Error('RunPodServerlessProvider is not active in current provider profile.');
  }

  public async stopInstance(id: string): Promise<GpuInstanceInfo> {
    throw new Error('RunPodServerlessProvider is not active.');
  }

  public async getInstanceStatus(id: string): Promise<GpuInstanceInfo> {
    throw new Error('RunPodServerlessProvider is not active.');
  }

  public async listInstances(): Promise<GpuInstanceInfo[]> {
    return [];
  }
}

export const runpodServerlessProvider = new RunPodServerlessProvider();
