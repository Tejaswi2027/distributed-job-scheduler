import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { JobController } from '../controllers/job.controller';
import { JobRepository } from '../../../infrastructure/repositories/job.repository';
import { QueueRepository } from '../../../infrastructure/repositories/queue.repository';
import { OrganizationRepository, ProjectRepository } from '../../../infrastructure/repositories/organization.repository';
import { JobService } from '../../../application/services/job.service';

const router = Router();
router.use(authMiddleware);

const orgRepo = new OrganizationRepository();
const projectRepo = new ProjectRepository();
const queueRepo = new QueueRepository();
const jobRepo = new JobRepository();
const jobService = new JobService(jobRepo, queueRepo, projectRepo, orgRepo);
const jobController = new JobController(jobService);

// Top-level job routes
router.post('/', jobController.enqueue);
router.post('/batch', jobController.enqueueBatch);
router.get('/:jobId', jobController.getOne);
router.get('/:jobId/logs', jobController.getLogs);

export { router as jobRouter };
