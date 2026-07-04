import { Router } from 'express';
import { authRouter } from './auth.routes';
import { organizationRouter } from './organization.routes';
import { queueRouter } from './queue.routes';
import { jobRouter } from './job.routes';
import { workerRouter } from './worker.routes';
import { dlqRouter } from './dlq.routes';
import { scheduledJobRouter } from './scheduled-job.routes';
import { statsRouter } from './stats.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/organizations', organizationRouter);
apiRouter.use('/queues', queueRouter);
apiRouter.use('/jobs', jobRouter);
apiRouter.use('/workers', workerRouter);
apiRouter.use('/dlq', dlqRouter);
apiRouter.use('/scheduled-jobs', scheduledJobRouter);
apiRouter.use('/stats', statsRouter);

export { apiRouter };
