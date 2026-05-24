export interface AuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  teamId?: string;
  action: string;
  status: 'success' | 'failed' | 'warning';
  resourceType: 'job' | 'pod' | 'credits' | 'apikey' | 'user' | 'team' | 'system';
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}
