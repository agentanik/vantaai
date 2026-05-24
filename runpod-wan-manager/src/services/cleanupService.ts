import fs from 'fs';
import path from 'path';
import { logger } from '../lib/logger';
import { env } from '../config/env';

export class CleanupService {
  async cleanupOldOutputs(days: number = 7): Promise<number> {
    const outputDir = path.resolve(env.outputDir);
    logger.info(`Running output cleanup task targeting files older than ${days} days in: ${outputDir}`);
    
    if (!fs.existsSync(outputDir)) {
      logger.warn(`Output directory does not exist locally, skipping: ${outputDir}`);
      return 0;
    }
    
    let deletedCount = 0;
    const now = Date.now();
    const thresholdMs = days * 24 * 60 * 60 * 1000;
    
    try {
      const files = fs.readdirSync(outputDir);
      for (const file of files) {
        const filePath = path.join(outputDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile() && now - stats.mtimeMs > thresholdMs) {
          fs.unlinkSync(filePath);
          logger.info(`Deleted file: ${filePath}`);
          deletedCount++;
        }
      }
      logger.info(`Output cleanup complete. Total files deleted: ${deletedCount}`);
    } catch (error: any) {
      logger.error(`Error executing output folder cleanup: ${error.message}`);
    }
    
    return deletedCount;
  }
}

export const cleanupService = new CleanupService();
