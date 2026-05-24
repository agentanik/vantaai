import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';
import { logger } from '../lib/logger';

export class OutputController {
  public static viewOutput(req: Request, res: Response, next: NextFunction): void {
    try {
      const { filename } = req.params;
      
      if (!filename) {
        res.status(400).json({
          success: false,
          error: 'Missing required route parameter: filename'
        });
        return;
      }
      
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\') || filename.includes('%2E') || filename.includes('%2F') || filename.includes('%5C')) {
        logger.warn(`Security warning: Path traversal attempt blocked for filename: ${filename}`);
        res.status(400).json({
          ok: false,
          error: 'Access denied: Path traversal detected.'
        });
        return;
      }
      
      const sanitizedFilename = path.basename(filename);
      const outputDirResolved = path.resolve(env.outputDir);
      const localFilePath = path.join(outputDirResolved, sanitizedFilename);
      
      if (!path.resolve(localFilePath).startsWith(outputDirResolved)) {
        logger.warn(`Security warning: Path traversal attempt blocked for filename: ${filename}`);
        res.status(403).json({
          success: false,
          error: 'Access denied: Path traversal detected.'
        });
        return;
      }
      
      if (!fs.existsSync(localFilePath)) {
        logger.warn(`Output view request failed. File not found: ${localFilePath}`);
        res.status(404).json({
          success: false,
          error: 'Generated output file not found. It may have been cleaned up or expired.'
        });
        return;
      }
      
      logger.debug(`Streaming local video output: ${localFilePath}`);
      res.sendFile(localFilePath);
    } catch (error: any) {
      logger.error(`Error streaming local output: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Internal server error retrieving static output asset.'
      });
    }
  }
}
