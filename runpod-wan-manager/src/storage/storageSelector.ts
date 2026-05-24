import { env } from '../config/env';
import { StorageAdapter } from './storageAdapter';
import { localStorageAdapter } from './localStorageAdapter';
import { r2StorageAdapter } from './r2StorageAdapter.placeholder';
import { s3StorageAdapter } from './s3StorageAdapter.placeholder';
import { logger } from '../lib/logger';

class StorageSelector {
  public getAdapter(): StorageAdapter {
    const provider = env.storageProvider?.toLowerCase();
    
    switch (provider) {
      case 'r2':
        logger.debug('Routing to R2StorageAdapter...');
        return r2StorageAdapter;
      case 's3':
        logger.debug('Routing to S3StorageAdapter...');
        return s3StorageAdapter;
      case 'local':
      default:
        return localStorageAdapter;
    }
  }
}

export const storageSelector = new StorageSelector();
