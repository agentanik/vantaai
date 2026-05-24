import { logger } from '../lib/logger';
import { auditLogService } from './auditLogService';
import { defaults } from '../config/defaults';
import { userRepository } from '../repositories/userRepository';

class CreditService {
  public async getBalance(userId: string): Promise<number> {
    const user = await userRepository.getById(userId);
    return user?.creditsBalance ?? defaults.userCreditBase;
  }

  public async checkCredits(userId: string, requiredCredits: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return balance >= requiredCredits;
  }

  public async reserveCredits(jobId: string, userId: string, credits: number): Promise<boolean> {
    const user = await userRepository.getById(userId);
    if (!user) {
      logger.warn(`User ${userId} not found when reserving credits.`);
      return false;
    }
    
    if (user.creditsBalance < credits) {
      logger.warn(`Insufficient credits for user ${userId}: requested ${credits}, available ${user.creditsBalance}`);
      return false;
    }

    user.creditsBalance = Math.max(0, user.creditsBalance - credits);
    
    // Initialise reserved if undefined
    if (!user.reservedCredits) {
      user.reservedCredits = {};
    }
    user.reservedCredits[jobId] = credits;
    
    await userRepository.save(user);
    
    auditLogService.log('credits_reserved', { credits, newBalance: user.creditsBalance }, userId, jobId);
    return true;
  }

  public async finalizeCredits(jobId: string): Promise<void> {
    const users = await userRepository.list();
    for (const user of users) {
      if (user.reservedCredits && user.reservedCredits[jobId] !== undefined) {
        const reserved = user.reservedCredits[jobId];
        delete user.reservedCredits[jobId];
        await userRepository.save(user);
        
        auditLogService.log('credits_finalised', { credits: reserved }, user.id, jobId);
        logger.info(`Finalised reserved credits (${reserved}) for job ${jobId}`);
        return;
      }
    }
  }

  public async refundCredits(jobId: string): Promise<void> {
    const users = await userRepository.list();
    for (const user of users) {
      if (user.reservedCredits && user.reservedCredits[jobId] !== undefined) {
        const reserved = user.reservedCredits[jobId];
        user.creditsBalance += reserved;
        delete user.reservedCredits[jobId];
        await userRepository.save(user);
        
        auditLogService.log('credits_refunded', { credits: reserved, newBalance: user.creditsBalance }, user.id, jobId);
        logger.info(`Refunded ${reserved} credits to user ${user.id} for failed job ${jobId}`);
        return;
      }
    }
  }

  public calculateCreditsForJob(width: number, height: number, durationSeconds: number, upscale: boolean): number {
    let cost = defaults.billingWeights.baseVideoClip10s;
    
    // Scale cost based on duration relative to 10s base
    if (durationSeconds > 10) {
      cost += Math.ceil((durationSeconds - 10) * 1.5);
    }
    
    // Scale cost based on resolution
    if (width > 1280 || height > 720) {
      cost += defaults.billingWeights.highResolutionAddition;
    }
 
    // Upscaling cost additions
    if (upscale) {
      cost += defaults.billingWeights.upscaleAddition;
    }

    return cost;
  }
}

export const creditService = new CreditService();


