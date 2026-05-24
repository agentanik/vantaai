import { Request, Response, NextFunction } from 'express';
import { auditLogService } from '../services/auditLogService';

export class AuditLogController {
  public static listLogs(req: Request, res: Response, next: NextFunction): void {
    try {
      const logs = auditLogService.listLogs();
      res.json({ success: true, count: logs.length, data: logs });
    } catch (err) {
      next(err);
    }
  }
}
