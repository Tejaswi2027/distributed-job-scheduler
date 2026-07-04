import { Worker, WorkerStatus } from '@prisma/client';
import { prisma } from '../database/prisma';
import { logger } from '../logger/logger';
import { env } from '../../shared/env';
import { JobRepository } from '../repositories/job.repository';
import * as os from 'os';

interface WorkerRecord {
  id: string;
  name: string;
}

export class WorkerEngine {
  private workerId: string | null = null;
  private workerRecord: WorkerRecord | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reaperTimer: NodeJS.Timeout | null = null;
  private isShuttingDown = false;
  private activeJobs = 0;
  private readonly jobRepo = new JobRepository();

  async register(): Promise<void> {
    const worker = await prisma.worker.create({
      data: {
        name: `worker-${os.hostname()}-${process.pid}`,
        hostname: os.hostname(),
        concurrencyLimit: env.WORKER_CONCURRENCY_LIMIT,
        status: 'ACTIVE',
        lastHeartbeatAt: new Date(),
      },
    });
    this.workerId = worker.id;
    this.workerRecord = { id: worker.id, name: worker.name };
    logger.info(`Worker registered: ${worker.name} (${worker.id})`, 'WORKER');
  }

  async start(): Promise<void> {
    await this.register();
    this.startHeartbeat();
    this.startPollLoop();
    this.startReaper();
    logger.info('Worker engine started successfully.', 'WORKER');
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(async () => {
      if (!this.workerId || this.isShuttingDown) return;
      try {
        await prisma.worker.update({
          where: { id: this.workerId },
          data: { lastHeartbeatAt: new Date() },
        });
      } catch (err) {
        logger.warn('Heartbeat failed.', 'WORKER', err);
      }
    }, env.WORKER_HEARTBEAT_INTERVAL_MS);
  }

  private startPollLoop(): void {
    this.pollTimer = setInterval(async () => {
      if (this.isShuttingDown) return;
      if (this.activeJobs >= env.WORKER_CONCURRENCY_LIMIT) return;

      try {
        // Find all active queues and poll each one
        const queues = await prisma.queue.findMany({
          where: { isPaused: false },
          orderBy: { priority: 'desc' },
        });

        for (const queue of queues) {
          if (this.activeJobs >= env.WORKER_CONCURRENCY_LIMIT) break;
          const job = await this.jobRepo.claimNextJob(queue.id, this.workerId!);
          if (job) {
            this.activeJobs++;
            this.executeJob(job).finally(() => { this.activeJobs--; });
          }
        }
      } catch (err) {
        logger.error('Worker poll loop error.', 'WORKER', err);
      }
    }, env.WORKER_POLL_INTERVAL_MS);
  }

  private async executeJob(job: any): Promise<void> {
    logger.info(`Executing job ${job.id} from queue ${job.queue_id}`, 'WORKER');
    const startTime = Date.now();
    
    // Find active execution record to attach logs to
    const execution = await prisma.jobExecution.findFirst({
      where: { jobId: job.id, status: 'RUNNING' },
      orderBy: { startedAt: 'desc' },
    });

    if (execution) {
      await prisma.jobLog.create({
        data: {
          executionId: execution.id,
          level: 'INFO',
          message: `Worker claimed job ${job.id} and started execution.`,
        },
      });
    }

    try {
      // Simulate job execution (handlers would be registered in a real system)
      await this.simulateJobExecution(job);

      // Mark completed
      await this.jobRepo.updateStatus(job.id, 'COMPLETED');
      const durationMs = Date.now() - startTime;

      // Update execution record
      await prisma.jobExecution.updateMany({
        where: { jobId: job.id, status: 'RUNNING' },
        data: { status: 'COMPLETED', finishedAt: new Date(), durationMs },
      });

      if (execution) {
        await prisma.jobLog.create({
          data: {
            executionId: execution.id,
            level: 'INFO',
            message: `Job ${job.id} executed successfully in ${durationMs}ms.`,
          },
        });
      }

      logger.info(`Job ${job.id} completed in ${durationMs}ms`, 'WORKER');
    } catch (err: any) {
      logger.error(`Job ${job.id} failed: ${err.message}`, 'WORKER', err);
      
      if (execution) {
        await prisma.jobLog.create({
          data: {
            executionId: execution.id,
            level: 'ERROR',
            message: `Job ${job.id} execution failed: ${err.message}`,
          },
        });
      }

      await this.handleJobFailure(job, err.message);
    }
  }

  private async simulateJobExecution(job: any): Promise<void> {
    // Simulate processing time (50ms–500ms)
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 450));
    
    // Allow live testing of failures by specifying {"fail": true} in payload
    if (job.payload && (job.payload as any).fail === true) {
      throw new Error('Simulated task execution failure (payload.fail = true).');
    }
  }

  private async handleJobFailure(job: any, errorMessage: string): Promise<void> {
    const currentJob = await prisma.job.findUnique({ where: { id: job.id } });
    if (!currentJob) return;

    if (currentJob.retryCount < currentJob.maxRetries) {
      // Schedule retry with exponential backoff
      const backoffSeconds = Math.pow(2, currentJob.retryCount) * 5;
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'QUEUED',
          retryCount: { increment: 1 },
          runAt: new Date(Date.now() + backoffSeconds * 1000),
        },
      });
      logger.info(`Job ${job.id} scheduled for retry #${currentJob.retryCount + 1} in ${backoffSeconds}s`, 'WORKER');
    } else {
      // Move to DLQ
      await prisma.job.update({ where: { id: job.id }, data: { status: 'DLQ' } });
      await prisma.deadLetterQueue.create({
        data: {
          jobId: job.id,
          reason: errorMessage,
          // Cast needed: Prisma JsonValue can be null but InputJsonValue cannot
          payload: (currentJob.payload ?? {}) as any,
        },
      });
      logger.warn(`Job ${job.id} moved to Dead Letter Queue after ${currentJob.maxRetries} retries.`, 'WORKER');
    }

    await prisma.jobExecution.updateMany({
      where: { jobId: job.id, status: 'RUNNING' },
      data: { status: 'FAILED', finishedAt: new Date(), errorMessage },
    });
  }

  private startReaper(): void {
    this.reaperTimer = setInterval(async () => {
      try {
        const staleJobs = await this.jobRepo.findStaleRunning(env.REAPER_INTERVAL_MS * 3);
        for (const job of staleJobs) {
          logger.warn(`Reaper: found stale job ${job.id}, requeuing.`, 'REAPER');
          await this.jobRepo.updateStatus(job.id, 'QUEUED');
        }
      } catch (err) {
        logger.error('Reaper error.', 'REAPER', err);
      }
    }, env.REAPER_INTERVAL_MS);
  }

  async gracefulShutdown(): Promise<void> {
    logger.info('Worker graceful shutdown initiated...', 'WORKER');
    this.isShuttingDown = true;

    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.reaperTimer) clearInterval(this.reaperTimer);

    // Wait for active jobs to complete (up to 30s)
    const start = Date.now();
    while (this.activeJobs > 0 && Date.now() - start < 30000) {
      await new Promise((r) => setTimeout(r, 100));
    }

    if (this.workerId) {
      await prisma.worker.update({
        where: { id: this.workerId },
        data: { status: 'DEREGISTERED' },
      });
    }

    logger.info('Worker engine shut down cleanly.', 'WORKER');
  }
}

export const workerEngine = new WorkerEngine();
