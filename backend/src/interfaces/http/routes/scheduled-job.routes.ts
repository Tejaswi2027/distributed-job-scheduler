import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { prisma } from '../../../infrastructure/database/prisma';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const createScheduledJobSchema = z.object({
  projectId: z.string().uuid(),
  queueId: z.string().uuid(),
  name: z.string().min(1).max(100),
  cronExpression: z.string().min(9),
  payload: z.record(z.any()).optional(),
  maxRetries: z.number().int().min(0).max(10).default(3),
});

router.post('/', async (req, res, next) => {
  try {
    const parsed = createScheduledJobSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'ValidationError', message: parsed.error.errors[0].message });
    const sj = await prisma.scheduledJob.create({ data: { ...parsed.data, payload: parsed.data.payload ?? {} } });
    return res.status(201).json(sj);
  } catch (err) { next(err); }
});

router.get('/project/:projectId', async (req, res, next) => {
  try {
    const jobs = await prisma.scheduledJob.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(jobs);
  } catch (err) { next(err); }
});

router.patch('/:id/toggle', async (req, res, next) => {
  try {
    const sj = await prisma.scheduledJob.findUnique({ where: { id: req.params.id } });
    if (!sj) return res.status(404).json({ error: 'NotFoundError', message: 'Scheduled job not found.' });
    const updated = await prisma.scheduledJob.update({
      where: { id: req.params.id },
      data: { isActive: !sj.isActive },
    });
    return res.json(updated);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.scheduledJob.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) { next(err); }
});

export { router as scheduledJobRouter };
