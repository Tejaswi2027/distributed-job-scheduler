import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProjectService } from '../../../application/services/organization.service';
import { ValidationError } from '../../../shared/errors';

const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters.').max(100),
});

export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createProjectSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(
          parsed.error.errors.map(e => e.message).join(' '),
          parsed.error.format(),
        );
      }
      const project = await this.projectService.createProject(
        parsed.data.name,
        req.params.orgId,
        req.user!.userId,
      );
      return res.status(201).json(project);
    } catch (err) { next(err); }
  };

  getOne = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const project = await this.projectService.getProject(req.params.projectId, req.user!.userId);
      return res.status(200).json(project);
    } catch (err) { next(err); }
  };

  listAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projects = await this.projectService.listProjects(req.params.orgId, req.user!.userId);
      return res.status(200).json(projects);
    } catch (err) { next(err); }
  };
}
