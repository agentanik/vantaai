import { runpodClient } from '../src/lib/runpodClient';
import { logger } from '../src/lib/logger';
import { config } from '../src/lib/config';

async function main() {
  logger.info('=================================================');
  logger.info('🔍 LIVE RUNPOD ACCOUNT DIAGNOSTIC');
  logger.info(`Using API Key: ${config.runpodApiKey.substring(0, 10)}...`);
  logger.info('=================================================');

  try {
    // 1. Test connection
    logger.info('Testing connection to RunPod REST API...');
    const conn = await runpodClient.testRunPodConnection();
    logger.info(`✅ Connection response: ${JSON.stringify(conn)}`);

    // 2. List existing pods
    logger.info('Fetching list of active pods on the account...');
    const pods = await runpodClient.listPods();
    logger.info(`Found ${pods.length} pods:`);
    pods.forEach(pod => {
      logger.info(`- Pod ID: ${pod.id}`);
      logger.info(`  Name:   ${pod.name}`);
      logger.info(`  Status: ${pod.status}`);
      logger.info(`  Image:  ${pod.imageName}`);
      if (pod.runtime) {
        logger.info(`  GPU:    ${pod.gpuName}`);
      }
      logger.info('---');
    });

    // 3. Fetch templates with includeRunpodTemplates=true & includePublicTemplates=true
    logger.info('Fetching templates list with public/runpod templates enabled...');
    const response = await fetch('https://rest.runpod.io/v1/templates?includeRunpodTemplates=true&includePublicTemplates=true', {
      headers: {
        'Authorization': `Bearer ${config.runpodApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const templates = await response.json() as any[];
      logger.info(`Found ${templates.length} templates. ComfyUI related templates:`);
      templates.forEach((t: any) => {
        if (t.name?.toLowerCase().includes('comfy') || t.imageName?.toLowerCase().includes('comfy')) {
          logger.info(`- Template ID: ${t.id}`);
          logger.info(`  Name:        ${t.name}`);
          logger.info(`  Image:       ${t.imageName}`);
          logger.info(`  Ports:       ${t.ports}`);
          logger.info('  ---');
        }
      });
    } else {
      logger.warn(`Could not fetch templates: HTTP ${response.status}`);
    }

  } catch (error: any) {
    logger.error('❌ Diagnostic error encountered:', error);
  }
}

main();
