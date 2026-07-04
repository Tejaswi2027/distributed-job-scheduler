import { Organization, Project, UserOrganization } from '@prisma/client';

export interface CreateOrganizationData {
  name: string;
  userId: string;
}

export interface CreateProjectData {
  name: string;
  organizationId: string;
}

export interface IOrganizationRepository {
  create(data: CreateOrganizationData): Promise<Organization>;
  findById(id: string): Promise<Organization | null>;
  findAllByUserId(userId: string): Promise<Organization[]>;
  findMembership(userId: string, organizationId: string): Promise<UserOrganization | null>;
}

export interface IProjectRepository {
  create(data: CreateProjectData): Promise<Project>;
  findById(id: string): Promise<Project | null>;
  findAllByOrgId(organizationId: string): Promise<Project[]>;
  findByApiKey(apiKey: string): Promise<Project | null>;
}
