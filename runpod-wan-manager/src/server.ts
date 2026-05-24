import express from 'express';
import cors from 'cors';
import { env, validateEnvConfig } from './config/env';
import { logger } from './lib/logger';
import router from './routes';
import { errorMiddleware } from './middleware/errorMiddleware';
import { cleanupService } from './services/cleanupService';
import { jobQueueService } from './services/jobQueueService';
import { watchdogService } from './services/watchdogService';

const app = express();

const allowedOrigins = process.env.FRONTEND_ORIGINS ? process.env.FRONTEND_ORIGINS.split(',') : ['http://localhost:5173'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-manager-api-key', 'x-idempotency-key']
}));

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log request metadata for traceability
app.use((req, res, next) => {
  logger.info(`HTTP Request: ${req.method} ${req.path} from IP: ${req.ip}`);
  next();
});

// Wire router
app.use(router);

// Wire central error handling middleware as the final link in the chain
app.use(errorMiddleware);

// Daily file cleanup task (Runs every 24 hours)
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
setInterval(() => {
  cleanupService.cleanupOldOutputs(env.outputCleanupDays)
    .then(count => {
      logger.info(`Automated cron cleanup task processed. Deleted ${count} files.`);
    })
    .catch(err => {
      logger.error(`Automated cron cleanup task encountered error: ${err.message}`);
    });
}, CLEANUP_INTERVAL_MS);

// Boot server
const PORT = env.port;

try {
  // Validate configuration before starting server
  validateEnvConfig();
  
  app.listen(PORT, () => {
    logger.info(`=================================================`);
    logger.info(`🚀 RunPod Wan Video Manager running on port ${PORT}`);
    logger.info(`=================================================`);
    
    // Start background engines
    jobQueueService.startQueueLoop();
    watchdogService.start();
  });
} catch (error: any) {
  logger.error(`❌ Startup Configuration Validation Failed: ${error.message}`);
  process.exit(1);
}

