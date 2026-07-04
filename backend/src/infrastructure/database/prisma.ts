import { PrismaClient } from '@prisma/client';
import { logger } from '../logger/logger';
import { env } from '../../shared/env';

class DatabaseConnection {
  private clientInstance: PrismaClient | null = null;

  get client(): PrismaClient {
    if (!this.clientInstance) {
      this.clientInstance = new PrismaClient({
        datasources: {
          db: {
            url: env.DATABASE_URL,
          },
        },
        log: [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'info' },
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ],
      });

      // Bind Prisma events to our custom logger
      (this.clientInstance as any).$on('query', (e: any) => {
        logger.debug(`Prisma SQL Query Execution: ${e.query}`, 'PRISMA_DB', {
          params: e.params,
          duration: `${e.duration}ms`,
        });
      });

      (this.clientInstance as any).$on('info', (e: any) => {
        logger.info(e.message, 'PRISMA_DB');
      });

      (this.clientInstance as any).$on('warn', (e: any) => {
        logger.warn(e.message, 'PRISMA_DB');
      });

      (this.clientInstance as any).$on('error', (e: any) => {
        logger.error(e.message, 'PRISMA_DB');
      });
    }

    return this.clientInstance;
  }

  async connect(): Promise<void> {
    try {
      await this.client.$connect();
      logger.info('Successfully established connection to PostgreSQL database.', 'DB_CONNECT');
    } catch (err: any) {
      logger.error('Failed to establish database socket connection:', 'DB_CONNECT', err);
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    if (this.clientInstance) {
      await this.clientInstance.$disconnect();
      logger.info('Database connection closed.', 'DB_DISCONNECT');
      this.clientInstance = null;
    }
  }
}

export const db = new DatabaseConnection();
export const prisma = db.client;
