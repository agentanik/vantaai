export interface StorageAdapter {
  uploadFile(localFilePath: string, destFileName: string): Promise<string>;
  downloadFile(fileName: string, destLocalPath: string): Promise<void>;
  deleteFile(fileName: string): Promise<void>;
  getSignedUrl(fileName: string, expirySeconds?: number): Promise<string>;
}
