import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { IUserRepository } from '../../core/repositories/user.repository';
import { ConflictError, AuthenticationError } from '../../shared/errors';
import { env } from '../../shared/env';
import { logger } from '../../infrastructure/logger/logger';

export interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

export class AuthService {
  constructor(private readonly userRepository: IUserRepository) {}

  async register(email: string, password: string): Promise<AuthResult> {
    logger.info(`Starting user registration process for email: ${email}`, 'AUTH_SERVICE');

    // 1. Check for duplicates (Explicit duplicate check - throws ConflictError)
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      logger.warn(`Registration rejected: email ${email} is already registered.`, 'AUTH_SERVICE');
      throw new ConflictError('A user with this email address already exists.');
    }

    // 2. Hash password
    const saltRounds = env.BCRYPT_ROUNDS;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Create user in DB
    const user = await this.userRepository.create({
      email,
      passwordHash,
    });

    logger.info(`Successfully created user: ${user.id} (${email})`, 'AUTH_SERVICE');

    // 4. Generate token
    const token = this.generateToken(user.id, user.email);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    logger.info(`Login attempt started for email: ${email}`, 'AUTH_SERVICE');

    // 1. Fetch user
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      logger.warn(`Login failed: user with email ${email} not found.`, 'AUTH_SERVICE');
      throw new AuthenticationError('Invalid email or password.');
    }

    // 2. Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      logger.warn(`Login failed: incorrect password for email ${email}.`, 'AUTH_SERVICE');
      throw new AuthenticationError('Invalid email or password.');
    }

    logger.info(`Login successful for user: ${user.id} (${email})`, 'AUTH_SERVICE');

    // 3. Generate token
    const token = this.generateToken(user.id, user.email);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  private generateToken(userId: string, email: string): string {
    const payload = {
      userId,
      email,
    };

    // Cast to `any` to bypass strict ms StringValue type — value is validated by Zod env schema
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });
  }
}
