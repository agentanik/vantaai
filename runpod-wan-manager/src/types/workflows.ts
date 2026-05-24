export interface WorkflowNodeInput {
  nodeId: string;
  inputName: string;
  value: any;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  modelId: string;
  workflowPath: string;
  version: string;
  parameters: {
    promptNodeId?: string;
    negativePromptNodeId?: string;
    seedNodeId?: string;
    widthNodeId?: string;
    heightNodeId?: string;
    framesNodeId?: string;
    stepsNodeId?: string;
  };
}
