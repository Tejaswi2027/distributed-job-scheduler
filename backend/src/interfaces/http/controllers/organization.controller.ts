import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { OrganizationService } from '../../../application/services/organization.service';
import { ValidationError } from '../../../shared/errors';

const createOrgSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters.').max(100),
});

export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createOrgSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(
          parsed.error.errors.map(e => e.message).join(' '),
          parsed.error.format(),
        );
      }
      const org = await this.orgService.createOrganization(parsed.data.name, req.user!.userId);
      return res.status(201).json(org);
    } catch (err) { next(err); }
  };

  getOne = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const org = await this.orgService.getOrganization(req.params.orgId, req.user!.userId);
      return res.status(200).json(org);
    } catch (err) { next(err); }
  };

  listAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgs = await this.orgService.listOrganizations(req.user!.userId);
      return res.status(200).json(orgs);
    } catch (err) { next(err); }
  };
}
