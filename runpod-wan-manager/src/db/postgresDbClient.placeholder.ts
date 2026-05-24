import { DbClient } from './dbClient';
import { logger } from '../lib/logger';

/**
 * Enterprise upgrade placeholder for migrating from JSON files to PostgreSQL.
 * Implement using pg, pg-promise, or Prisma / Drizzle ORM.
 */
export class PostgresDbClient implements DbClient {
  constructor() {
    logger.info('PostgresDbClient placeholder initialized. (Not active)');
  }

  public async readTable<T>(tableName: string): Promise<T[]> {
    logger.debug(`[PG-PLACEHOLDER] Querying SELECT * FROM ${tableName}`);
    throw new Error('PostgresDbClient is a placeholder. Switch STORAGE_DB=postgres to use it in production.');
  }

  public async writeTable<T>(tableName: string, data: T[]): Promise<void> {
    logger.debug(`[PG-PLACEHOLDER] Bulk writing to table ${tableName} with ${data.length} records.`);
    throw new Error('PostgresDbClient is a placeholder. Switch STORAGE_DB=postgres to use it in production.');
  }
}

export const postgresDbClient = new PostgresDbClient();
