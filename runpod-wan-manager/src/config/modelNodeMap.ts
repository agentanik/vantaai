export interface WorkflowNodeMap {
  promptNodeId: string;
  promptInputName: string;
  negativePromptNodeId?: string;
  negativePromptInputName?: string;
  seedNodeId: string;
  seedInputName: string;
  widthNodeId: string;
  widthInputName: string;
  heightNodeId: string;
  heightInputName: string;
  framesNodeId?: string;
  framesInputName?: string;
  outputNodeId: string;
}

export const modelNodeMap: Record<string, WorkflowNodeMap> = {
  'wan2.2-ti2v-5b': {
    promptNodeId: '6',
    promptInputName: 'text',
    negativePromptNodeId: '7',
    negativePromptInputName: 'text',
    seedNodeId: '12',
    seedInputName: 'noise_seed',
    widthNodeId: '15',
    widthInputName: 'value',
    heightNodeId: '16',
    heightInputName: 'value',
    framesNodeId: '18',
    framesInputName: 'value',
    outputNodeId: '20'
  },
  'wan2.2-a14b-placeholder': {
    promptNodeId: '10',
    promptInputName: 'text',
    seedNodeId: '15',
    seedInputName: 'seed',
    widthNodeId: '20',
    widthInputName: 'width',
    heightNodeId: '21',
    heightInputName: 'height',
    outputNodeId: '25'
  },
  'video-upscaler-placeholder': {
    promptNodeId: '1',
    promptInputName: 'text',
    seedNodeId: '2',
    seedInputName: 'seed',
    widthNodeId: '3',
    widthInputName: 'width',
    heightNodeId: '4',
    heightInputName: 'height',
    outputNodeId: '10'
  }
};
