export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface SystemAlert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  source: string;
  resolved: boolean;
  createdAt: string;
  resolvedAt?: string;
  metadata?: Record<string, any>;
}
