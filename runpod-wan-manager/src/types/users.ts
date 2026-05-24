export interface UserProfile {
  id: string;
  email: string;
  creditsBalance: number;
  role: 'admin' | 'user';
  dailyBudgetLimitUsd: number;
  monthlyBudgetLimitUsd: number;
  status: 'active' | 'suspended';
  reservedCredits?: Record<string, number>;
}

export interface CreditLedgerEntry {
  id: string;
  userId: string;
  jobId?: string;
  amount: number; // positive for load, negative for deduction
  type: 'charge' | 'refund' | 'grant' | 'purchase';
  description: string;
  timestamp: string;
}
