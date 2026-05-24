export type ProviderType = 'runpod' | 'runpod-serverless-placeholder' | 'vastai-placeholder' | 'lambdalabs-placeholder' | 'local-gpu-placeholder';

export interface ComputeInstance {
  id: string;
  provider: ProviderType;
  gpuType: string;
  vramGB: number;
  status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error' | 'unknown';
  ipAddress?: string;
  portMappings?: Record<number, number>;
  hourlyCostUsd: number;
}

export interface ComputeProvider {
  type: ProviderType;
  createCompute(gpuType: string, options: any): Promise<ComputeInstance>;
  startCompute(id: string): Promise<boolean>;
  stopCompute(id: string): Promise<boolean>;
  getComputeStatus(id: string): Promise<ComputeInstance>;
  getPublicUrl(id: string, port: number): Promise<string>;
  estimateCost(gpuType: string, durationMinutes: number): number;
}

export interface ProviderDefinition {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
}

