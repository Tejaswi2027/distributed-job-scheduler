import request from 'supertest';
import { app } from '../../src/interfaces/http/app';
import { prisma } from '../../src/infrastructure/database/prisma';
import jwt from 'jsonwebtoken';
import { env } from '../../src/shared/env';

describe('Job REST API End-to-End Tests', () => {
  let token: string;
  let queueId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email: `api-j-${Date.now()}@example.com`, passwordHash: 'hash' },
    });
    const org = await prisma.organization.create({
      data: { name: 'API Job Org' },
    });
    await prisma.userOrganization.create({
      data: { userId: user.id, organizationId: org.id, role: 'OWNER' },
    });
    const proj = await prisma.project.create({
      data: { organizationId: org.id, name: 'API Job Project', apiKey: `api-j-key-${Date.now()}` },
    });
    const queue = await prisma.queue.create({
      data: { projectId: proj.id, name: `q-${Date.now()}`, priority: 1, concurrencyLimit: 10 },
    });
    queueId = queue.id;

    token = jwt.sign({ userId: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await prisma.organization.deleteMany({
      where: { name: 'API Job Org' },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'api-j-' } },
    });
    await prisma.$disconnect();
  });

  it('should deny enqueuing if no token is provided', async () => {
    const res = await request(app)
      .post('/api/v1/jobs')
      .send({ queueId, payload: {} });

    expect(res.status).toBe(401);
  });

  it('should successfully enqueue an immediate job', async () => {
    const res = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ queueId, payload: { value: 123 } });

    expect(res.status).toBe(201);
    expect(res.body.queueId).toBe(queueId);
    expect(res.body.status).toBe('QUEUED');
  });
});
