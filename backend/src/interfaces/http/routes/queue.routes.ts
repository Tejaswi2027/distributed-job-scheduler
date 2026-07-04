import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { QueueController } from '../controllers/queue.controller';
import { JobController } from '../controllers/job.controller';
import { QueueRepository } from '../../../infrastructure/repositories/queue.repository';
import { JobRepository } from '../../../infrastructure/repositories/job.repository';
import { OrganizationRepository, ProjectRepository } from '../../../infrastructure/repositories/organization.repository';
import { QueueService } from '../../../application/services/queue.service';
import { JobService } from '../../../application/services/job.service';

const router = Router();
router.use(authMiddleware);

const orgRepo = new OrganizationRepository();
const projectRepo = new ProjectRepository();
const queueRepo = new QueueRepository();
const jobRepo = new JobRepository();

const queueService = new QueueService(queueRepo, projectRepo, orgRepo);
const jobService = new JobService(jobRepo, queueRepo, projectRepo, orgRepo);

const queueController = new QueueController(queueService);
const jobController = new JobController(jobService);

// Queue routes
router.post('/', queueController.create);
router.get('/project/:projectId', queueController.listByProject);
router.get('/:queueId', queueController.getOne);
router.patch('/:queueId', queueController.update);
router.post('/:queueId/pause', queueController.pause);
router.post('/:queueId/resume', queueController.resume);
router.delete('/:queueId', queueController.remove);
router.get('/:queueId/stats', queueController.stats);

// Job routes (nested under queues)
router.post('/:queueId/jobs', jobController.enqueue);
router.get('/:queueId/jobs', jobController.listByQueue);

export { router as queueRouter };
