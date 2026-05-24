import { ProviderAdapter, GpuInstanceInfo } from './providerAdapter';
import { logger } from '../lib/logger';

export class VastProvider implements ProviderAdapter {
  constructor() {
    logger.info('VastProvider placeholder initialized. (Not active)');
  }

  public async startInstance(id: string): Promise<GpuInstanceInfo> {
    throw new Error('VastProvider is not active.');
  }

  public async stopInstance(id: string): Promise<GpuInstanceInfo> {
    throw new Error('VastProvider is not active.');
  }

  public async getInstanceStatus(id: string): Promise<GpuInstanceInfo> {
    throw new Error('VastProvider is not active.');
  }

  public async listInstances(): Promise<GpuInstanceInfo[]> {
    return [];
  }
}

export const vastProvider = new VastProvider();
