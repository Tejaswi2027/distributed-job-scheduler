import { AuthService } from '../../src/application/services/auth.service';
import { IUserRepository } from '../../src/core/repositories/user.repository';
import { ConflictError, AuthenticationError } from '../../src/shared/errors';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

describe('AuthService Unit Tests', () => {
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let authService: AuthService;

  const mockUser: User = {
    id: 'user-uuid-123',
    email: 'test@example.com',
    passwordHash: 'hashedpassword123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    } as any;

    authService = new AuthService(mockUserRepository);
  });

  describe('Register', () => {
    it('should register a new user successfully and return token', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);

      const result = await authService.register('test@example.com', 'SecurePass123!');

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.id).toBe('user-uuid-123');
    });

    it('should throw ConflictError if user email already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.register('test@example.com', 'SecurePass123!'))
        .rejects.toThrow(ConflictError);

      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('Login', () => {
    it('should login successfully with valid email and password', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const result = await authService.login('test@example.com', 'SecurePass123!');

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw AuthenticationError if email does not exist', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.login('missing@example.com', 'AnyPass1!'))
        .rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError if password does not match', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(authService.login('test@example.com', 'WrongPass1!'))
        .rejects.toThrow(AuthenticationError);
    });
  });
});
