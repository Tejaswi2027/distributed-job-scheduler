import request from 'supertest';
import { app } from '../../src/interfaces/http/app';
import { prisma } from '../../src/infrastructure/database/prisma';
import jwt from 'jsonwebtoken';
import { env } from '../../src/shared/env';

describe('Queue REST API End-to-End Tests', () => {
  let token: string;
  let projectId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email: `api-q-${Date.now()}@example.com`, passwordHash: 'hash' },
    });
    const org = await prisma.organization.create({
      data: { name: 'API Queue Org' },
    });
    await prisma.userOrganization.create({
      data: { userId: user.id, organizationId: org.id, role: 'OWNER' },
    });
    const proj = await prisma.project.create({
      data: { organizationId: org.id, name: 'API Queue Project', apiKey: `api-q-key-${Date.now()}` },
    });
    projectId = proj.id;

    token = jwt.sign({ userId: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await prisma.organization.deleteMany({
      where: { name: 'API Queue Org' },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'api-q-' } },
    });
    await prisma.$disconnect();
  });

  it('should deny access if no JWT token is provided', async () => {
    const res = await request(app)
      .post('/api/v1/queues')
      .send({ projectId, name: 'unauthorized-q' });

    expect(res.status).toBe(401);
  });

  it('should successfully create a new queue when authenticated', async () => {
    const name = `q-${Date.now()}`;
    const res = await request(app)
      .post('/api/v1/queues')
      .set('Authorization', `Bearer ${token}`)
      .send({ projectId, name, priority: 1, concurrencyLimit: 10 });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe(name);
  });
});
