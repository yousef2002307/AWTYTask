import 'dotenv/config';
import { db, runMigrations } from './db';
import { startTaskWorker } from './tasks/task.worker';

async function bootstrap(): Promise<void> {
  await db.query('SELECT 1');
  await runMigrations();
  await db.query(`UPDATE tasks SET status = 'failed' WHERE status = 'processing'`);
  await startTaskWorker();
  console.log('Worker started');
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
