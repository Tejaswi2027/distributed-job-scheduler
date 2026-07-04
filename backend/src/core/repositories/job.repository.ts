import { Job, JobStatus } from '@prisma/client';

export interface CreateJobData {
  queueId: string;
  payload?: object;
  priority?: number;
  runAt?: Date;
  maxRetries?: number;
  batchId?: string;
}

export interface IJobRepository {
  create(data: CreateJobData): Promise<Job>;
  createMany(data: CreateJobData[]): Promise<number>;
  findById(id: string): Promise<Job | null>;
  findByQueueId(queueId: string, limit?: number, offset?: number): Promise<{ jobs: Job[]; total: number }>;
  claimNextJob(queueId: string, workerId: string): Promise<Job | null>;
  updateStatus(id: string, status: JobStatus, errorMessage?: string): Promise<Job>;
  incrementRetry(id: string): Promise<Job>;
  findStaleRunning(thresholdMs: number): Promise<Job[]>;
  getExecutionLogs(jobId: string): Promise<any[]>;
}
