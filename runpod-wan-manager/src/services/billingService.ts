import { userRepository } from '../repositories/userRepository';
import { usageRepository } from '../repositories/usageRepository';
import { logger } from '../lib/logger';
import { UsageLedgerEntry } from '../types/costs';
import { v4 as uuidv4 } from 'uuid';

export class BillingService {
  /**
   * Check if a user has sufficient credits to run a job.
   */
  public async hasSufficientCredits(userId: string, minCredits: number = 0.50): Promise<boolean> {
    const user = await userRepository.getById(userId);
    if (!user) return false;
    
    // Check account credits balance
    return user.creditsBalance >= minCredits;
  }

  /**
   * Charge a user for GPU active usage duration and record transaction.
   */
  public async recordUsage(params: {
    userId: string;
    jobId: string;
    durationSeconds: number;
    costPerHourUsd: number;
    providerId: string;
  }): Promise<number> {
    const { userId, jobId, durationSeconds, costPerHourUsd, providerId } = params;
    
    // Calculate total cost (prorated by seconds)
    const cost = (durationSeconds / 3600) * costPerHourUsd;
    const roundedCost = Math.round(cost * 10000) / 10000; // 4 decimals

    logger.info(`Recording GPU usage for user ${userId}, job ${jobId}: ${durationSeconds}s @ $${costPerHourUsd}/hr = $${roundedCost}`);

    // Deduct user balance
    const user = await userRepository.getById(userId);
    if (user) {
      user.creditsBalance = Math.max(0, user.creditsBalance - roundedCost);
      await userRepository.save(user);
    }

    // Save usage entry
    const entry: UsageLedgerEntry = {
      id: uuidv4(),
      userId,
      jobId,
      gpuType: 'RTX 4090',
      runtimeSeconds: durationSeconds,
      provider: providerId,
      costUsd: roundedCost,
      creditsCharged: roundedCost,
      timestamp: new Date().toISOString(),
    };

    await usageRepository.save(entry);
    return roundedCost;
  }

  /**
   * Reserve credit bounds at the beginning of a job.
   */
  public async reserveCredits(userId: string, amount: number): Promise<boolean> {
    const user = await userRepository.getById(userId);
    if (!user || user.creditsBalance < amount) {
      return false;
    }
    
    // For simplicity, we just verify balance. Enterprise systems lock reservedCredits.
    return true;
  }
}

export const billingService = new BillingService();

