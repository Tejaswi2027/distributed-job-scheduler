import { app } from './interfaces/http/app';
import { db } from './infrastructure/database/prisma';
import { logger } from './infrastructure/logger/logger';
import { env } from './shared/env';
import { workerEngine } from './infrastructure/worker/worker.engine';
import { cronScheduler } from './infrastructure/scheduler/cron.scheduler';

async function bootstrap() {
  try {
    logger.info('Initializing application bootstrap sequence...', 'BOOTSTRAP');

    await db.connect();

    const server = app.listen(env.PORT, () => {
      logger.info(`HTTP API Server listening on port ${env.PORT} [${env.NODE_ENV}]`, 'BOOTSTRAP');
    });

    // Start worker engine and cron scheduler
    await workerEngine.start();
    cronScheduler.start();

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down...`, 'SHUTDOWN');
      server.close(async () => {
        await workerEngine.gracefulShutdown();
        cronScheduler.stop();
        await db.disconnect();
        process.exit(0);
      });
      setTimeout(async () => {
        logger.warn('Forcing shutdown after timeout.', 'SHUTDOWN');
        await db.disconnect();
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (err: any) {
    logger.error('Fatal bootstrap failure:', 'BOOTSTRAP', err);
    process.exit(1);
  }
}

bootstrap();
