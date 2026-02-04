import cron from 'node-cron';
import { updateILI } from '../services/ili-calculator';
import { updateICR } from '../services/icr-calculator';

/**
 * Cron Job Scheduler
 * 
 * Schedules automated tasks for ILI and ICR updates
 */

/**
 * Initialize all cron jobs
 */
export function initializeCronJobs(): void {
  console.log('⏰ Initializing cron jobs...');

  // ILI Update - Every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('⏰ Running ILI update cron job');
    try {
      await updateILI();
    } catch (error) {
      console.error('❌ ILI cron job failed:', error);
    }
  });

  // ICR Update - Every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    console.log('⏰ Running ICR update cron job');
    try {
      await updateICR();
    } catch (error) {
      console.error('❌ ICR cron job failed:', error);
    }
  });

  console.log('✅ Cron jobs initialized');
  console.log('   - ILI update: every 5 minutes');
  console.log('   - ICR update: every 10 minutes');
}

/**
 * Run initial updates on startup
 */
export async function runInitialUpdates(): Promise<void> {
  console.log('🚀 Running initial ILI and ICR calculations...');

  try {
    await Promise.all([
      updateILI(),
      updateICR()
    ]);
    console.log('✅ Initial calculations complete');
  } catch (error) {
    console.error('❌ Initial calculations failed:', error);
    throw error;
  }
}
