export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'enterprise';

export interface PlanLimits {
  maxJobsPerDay: number;
  maxDurationSeconds: number;
  maxResolutionWidth: number;
  maxResolutionHeight: number;
  maxBatchSize: number;
  outputRetentionDays: number;
  hasPriorityQueue: boolean;
}

export interface TeamProfile {
  id: string;
  name: string;
  plan: SubscriptionPlan;
  ownerId: string;
  members: { userId: string; role: 'owner' | 'admin' | 'member' }[];
  dailyBudgetLimitUsd: number;
  monthlyBudgetLimitUsd: number;
  creditsBalance: number;
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
}
