import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../../../application/services/auth.service';
import { ValidationError } from '../../../shared/errors';

// Password policy regex: min 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).'
  );

const registerSchema = z.object({
  email: z.string().email('Please provide a valid email address.'),
  password: passwordSchema,
});

const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Zod input validation
      const parseResult = registerSchema.safeParse(req.body);
      if (!parseResult.success) {
        // Collect errors and throw ValidationError
        const errorMessages = parseResult.error.errors.map(err => err.message).join(' ');
        throw new ValidationError(errorMessages, parseResult.error.format());
      }

      const { email, password } = parseResult.data;

      // 2. Call service layer logic
      const result = await this.authService.register(email, password);

      // 3. Return response
      return res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Zod input validation
      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errorMessages = parseResult.error.errors.map(err => err.message).join(' ');
        throw new ValidationError(errorMessages, parseResult.error.format());
      }

      const { email, password } = parseResult.data;

      // 2. Call service
      const result = await this.authService.login(email, password);

      // 3. Return response
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}
