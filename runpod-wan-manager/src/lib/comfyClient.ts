import { ComfyPromptResponse, ComfyHistoryResponse, ComfySystemStats } from '../types/comfy';
import { ComfyUIError } from './errors';
import { logger } from './logger';
import { sleep } from './waitUtils';
import { config } from './config';

export function getComfyBaseUrl(podId: string): string {
  return `https://${podId}-${config.runpodComfyuiPort}.proxy.runpod.net`;
}

export async function checkComfyHealth(baseUrl: string): Promise<boolean> {
  try {
    const url = `${baseUrl}/system_stats`;
    logger.debug(`Checking ComfyUI health at: ${url}`);
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const stats = await res.json() as ComfySystemStats;
      logger.info(`ComfyUI is responsive. CUDA Devices detected: ${stats.devices.length}`);
      return true;
    }
    return false;
  } catch (error: any) {
    logger.debug(`ComfyUI health check attempt failed: ${error.message}`);
    return false;
  }
}

export async function waitForComfyUIReady(baseUrl: string, timeoutSeconds: number): Promise<void> {
  const started = Date.now();
  logger.info(`Waiting for ComfyUI to become ready at: ${baseUrl} (Timeout: ${timeoutSeconds}s)`);
  
  while (Date.now() - started < timeoutSeconds * 1000) {
    const isReady = await checkComfyHealth(baseUrl);
    if (isReady) {
      logger.info(`ComfyUI initialized successfully and ready for inputs.`);
      return;
    }
    await sleep(5000);
  }
  
  throw new ComfyUIError(`ComfyUI container did not become responsive on proxy endpoint before timeout (${timeoutSeconds} seconds).`);
}

export async function submitComfyPrompt(baseUrl: string, workflow: unknown): Promise<ComfyPromptResponse> {
  const url = `${baseUrl}/prompt`;
  logger.info(`Submitting workflow payload to ComfyUI prompt endpoint...`);
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow })
    });
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new ComfyUIError(`ComfyUI prompt submission failed with HTTP ${res.status}: ${errorText}`);
    }
    
    const data = await res.json() as ComfyPromptResponse;
    if (data.node_errors && Object.keys(data.node_errors).length > 0) {
      throw new ComfyUIError(`ComfyUI workflow has compilation errors: ${JSON.stringify(data.node_errors)}`);
    }
    
    logger.info(`ComfyUI prompt accepted. Prompt ID: ${data.prompt_id}`);
    return data;
  } catch (error: any) {
    if (error instanceof ComfyUIError) throw error;
    throw new ComfyUIError(`Failed to connect or submit to ComfyUI: ${error.message}`);
  }
}

export async function getComfyHistory(baseUrl: string, promptId: string): Promise<ComfyHistoryResponse> {
  const url = `${baseUrl}/history/${promptId}`;
  logger.debug(`Retrieving ComfyUI execution history for prompt: ${promptId}`);
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new ComfyUIError(`Failed to fetch history from ComfyUI (HTTP ${res.status})`);
    }
    return await res.json() as ComfyHistoryResponse;
  } catch (error: any) {
    if (error instanceof ComfyUIError) throw error;
    throw new ComfyUIError(`Error fetching history from ComfyUI: ${error.message}`);
  }
}

export async function getComfyQueue(baseUrl: string): Promise<any> {
  const url = `${baseUrl}/queue`;
  try {
    const res = await fetch(url);
    if (res.ok) return await res.json();
    return null;
  } catch {
    return null;
  }
}

export function findOutputVideoFromHistory(history: ComfyHistoryResponse, promptId: string): string | null {
  const jobHistory = history[promptId];
  if (!jobHistory) return null;
  
  const outputs = jobHistory.outputs;
  for (const nodeId in outputs) {
    const nodeOutput = outputs[nodeId];
    // Check for gifs/video lists
    if (nodeOutput.gifs && nodeOutput.gifs.length > 0) {
      // Typically Kijai's WanVideo combines outputs to files or gifs
      return nodeOutput.gifs[0].filename;
    }
    // Also fallback to images list (if outputted as image sequence or mp4 in images key)
    if (nodeOutput.images && nodeOutput.images.length > 0) {
      return nodeOutput.images[0].filename;
    }
    // Also check for 'videos' key, as native SaveVideo may use this in newer versions
    if (nodeOutput.videos && nodeOutput.videos.length > 0) {
      return nodeOutput.videos[0].filename;
    }
  }
  
  return null;
}

export async function interruptComfyPrompt(baseUrl: string): Promise<void> {
  const url = `${baseUrl}/interrupt`;
  logger.info(`Sending interrupt request to ComfyUI at: ${url}`);
  try {
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) {
      throw new ComfyUIError(`Failed to interrupt ComfyUI prompt (HTTP ${res.status})`);
    }
  } catch (error: any) {
    if (error instanceof ComfyUIError) throw error;
    throw new ComfyUIError(`Error sending interrupt request to ComfyUI: ${error.message}`);
  }
}

