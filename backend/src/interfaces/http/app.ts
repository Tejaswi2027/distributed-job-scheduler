import express from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { apiRouter } from './routes';
import { prisma } from '../../infrastructure/database/prisma';

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Mount API routes
app.use('/api/v1', apiRouter);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      services: {
        database: 'UP',
      },
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      services: {
        database: 'DOWN',
        error: err.message,
      },
    });
  }
});

// Centralized error handler mounted last
app.use(errorHandler);

export { app };
