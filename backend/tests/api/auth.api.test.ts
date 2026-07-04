import request from 'supertest';
import { app } from '../../src/interfaces/http/app';
import { prisma } from '../../src/infrastructure/database/prisma';

describe('Auth REST API End-to-End Tests', () => {
  const registerEmail = `api-${Date.now()}@example.com`;
  const strongPassword = 'StrongPassword123!';

  afterAll(async () => {
    // Clean up created API test users
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'api-',
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register successfully and return 201 with token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register') // Wait, index routing mounts at /api/v1 inside app.ts which is mounted on app.ts at app.use('/api/v1', apiRouter). The route is /api/v1/auth/register!
        // Let's verify the path. In app.ts: app.use('/api/v1', apiRouter). In index.ts: apiRouter.use('/auth', authRouter). In auth.routes.ts: router.post('/register').
        // So the full path is indeed: /api/v1/auth/register!
        .send({
          email: registerEmail,
          password: strongPassword,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(registerEmail);
    });

    it('should reject registration with 409 Conflict if email is already taken', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: registerEmail,
          password: strongPassword,
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('ConflictError');
    });

    it('should reject registration with 400 Validation Error if email format is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email-format',
          password: strongPassword,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ValidationError');
    });

    it('should reject registration with 400 if password does not satisfy strength policy', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `api-pass-${Date.now()}@example.com`,
          password: 'weak',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ValidationError');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should successfully login and return 200 with JWT token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: registerEmail,
          password: strongPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(registerEmail);
    });

    it('should reject login with 401 Unauthorized for incorrect password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: registerEmail,
          password: 'IncorrectPassword1!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('AuthenticationError');
    });
  });
});
