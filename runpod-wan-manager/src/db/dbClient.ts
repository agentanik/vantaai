export interface DbClient {
  readTable<T>(tableName: string): Promise<T[]>;
  writeTable<T>(tableName: string, data: T[]): Promise<void>;
}
