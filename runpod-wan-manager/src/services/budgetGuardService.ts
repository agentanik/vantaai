import { AIModel } from '../types/models';
import { BudgetEnforcementResult } from '../types/costs';
import { env } from '../config/env';
import { jobRepository } from '../repositories/jobRepository';
import { creditService } from './creditService';
import { logger } from '../lib/logger';

class BudgetGuardService {
  public async evaluateJobBudget(
    userId: string,
    model: AIModel,
    estimatedCostUsd: number,
    requiredCredits: number
  ): Promise<BudgetEnforcementResult> {
    // 1. Model status check
    if (!model.enabled) {
      return {
        allowed: false,
        reason: `Model "${model.displayName}" is currently disabled in registry.`
      };
    }

    // 2. User Credit Balance check
    const creditsBalance = await creditService.getBalance(userId);
    if (creditsBalance < requiredCredits) {
      return {
        allowed: false,
        reason: `Insufficient credit balance. Required: ${requiredCredits}, Current balance: ${creditsBalance}.`,
        limit: requiredCredits,
        currentUsage: creditsBalance
      };
    }

    // 3. Single Job budget limits
    if (estimatedCostUsd > env.maxSingleJobCostUsd) {
      return {
        allowed: false,
        reason: `Estimated job cost ($${estimatedCostUsd.toFixed(2)}) exceeds single job maximum threshold ($${env.maxSingleJobCostUsd.toFixed(2)}).`,
        limit: env.maxSingleJobCostUsd,
        currentUsage: estimatedCostUsd
      };
    }

    // Calculate aggregated costs from jobs list database
    const allJobs = await jobRepository.list();
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let dailyCost = 0;
    let monthlyCost = 0;

    allJobs.forEach((job) => {
      const jobTime = new Date(job.createdAt);
      const cost = job.actualCostUsd || job.estimatedCostUsd || 0;
      
      if (jobTime >= oneDayAgo) {
        dailyCost += cost;
      }
      if (jobTime >= oneMonthAgo) {
        monthlyCost += cost;
      }
    });

    // 4. Daily budget limit check
    if (dailyCost + estimatedCostUsd > env.maxDailyGpuCostUsd) {
      logger.warn(`Daily budget limit warning: Current usage $${dailyCost.toFixed(2)} + Job estimate $${estimatedCostUsd.toFixed(2)} exceeds limit $${env.maxDailyGpuCostUsd.toFixed(2)}`);
      return {
        allowed: false,
        reason: `Daily GPU operational cost limit reached. Current: $${dailyCost.toFixed(2)}/day, Limit: $${env.maxDailyGpuCostUsd.toFixed(2)}/day`,
        limit: env.maxDailyGpuCostUsd,
        currentUsage: dailyCost
      };
    }

    // 5. Monthly budget limit check
    if (monthlyCost + estimatedCostUsd > env.maxMonthlyGpuCostUsd) {
      logger.warn(`Monthly budget limit warning: Current usage $${monthlyCost.toFixed(2)} + Job estimate $${estimatedCostUsd.toFixed(2)} exceeds limit $${env.maxMonthlyGpuCostUsd.toFixed(2)}`);
      return {
        allowed: false,
        reason: `Monthly GPU operational budget limit reached. Current: $${monthlyCost.toFixed(2)}/month, Limit: $${env.maxMonthlyGpuCostUsd.toFixed(2)}/month`,
        limit: env.maxMonthlyGpuCostUsd,
        currentUsage: monthlyCost
      };
    }

    return { allowed: true };
  }
}

export const budgetGuardService = new BudgetGuardService();

