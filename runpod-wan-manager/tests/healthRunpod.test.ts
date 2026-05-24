import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRunpodHealth } from '../src/api/v1/health/runpod';
import { runpodClient } from '../src/lib/runpodClient';
import { env } from '../src/config/env';

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

vi.mock('../src/lib/runpodClient', () => ({
  runpodClient: {
    testRunPodConnection: vi.fn()
  }
}));

describe('RunPod Health Endpoint Security', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = {};
    res = mockResponse();
    vi.clearAllMocks();
    
    env.runpodApiKey = 'valid_key_1234567890';
    env.runpodPodId = 'pod123';
    env.runpodNetworkVolumeId = 'vol123';
  });

  it('should return a perfect 200 JSON on success without leaking internal keys', async () => {
    (runpodClient.testRunPodConnection as any).mockResolvedValue({ ok: true });
    
    await getRunpodHealth(req, res, vi.fn());
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      provider: "runpod",
      apiKeyConfigured: true,
      podIdConfigured: true,
      networkVolumeConfigured: true,
      podId: "pod123",
      status: "connected"
    });
  });

  it('should NEVER leak stack traces on SDK failure, always returns strict safe 500 JSON', async () => {
    (runpodClient.testRunPodConnection as any).mockRejectedValue(new Error('Super secret SDK crash stack trace here'));
    
    await getRunpodHealth(req, res, vi.fn());
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      provider: "runpod",
      apiKeyConfigured: true,
      podIdConfigured: true,
      networkVolumeConfigured: true,
      status: "failed",
      error: "RunPod health check failed"
    });
    
    const jsonCall = res.json.mock.calls[0][0];
    expect(JSON.stringify(jsonCall)).not.toContain('secret SDK crash');
  });
});
