export type JobPriority = 'low' | 'medium' | 'high' | 'critical';

export type JobStatus =
  | 'created'
  | 'validating'
  | 'waiting_for_credits'
  | 'queued'
  | 'starting_pod'
  | 'waiting_for_pod'
  | 'waiting_for_comfyui'
  | 'loading_model'
  | 'loading_workflow'
  | 'patching_workflow'
  | 'submitting_to_comfyui'
  | 'generating'
  | 'polling_history'
  | 'collecting_output'
  | 'post_processing'
  | 'upscaling'
  | 'uploading'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout'
  | 'auto_stopping_pod'
  | 'pod_stopped';

export interface VideoGenerationRequest {
  userId?: string;
  modelId?: string;
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  fps?: number;
  seed?: number;
  priority?: JobPriority;
  autoStop?: boolean;
  upscale?: boolean;
  callbackUrl?: string;
}

export interface GenerationJob {
  id: string;
  userId: string;
  modelId: string;
  priority: JobPriority;
  status: JobStatus;
  request: VideoGenerationRequest;
  comfyPromptId?: string;
  outputFile?: string;
  outputUrl?: string;
  error?: string;
  retries: number;
  maxRetries: number;
  estimatedCostUsd?: number;
  actualCostUsd?: number;
  creditsCharged?: number;
  callbackUrl?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}
