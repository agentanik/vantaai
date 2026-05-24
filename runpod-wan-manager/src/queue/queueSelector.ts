import { env } from '../config/env';
import { QueueAdapter } from './queueAdapter';
import { memoryQueueAdapter } from './memoryQueueAdapter';
import { bullmqQueueAdapter } from './bullmqQueueAdapter.placeholder';
import { logger } from '../lib/logger';

class QueueSelector {
  public getAdapter(): QueueAdapter {
    const type = env.queueAdapter?.toLowerCase();
    
    switch (type) {
      case 'redis':
      case 'bullmq':
        logger.debug('Routing to BullMQQueueAdapter...');
        return bullmqQueueAdapter;
      case 'memory':
      default:
        return memoryQueueAdapter;
    }
  }
}

export const queueSelector = new QueueSelector();
