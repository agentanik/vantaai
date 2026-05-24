import fs from 'fs';
import path from 'path';
import { WorkflowTemplate } from '../types/workflows';
import { logger } from '../lib/logger';
import { fileUtils } from '../lib/fileUtils';

class WorkflowRegistryService {
  private templates: Map<string, WorkflowTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    const defaultTemplates: WorkflowTemplate[] = [
      {
        id: 'wan2.2-ti2v-5b-default',
        name: 'Wan2.2 TI2V 5B Production Workflow',
        description: 'Default text-to-video workflow configured for Wan2.2 5B FP8 model',
        modelId: 'wan2.2-ti2v-5b',
        workflowPath: 'workflows/wan2.2-ti2v-5b.json',
        version: '1.0',
        parameters: {
          promptNodeId: '6',
          negativePromptNodeId: '7',
          seedNodeId: '12',
          widthNodeId: '15',
          heightNodeId: '16',
          framesNodeId: '18'
        }
      },
      {
        id: 'wan2.2-ti2v-5b-placeholder-tmpl',
        name: 'Wan2.2 TI2V 5B Placeholder Workflow',
        description: 'Mock template for 5B video models',
        modelId: 'wan2.2-a14b-placeholder',
        workflowPath: 'workflows/wan2.2-ti2v-5b.placeholder.json',
        version: '1.0',
        parameters: {
          promptNodeId: '10',
          seedNodeId: '15',
          widthNodeId: '20',
          heightNodeId: '21'
        }
      },
      {
        id: 'video-upscale-default',
        name: 'Ultimate SD Upscaler Video Template',
        description: 'Upscaling video inputs using ComfyUI',
        modelId: 'video-upscaler-placeholder',
        workflowPath: 'workflows/video-upscale.placeholder.json',
        version: '1.0',
        parameters: {
          promptNodeId: '1',
          seedNodeId: '2',
          widthNodeId: '3',
          heightNodeId: '4'
        }
      }
    ];

    defaultTemplates.forEach((t) => {
      this.templates.set(t.id, t);
    });

    logger.info(`Workflow Registry initialised with ${this.templates.size} workflow templates.`);
  }

  public getTemplate(id: string): WorkflowTemplate | undefined {
    return this.templates.get(id);
  }

  public getTemplateForModel(modelId: string): WorkflowTemplate | undefined {
    return Array.from(this.templates.values()).find((t) => t.modelId === modelId);
  }

  public getWorkflowJson(template: WorkflowTemplate): Record<string, any> {
    const fullPath = path.join(process.cwd(), template.workflowPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Workflow template file not found on disk at: ${template.workflowPath}`);
    }
    const rawContent = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(rawContent);
  }

  public registerTemplate(template: WorkflowTemplate): void {
    this.templates.set(template.id, template);
    logger.info(`Workflow template registered: ${template.name} (${template.id})`);
  }

  public listWorkflows(): WorkflowTemplate[] {
    return Array.from(this.templates.values());
  }

  public loadRawWorkflow(templateId: string): Record<string, any> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Workflow template with ID ${templateId} not found.`);
    }
    return this.getWorkflowJson(template);
  }
}

export const workflowRegistryService = new WorkflowRegistryService();
