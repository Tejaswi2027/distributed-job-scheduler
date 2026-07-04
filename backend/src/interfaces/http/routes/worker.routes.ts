import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { prisma } from '../../../infrastructure/database/prisma';

const router = Router();
router.use(authMiddleware);

// List all active workers
router.get('/', async (req, res, next) => {
  try {
    const workers = await prisma.worker.findMany({
      orderBy: { startedAt: 'desc' },
    });
    return res.json(workers);
  } catch (err) { next(err); }
});

// Get a specific worker
router.get('/:workerId', async (req, res, next) => {
  try {
    const worker = await prisma.worker.findUnique({ where: { id: req.params.workerId } });
    if (!worker) return res.status(404).json({ error: 'NotFoundError', message: 'Worker not found.' });
    return res.json(worker);
  } catch (err) { next(err); }
});

export { router as workerRouter };
