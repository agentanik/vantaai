import { AIModel } from '../types/models';
import { logger } from '../lib/logger';
import { modelRepository } from '../repositories/modelRepository';

class ModelRegistryService {
  private syncCache: Map<string, AIModel> = new Map();

  constructor() {
    this.initializeRegistry();
  }

  private initializeRegistry(): void {
    const defaultModels: AIModel[] = [
      {
        id: 'wan2.2-ti2v-5b',
        displayName: 'Wan2.2 TI2V 5B',
        provider: 'comfyui',
        category: 'video',
        version: '2.2',
        enabled: true,
        requiredVRAMGB: 24,
        recommendedGPU: 'RTX 4090',
        workflowPath: 'workflows/wan2.2-ti2v-5b.json',
        outputType: 'mp4',
        defaultWidth: 1280,
        defaultHeight: 704,
        defaultDurationSeconds: 10,
        maxDurationSeconds: 20,
        averageRuntimeSeconds: 240,
        estimatedGpuCostPerMinute: 0.0057,
        supportsPrompt: true,
        supportsNegativePrompt: true,
        supportsImageInput: true,
        supportsSeed: true,
        supportsUpscale: false
      },
      {
        id: 'wan2.2-a14b-placeholder',
        displayName: 'Wan2.2 Text-to-Video 14B (FP8)',
        provider: 'comfyui',
        category: 'video',
        version: '2.2',
        enabled: true,
        requiredVRAMGB: 48,
        recommendedGPU: 'A100',
        workflowPath: 'workflows/wan2.2-ti2v-5b.placeholder.json',
        outputType: 'mp4',
        defaultWidth: 1280,
        defaultHeight: 704,
        defaultDurationSeconds: 10,
        maxDurationSeconds: 20,
        averageRuntimeSeconds: 480,
        estimatedGpuCostPerMinute: 0.0366,
        supportsPrompt: true,
        supportsNegativePrompt: true,
        supportsImageInput: false,
        supportsSeed: true,
        supportsUpscale: true
      },
      {
        id: 'video-upscaler-placeholder',
        displayName: 'ComfyUI Video Upscaler',
        provider: 'comfyui',
        category: 'upscale',
        version: '1.0',
        enabled: true,
        requiredVRAMGB: 24,
        recommendedGPU: 'RTX 3090',
        workflowPath: 'workflows/video-upscale.placeholder.json',
        outputType: 'mp4',
        averageRuntimeSeconds: 120,
        estimatedGpuCostPerMinute: 0.0057,
        supportsPrompt: false,
        supportsNegativePrompt: false,
        supportsImageInput: false,
        supportsSeed: false,
        supportsUpscale: true
      },
      {
        id: 'rife-interpolation-placeholder',
        displayName: 'RIFE Frame Interpolation',
        provider: 'comfyui',
        category: 'utility',
        version: '4.0',
        enabled: true,
        requiredVRAMGB: 16,
        recommendedGPU: 'RTX 3090',
        workflowPath: 'workflows/video-upscale.placeholder.json',
        outputType: 'mp4',
        averageRuntimeSeconds: 60,
        estimatedGpuCostPerMinute: 0.0057,
        supportsPrompt: false,
        supportsNegativePrompt: false,
        supportsImageInput: false,
        supportsSeed: false,
        supportsUpscale: false
      },
      {
        id: 'sdxl-thumbnail-placeholder',
        displayName: 'SDXL Image Generator',
        provider: 'comfyui',
        category: 'image',
        version: '1.0',
        enabled: true,
        requiredVRAMGB: 12,
        recommendedGPU: 'RTX 3090',
        workflowPath: 'workflows/image-generation.placeholder.json',
        outputType: 'png',
        defaultWidth: 1024,
        defaultHeight: 1024,
        averageRuntimeSeconds: 15,
        estimatedGpuCostPerMinute: 0.0057,
        supportsPrompt: true,
        supportsNegativePrompt: true,
        supportsImageInput: false,
        supportsSeed: true,
        supportsUpscale: false
      },
      {
        id: 'flux-thumbnail-placeholder',
        displayName: 'FLUX Image Generator',
        provider: 'comfyui',
        category: 'image',
        version: '1.0',
        enabled: true,
        requiredVRAMGB: 24,
        recommendedGPU: 'RTX 4090',
        workflowPath: 'workflows/image-generation.placeholder.json',
        outputType: 'png',
        defaultWidth: 1024,
        defaultHeight: 1024,
        averageRuntimeSeconds: 25,
        estimatedGpuCostPerMinute: 0.0057,
        supportsPrompt: true,
        supportsNegativePrompt: false,
        supportsImageInput: false,
        supportsSeed: true,
        supportsUpscale: false
      },
      {
        id: 'whisper-subtitle-placeholder',
        displayName: 'Whisper Transcribe & Subtitle',
        provider: 'local-gpu-placeholder',
        category: 'subtitle',
        version: '3.0',
        enabled: true,
        requiredVRAMGB: 8,
        recommendedGPU: 'CPU',
        workflowPath: '',
        outputType: 'json',
        averageRuntimeSeconds: 30,
        estimatedGpuCostPerMinute: 0.0,
        supportsPrompt: false,
        supportsNegativePrompt: false,
        supportsImageInput: false,
        supportsSeed: false,
        supportsUpscale: false
      },
      {
        id: 'tts-placeholder',
        displayName: 'XTTS Audio Generator',
        provider: 'local-gpu-placeholder',
        category: 'audio',
        version: '2.0',
        enabled: true,
        requiredVRAMGB: 8,
        recommendedGPU: 'CPU',
        workflowPath: '',
        outputType: 'wav',
        averageRuntimeSeconds: 10,
        estimatedGpuCostPerMinute: 0.0,
        supportsPrompt: true,
        supportsNegativePrompt: false,
        supportsImageInput: false,
        supportsSeed: false,
        supportsUpscale: false
      }
    ];

    modelRepository.list().then((list) => {
      if (list.length === 0) {
        // Seed default models into database
        Promise.all(defaultModels.map((m) => modelRepository.save(m))).then(() => {
          defaultModels.forEach((m) => this.syncCache.set(m.id, m));
        });
      } else {
        list.forEach((m) => this.syncCache.set(m.id, m));
      }
    }).catch((err) => {
      logger.error(`Failed to seed model registry: ${err.message}`);
    });
  }

  public getModel(id: string): AIModel | undefined {
    return this.syncCache.get(id);
  }

  public listModels(category?: string): AIModel[] {
    const list = Array.from(this.syncCache.values());
    if (category) {
      return list.filter((m) => m.category === category);
    }
    return list;
  }

  public registerModel(model: AIModel): void {
    this.syncCache.set(model.id, model);
    modelRepository.save(model).catch((err) => {
      logger.error(`Async repository save failed for model ${model.id}: ${err.message}`);
    });
    logger.info(`Model registered in registry: ${model.displayName} (${model.id})`);
  }

  public toggleModel(id: string, enabled: boolean): AIModel {
    const model = this.getModel(id);
    if (!model) {
      throw new Error(`Model ${id} not found in registry.`);
    }
    model.enabled = enabled;
    this.syncCache.set(id, model);
    modelRepository.save(model).catch((err) => {
      logger.error(`Async repository update failed for model ${id}: ${err.message}`);
    });
    logger.info(`Model ${id} enabled status updated to: ${enabled}`);
    return model;
  }
}

export const modelRegistryService = new ModelRegistryService();

