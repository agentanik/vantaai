import { StorageAdapter } from './storageAdapter';
import { env } from '../config/env';
import { logger } from '../lib/logger';

/**
 * AWS S3 storage integration placeholder.
 */
export class S3StorageAdapter implements StorageAdapter {
  constructor() {
    logger.info('S3StorageAdapter placeholder initialized. (Not active)');
  }

  public async uploadFile(localFilePath: string, destFileName: string): Promise<string> {
    logger.debug(`[S3-PLACEHOLDER] Uploading ${localFilePath} to S3 bucket: ${env.s3Bucket}/${destFileName}`);
    return `https://${env.s3Bucket}.s3.${env.s3Region}.amazonaws.com/${destFileName}`;
  }

  public async downloadFile(fileName: string, destLocalPath: string): Promise<void> {
    logger.debug(`[S3-PLACEHOLDER] Downloading ${fileName} from S3 to ${destLocalPath}`);
  }

  public async deleteFile(fileName: string): Promise<void> {
    logger.debug(`[S3-PLACEHOLDER] Deleting ${fileName} from S3`);
  }

  public async getSignedUrl(fileName: string, expirySeconds: number = 3600): Promise<string> {
    return `https://${env.s3Bucket}.s3.${env.s3Region}.amazonaws.com/${fileName}?AWSAccessKeyId=placeholder&Expires=${Math.floor(Date.now() / 1000) + expirySeconds}&Signature=placeholder`;
  }
}

export const s3StorageAdapter = new S3StorageAdapter();
