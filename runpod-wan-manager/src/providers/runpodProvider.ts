import { ProviderAdapter, GpuInstanceInfo } from './providerAdapter';
import { runpodClient, PodResponse } from '../lib/runpodClient';
import { logger } from '../lib/logger';
import { config } from '../lib/config';

export class RunPodProvider implements ProviderAdapter {
  private mapPodInfo(pod: any): GpuInstanceInfo {
    let status: GpuInstanceInfo['status'] = 'stopped';
    
    const podStatus = pod.status || pod.desiredStatus || 'unknown';
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

    // ComfyUI port mapping
    let ipAddress: string | undefined;
    const ports: Record<number, number> = {};
    
    if (pod.runtime?.ports) {
      ipAddress = pod.runtime.ports[0]?.ip;
      pod.runtime.ports.forEach((p) => {
        ports[p.privatePort] = p.publicPort;
      });
    }

    // Default rate lookup (using RTX 4090 standard rate around $0.74/hr if not listed)
    const costPerHourUsd = pod.gpuName?.includes('4090') ? 0.74 : 0.74;

    return {
      id: pod.id,
      name: pod.name || 'runpod-instance',
      status,
      ipAddress,
      ports,
      gpuType: pod.gpuName || config.runpodGpuType || 'NVIDIA GeForce RTX 4090',
      costPerHourUsd
    };
  }

  public async startInstance(id: string): Promise<GpuInstanceInfo> {
    logger.info(`RunPod Provider starting instance: ${id}`);
    const response = await runpodClient.startPod(id);
    return this.mapPodInfo(response);
  }

  public async stopInstance(id: string): Promise<GpuInstanceInfo> {
    logger.info(`RunPod Provider stopping instance: ${id}`);
    const response = await runpodClient.stopPod(id);
    return this.mapPodInfo(response);
  }

  public async getInstanceStatus(id: string): Promise<GpuInstanceInfo> {
    const response = await runpodClient.getPodStatus(id);
    return this.mapPodInfo(response);
  }

  public async listInstances(): Promise<GpuInstanceInfo[]> {
    const list = await runpodClient.listPods();
    return list.map((pod) => this.mapPodInfo(pod));
  }
}

export const runpodProvider = new RunPodProvider();

