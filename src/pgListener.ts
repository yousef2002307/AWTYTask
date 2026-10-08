import { Client } from 'pg';
import { taskEvents } from './tasks/taskEvents';
import type { TaskNotification } from './types';

export async function startPgListener(): Promise<void> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query('LISTEN task_updates');

  client.on('notification', (msg) => {
    if (!msg.payload) return;
    const { taskId, status, progress } = JSON.parse(msg.payload) as TaskNotification;

    const payload =
      status === 'completed'
        ? { type: 'completed', taskId }
        : status === 'failed'
          ? { type: 'failed', taskId }
          : { type: 'progress', taskId, progress };

    taskEvents.emit('update', payload);
    taskEvents.emit(taskId, payload);
  });

  client.on('error', (err) => {
    console.error('pg listener error:', err);
    process.exit(1);
  });
}
