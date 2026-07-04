import { Organization, Project } from '@prisma/client';
import {
  IOrganizationRepository,
  IProjectRepository,
} from '../../core/repositories/organization.repository';
import { NotFoundError, AuthorizationError } from '../../shared/errors';
import { logger } from '../../infrastructure/logger/logger';

export class OrganizationService {
  constructor(private readonly orgRepo: IOrganizationRepository) {}

  async createOrganization(name: string, userId: string): Promise<Organization> {
    logger.info(`User ${userId} creating organization: "${name}"`, 'ORG_SERVICE');
    const org = await this.orgRepo.create({ name, userId });
    logger.info(`Organization created: ${org.id} ("${org.name}") by user ${userId}`, 'ORG_SERVICE');
    return org;
  }

  async getOrganization(orgId: string, userId: string): Promise<Organization> {
    const org = await this.orgRepo.findById(orgId);
    if (!org) throw new NotFoundError(`Organization ${orgId} not found.`);

    const membership = await this.orgRepo.findMembership(userId, orgId);
    if (!membership) throw new AuthorizationError('You do not have access to this organization.');

    return org;
  }

  async listOrganizations(userId: string): Promise<Organization[]> {
    return this.orgRepo.findAllByUserId(userId);
  }
}

export class ProjectService {
  constructor(
    private readonly projectRepo: IProjectRepository,
    private readonly orgRepo: IOrganizationRepository,
  ) {}

  async createProject(name: string, organizationId: string, userId: string): Promise<Project> {
    // Ensure user belongs to the organization first
    const membership = await this.orgRepo.findMembership(userId, organizationId);
    if (!membership) throw new AuthorizationError('You do not have access to this organization.');

    logger.info(`User ${userId} creating project "${name}" in org ${organizationId}`, 'PROJECT_SERVICE');
    const project = await this.projectRepo.create({ name, organizationId });
    logger.info(`Project created: ${project.id} ("${project.name}") — API key generated`, 'PROJECT_SERVICE');
    return project;
  }

  async getProject(projectId: string, userId: string): Promise<Project> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) throw new NotFoundError(`Project ${projectId} not found.`);

    const membership = await this.orgRepo.findMembership(userId, project.organizationId);
    if (!membership) throw new AuthorizationError('You do not have access to this project.');

    return project;
  }

  async listProjects(organizationId: string, userId: string): Promise<Project[]> {
    const membership = await this.orgRepo.findMembership(userId, organizationId);
    if (!membership) throw new AuthorizationError('You do not have access to this organization.');

    return this.projectRepo.findAllByOrgId(organizationId);
  }
}
