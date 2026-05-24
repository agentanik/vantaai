import { Request, Response, NextFunction } from 'express';
import { workflowRegistryService } from '../services/workflowRegistryService';
import { workflowValidationService } from '../services/workflowValidationService';

export class WorkflowController {
  public static listWorkflows(req: Request, res: Response, next: NextFunction): void {
    try {
      const list = workflowRegistryService.listWorkflows();
      res.json({ success: true, count: list.length, data: list });
    } catch (err) {
      next(err);
    }
  }

  public static getWorkflow(req: Request, res: Response, next: NextFunction): void {
    try {
      const { id } = req.params;
      const json = workflowRegistryService.loadRawWorkflow(id);
      res.json({ success: true, workflowId: id, nodes: json });
    } catch (err) {
      next(err);
    }
  }

  public static validateWorkflow(req: Request, res: Response, next: NextFunction): void {
    try {
      const { modelId } = req.body;
      if (!modelId || typeof modelId !== 'string') {
        res.status(400).json({ ok: false, valid: false, errors: [{ code: 'INVALID_REQUEST', message: 'modelId is required' }] });
        return;
      }
      
      const result = workflowValidationService.validate(modelId);
      
      if (!result.valid) {
        res.status(400).json(result);
        return;
      }
      
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
