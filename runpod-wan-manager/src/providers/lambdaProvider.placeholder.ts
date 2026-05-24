import { ProviderAdapter, GpuInstanceInfo } from './providerAdapter';
import { logger } from '../lib/logger';

export class LambdaProvider implements ProviderAdapter {
  constructor() {
    logger.info('LambdaProvider placeholder initialized. (Not active)');
  }

  public async startInstance(id: string): Promise<GpuInstanceInfo> {
    throw new Error('LambdaProvider is not active.');
  }

  public async stopInstance(id: string): Promise<GpuInstanceInfo> {
    throw new Error('LambdaProvider is not active.');
  }

  public async getInstanceStatus(id: string): Promise<GpuInstanceInfo> {
    throw new Error('LambdaProvider is not active.');
  }

  public async listInstances(): Promise<GpuInstanceInfo[]> {
    return [];
  }
}

export const lambdaProvider = new LambdaProvider();
