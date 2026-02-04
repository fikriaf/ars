import http from 'http';
import { createApp } from './app';
import { WebSocketService } from './services/websocket';
import { PolicyExecutor } from './services/policy-executor';
import { initializeCronJobs, runInitialUpdates } from './cron';
import { config } from './config';

async function startServer() {
  try {
    const app = createApp();
    const server = http.createServer(app);

    // Initialize WebSocket service
    const wsService = new WebSocketService(server);

    // Initialize Policy Executor
    const policyExecutor = new PolicyExecutor();
    policyExecutor.start();

    // Run initial ILI and ICR calculations
    await runInitialUpdates();

    // Initialize cron jobs for scheduled updates
    initializeCronJobs();

    server.listen(config.port, () => {
      console.log(`🚀 ICB Backend API running on port ${config.port}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
      console.log(`🔌 WebSocket server available at ws://localhost:${config.port}/ws`);
      console.log(`🏛️ Policy executor monitoring proposals`);
      console.log(`⏰ Cron jobs active: ILI (5min), ICR (10min)`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      policyExecutor.stop();
      wsService.close();
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT signal received: closing HTTP server');
      policyExecutor.stop();
      wsService.close();
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
