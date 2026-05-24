export interface GpuInstanceInfo {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error' | 'unknown';
  ipAddress?: string;
  ports?: Record<number, number>;
  gpuType: string;
  costPerHourUsd: number;
}

export interface ProviderAdapter {
  startInstance(id: string): Promise<GpuInstanceInfo>;
  stopInstance(id: string): Promise<GpuInstanceInfo>;
  getInstanceStatus(id: string): Promise<GpuInstanceInfo>;
  listInstances(): Promise<GpuInstanceInfo[]>;
}
