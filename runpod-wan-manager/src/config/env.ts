import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  managerApiKey: process.env.MANAGER_API_KEY || '',
  jwtSecret: process.env.JWT_SECRET_PLACEHOLDER || 'secret-key-for-local-tokens',
  maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || '2', 10),

  // Providers & GPU Config
  runpodApiKey: process.env.RUNPOD_API_KEY || '',
  enableMockRunpod: (process.env.ENABLE_MOCK_RUNPOD || 'false').toLowerCase() === 'true',
  runpodPodId: process.env.RUNPOD_POD_ID || '',
  runpodGpuType: process.env.RUNPOD_GPU_TYPE || 'NVIDIA GeForce RTX 4090',
  runpodNetworkVolumeId: process.env.RUNPOD_NETWORK_VOLUME_ID || '',
  runpodVolumeMountPath: process.env.RUNPOD_VOLUME_MOUNT_PATH || '/workspace',
  runpodComfyuiPort: parseInt(process.env.RUNPOD_COMFYUI_PORT || '8188', 10),
  runpodProvider: process.env.RUNPOD_PROVIDER || 'runpod',
  runpodTemplateId: process.env.RUNPOD_TEMPLATE_ID || 'cw3nka7d08',
  queueAdapter: process.env.QUEUE_ADAPTER || 'memory',

  // Third Party APIs
  hfToken: process.env.HF_TOKEN || '',

  // Lifecycles & Watchdogs
  autoStartPod: (process.env.AUTO_START_POD || 'true').toLowerCase() === 'true',
  autoStopAfterJob: (process.env.AUTO_STOP_AFTER_JOB || 'true').toLowerCase() === 'true',
  autoStopWhenQueueEmpty: (process.env.AUTO_STOP_WHEN_QUEUE_EMPTY || 'true').toLowerCase() === 'true',
  zombiePodCheckOnStartup: (process.env.ZOMBIE_POD_CHECK_ON_STARTUP || 'true').toLowerCase() === 'true',
  autoStopTimeoutMinutes: parseInt(process.env.AUTO_STOP_TIMEOUT_MINUTES || '60', 10),
  idleStopMinutes: parseInt(process.env.IDLE_STOP_MINUTES || '10', 10),

  // Timeouts & Retries
  comfyuiReadyTimeoutSeconds: parseInt(process.env.COMFYUI_READY_TIMEOUT_SECONDS || '300', 10),
  generationTimeoutMinutes: parseInt(process.env.GENERATION_TIMEOUT_MINUTES || '45', 10),
  maxRetries: parseInt(process.env.MAX_RETRIES || '2', 10),

  // Video Generation Defaults & Constraints
  defaultModelId: process.env.DEFAULT_MODEL_ID || 'wan2.2-ti2v-5b',
  defaultWidth: parseInt(process.env.DEFAULT_WIDTH || '1280', 10),
  defaultHeight: parseInt(process.env.DEFAULT_HEIGHT || '704', 10),
  defaultDurationSeconds: parseInt(process.env.DEFAULT_DURATION_SECONDS || '10', 10),
  defaultSeed: parseInt(process.env.DEFAULT_SEED || '-1', 10),
  maxDurationSeconds: parseInt(process.env.MAX_DURATION_SECONDS || '20', 10),
  maxPromptLength: parseInt(process.env.MAX_PROMPT_LENGTH || '2000', 10),

  // Pathing & Local Proxy
  outputDir: process.env.OUTPUT_DIR || path.join(process.cwd(), 'data', 'outputs'),
  localOutputProxyEnabled: (process.env.LOCAL_OUTPUT_PROXY_ENABLED || 'true').toLowerCase() === 'true',
  outputCleanupDays: parseInt(process.env.OUTPUT_CLEANUP_DAYS || '7', 10),

  // Budget Guards
  maxDailyGpuCostUsd: parseFloat(process.env.MAX_DAILY_GPU_COST_USD || '10.0'),
  maxMonthlyGpuCostUsd: parseFloat(process.env.MAX_MONTHLY_GPU_COST_USD || '150.0'),
  maxSingleJobCostUsd: parseFloat(process.env.MAX_SINGLE_JOB_COST_USD || '2.0'),

  // Storage
  storageProvider: process.env.STORAGE_PROVIDER || 'local',
  r2AccountId: process.env.R2_ACCOUNT_ID || '',
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  r2Bucket: process.env.R2_BUCKET || '',
  s3Bucket: process.env.S3_BUCKET || '',
  s3Region: process.env.S3_REGION || '',
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID || '',
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',

  // Webhooks
  webhookSecret: process.env.WEBHOOK_SECRET || 'webhook-signing-key-1234',
  enableWebhooks: (process.env.ENABLE_WEBHOOKS || 'true').toLowerCase() === 'true',

  logLevel: process.env.LOG_LEVEL || 'info',

  // Configurable Workflow Nodes
  wan: {
    promptNodeId: process.env.WAN_PROMPT_NODE_ID || '4',
    negativePromptNodeId: process.env.WAN_NEGATIVE_PROMPT_NODE_ID || '5',
    seedNodeId: process.env.WAN_SEED_NODE_ID || '7',
    widthNodeId: process.env.WAN_WIDTH_NODE_ID || '6',
    heightNodeId: process.env.WAN_HEIGHT_NODE_ID || '6',
    framesNodeId: process.env.WAN_FRAMES_NODE_ID || '6',
    fpsNodeId: process.env.WAN_FPS_NODE_ID || '',
    outputNodeId: process.env.WAN_OUTPUT_NODE_ID || '10'
  }
};

export const validateEnvConfig = () => {
  const missing: string[] = [];

  if (
    !env.runpodApiKey ||
    env.runpodApiKey === 'your_runpod_api_key_here' ||
    env.runpodApiKey === 'your_real_runpod_api_key_here'
  ) {
    missing.push('RUNPOD_API_KEY');
  }

  if (
    !env.managerApiKey ||
    env.managerApiKey === 'your_secret_manager_api_key_here' ||
    env.managerApiKey === 'your_own_secret_manager_key_here' ||
    env.managerApiKey === 'default_sec_token_replace_me_123'
  ) {
    missing.push('MANAGER_API_KEY');
  }

  if (missing.length > 0) {
    throw new Error(
      `Configuration Error: Missing or default environment variables: ${missing.join(', ')}. ` +
      `Please check your local .env configuration file.`
    );
  }
};
