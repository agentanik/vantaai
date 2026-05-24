import { Request, Response, NextFunction } from 'express';
import { modelRegistryService } from '../services/modelRegistryService';
import { z } from 'zod';

const ToggleModelSchema = z.object({
  id: z.string().min(1),
  enabled: z.boolean()
});

export class ModelController {
  public static listModels(req: Request, res: Response, next: NextFunction): void {
    try {
      const models = modelRegistryService.listModels();
      res.json({ success: true, count: models.length, data: models });
    } catch (err) {
      next(err);
    }
  }

  public static getModel(req: Request, res: Response, next: NextFunction): void {
    try {
      const { id } = req.params;
      const model = modelRegistryService.getModel(id);
      res.json({ success: true, data: model });
    } catch (err) {
      next(err);
    }
  }

  public static toggleModel(req: Request, res: Response, next: NextFunction): void {
    try {
      const result = ToggleModelSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
        return;
      }
      
      const { id, enabled } = result.data;
      const updated = modelRegistryService.toggleModel(id, enabled);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
}
