import { config } from '../lib/config';
import { readJsonFile, getWorkflowPath } from '../lib/fileUtils';
import { logger } from '../lib/logger';
import { ValidationError } from '../lib/errors';
import { VideoGenerationRequest } from '../types/jobs';

export class ComfyWorkflowService {
  private patchNodeInput(
    workflow: any,
    nodeId: string,
    inputName: string,
    value: unknown
  ): void {
    if (!workflow[nodeId]) {
      throw new ValidationError(
        `Workflow compilation error: Node ID "${nodeId}" could not be found in the loaded JSON template. ` +
        `Please verify that the nodeId mapping in your configuration matches your exported ComfyUI schema.`
      );
    }
    
    if (!workflow[nodeId].inputs) {
      workflow[nodeId].inputs = {};
    }
    
    workflow[nodeId].inputs[inputName] = value;
    logger.debug(`Workflow patched: Node [${nodeId}], input [${inputName}] = ${value}`);
  }

  loadWorkflowTemplate(filename: string): any {
    const templatePath = getWorkflowPath(filename);
    logger.info(`Loading workflow JSON template from: ${templatePath}`);
    return readJsonFile<any>(templatePath);
  }

  prepareGenerationWorkflow(
    request: VideoGenerationRequest,
    actualSeed: number,
    totalFrames: number,
    fps: number
  ): any {
    const workflow = this.loadWorkflowTemplate('wan2.2-ti2v-5b.json');
    
    logger.info('Patching loaded workflow template with request parameters...');
    
    // Inject prompt
    this.patchNodeInput(workflow, config.wan.promptNodeId, 'text', request.prompt);
    
    // Inject negative prompt if provided
    if (request.negativePrompt) {
      this.patchNodeInput(workflow, config.wan.negativePromptNodeId, 'text', request.negativePrompt);
    }
    
    // Inject seed
    this.patchNodeInput(workflow, config.wan.seedNodeId, 'seed', actualSeed);
    
    // Inject resolution
    const width = request.width || config.defaultWidth;
    const height = request.height || config.defaultHeight;
    this.patchNodeInput(workflow, config.wan.widthNodeId, 'width', width);
    this.patchNodeInput(workflow, config.wan.heightNodeId, 'height', height);
    
    // Inject duration/frames
    this.patchNodeInput(workflow, config.wan.framesNodeId, 'batch_size', totalFrames);
    
    // Inject FPS if a node is configured for it
    if (config.wan.fpsNodeId) {
      this.patchNodeInput(workflow, config.wan.fpsNodeId, 'fps', fps);
    }
    
    logger.info('Workflow template successfully compiled and patched.');
    return workflow;
  }

  prepareUpscaleWorkflow(inputVideoPath: string): any {
    const workflow = this.loadWorkflowTemplate('video-upscale-template.json');
    logger.info(`Compiling upscale workflow targeting input video: ${inputVideoPath}`);
    
    // Patch input path into LoadVideo node (Node 1)
    this.patchNodeInput(workflow, '1', 'video_path', inputVideoPath);
    
    return workflow;
  }
}

export const comfyWorkflowService = new ComfyWorkflowService();
