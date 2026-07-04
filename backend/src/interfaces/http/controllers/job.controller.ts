import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { JobService } from '../../../application/services/job.service';
import { ValidationError } from '../../../shared/errors';

const enqueueSchema = z.object({
  queueId: z.string().uuid(),
  payload: z.record(z.any()).optional(),
  priority: z.number().int().min(1).max(100).optional(),
  delaySeconds: z.number().int().min(0).optional(),
});

const batchSchema = z.object({
  queueId: z.string().uuid(),
  jobs: z.array(z.object({
    payload: z.record(z.any()).optional(),
    priority: z.number().int().min(1).max(100).optional(),
  })).min(1).max(1000),
});

export class JobController {
  constructor(private readonly jobService: JobService) {}

  enqueue = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = enqueueSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError(parsed.error.errors.map(e => e.message).join(' '), parsed.error.format());
      const { delaySeconds, ...jobData } = parsed.data;
      const job = delaySeconds && delaySeconds > 0
        ? await this.jobService.enqueueDelayed(jobData, delaySeconds, req.user!.userId)
        : await this.jobService.enqueueImmediate(jobData, req.user!.userId);
      return res.status(201).json(job);
    } catch (err) { next(err); }
  };

  enqueueBatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = batchSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError(parsed.error.errors.map(e => e.message).join(' '), parsed.error.format());
      const count = await this.jobService.enqueueBatch(parsed.data.queueId, parsed.data.jobs, req.user!.userId);
      return res.status(201).json({ enqueued: count });
    } catch (err) { next(err); }
  };

  getOne = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const job = await this.jobService.getJob(req.params.jobId, req.user!.userId);
      return res.status(200).json(job);
    } catch (err) { next(err); }
  };

  listByQueue = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = parseInt(req.query.offset as string) || 0;
      const result = await this.jobService.listJobs(req.params.queueId, req.user!.userId, limit, offset);
      return res.status(200).json(result);
    } catch (err) { next(err); }
  };

  getLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const logs = await this.jobService.getJobLogs(req.params.jobId, req.user!.userId);
      return res.status(200).json(logs);
    } catch (err) { next(err); }
  };
}
