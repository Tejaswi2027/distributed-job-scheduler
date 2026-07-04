import { Queue } from '@prisma/client';
import { IQueueRepository, CreateQueueData, UpdateQueueData } from '../../core/repositories/queue.repository';
import { IProjectRepository } from '../../core/repositories/organization.repository';
import { NotFoundError, AuthorizationError, ConflictError } from '../../shared/errors';
import { logger } from '../../infrastructure/logger/logger';
import { IOrganizationRepository } from '../../core/repositories/organization.repository';

export class QueueService {
  constructor(
    private readonly queueRepo: IQueueRepository,
    private readonly projectRepo: IProjectRepository,
    private readonly orgRepo: IOrganizationRepository,
  ) {}

  private async verifyProjectAccess(projectId: string, userId: string): Promise<void> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) throw new NotFoundError(`Project ${projectId} not found.`);
    const membership = await this.orgRepo.findMembership(userId, project.organizationId);
    if (!membership) throw new AuthorizationError('You do not have access to this project.');
  }

  async createQueue(data: CreateQueueData, userId: string): Promise<Queue> {
    await this.verifyProjectAccess(data.projectId, userId);

    const existing = await this.queueRepo.findByProjectAndName(data.projectId, data.name);
    if (existing) throw new ConflictError(`Queue with name "${data.name}" already exists in this project.`);

    logger.info(`Creating queue "${data.name}" in project ${data.projectId}`, 'QUEUE_SERVICE');
    return this.queueRepo.create(data);
  }

  async getQueue(queueId: string, userId: string): Promise<Queue> {
    const queue = await this.queueRepo.findById(queueId);
    if (!queue) throw new NotFoundError(`Queue ${queueId} not found.`);
    await this.verifyProjectAccess(queue.projectId, userId);
    return queue;
  }

  async listQueues(projectId: string, userId: string): Promise<Queue[]> {
    await this.verifyProjectAccess(projectId, userId);
    return this.queueRepo.findByProjectId(projectId);
  }

  async updateQueue(queueId: string, data: UpdateQueueData, userId: string): Promise<Queue> {
    const queue = await this.queueRepo.findById(queueId);
    if (!queue) throw new NotFoundError(`Queue ${queueId} not found.`);
    await this.verifyProjectAccess(queue.projectId, userId);
    logger.info(`Updating queue ${queueId}`, 'QUEUE_SERVICE');
    return this.queueRepo.update(queueId, data);
  }

  async pauseQueue(queueId: string, userId: string): Promise<Queue> {
    return this.updateQueue(queueId, { isPaused: true }, userId);
  }

  async resumeQueue(queueId: string, userId: string): Promise<Queue> {
    return this.updateQueue(queueId, { isPaused: false }, userId);
  }

  async deleteQueue(queueId: string, userId: string): Promise<void> {
    const queue = await this.queueRepo.findById(queueId);
    if (!queue) throw new NotFoundError(`Queue ${queueId} not found.`);
    await this.verifyProjectAccess(queue.projectId, userId);
    await this.queueRepo.delete(queueId);
    logger.info(`Deleted queue ${queueId}`, 'QUEUE_SERVICE');
  }

  async getQueueStats(queueId: string, userId: string) {
    const queue = await this.queueRepo.findById(queueId);
    if (!queue) throw new NotFoundError(`Queue ${queueId} not found.`);
    await this.verifyProjectAccess(queue.projectId, userId);
    const stats = await this.queueRepo.getStats(queueId);
    return { queue, stats };
  }
}
