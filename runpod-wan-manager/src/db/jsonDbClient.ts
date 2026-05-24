import fs from 'fs/promises';
import path from 'path';
import { DbClient } from './dbClient';
import { logger } from '../lib/logger';

export class JsonDbClient implements DbClient {
  private dataDir: string;

  constructor() {
    this.dataDir = path.resolve(process.cwd(), 'data');
  }

  private getFilePath(tableName: string): string {
    return path.join(this.dataDir, `${tableName}.json`);
  }

  private async ensureDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (err: any) {
      logger.error(`Failed to create data directory: ${err.message}`);
    }
  }

  public async readTable<T>(tableName: string): Promise<T[]> {
    await this.ensureDirectory();
    const filePath = this.getFilePath(tableName);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as T[];
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        // Table file does not exist yet; return empty array
        return [];
      }
      logger.error(`Error reading JSON table "${tableName}": ${err.message}`);
      throw err;
    }
  }

  public async writeTable<T>(tableName: string, data: T[]): Promise<void> {
    await this.ensureDirectory();
    const filePath = this.getFilePath(tableName);
    try {
      const tempPath = `${filePath}.tmp`;
      const content = JSON.stringify(data, null, 2);
      await fs.writeFile(tempPath, content, 'utf-8');
      await fs.rename(tempPath, filePath);
    } catch (err: any) {
      logger.error(`Error writing JSON table "${tableName}": ${err.message}`);
      throw err;
    }
  }
}

export const jsonDbClient = new JsonDbClient();
