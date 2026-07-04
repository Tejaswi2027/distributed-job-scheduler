import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { prisma } from '../../../infrastructure/database/prisma';

const router = Router();
router.use(authMiddleware);

// Dashboard overview stats
router.get('/overview', async (req, res, next) => {
  try {
    const [totalJobs, queued, running, completed, failed, dlq, workers, queues, scheduledJobs] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { status: 'QUEUED' } }),
      prisma.job.count({ where: { status: 'RUNNING' } }),
      prisma.job.count({ where: { status: 'COMPLETED' } }),
      prisma.job.count({ where: { status: 'FAILED' } }),
      prisma.deadLetterQueue.count(),
      prisma.worker.count({ where: { status: 'ACTIVE' } }),
      prisma.queue.count(),
      prisma.scheduledJob.count({ where: { isActive: true } }),
    ]);

    // Get recent jobs
    const recentJobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { queue: true },
    });

    return res.json({
      jobs: { total: totalJobs, queued, running, completed, failed },
      dlq,
      activeWorkers: workers,
      totalQueues: queues,
      activeScheduledJobs: scheduledJobs,
      recentJobs,
    });
  } catch (err) { next(err); }
});

// Global audit/execution log feed
router.get('/logs', async (req, res, next) => {
  try {
    const logs = await prisma.jobLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
      include: {
        execution: {
          include: {
            job: {
              include: {
                queue: true,
              },
            },
            worker: true,
          },
        },
      },
    });

    const formattedLogs = logs.map(l => ({
      id: l.id,
      timestamp: l.timestamp,
      level: l.level,
      message: l.message,
      queue: l.execution.job.queue.name,
      jobId: l.execution.jobId,
      worker: l.execution.worker?.name ?? 'unknown',
    }));

    return res.json(formattedLogs);
  } catch (err) { next(err); }
});

export { router as statsRouter };
