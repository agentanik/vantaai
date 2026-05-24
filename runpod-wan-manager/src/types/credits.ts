export interface UserCredits {
  userId: string;
  balance: number;
  reserved: number;
  lastUpdated: string;
}

export interface CreditReservation {
  id: string;
  userId: string;
  jobId: string;
  amount: number;
  status: 'reserved' | 'finalized' | 'released';
  createdAt: string;
  expiresAt: string;
}
