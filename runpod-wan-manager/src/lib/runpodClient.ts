import { config } from './config';
import { PodResponse } from '../types/runpod';
import { RunPodError } from './errors';
import { logger } from './logger';

const BASE_URL = 'https://rest.runpod.io/v1';

class RunPodClient {
  private getHeaders() {
    if (!config.runpodApiKey || config.runpodApiKey === 'your_runpod_api_key_here') {
      throw new RunPodError('RUNPOD_API_KEY is not defined in the environment variables.', 500);
    }
    return {
      'Authorization': `Bearer ${config.runpodApiKey}`,
      'Content-Type': 'application/json'
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers = { ...this.getHeaders(), ...options.headers };
    
    try {
      logger.debug(`Sending request to RunPod API: ${options.method || 'GET'} ${endpoint}`);
      const response = await fetch(url, { ...options, headers });
      const data = (await response.json().catch(() => null)) as any;

      if (!response.ok) {
        const errorMessage = data?.message || data?.error || response.statusText;
        logger.error(`RunPod API request failed: HTTP ${response.status}`, errorMessage);
        
        if (response.status === 404) {
          throw new RunPodError(`Pod or resource not found: ${errorMessage}`, 404);
        }
        if (response.status === 401 || response.status === 403) {
          throw new RunPodError(`Authentication failed: Invalid RunPod API Key. Verify your API key in settings. ${errorMessage}`, 401);
        }
        
        const lowerMessage = errorMessage?.toLowerCase() || '';
        
        if (lowerMessage.includes('balance') || lowerMessage.includes('payment') || lowerMessage.includes('funds')) {
          throw new RunPodError(`Insufficient Balance: You do not have enough funds in your RunPod account to deploy/resume this pod. Please add balance manually in the console.`, 402);
        }
        
        if (lowerMessage.includes('capacity') || lowerMessage.includes('out of stock') || lowerMessage.includes('no gpu')) {
          throw new RunPodError(`Zero GPU Capacity: RunPod currently has no available "${config.runpodGpuType}" instances in this region. Please try another GPU or wait.`, 503);
        }
        
        if (lowerMessage.includes('volume') || lowerMessage.includes('network volume')) {
          throw new RunPodError(`Network Volume Error: The volume ID "${config.runpodNetworkVolumeId}" could not be found or attached. Ensure it is in the same data center region.`, 400);
        }

        throw new RunPodError(`RunPod API Error (HTTP ${response.status}): ${errorMessage}`);
      }

      return data as T;
    } catch (error: any) {
      if (error instanceof RunPodError) {
        throw error;
      }
      throw new RunPodError(`RunPod Request Failed: ${error?.message || error}`);
    }
  }

  async listPods(): Promise<PodResponse[]> {
    return this.request<PodResponse[]>('/pods');
  }

  async createPod(name: string, gpuTypeId: string, networkVolumeId?: string): Promise<PodResponse> {
    const templateId = config.runpodTemplateId || 'cw3nka7d08';
    const body: any = {
      name,
      templateId,
      gpuTypeIds: [gpuTypeId],
      gpuCount: 1,
      cloudType: 'SECURE',
      containerDiskInGb: 40,
      volumeMountPath: config.runpodVolumeMountPath,
      env: {
        HF_TOKEN: config.hfToken
      }
    };

    if (networkVolumeId) {
      body.networkVolumeId = networkVolumeId;
    } else {
      body.volumeInGb = 50;
    }

    return this.request<PodResponse>('/pods', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async startPod(podId: string): Promise<PodResponse> {
    return this.request<PodResponse>(`/pods/${podId}/start`, { method: 'POST' });
  }

  async stopPod(podId: string): Promise<PodResponse> {
    return this.request<PodResponse>(`/pods/${podId}/stop`, { method: 'POST' });
  }

  async getPodStatus(podId: string): Promise<PodResponse> {
    return this.request<PodResponse>(`/pods/${podId}`);
  }

  async testRunPodConnection(): Promise<{ ok: boolean; message: string }> {
    if (
      !config.runpodApiKey ||
      config.runpodApiKey === 'your_runpod_api_key_here' ||
      config.runpodApiKey === 'your_real_runpod_api_key_here'
    ) {
      throw new RunPodError('RUNPOD_API_KEY is not defined or is using a default placeholder.', 401);
    }
    try {
      // List pods is a safe GET request to verify authorization
      await this.listPods();
      return { ok: true, message: 'RunPod API connection successful' };
    } catch (error: any) {
      if (error instanceof RunPodError) {
        throw error;
      }
      throw new RunPodError(`Connection failed: ${error?.message || error}`, 500);
    }
  }
}

export const runpodClient = new RunPodClient();
export { PodResponse };
