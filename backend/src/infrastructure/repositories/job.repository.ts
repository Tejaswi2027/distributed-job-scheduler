import { Job, JobStatus } from '@prisma/client';
import { IJobRepository, CreateJobData } from '../../core/repositories/job.repository';
import { prisma } from '../database/prisma';

export class JobRepository implements IJobRepository {
  async create(data: CreateJobData): Promise<Job> {
    return prisma.job.create({
      data: {
        queueId: data.queueId,
        payload: data.payload ?? {},
        priority: data.priority ?? 1,
        runAt: data.runAt ?? new Date(),
        maxRetries: data.maxRetries ?? 3,
        batchId: data.batchId,
      },
    });
  }

  async createMany(data: CreateJobData[]): Promise<number> {
    const result = await prisma.job.createMany({
      data: data.map((d) => ({
        queueId: d.queueId,
        payload: d.payload ?? {},
        priority: d.priority ?? 1,
        runAt: d.runAt ?? new Date(),
        maxRetries: d.maxRetries ?? 3,
        batchId: d.batchId,
      })),
    });
    return result.count;
  }

  async findById(id: string): Promise<Job | null> {
    return prisma.job.findUnique({
      where: { id },
      include: { executions: { orderBy: { startedAt: 'desc' }, take: 10 } },
    }) as any;
  }

  async findByQueueId(queueId: string, limit = 20, offset = 0): Promise<{ jobs: Job[]; total: number }> {
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({ where: { queueId }, orderBy: { createdAt: 'desc' }, take: limit, skip: offset }),
      prisma.job.count({ where: { queueId } }),
    ]);
    return { jobs, total };
  }

  // SKIP LOCKED ensures atomic job claiming without race conditions
  async claimNextJob(queueId: string, workerId: string): Promise<Job | null> {
    const result = await prisma.$queryRaw<Job[]>`
      UPDATE jobs
      SET status = 'RUNNING', updated_at = NOW()
      WHERE id = (
        SELECT id FROM jobs
        WHERE queue_id = ${queueId}::uuid
          AND status = 'QUEUED'
          AND run_at <= NOW()
        ORDER BY priority DESC, run_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      RETURNING *
    `;

    if (!result || result.length === 0) return null;

    const job = result[0];
    // Create an execution record
    await prisma.jobExecution.create({
      data: { jobId: job.id, workerId, status: 'RUNNING' },
    });
    return job;
  }

  async updateStatus(id: string, status: JobStatus, errorMessage?: string): Promise<Job> {
    return prisma.job.update({ where: { id }, data: { status } });
  }

  async incrementRetry(id: string): Promise<Job> {
    return prisma.job.update({
      where: { id },
      data: { retryCount: { increment: 1 }, status: 'QUEUED' },
    });
  }

  async findStaleRunning(thresholdMs: number): Promise<Job[]> {
    const thresholdTime = new Date(Date.now() - thresholdMs);
    return prisma.job.findMany({
      where: { status: 'RUNNING', updatedAt: { lt: thresholdTime } },
    });
  }

  async getExecutionLogs(jobId: string): Promise<any[]> {
    return prisma.jobExecution.findMany({
      where: { jobId },
      include: { logs: true },
      orderBy: { startedAt: 'desc' },
    });
  }
}
