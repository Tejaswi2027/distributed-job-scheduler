import { PrismaClient, JobStatus, WorkerStatus, RetryStrategy } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean database
  await prisma.deadLetterQueue.deleteMany({});
  await prisma.jobLog.deleteMany({});
  await prisma.jobExecution.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.scheduledJob.deleteMany({});
  await prisma.queue.deleteMany({});
  await prisma.retryPolicy.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.userOrganization.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.worker.deleteMany({});

  // 2. Create default user and organization
  const passwordHash = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'admin@acme.com',
      passwordHash,
    },
  });

  const org = await prisma.organization.create({
    data: {
      name: 'Acme Corp',
    },
  });

  await prisma.userOrganization.create({
    data: {
      userId: user.id,
      organizationId: org.id,
      role: 'ADMIN',
    },
  });

  // 3. Create project
  const project = await prisma.project.create({
    data: {
      organizationId: org.id,
      name: 'Default Project',
      apiKey: 'default_project_api_key_123',
    },
  });

  // 4. Create retry policies
  const expPolicy = await prisma.retryPolicy.create({
    data: {
      name: 'Exponential Backoff',
      strategy: RetryStrategy.EXPONENTIAL,
      baseDelaySeconds: 5,
      maxDelaySeconds: 60,
    },
  });

  const fixedPolicy = await prisma.retryPolicy.create({
    data: {
      name: 'Fixed 10s Backoff',
      strategy: RetryStrategy.FIXED,
      baseDelaySeconds: 10,
      maxDelaySeconds: 10,
    },
  });

  // 5. Create queues
  const defaultQueue = await prisma.queue.create({
    data: {
      projectId: project.id,
      name: 'default',
      priority: 1,
      concurrencyLimit: 5,
      isPaused: false,
    },
  });

  const emailQueue = await prisma.queue.create({
    data: {
      projectId: project.id,
      name: 'emails',
      priority: 2,
      concurrencyLimit: 2,
      isPaused: false,
    },
  });

  const reportsQueue = await prisma.queue.create({
    data: {
      projectId: project.id,
      name: 'reports',
      priority: 1,
      concurrencyLimit: 1,
      isPaused: false,
    },
  });

  // 6. Create some initial jobs
  await prisma.job.create({
    data: {
      queueId: defaultQueue.id,
      status: JobStatus.QUEUED,
      payload: { task: 'PDF Report Generation', userId: 'usr_101' },
      priority: 2,
      maxRetries: 3,
      retryPolicyId: expPolicy.id,
    },
  });

  await prisma.job.create({
    data: {
      queueId: emailQueue.id,
      status: JobStatus.QUEUED,
      payload: { to: 'customer@gmail.com', subject: 'Welcome!', template: 'welcome_v1' },
      priority: 5,
      maxRetries: 5,
      retryPolicyId: fixedPolicy.id,
    },
  });

  // Delayed job
  const runAt = new Date();
  runAt.setMinutes(runAt.getMinutes() + 10); // Run in 10 mins
  await prisma.job.create({
    data: {
      queueId: reportsQueue.id,
      status: JobStatus.QUEUED,
      payload: { action: 'Nightly Sync', range: 'daily' },
      priority: 1,
      runAt,
      maxRetries: 1,
      retryPolicyId: expPolicy.id,
    },
  });

  // Failed/DLQ job for dashboard exploration
  const failedJob = await prisma.job.create({
    data: {
      queueId: defaultQueue.id,
      status: JobStatus.DLQ,
      payload: { url: 'https://invalid-webhook.url/webhook', data: { event: 'user.created' } },
      priority: 1,
      retryCount: 3,
      maxRetries: 3,
      retryPolicyId: expPolicy.id,
    },
  });

  await prisma.deadLetterQueue.create({
    data: {
      jobId: failedJob.id,
      reason: 'HTTP 500: Internal Server Error from webhook receiver after 3 retries.',
      payload: failedJob.payload as any,
    },
  });

  // 7. Create a scheduled recurring cron job
  await prisma.scheduledJob.create({
    data: {
      projectId: project.id,
      queueId: defaultQueue.id,
      name: 'Cleanup Old Logs',
      cronExpression: '*/5 * * * *', // Every 5 minutes
      payload: { action: 'purge_logs', retentionDays: 7 },
      retryPolicyId: fixedPolicy.id,
      maxRetries: 2,
      isActive: true,
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
