import { Request, Response, NextFunction } from 'express';
import { videoGenerationService } from '../services/videoGenerationService';
import { jobRepository } from '../repositories/jobRepository';
import { auditLogService } from '../services/auditLogService';
import { creditService } from '../services/creditService';
import { logger } from '../lib/logger';
import { workflowValidationService } from '../services/workflowValidationService';

export class JobController {
  public static async createJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const requestPayload = {
        ...req.body,
        userId: user ? user.id : (req.body.userId || 'test-user')
      };
      
      const modelId = requestPayload.modelId || 'wan2.2-ti2v-5b';
      const validationResult = workflowValidationService.validate(modelId);
      
      if (!validationResult.valid) {
        res.status(400).json({
          ok: false,
          error: {
            code: 'WORKFLOW_VALIDATION_FAILED',
            message: 'Wan workflow is not ready for generation',
            details: validationResult.errors?.map((e: any) => e.message) || []
          }
        });
        return;
      }
      
      const job = await videoGenerationService.queueGeneration(requestPayload);
      res.status(202).json({
        success: true,
        message: 'Generation job successfully enqueued.',
        data: {
          jobId: job.id,
          status: job.status,
          priority: job.priority,
          estimatedCostUsd: job.estimatedCostUsd,
          creditsCharged: job.creditsCharged
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const job = await jobRepository.getById(id);
      if (!job) {
        res.status(404).json({ success: false, error: 'Job not found.' });
        return;
      }
      res.json({ success: true, data: job });
    } catch (err) {
      next(err);
    }
  }

  public static async listJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobs = await jobRepository.list();
      res.json({ success: true, count: jobs.length, data: jobs });
    } catch (err) {
      next(err);
    }
  }

  public static async cancelJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const job = await jobRepository.getById(id);
      
      if (!job) {
        res.status(404).json({ success: false, error: 'Job not found.' });
        return;
      }
      
      const user = (req as any).user;
      if (user && user.role !== 'admin' && job.userId !== user.id) {
        logger.warn(`Forbidden: User ${user.id} attempted to cancel job ${id} owned by ${job.userId}`);
        res.status(403).json({
          success: false,
          error: 'Access denied: You do not own this job.'
        });
        return;
      }
      
      if (['completed', 'failed', 'cancelled'].includes(job.status)) {
        res.status(400).json({
          success: false,
          error: `Cannot cancel job with status: ${job.status}`
        });
        return;
      }

      await jobRepository.updateStatus(id, 'cancelled', {
        error: 'Job was cancelled by administrative request.'
      });

      try {
        await creditService.refundCredits(id);
      } catch (refundErr: any) {
        logger.error(`Failed to refund credits for cancelled job ${id}: ${refundErr.message}`);
      }

      auditLogService.log('job_cancelled', {}, job.userId, id);
      res.json({ success: true, message: `Job ${id} cancelled successfully.` });
    } catch (err) {
      next(err);
    }
  }
}


