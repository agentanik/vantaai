import fs from 'fs/promises';
import path from 'path';
import { StorageAdapter } from './storageAdapter';
import { env } from '../config/env';
import { logger } from '../lib/logger';

export class LocalStorageAdapter implements StorageAdapter {
  private destDir: string;

  constructor() {
    this.destDir = env.outputDir;
  }

  private async ensureDir(): Promise<void> {
    await fs.mkdir(this.destDir, { recursive: true });
  }

  public async uploadFile(localFilePath: string, destFileName: string): Promise<string> {
    await this.ensureDir();
    const targetPath = path.join(this.destDir, destFileName);
    
    // If files are already in the target output path, do nothing
    if (path.resolve(localFilePath) === path.resolve(targetPath)) {
      return `/api/output/view/${destFileName}`;
    }

    try {
      await fs.copyFile(localFilePath, targetPath);
      logger.info(`File uploaded locally: ${localFilePath} -> ${targetPath}`);
      return `/api/output/view/${destFileName}`;
    } catch (err: any) {
      logger.error(`Local upload failed: ${err.message}`);
      throw err;
    }
  }

  public async downloadFile(fileName: string, destLocalPath: string): Promise<void> {
    const sourcePath = path.join(this.destDir, fileName);
    try {
      await fs.copyFile(sourcePath, destLocalPath);
    } catch (err: any) {
      logger.error(`Local download failed: ${err.message}`);
      throw err;
    }
  }

  public async deleteFile(fileName: string): Promise<void> {
    const filePath = path.join(this.destDir, fileName);
    try {
      await fs.unlink(filePath);
      logger.info(`File deleted locally: ${filePath}`);
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        logger.error(`Failed to delete local file: ${err.message}`);
        throw err;
      }
    }
  }

  public async getSignedUrl(fileName: string, expirySeconds?: number): Promise<string> {
    // Locally, we return our secure streaming proxy route
    return `/api/output/view/${fileName}`;
  }
}

export const localStorageAdapter = new LocalStorageAdapter();
