import { runpodClient } from '../src/lib/runpodClient';
import { logger } from '../src/lib/logger';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const podId = process.env.RUNPOD_POD_ID || 'k8w9j2e2xvcdv6';
  logger.info(`Fetching details for pod: ${podId}`);
  try {
    const status = await runpodClient.getPodStatus(podId);
    console.log('POD STATUS DETAILS:', JSON.stringify(status, null, 2));
  } catch (error) {
    logger.error('Failed to get pod status:', error);
  }
}

main();
