import { AIModel } from '../types/models';
import { env } from '../config/env';

export interface GpuSelection {
  recommendedGpu: string;
  reason: string;
  estimatedHourlyCost: number;
  fallbackOptions: string[];
}

class GpuSelectorService {
  public selectGpuForModel(model: AIModel, priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'): GpuSelection {
    const requiredVRAM = model.requiredVRAMGB;

    // Rule 1: Whisper/Audio subtitles can run on CPU or very cheap nodes
    if (model.category === 'subtitle' || model.category === 'audio') {
      return {
        recommendedGpu: 'CPU',
        reason: 'Low processing requirements. Running on local utility threads.',
        estimatedHourlyCost: 0.00,
        fallbackOptions: ['RTX 3090']
      };
    }

    // Rule 2: Large models (Wan 14B) require large datacenter GPUs
    if (requiredVRAM > 24) {
      if (priority === 'urgent' || priority === 'high') {
        return {
          recommendedGpu: 'NVIDIA H100 PCIe',
          reason: `High priority execution for heavy ${model.displayName} requiring >24GB VRAM.`,
          estimatedHourlyCost: 4.76,
          fallbackOptions: ['NVIDIA A100-SXM4-80GB']
        };
      }
      return {
        recommendedGpu: 'NVIDIA A100-SXM4-80GB',
        reason: `VRAM requirement (${requiredVRAM}GB) requires datacenter node allocation.`,
        estimatedHourlyCost: 2.20,
        fallbackOptions: ['NVIDIA A40', 'NVIDIA RTX 6000 Ada']
      };
    }

    // Rule 3: High-end consumer GPUs for standard Wan 5B video and Upscalers (24GB VRAM)
    if (model.category === 'video' || model.category === 'upscale') {
      return {
        recommendedGpu: env.runpodGpuType || 'NVIDIA GeForce RTX 4090',
        reason: 'Standard consumer flagship GPU matching ideal VRAM footprint and execution speed.',
        estimatedHourlyCost: 0.74,
        fallbackOptions: ['NVIDIA GeForce RTX 3090', 'NVIDIA RTX A5000']
      };
    }

    // Rule 4: Lightweight image generation models (SDXL)
    return {
      recommendedGpu: 'NVIDIA GeForce RTX 3090',
      reason: 'Cost-effective GPU choice for short-running image generation tasks.',
      estimatedHourlyCost: 0.44,
      fallbackOptions: ['NVIDIA GeForce RTX 4090']
    };
  }
}

export const gpuSelectorService = new GpuSelectorService();
