import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { prisma } from '../../../infrastructure/database/prisma';

const router = Router();
router.use(authMiddleware);

// List all DLQ entries
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const [entries, total] = await Promise.all([
      prisma.deadLetterQueue.findMany({
        include: { job: true },
        orderBy: { failedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.deadLetterQueue.count(),
    ]);
    return res.json({ entries, total });
  } catch (err) { next(err); }
});

// Requeue a DLQ entry (move job back to QUEUED)
router.post('/:dlqId/requeue', async (req, res, next) => {
  try {
    const dlqEntry = await prisma.deadLetterQueue.findUnique({ where: { id: req.params.dlqId } });
    if (!dlqEntry) return res.status(404).json({ error: 'NotFoundError', message: 'DLQ entry not found.' });

    await prisma.job.update({
      where: { id: dlqEntry.jobId },
      data: { status: 'QUEUED', retryCount: 0, runAt: new Date() },
    });
    await prisma.deadLetterQueue.delete({ where: { id: req.params.dlqId } });

    return res.json({ message: 'Job requeued successfully.' });
  } catch (err) { next(err); }
});

export { router as dlqRouter };
