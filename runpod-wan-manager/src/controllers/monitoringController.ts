import { Request, Response, NextFunction } from 'express';
import { monitoringService } from '../services/monitoringService';

export class MonitoringController {
  public static async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await monitoringService.getMetrics();
      res.json({ success: true, data: metrics });
    } catch (err) {
      next(err);
    }
  }

  public static async getStorage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const storage = await monitoringService.getStorageStatus();
      res.json({ success: true, data: storage });
    } catch (err) {
      next(err);
    }
  }

  public static async getHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await monitoringService.getMetrics();
      const status = (metrics.runpodOnline) ? 'healthy' : 'degraded';
      
      res.json({
        success: true,
        status,
        timestamp: new Date().toISOString(),
        details: {
          runpodApi: metrics.runpodOnline ? 'online' : 'offline',
          comfyuiEndpoint: metrics.comfyuiOnline ? 'online' : 'offline'
        }
      });
    } catch (err) {
      next(err);
    }
  }
}
