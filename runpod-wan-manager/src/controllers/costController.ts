import { Request, Response, NextFunction } from 'express';
import { costEstimatorService } from '../services/costEstimatorService';
import { modelRegistryService } from '../services/modelRegistryService';
import { creditService } from '../services/creditService';
import { jobRepository } from '../repositories/jobRepository';
import { env } from '../config/env';
import { z } from 'zod';

const EstimateCostSchema = z.object({
  modelId: z.string().min(1),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  durationSeconds: z.number().int().positive().optional(),
  upscale: z.boolean().optional()
});

export class CostController {
  public static estimateCost(req: Request, res: Response, next: NextFunction): void {
    try {
      const result = EstimateCostSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
        return;
      }
      
      const { modelId, width, height, durationSeconds, upscale } = result.data;
      
      const model = modelRegistryService.getModel(modelId);
      if (!model) {
        res.status(404).json({ success: false, error: `Model "${modelId}" was not found in registry.` });
        return;
      }
      
      const estimate = costEstimatorService.estimateJobCost(
        model,
        width || 1024,
        height || 576,
        durationSeconds || 10,
        !!upscale
      );

      res.json({ success: true, data: estimate });
    } catch (err) {
      next(err);
    }
  }

  public static async getLedger(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.query.userId as string) || 'test-user';
      const balance = await creditService.getBalance(userId);
      res.json({
        success: true,
        userId,
        balance,
        unit: 'credits'
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getCostStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const allJobs = await jobRepository.list();
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

      let dailyCost = 0;
      let monthlyCost = 0;

      allJobs.forEach((job) => {
        const jobTime = new Date(job.createdAt).getTime();
        const cost = job.actualCostUsd || job.estimatedCostUsd || 0;
        
        if (jobTime >= oneDayAgo) {
          dailyCost += cost;
        }
        if (jobTime >= oneMonthAgo) {
          monthlyCost += cost;
        }
      });

      res.json({
        success: true,
        data: {
          dailyUsageUsd: Math.round(dailyCost * 100) / 100,
          dailyLimitUsd: env.maxDailyGpuCostUsd,
          dailyRemainingUsd: Math.max(0, Math.round((env.maxDailyGpuCostUsd - dailyCost) * 100) / 100),
          monthlyUsageUsd: Math.round(monthlyCost * 100) / 100,
          monthlyLimitUsd: env.maxMonthlyGpuCostUsd,
          monthlyRemainingUsd: Math.max(0, Math.round((env.maxMonthlyGpuCostUsd - monthlyCost) * 100) / 100)
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

