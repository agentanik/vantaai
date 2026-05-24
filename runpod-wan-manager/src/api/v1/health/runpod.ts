import { Request, Response, NextFunction } from 'express';
import { runpodClient } from '../../../lib/runpodClient';
import { env } from '../../../config/env';

export const getRunpodHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const hasApiKey = !!env.runpodApiKey && 
                      env.runpodApiKey !== 'your_runpod_api_key_here' && 
                      env.runpodApiKey !== 'your_real_runpod_api_key_here' && 
                      env.runpodApiKey.length > 10;
    const hasPodId = !!env.runpodPodId;
    const hasNetworkVolume = !!env.runpodNetworkVolumeId;

    let apiOk = false;
    if (hasApiKey) {
      await runpodClient.testRunPodConnection();
      apiOk = true;
    }

    res.status(200).json({
      ok: apiOk,
      provider: "runpod",
      apiKeyConfigured: hasApiKey,
      podIdConfigured: hasPodId,
      networkVolumeConfigured: hasNetworkVolume,
      podId: hasPodId ? env.runpodPodId : undefined,
      status: apiOk ? "connected" : "failed"
    });
  } catch (error: any) {
    const hasApiKey = !!env.runpodApiKey && env.runpodApiKey.length > 10;
    const hasPodId = !!env.runpodPodId;
    const hasNetworkVolume = !!env.runpodNetworkVolumeId;
    
    res.status(500).json({
      ok: false,
      provider: "runpod",
      apiKeyConfigured: hasApiKey,
      podIdConfigured: hasPodId,
      networkVolumeConfigured: hasNetworkVolume,
      status: "failed",
      error: "RunPod health check failed"
    });
  }
};
