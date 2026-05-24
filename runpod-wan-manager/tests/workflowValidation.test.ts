import { describe, it, expect, vi } from 'vitest';
import { workflowValidationService } from '../src/services/workflowValidationService';
import { workflowRegistryService } from '../src/services/workflowRegistryService';
import { env } from '../src/config/env';

vi.mock('../src/services/workflowRegistryService', () => ({
  workflowRegistryService: {
    listWorkflows: vi.fn(),
    loadRawWorkflow: vi.fn()
  }
}));

describe('Workflow Validation Service Security Guards', () => {
  it('should violently reject an unknown modelId', () => {
    (workflowRegistryService.listWorkflows as any).mockReturnValue([]);
    const res = workflowValidationService.validate('fake-model');
    expect(res.valid).toBe(false);
    expect(res.errors![0].code).toBe('MODEL_NOT_FOUND');
  });

  it('should block a disabled modelId from running', () => {
    (workflowRegistryService.listWorkflows as any).mockReturnValue([{ id: 'test-model', enabled: false }]);
    const res = workflowValidationService.validate('test-model');
    expect(res.valid).toBe(false);
    expect(res.errors![0].code).toBe('MODEL_DISABLED');
  });

  it('should explicitly block placeholder workflows containing empty objects', () => {
    (workflowRegistryService.listWorkflows as any).mockReturnValue([{ id: 'test-model', enabled: true }]);
    (workflowRegistryService.loadRawWorkflow as any).mockReturnValue({ "1": "placeholder" });
    const res = workflowValidationService.validate('test-model');
    expect(res.valid).toBe(false);
    expect(res.errors![0].code).toBe('PLACEHOLDER_WORKFLOW');
  });

  it('should fail validation if required structural Node IDs are missing from the parsed JSON', () => {
    (workflowRegistryService.listWorkflows as any).mockReturnValue([{ id: 'test-model', enabled: true }]);
    (workflowRegistryService.loadRawWorkflow as any).mockReturnValue({
      "1": { class_type: "SomeNode" },
      "2": { class_type: "AnotherNode" },
      "3": { class_type: "ExtraNode" }
    });
    
    env.wan = {
      promptNodeId: '10',
      seedNodeId: '12',
      widthNodeId: '15',
      heightNodeId: '16',
      framesNodeId: '18',
      outputNodeId: '20',
      negativePromptNodeId: ''
    };

    const res = workflowValidationService.validate('test-model');
    expect(res.valid).toBe(false);
    expect(res.errors!.some(e => e.code === 'MISSING_NODE_IN_WORKFLOW' && e.field === 'WAN_PROMPT_NODE_ID')).toBe(true);
  });
});
