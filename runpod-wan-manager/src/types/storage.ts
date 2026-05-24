export type StorageProviderType = 'local' | 'r2' | 's3';

export interface StorageMetadata {
  filename: string;
  fullPath: string;
  relativePath: string;
  sizeBytes: number;
  createdAt: string;
  mimeType: string;
  modelId?: string;
  jobId?: string;
}

export interface StorageServiceConfig {
  provider: StorageProviderType;
  r2?: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
  };
  s3?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
}
