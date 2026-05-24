import { logger } from '../lib/logger';
import { GenerationJob } from '../types/jobs';
import crypto from 'crypto';
import { env } from '../config/env';

export class WebhookService {
  /**
   * Fires a webhook POST request to the external url with exponential backoff retries.
   */
  public async sendWebhook(url: string, payload: any, retries: number = 3): Promise<boolean> {
    if (!url) return false;

    let attempt = 1;
    let delay = 1000; // 1s initial delay

    while (attempt <= retries) {
      try {
        logger.info(`Firing Webhook payload to: ${url} (Attempt ${attempt}/${retries})`);
        
        const serializedPayload = JSON.stringify(payload);
        const signature = crypto
          .createHmac('sha256', env.webhookSecret)
          .update(serializedPayload)
          .digest('hex');

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'RunPod-Wan-Manager/Enterprise',
            'x-manager-signature': signature
          },
          body: serializedPayload,
        });

        if (response.ok) {
          logger.info(`Webhook successfully delivered to: ${url}`);
          return true;
        }

        logger.warn(`Webhook endpoint returned status: HTTP ${response.status}`);
      } catch (err: any) {
        logger.error(`Webhook delivery attempt ${attempt} failed: ${err.message}`);
      }

      if (attempt < retries) {
        logger.debug(`Waiting ${delay}ms before next webhook retry...`);
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2; // exponential backoff
      }
      attempt++;
    }

    logger.error(`Webhook delivery permanently failed for: ${url}`);
    return false;
  }

  /**
   * Sends a callback notification containing job metadata to a registered callbackUrl.
   */
  public async sendCallback(job: GenerationJob): Promise<boolean> {
    const callbackUrl = job.callbackUrl || job.request?.callbackUrl;
    if (!callbackUrl) {
      logger.debug(`No callbackUrl specified for job ${job.id}. Skipping.`);
      return false;
    }

    const payload = {
      jobId: job.id,
      userId: job.userId,
      status: job.status,
      outputUrl: job.outputUrl,
      estimatedCostUsd: job.estimatedCostUsd,
      actualCostUsd: job.actualCostUsd,
      error: job.error,
      createdAt: job.createdAt,
      completedAt: job.completedAt
    };

    return await this.sendWebhook(callbackUrl, payload);
  }
}

export const webhookService = new WebhookService();

