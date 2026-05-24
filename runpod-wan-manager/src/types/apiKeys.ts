export type ApiKeyStatus = "active" | "revoked" | "expired";

export type ApiKeyScope =
  | "admin:*"
  | "pod:read"
  | "pod:write"
  | "video:generate"
  | "video:read"
  | "jobs:read"
  | "jobs:write"
  | "models:read"
  | "models:write"
  | "billing:read"
  | "keys:read"
  | "keys:write";

export interface ManagerApiKey {
  id: string;
  name: string;
  prefix: string;
  keyHash: string;
  scopes: ApiKeyScope[];
  status: ApiKeyStatus;
  ownerUserId?: string;
  teamId?: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  revokedAt?: string;
  revokedReason?: string;
}
