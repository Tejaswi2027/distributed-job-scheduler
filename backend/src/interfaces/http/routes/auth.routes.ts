import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../../../application/services/auth.service';
import { UserRepository } from '../../../infrastructure/repositories/user.repository';

const router = Router();

// Instantiate dependencies and inject them
const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);

// Map paths
router.post('/register', authController.register);
router.post('/login', authController.login);

export { router as authRouter };
