import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { QueueService } from '../../../application/services/queue.service';
import { ValidationError } from '../../../shared/errors';

const createQueueSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(100),
  priority: z.number().int().min(1).max(100).default(1),
  concurrencyLimit: z.number().int().min(1).max(500).default(10),
});

const updateQueueSchema = z.object({
  priority: z.number().int().min(1).max(100).optional(),
  concurrencyLimit: z.number().int().min(1).max(500).optional(),
});

export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createQueueSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError(parsed.error.errors.map(e => e.message).join(' '), parsed.error.format());
      const queue = await this.queueService.createQueue(parsed.data, req.user!.userId);
      return res.status(201).json(queue);
    } catch (err) { next(err); }
  };

  getOne = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queue = await this.queueService.getQueue(req.params.queueId, req.user!.userId);
      return res.status(200).json(queue);
    } catch (err) { next(err); }
  };

  listByProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queues = await this.queueService.listQueues(req.params.projectId, req.user!.userId);
      return res.status(200).json(queues);
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = updateQueueSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError(parsed.error.errors.map(e => e.message).join(' '), parsed.error.format());
      const queue = await this.queueService.updateQueue(req.params.queueId, parsed.data, req.user!.userId);
      return res.status(200).json(queue);
    } catch (err) { next(err); }
  };

  pause = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queue = await this.queueService.pauseQueue(req.params.queueId, req.user!.userId);
      return res.status(200).json(queue);
    } catch (err) { next(err); }
  };

  resume = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queue = await this.queueService.resumeQueue(req.params.queueId, req.user!.userId);
      return res.status(200).json(queue);
    } catch (err) { next(err); }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.queueService.deleteQueue(req.params.queueId, req.user!.userId);
      return res.status(204).send();
    } catch (err) { next(err); }
  };

  stats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.queueService.getQueueStats(req.params.queueId, req.user!.userId);
      return res.status(200).json(result);
    } catch (err) { next(err); }
  };
}
