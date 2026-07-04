import { JobRepository } from '../../src/infrastructure/repositories/job.repository';
import { prisma } from '../../src/infrastructure/database/prisma';

describe('JobRepository Integration Tests (SKIP LOCKED)', () => {
  const jobRepo = new JobRepository();
  let queueId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email: `test-job-repo-${Date.now()}@example.com`, passwordHash: 'hash' },
    });
    const org = await prisma.organization.create({
      data: { name: 'Test Job Repo Org' },
    });
    await prisma.userOrganization.create({
      data: { userId: user.id, organizationId: org.id, role: 'OWNER' },
    });
    const proj = await prisma.project.create({
      data: { organizationId: org.id, name: 'Test Job Repo Project', apiKey: `test-job-key-${Date.now()}` },
    });
    const queue = await prisma.queue.create({
      data: { projectId: proj.id, name: 'test-locked-queue', priority: 1, concurrencyLimit: 1 },
    });
    queueId = queue.id;
  });

  afterAll(async () => {
    await prisma.organization.deleteMany({
      where: { name: 'Test Job Repo Org' },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'test-job-repo-' } },
    });
    await prisma.$disconnect();
  });

  it('should claim jobs atomically using SKIP LOCKED', async () => {
    const job = await jobRepo.create({
      queueId,
      payload: { value: 42 },
      priority: 1,
    });

    const worker1 = 'worker-1';
    const worker2 = 'worker-2';

    // Claim concurrently
    const [claim1, claim2] = await Promise.all([
      jobRepo.claimNextJob(queueId, worker1),
      jobRepo.claimNextJob(queueId, worker2),
    ]);

    // Exactly one worker must claim the job, the other gets null (skipped locked row)
    const claimedCount = [claim1, claim2].filter(Boolean).length;
    expect(claimedCount).toBe(1);

    const successfulClaim = claim1 || claim2;
    expect(successfulClaim!.id).toBe(job.id);
  });
});
