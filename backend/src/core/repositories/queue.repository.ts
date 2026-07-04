import { Queue } from '@prisma/client';

export interface CreateQueueData {
  projectId: string;
  name: string;
  priority?: number;
  concurrencyLimit?: number;
}

export interface UpdateQueueData {
  priority?: number;
  concurrencyLimit?: number;
  isPaused?: boolean;
}

export interface IQueueRepository {
  create(data: CreateQueueData): Promise<Queue>;
  findById(id: string): Promise<Queue | null>;
  findByProjectId(projectId: string): Promise<Queue[]>;
  findByProjectAndName(projectId: string, name: string): Promise<Queue | null>;
  update(id: string, data: UpdateQueueData): Promise<Queue>;
  delete(id: string): Promise<void>;
  getStats(id: string): Promise<{ queued: number; running: number; completed: number; failed: number }>;
}
