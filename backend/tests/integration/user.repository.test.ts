import { UserRepository } from '../../src/infrastructure/repositories/user.repository';
import { prisma } from '../../src/infrastructure/database/prisma';

describe('UserRepository Integration Tests', () => {
  const userRepository = new UserRepository();
  const testEmail = `integration-${Date.now()}@example.com`;
  let createdUserId: string;

  afterAll(async () => {
    // Cleanup database test records
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'integration-',
        },
      },
    });
    await prisma.$disconnect();
  });

  it('should save a user database record and fetch it by email', async () => {
    const user = await userRepository.create({
      email: testEmail,
      passwordHash: 'dummy_hash_123',
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe(testEmail);
    createdUserId = user.id;

    const fetchedUser = await userRepository.findByEmail(testEmail);
    expect(fetchedUser).not.toBeNull();
    expect(fetchedUser?.id).toBe(createdUserId);
  });

  it('should find user record by database primary key ID', async () => {
    const fetchedUser = await userRepository.findById(createdUserId);
    expect(fetchedUser).not.toBeNull();
    expect(fetchedUser?.email).toBe(testEmail);
  });

  it('should return null if user email does not exist', async () => {
    const user = await userRepository.findByEmail('nonexistent-email@example.com');
    expect(user).toBeNull();
  });
});
