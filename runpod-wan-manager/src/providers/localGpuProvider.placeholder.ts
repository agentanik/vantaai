import { ProviderAdapter, GpuInstanceInfo } from './providerAdapter';
import { logger } from '../lib/logger';

export class LocalGpuProvider implements ProviderAdapter {
  constructor() {
    logger.info('LocalGpuProvider placeholder initialized. (Not active)');
  }

  public async startInstance(id: string): Promise<GpuInstanceInfo> {
    logger.debug(`[LOCAL-GPU] Starting local emulator/docker GPU: ${id}`);
    return {
      id,
      name: 'local-gpu-box',
      status: 'running',
      ipAddress: '127.0.0.1',
      ports: { 8188: 8188 },
      gpuType: 'Local NVIDIA GPU',
      costPerHourUsd: 0.0
    };
  }

  public async stopInstance(id: string): Promise<GpuInstanceInfo> {
    logger.debug(`[LOCAL-GPU] Stopping local emulator/docker GPU: ${id}`);
    return {
      id,
      name: 'local-gpu-box',
      status: 'stopped',
      gpuType: 'Local NVIDIA GPU',
      costPerHourUsd: 0.0
    };
  }

  public async getInstanceStatus(id: string): Promise<GpuInstanceInfo> {
    return {
      id,
      name: 'local-gpu-box',
      status: 'running',
      ipAddress: '127.0.0.1',
      ports: { 8188: 8188 },
      gpuType: 'Local NVIDIA GPU',
      costPerHourUsd: 0.0
    };
  }

  public async listInstances(): Promise<GpuInstanceInfo[]> {
    return [
      {
        id: 'local-gpu-instance',
        name: 'local-gpu-box',
        status: 'running',
        ipAddress: '127.0.0.1',
        ports: { 8188: 8188 },
        gpuType: 'Local NVIDIA GPU',
        costPerHourUsd: 0.0
      }
    ];
  }
}

export const localGpuProvider = new LocalGpuProvider();
