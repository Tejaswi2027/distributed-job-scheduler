import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { OrganizationController } from '../controllers/organization.controller';
import { ProjectController } from '../controllers/project.controller';
import { OrganizationRepository, ProjectRepository } from '../../../infrastructure/repositories/organization.repository';
import { OrganizationService, ProjectService } from '../../../application/services/organization.service';

const router = Router();

// Inject dependencies
const orgRepo = new OrganizationRepository();
const projectRepo = new ProjectRepository();
const orgService = new OrganizationService(orgRepo);
const projectService = new ProjectService(projectRepo, orgRepo);
const orgController = new OrganizationController(orgService);
const projectController = new ProjectController(projectService);

// All routes in this file require a valid JWT
router.use(authMiddleware);

// Organization routes
router.post('/', orgController.create);
router.get('/', orgController.listAll);
router.get('/:orgId', orgController.getOne);

// Project routes (nested under organizations)
router.post('/:orgId/projects', projectController.create);
router.get('/:orgId/projects', projectController.listAll);
router.get('/:orgId/projects/:projectId', projectController.getOne);

export { router as organizationRouter };
