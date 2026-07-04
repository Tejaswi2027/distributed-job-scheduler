import { QueueRepository } from '../../src/infrastructure/repositories/queue.repository';
import { prisma } from '../../src/infrastructure/database/prisma';

describe('QueueRepository Integration Tests', () => {
  const queueRepo = new QueueRepository();
  let projectId: string;

  beforeAll(async () => {
    // Get or create testing organization and project
    const user = await prisma.user.create({
      data: { email: `test-repo-${Date.now()}@example.com`, passwordHash: 'hash' },
    });
    const org = await prisma.organization.create({
      data: { name: 'Test Repo Org' },
    });
    await prisma.userOrganization.create({
      data: { userId: user.id, organizationId: org.id, role: 'OWNER' },
    });
    const proj = await prisma.project.create({
      data: { organizationId: org.id, name: 'Test Repo Project', apiKey: `test-key-${Date.now()}` },
    });
    projectId = proj.id;
  });

  afterAll(async () => {
    // Cascade cleanup will wipe children
    await prisma.organization.deleteMany({
      where: { name: 'Test Repo Org' },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'test-repo-' } },
    });
    await prisma.$disconnect();
  });

  it('should create and retrieve a queue', async () => {
    const queue = await queueRepo.create({
      projectId,
      name: `q-${Date.now()}`,
      priority: 5,
      concurrencyLimit: 2,
    });

    expect(queue).toHaveProperty('id');
    expect(queue.priority).toBe(5);

    const fetched = await queueRepo.findById(queue.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.name).toBe(queue.name);
  });
});
