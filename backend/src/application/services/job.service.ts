import { Job } from '@prisma/client';
import { IJobRepository, CreateJobData } from '../../core/repositories/job.repository';
import { IQueueRepository } from '../../core/repositories/queue.repository';
import { IProjectRepository, IOrganizationRepository } from '../../core/repositories/organization.repository';
import { NotFoundError, AuthorizationError, ValidationError } from '../../shared/errors';
import { logger } from '../../infrastructure/logger/logger';
import * as crypto from 'crypto';

export class JobService {
  constructor(
    private readonly jobRepo: IJobRepository,
    private readonly queueRepo: IQueueRepository,
    private readonly projectRepo: IProjectRepository,
    private readonly orgRepo: IOrganizationRepository,
  ) {}

  private async verifyQueueAccess(queueId: string, userId: string): Promise<void> {
    const queue = await this.queueRepo.findById(queueId);
    if (!queue) throw new NotFoundError(`Queue ${queueId} not found.`);
    if (queue.isPaused) throw new ValidationError('Cannot enqueue jobs into a paused queue.');
    const project = await this.projectRepo.findById(queue.projectId);
    if (!project) throw new NotFoundError(`Project not found.`);
    const membership = await this.orgRepo.findMembership(userId, project.organizationId);
    if (!membership) throw new AuthorizationError('You do not have access to this queue.');
  }

  async enqueueImmediate(data: CreateJobData, userId: string): Promise<Job> {
    await this.verifyQueueAccess(data.queueId, userId);
    logger.info(`Enqueueing immediate job into queue ${data.queueId}`, 'JOB_SERVICE');
    return this.jobRepo.create({ ...data, runAt: new Date() });
  }

  async enqueueDelayed(data: CreateJobData, delaySeconds: number, userId: string): Promise<Job> {
    await this.verifyQueueAccess(data.queueId, userId);
    const runAt = new Date(Date.now() + delaySeconds * 1000);
    logger.info(`Enqueueing delayed job (${delaySeconds}s) into queue ${data.queueId}`, 'JOB_SERVICE');
    return this.jobRepo.create({ ...data, runAt });
  }

  async enqueueBatch(queueId: string, jobs: Array<{ payload?: object; priority?: number }>, userId: string): Promise<number> {
    await this.verifyQueueAccess(queueId, userId);
    const batchId = crypto.randomUUID();
    const jobsData: CreateJobData[] = jobs.map((j) => ({
      queueId,
      payload: j.payload ?? {},
      priority: j.priority ?? 1,
      runAt: new Date(),
      batchId,
    }));
    logger.info(`Enqueueing batch of ${jobs.length} jobs into queue ${queueId}, batchId: ${batchId}`, 'JOB_SERVICE');
    return this.jobRepo.createMany(jobsData);
  }

  async getJob(jobId: string, userId: string): Promise<Job> {
    const job = await this.jobRepo.findById(jobId);
    if (!job) throw new NotFoundError(`Job ${jobId} not found.`);
    await this.verifyQueueAccess(job.queueId, userId);
    return job;
  }

  async listJobs(queueId: string, userId: string, limit = 20, offset = 0) {
    const queue = await this.queueRepo.findById(queueId);
    if (!queue) throw new NotFoundError(`Queue ${queueId} not found.`);
    const project = await this.projectRepo.findById(queue.projectId);
    if (!project) throw new NotFoundError(`Project not found.`);
    const membership = await this.orgRepo.findMembership(userId, project.organizationId);
    if (!membership) throw new AuthorizationError('You do not have access to this queue.');
    return this.jobRepo.findByQueueId(queueId, limit, offset);
  }

  async getJobLogs(jobId: string, userId: string) {
    const job = await this.jobRepo.findById(jobId);
    if (!job) throw new NotFoundError(`Job ${jobId} not found.`);
    await this.verifyQueueAccess(job.queueId, userId);
    return this.jobRepo.getExecutionLogs(jobId);
  }
}
