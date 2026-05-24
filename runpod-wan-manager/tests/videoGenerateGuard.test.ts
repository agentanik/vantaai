import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobController } from '../src/controllers/jobController';
import { workflowValidationService } from '../src/services/workflowValidationService';
import { videoGenerationService } from '../src/services/videoGenerationService';

vi.mock('../src/services/workflowValidationService', () => ({
  workflowValidationService: {
    validate: vi.fn()
  }
}));

vi.mock('../src/services/videoGenerationService', () => ({
  videoGenerationService: {
    queueGeneration: vi.fn()
  }
}));

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('Job Controller Video Generate Guard', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = { body: { prompt: 'A dog', modelId: 'wan2.2-ti2v-5b' } };
    res = mockResponse();
    next = vi.fn();
    vi.clearAllMocks();
  });

  it('should immediately reject requests if workflow validation fails BEFORE touching billing or queues', async () => {
    (workflowValidationService.validate as any).mockReturnValue({
      valid: false,
      errors: [{ code: 'INVALID', message: 'Missing node' }]
    });

    await JobController.createJob(req, res, next);

    expect(workflowValidationService.validate).toHaveBeenCalledWith('wan2.2-ti2v-5b');
    expect(videoGenerationService.queueGeneration).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].error.code).toBe('WORKFLOW_VALIDATION_FAILED');
  });

  it('should proceed to securely queue the job if the workflow is valid', async () => {
    (workflowValidationService.validate as any).mockReturnValue({
      valid: true
    });
    
    (videoGenerationService.queueGeneration as any).mockResolvedValue({
      id: 'job_123',
      status: 'queued',
      priority: 0,
      estimatedCostUsd: 0,
      creditsCharged: 0
    });

    await JobController.createJob(req, res, next);

    expect(workflowValidationService.validate).toHaveBeenCalledWith('wan2.2-ti2v-5b');
    expect(videoGenerationService.queueGeneration).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(202);
  });
});
