import { prisma } from '../database/prisma';
import { logger } from '../logger/logger';
import { JobRepository } from '../repositories/job.repository';

// Simple cron parser: returns true if the cron expression matches current time
function matchesCron(expression: string, now: Date): boolean {
  try {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) return false;
    const [minuteE, hourE, domE, monthE, dowE] = parts;

    const matches = (expr: string, value: number): boolean => {
      if (expr === '*') return true;
      if (expr.includes('/')) {
        const [, step] = expr.split('/');
        return value % parseInt(step) === 0;
      }
      if (expr.includes(',')) return expr.split(',').map(Number).includes(value);
      if (expr.includes('-')) {
        const [min, max] = expr.split('-').map(Number);
        return value >= min && value <= max;
      }
      return parseInt(expr) === value;
    };

    return (
      matches(minuteE, now.getUTCMinutes()) &&
      matches(hourE, now.getUTCHours()) &&
      matches(domE, now.getUTCDate()) &&
      matches(monthE, now.getUTCMonth() + 1) &&
      matches(dowE, now.getUTCDay())
    );
  } catch {
    return false;
  }
}

export class CronScheduler {
  private timer: NodeJS.Timeout | null = null;
  private isShuttingDown = false;
  private readonly jobRepo = new JobRepository();

  start(): void {
    // Check every minute (align to the next minute boundary)
    const msUntilNextMinute = (60 - new Date().getSeconds()) * 1000;
    setTimeout(() => {
      this.tick();
      this.timer = setInterval(() => this.tick(), 60_000);
    }, msUntilNextMinute);

    logger.info('Cron scheduler started.', 'SCHEDULER');
  }

  private async tick(): Promise<void> {
    if (this.isShuttingDown) return;
    const now = new Date();
    logger.debug(`Cron tick at ${now.toISOString()}`, 'SCHEDULER');

    try {
      const activeJobs = await prisma.scheduledJob.findMany({
        where: { isActive: true },
      });

      for (const sj of activeJobs) {
        if (matchesCron(sj.cronExpression, now)) {
          logger.info(`Firing cron job "${sj.name}" (${sj.cronExpression})`, 'SCHEDULER');
          try {
            await this.jobRepo.create({
              queueId: sj.queueId,
              payload: sj.payload as object,
              maxRetries: sj.maxRetries,
            });
            await prisma.scheduledJob.update({
              where: { id: sj.id },
              data: { lastRunAt: now },
            });
          } catch (err) {
            logger.error(`Failed to fire cron job "${sj.name}"`, 'SCHEDULER', err);
          }
        }
      }
    } catch (err) {
      logger.error('Cron scheduler tick error.', 'SCHEDULER', err);
    }
  }

  stop(): void {
    this.isShuttingDown = true;
    if (this.timer) clearInterval(this.timer);
    logger.info('Cron scheduler stopped.', 'SCHEDULER');
  }
}

export const cronScheduler = new CronScheduler();
