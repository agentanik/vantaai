import { ProviderAdapter } from './providerAdapter';
import { runpodProvider } from './runpodProvider';
import { runpodServerlessProvider } from './runpodServerlessProvider.placeholder';
import { vastProvider } from './vastProvider.placeholder';
import { lambdaProvider } from './lambdaProvider.placeholder';
import { localGpuProvider } from './localGpuProvider.placeholder';
import { providerRepository } from '../repositories/providerRepository';
import { logger } from '../lib/logger';

class ProviderSelector {
  public async getAdapter(providerId: string): Promise<ProviderAdapter> {
    const provider = await providerRepository.getById(providerId);
    if (!provider) {
      logger.warn(`Provider ${providerId} not found in database. Defaulting to RunPod.`);
      return runpodProvider;
    }

    switch (provider.type) {
      case 'runpod-serverless':
        return runpodServerlessProvider;
      case 'vast':
        return vastProvider;
      case 'lambda':
        return lambdaProvider;
      case 'local':
        return localGpuProvider;
      case 'runpod':
      default:
        return runpodProvider;
    }
  }
}

export const providerSelector = new ProviderSelector();
