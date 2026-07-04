import { Organization, Project, UserOrganization } from '@prisma/client';
import {
  IOrganizationRepository,
  IProjectRepository,
  CreateOrganizationData,
  CreateProjectData,
} from '../../core/repositories/organization.repository';
import { prisma } from '../database/prisma';
import * as crypto from 'crypto';

export class OrganizationRepository implements IOrganizationRepository {
  async create(data: CreateOrganizationData): Promise<Organization> {
    // Create the org and add creator as OWNER in a single transaction
    return prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: data.name },
      });
      await tx.userOrganization.create({
        data: {
          userId: data.userId,
          organizationId: org.id,
          role: 'OWNER',
        },
      });
      return org;
    });
  }

  async findById(id: string): Promise<Organization | null> {
    return prisma.organization.findUnique({ where: { id } });
  }

  async findAllByUserId(userId: string): Promise<Organization[]> {
    const memberships = await prisma.userOrganization.findMany({
      where: { userId },
      include: { organization: true },
    });
    return memberships.map((m) => m.organization);
  }

  async findMembership(userId: string, organizationId: string): Promise<UserOrganization | null> {
    return prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });
  }
}

export class ProjectRepository implements IProjectRepository {
  async create(data: CreateProjectData): Promise<Project> {
    const apiKey = `sk_${crypto.randomBytes(24).toString('hex')}`;
    return prisma.project.create({
      data: {
        name: data.name,
        organizationId: data.organizationId,
        apiKey,
      },
    });
  }

  async findById(id: string): Promise<Project | null> {
    return prisma.project.findUnique({ where: { id } });
  }

  async findAllByOrgId(organizationId: string): Promise<Project[]> {
    return prisma.project.findMany({ where: { organizationId } });
  }

  async findByApiKey(apiKey: string): Promise<Project | null> {
    return prisma.project.findUnique({ where: { apiKey } });
  }
}
