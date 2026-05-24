import path from 'path';
import { fileUtils } from '../lib/fileUtils';
import { timeUtils } from '../lib/timeUtils';
import { idUtils } from '../lib/idUtils';
import { logger } from '../lib/logger';

export interface AuditLogEntry {
  id: string;
  action: string;
  userId?: string;
  jobId?: string;
  details: Record<string, any>;
  timestamp: string;
}

class AuditLogService {
  private readonly logPath = path.join(process.cwd(), 'data', 'audit-log.json');

  public log(action: string, details: Record<string, any> = {}, userId?: string, jobId?: string): void {
    try {
      const logs = fileUtils.readJson<AuditLogEntry[]>(this.logPath, []);
      
      const newEntry: AuditLogEntry = {
        id: idUtils.generateId('audit'),
        action,
        userId,
        jobId,
        details,
        timestamp: timeUtils.now()
      };

      logs.push(newEntry);
      
      // Limit to last 5000 audit logs to prevent infinite file size bloat
      if (logs.length > 5000) {
        logs.shift();
      }

      fileUtils.writeJson(this.logPath, logs);
      logger.info(`Audit Log: Action="${action}" JobId="${jobId || ''}" UserId="${userId || ''}"`);
    } catch (err: any) {
      logger.error(`Failed to write audit log entry: ${err.message}`);
    }
  }

  public listLogs(): AuditLogEntry[] {
    return fileUtils.readJson<AuditLogEntry[]>(this.logPath, []).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}

export const auditLogService = new AuditLogService();
