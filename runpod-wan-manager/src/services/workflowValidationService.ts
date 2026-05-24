import { env } from '../config/env';
import { workflowRegistryService } from './workflowRegistryService';

export interface WorkflowValidationError {
  code: string;
  field?: string;
  message: string;
}

export interface WorkflowValidationResult {
  ok: boolean;
  modelId?: string;
  valid: boolean;
  workflowPath?: string;
  errors?: WorkflowValidationError[];
  checkedNodes?: Record<string, string>;
}

export class WorkflowValidationService {
  public validate(modelId: string): WorkflowValidationResult {
    const config = workflowRegistryService.listWorkflows().find(w => w.id === modelId || w.id === `${modelId}-default`);

    if (!config) {
      return {
        ok: false,
        modelId,
        valid: false,
        errors: [{ code: 'MODEL_NOT_FOUND', message: `Model ID ${modelId} does not exist in registry.` }]
      };
    }

    if ((config as any).enabled === false) {
      return {
        ok: false,
        modelId,
        valid: false,
        errors: [{ code: 'MODEL_DISABLED', message: `Model ID ${modelId} is currently disabled.` }]
      };
    }

    let rawJson: any;
    try {
      rawJson = workflowRegistryService.loadRawWorkflow(config.id);
    } catch (e: any) {
      return {
        ok: false,
        modelId,
        valid: false,
        errors: [{ code: 'WORKFLOW_LOAD_FAILED', message: `Failed to load workflow JSON` }]
      };
    }

    // Check if it's a placeholder
    if (!rawJson || Object.keys(rawJson).length <= 2 || rawJson.placeholder) {
      return {
        ok: false,
        modelId,
        valid: false,
        errors: [{ code: 'PLACEHOLDER_WORKFLOW', message: 'Real ComfyUI workflow JSON is required before generation' }]
      };
    }

    const errors: WorkflowValidationError[] = [];
    const checkedNodes: Record<string, string> = {};

    const requiredNodes = [
      { field: 'WAN_PROMPT_NODE_ID', envVal: env.wan.promptNodeId, key: 'prompt' },
      { field: 'WAN_SEED_NODE_ID', envVal: env.wan.seedNodeId, key: 'seed' },
      { field: 'WAN_WIDTH_NODE_ID', envVal: env.wan.widthNodeId, key: 'width' },
      { field: 'WAN_HEIGHT_NODE_ID', envVal: env.wan.heightNodeId, key: 'height' },
      { field: 'WAN_FRAMES_NODE_ID', envVal: env.wan.framesNodeId, key: 'frames' },
      { field: 'WAN_OUTPUT_NODE_ID', envVal: env.wan.outputNodeId, key: 'output' }
    ];

    if (env.wan.negativePromptNodeId) {
      requiredNodes.push({ field: 'WAN_NEGATIVE_PROMPT_NODE_ID', envVal: env.wan.negativePromptNodeId, key: 'negativePrompt' });
    }

    for (const reqNode of requiredNodes) {
      if (!reqNode.envVal) {
        errors.push({
          code: 'MISSING_NODE_ID',
          field: reqNode.field,
          message: `${reqNode.field} is not configured`
        });
        continue;
      }
      
      const nodeData = rawJson[reqNode.envVal];
      if (!nodeData) {
        errors.push({
          code: 'MISSING_NODE_IN_WORKFLOW',
          field: reqNode.field,
          message: `Node ID ${reqNode.envVal} is missing in the workflow JSON`
        });
      } else {
        checkedNodes[reqNode.key] = reqNode.envVal;
      }
    }

    if (errors.length > 0) {
      return {
        ok: false,
        modelId,
        valid: false,
        errors
      };
    }

    return {
      ok: true,
      modelId,
      valid: true,
      workflowPath: config.workflowPath,
      checkedNodes
    };
  }
}

export const workflowValidationService = new WorkflowValidationService();
