import { createApp } from './app.production';
import { config } from './config';
import { logger } from './services/memory/logger';

const app = createApp();
const PORT = config.port || 3001;

app.listen(PORT, () => {
  logger.info(`🚀 ARS Backend API running on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
