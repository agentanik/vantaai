export type ModelCategory = 'video' | 'image' | 'audio' | 'upscale' | 'subtitle' | 'utility';

export interface AIModel {
  id: string;
  displayName: string;
  provider: string;
  category: ModelCategory;
  version: string;
  enabled: boolean;
  requiredVRAMGB: number;
  recommendedGPU: string;
  workflowPath: string;
  outputType: string;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultDurationSeconds?: number;
  maxDurationSeconds?: number;
  averageRuntimeSeconds: number;
  estimatedGpuCostPerMinute: number;
  supportsPrompt: boolean;
  supportsNegativePrompt: boolean;
  supportsImageInput: boolean;
  supportsSeed: boolean;
  supportsUpscale: boolean;
}
