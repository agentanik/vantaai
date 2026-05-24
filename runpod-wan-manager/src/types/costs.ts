export interface CostEstimate {
  estimatedRuntimeMinutes: number;
  estimatedGpuCostUsd: number;
  estimatedStorageCostUsd: number;
  estimatedTotalCostUsd: number;
  estimatedCredits: number;
  assumptions: string[];
}

export interface BudgetEnforcementResult {
  allowed: boolean;
  reason?: string;
  limit?: number;
  currentUsage?: number;
}

export interface UsageLedgerEntry {
  id: string;
  jobId: string;
  userId: string;
  gpuType: string;
  runtimeSeconds: number;
  provider: string;
  costUsd: number;
  creditsCharged: number;
  timestamp: string;
}
