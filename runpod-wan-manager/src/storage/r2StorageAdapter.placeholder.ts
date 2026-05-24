import { StorageAdapter } from './storageAdapter';
import { env } from '../config/env';
import { logger } from '../lib/logger';

/**
 * Cloudflare R2 storage integration placeholder.
 */
export class R2StorageAdapter implements StorageAdapter {
  constructor() {
    logger.info('R2StorageAdapter placeholder initialized. (Not active)');
  }

  public async uploadFile(localFilePath: string, destFileName: string): Promise<string> {
    logger.debug(`[R2-PLACEHOLDER] Uploading ${localFilePath} to R2 bucket: ${env.r2Bucket}/${destFileName}`);
    return `https://${env.r2Bucket}.r2.cloudflarestorage.com/${destFileName}`;
  }

  public async downloadFile(fileName: string, destLocalPath: string): Promise<void> {
    logger.debug(`[R2-PLACEHOLDER] Downloading ${fileName} from R2 to ${destLocalPath}`);
  }

  public async deleteFile(fileName: string): Promise<void> {
    logger.debug(`[R2-PLACEHOLDER] Deleting ${fileName} from R2`);
  }

  public async getSignedUrl(fileName: string, expirySeconds: number = 3600): Promise<string> {
    return `https://${env.r2Bucket}.r2.cloudflarestorage.com/${fileName}?sig=placeholder_signature&expires=${Math.floor(Date.now() / 1000) + expirySeconds}`;
  }
}

export const r2StorageAdapter = new R2StorageAdapter();
