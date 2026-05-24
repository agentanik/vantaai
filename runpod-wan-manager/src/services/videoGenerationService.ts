import { z } from 'zod';
import path from 'path';
import { jobRepository } from '../repositories/jobRepository';
import { comfyWorkflowService } from './comfyWorkflowService';
import { outputService } from './outputService';
import { logger } from '../lib/logger';
import { env } from '../config/env';
import { getComfyBaseUrl, waitForComfyUIReady, submitComfyPrompt, getComfyHistory } from '../lib/comfyClient';
import { ValidationError, ComfyUIError, BudgetExceededError } from '../lib/errors';
import { GenerationJob } from '../types/jobs';
import { sleep } from '../lib/waitUtils';
import { modelRegistryService } from './modelRegistryService';
import { costEstimatorService } from './costEstimatorService';
import { budgetGuardService } from './budgetGuardService';
import { idUtils } from '../lib/idUtils';
import { auditLogService } from './auditLogService';
import { providerSelector } from '../providers/providerSelector';
import { storageSelector } from '../storage/storageSelector';
import { creditService } from './creditService';
import { billingService } from './billingService';
import { modelFileValidationService } from './modelFileValidationService';
import { workflowValidationService } from './workflowValidationService';

// Updated Input Schema matching the enterprise specification
export const VideoRequestSchema = z.object({
  prompt: z.string().min(1).max(2000),
  negativePrompt: z.string().max(2000).optional().default(''),
  width: z.number().int().positive().max(2048).default(env.defaultWidth),
  height: z.number().int().positive().max(2048).default(env.defaultHeight),
  durationSeconds: z.number().int().min(1).max(60).default(env.defaultDurationSeconds),
  fps: z.number().int().min(1).max(60).default(16),
  seed: z.number().int().default(-1),
  autoStop: z.boolean().default(true),
  upscale: z.boolean().default(false),
  userId: z.string().default('test-user'),
  modelId: z.string().default(env.defaultModelId),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium')
});

export type VideoGenerationInput = z.infer<typeof VideoRequestSchema>;

class VideoGenerationService {
  public async queueGeneration(rawRequest: unknown): Promise<GenerationJob> {
    // 1. Validate incoming payload parameters
    const parsed = VideoRequestSchema.safeParse(rawRequest);
    if (!parsed.success) {
      const errorMsg = parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new ValidationError(errorMsg);
    }
    const request = parsed.data;

    // 2. Fetch target model registry profile
    const model = modelRegistryService.getModel(request.modelId);
    if (!model) {
      throw new ValidationError(`Model "${request.modelId}" is not registered in the system.`);
    }

    // Validate workflow template availability before reserving credits or putting job in queue
    if (model.workflowPath) {
      try {
        comfyWorkflowService.loadWorkflowTemplate(path.basename(model.workflowPath));
      } catch (err: any) {
        throw new ValidationError(`Workflow template configuration error for model "${model.id}": ${err.message}`);
      }
    }

    // 3. Estimate resource costs and credits
    const costEstimate = costEstimatorService.estimateJobCost(
      model,
      request.width,
      request.height,
      request.durationSeconds,
      request.upscale
    );

    // 4. Validate system and budget constraints
    const budgetEvaluation = await budgetGuardService.evaluateJobBudget(
      request.userId,
      model,
      costEstimate.estimatedTotalCostUsd,
      costEstimate.estimatedCredits
    );

    if (!budgetEvaluation.allowed) {
      throw new BudgetExceededError(budgetEvaluation.reason || 'Job budget exceeded');
    }

    const jobId = idUtils.generateId('job');

    // 5. Reserve credits in user balance ledger
    const reserved = await creditService.reserveCredits(
      jobId,
      request.userId,
      costEstimate.estimatedCredits
    );

    if (!reserved) {
      throw new BudgetExceededError('Failed to reserve credit funds for this generation request.');
    }

    // 6. Persist job entry as queued
    const job: GenerationJob = {
      id: jobId,
      userId: request.userId,
      modelId: request.modelId,
      priority: request.priority,
      status: 'queued',
      request,
      retries: 0,
      maxRetries: 2,
      estimatedCostUsd: costEstimate.estimatedTotalCostUsd,
      creditsCharged: costEstimate.estimatedCredits,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await jobRepository.save(job);
    auditLogService.log('job_created', { modelId: request.modelId, priority: request.priority }, request.userId, jobId);

    return job;
  }

  /**
   * Orchestrates the raw job execution lifecycle on the selected GPU Pod
   */
  public async executeJob(job: GenerationJob): Promise<{ outputUrl: string; actualCostUsd: number }> {
    const request = job.request as VideoGenerationInput;
    const model = modelRegistryService.getModel(job.modelId);
    
    // Choose appropriate instance ID and provider mapping
    const providerId = model?.provider || 'runpod';
    const instanceId = env.runpodPodId; // fallback default instance ID
    const startTime = Date.now();

    const providerAdapter = await providerSelector.getAdapter(providerId);
    const storageAdapter = storageSelector.getAdapter();

    if (env.enableMockRunpod) {
      logger.info(`MOCK MODE: Simulating execution for job ${job.id}`);
      job.status = 'generating';
      await jobRepository.save(job);
      await sleep(2000);
      job.status = 'collecting_output';
      await jobRepository.save(job);
      await sleep(1000);
      job.status = 'completed';
      await jobRepository.save(job);
      return {
        outputUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        actualCostUsd: 0.05
      };
    }

    try {
      // Step A: Signal Startup state
      job.status = 'starting_pod';
      job.updatedAt = new Date().toISOString();
      await jobRepository.save(job);
      
      logger.info(`Starting compute instance ${instanceId} via provider ${providerId}...`);
      await providerAdapter.startInstance(instanceId);
      auditLogService.log('gpu_start_initiated', { providerId, instanceId }, job.userId, job.id);
      
      // Step B: Wait for instance initialization
      job.status = 'waiting_for_pod';
      job.updatedAt = new Date().toISOString();
      await jobRepository.save(job);

      let isRunning = false;
      for (let i = 0; i < 20; i++) {
        const info = await providerAdapter.getInstanceStatus(instanceId);
        if (info.status === 'running') {
          isRunning = true;
          break;
        }
        await sleep(10000); // check status every 10s
      }

      if (!isRunning) {
        throw new ComfyUIError(`Failed to transition instance ${instanceId} to running status.`);
      }
      
      // Step C: Verify proxy connections and wait for ComfyUI
      job.status = 'waiting_for_comfyui';
      job.updatedAt = new Date().toISOString();
      await jobRepository.save(job);

      const comfyBaseUrl = getComfyBaseUrl(instanceId);
      await waitForComfyUIReady(comfyBaseUrl, env.comfyuiReadyTimeoutSeconds);
      
      // Step C.1: Validate Wan model files
      job.status = 'validating_models' as any;
      job.updatedAt = new Date().toISOString();
      await jobRepository.save(job);
      
      const fileCheck = await modelFileValidationService.validateWanModelFiles(instanceId);
      if (!fileCheck.ok) {
        throw new ComfyUIError(`Model file validation failed. Missing files: ${fileCheck.missing?.join(', ')}`);
      }

      // Step C.2: Validate workflow
      job.status = 'validating_workflow' as any;
      job.updatedAt = new Date().toISOString();
      await jobRepository.save(job);

      const workflowCheck = workflowValidationService.validate(request.modelId || 'wan2.2-ti2v-5b');
      if (!workflowCheck.valid) {
        throw new ValidationError(`Workflow invalid: ${workflowCheck.errors?.map((e: any) => e.message).join(' | ')}`);
      }

      // Step D: Construct workflow parameter nodes
      job.status = 'patching_workflow' as any;
      job.updatedAt = new Date().toISOString();
      await jobRepository.save(job);

      const actualSeed = request.seed === -1 ? Math.floor(Math.random() * 10000000) : request.seed;
      const fps = request.fps ?? 16;
      const durationSeconds = request.durationSeconds ?? 5;
      const totalFrames = Math.max(24, Math.round(durationSeconds * fps));
      
      const workflow = comfyWorkflowService.prepareGenerationWorkflow(
        {
          prompt: request.prompt,
          negativePrompt: request.negativePrompt,
          width: request.width,
          height: request.height,
          durationSeconds: request.durationSeconds,
          fps: fps,
          seed: actualSeed,
          upscale: request.upscale
        },
        actualSeed,
        totalFrames,
        fps
      );
      
      // Step E: Dispatch workspace request
      job.status = 'submitting' as any;
      job.updatedAt = new Date().toISOString();
      await jobRepository.save(job);

      const promptRes = await submitComfyPrompt(comfyBaseUrl, workflow);
      
      job.status = 'generating';
      job.comfyPromptId = promptRes.prompt_id;
      job.updatedAt = new Date().toISOString();
      await jobRepository.save(job);
      
      // Step F: Poll prompt history state
      const comfyPromptId = promptRes.prompt_id;
      const pollStart = Date.now();
      const pollTimeoutMs = env.generationTimeoutMinutes * 60 * 1000;
      let completed = false;

      logger.info(`Polling history status for Prompt ID: ${comfyPromptId}`);
      while (Date.now() - pollStart < pollTimeoutMs) {
        const history = await getComfyHistory(comfyBaseUrl, comfyPromptId);
        
        if (history[comfyPromptId]) {
          const item = history[comfyPromptId];
          if (item.status?.completed) {
            completed = true;
            break;
          } else {
            throw new ComfyUIError('ComfyUI engine reported prompt execution failure or abort.');
          }
        }
        await sleep(5000);
      }

      if (!completed) {
        throw new ComfyUIError(`ComfyUI generation task timed out after ${env.generationTimeoutMinutes} minutes.`);
      }

      // Step G: Collect static file outputs
      job.status = 'collecting_output';
      job.updatedAt = new Date().toISOString();
      await jobRepository.save(job);

      const output = await outputService.processJobOutput(comfyBaseUrl, comfyPromptId);
      let finalFileName = output.fileName;
      let localFilePath = output.localPath;
      
      // Step H: Execute optional upscale processing
      if (request.upscale) {
        job.status = 'upscaling';
        job.updatedAt = new Date().toISOString();
        await jobRepository.save(job);

        logger.info(`Sending upscale workflow for completed render: ${finalFileName}`);
        const upscaleWorkflow = comfyWorkflowService.prepareUpscaleWorkflow(finalFileName);
        const upscalePrompt = await submitComfyPrompt(comfyBaseUrl, upscaleWorkflow);
        
        const upscaleStart = Date.now();
        let upscaleCompleted = false;
        while (Date.now() - upscaleStart < 15 * 60 * 1000) {
          const upscaleHistory = await getComfyHistory(comfyBaseUrl, upscalePrompt.prompt_id);
          if (upscaleHistory[upscalePrompt.prompt_id]) {
            upscaleCompleted = true;
            break;
          }
          await sleep(5000);
        }
        
        if (upscaleCompleted) {
          const upscaleOutput = await outputService.processJobOutput(comfyBaseUrl, upscalePrompt.prompt_id);
          finalFileName = upscaleOutput.fileName;
          localFilePath = upscaleOutput.localPath;
        } else {
          logger.warn('Upscale operation timed out. Returning primary output file instead.');
        }
      }

      // Calculate actual financial billing costs based on execution duration
      const execDurationSeconds = Math.ceil((Date.now() - startTime) / 1000);
      const hourlyRate = 0.74; // Standard RTX 4090 rate baseline

      // Record billable transaction to our DB ledger
      const actualCostUsd = await billingService.recordUsage({
        userId: job.userId,
        jobId: job.id,
        durationSeconds: execDurationSeconds,
        costPerHourUsd: hourlyRate,
        providerId
      });

      // Upload file via our storage adapter selector (Local / S3 / R2)
      const outputUrl = await storageAdapter.uploadFile(localFilePath, finalFileName);

      auditLogService.log('job_completed', { outputFile: finalFileName, actualCostUsd }, job.userId, job.id);

      return {
        outputUrl,
        actualCostUsd
      };

    } catch (err: any) {
      auditLogService.log('job_failed', { error: err.message }, job.userId, job.id);
      throw err;
    } finally {
      // Step I: Auto-stop Pod if requested to contain runaway idle billing
      if (request.autoStop && env.autoStopAfterJob) {
        logger.info(`Auto-stop container check trigger active for Pod: ${instanceId}`);
        try {
          await providerAdapter.stopInstance(instanceId);
          auditLogService.log('gpu_stop_initiated', { providerId, instanceId }, job.userId, job.id);
        } catch (stopErr: any) {
          logger.error(`Container teardown failure: ${stopErr.message}`);
        }
      }
    }
  }
}

export const videoGenerationService = new VideoGenerationService();

