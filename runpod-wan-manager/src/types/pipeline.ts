import { GenerationJob } from './jobs';
import { AIModel } from './models';
import { WorkflowTemplate } from './workflows';

export interface WorkflowExecutionPlan {
  jobId: string;
  model: AIModel;
  template: WorkflowTemplate;
  steps: string[];
  estimatedCostUsd: number;
  gpuTypeRequired: string;
}

export interface JobProgressEvent {
  jobId: string;
  status: string;
  percent: number;
  currentNode?: string;
  currentNodeName?: string;
  timestamp: string;
  message?: string;
}

