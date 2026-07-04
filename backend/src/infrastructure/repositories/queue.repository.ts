import { Queue } from '@prisma/client';
import {
  IQueueRepository,
  CreateQueueData,
  UpdateQueueData,
} from '../../core/repositories/queue.repository';
import { prisma } from '../database/prisma';

export class QueueRepository implements IQueueRepository {
  async create(data: CreateQueueData): Promise<Queue> {
    return prisma.queue.create({ data });
  }

  async findById(id: string): Promise<Queue | null> {
    return prisma.queue.findUnique({ where: { id } });
  }

  async findByProjectId(projectId: string): Promise<Queue[]> {
    return prisma.queue.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' } });
  }

  async findByProjectAndName(projectId: string, name: string): Promise<Queue | null> {
    return prisma.queue.findUnique({ where: { unique_project_queue_name: { projectId, name } } });
  }

  async update(id: string, data: UpdateQueueData): Promise<Queue> {
    return prisma.queue.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.queue.delete({ where: { id } });
  }

  async getStats(id: string): Promise<{ queued: number; running: number; completed: number; failed: number }> {
    const [queued, running, completed, failed] = await Promise.all([
      prisma.job.count({ where: { queueId: id, status: 'QUEUED' } }),
      prisma.job.count({ where: { queueId: id, status: 'RUNNING' } }),
      prisma.job.count({ where: { queueId: id, status: 'COMPLETED' } }),
      prisma.job.count({ where: { queueId: id, status: 'FAILED' } }),
    ]);
    return { queued, running, completed, failed };
  }
}
