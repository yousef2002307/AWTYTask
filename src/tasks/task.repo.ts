import { db } from '../db';
import type { Task, TaskStatus } from '../types';

export async function createTask(id: string, duration: number): Promise<Task> {
  const { rows } = await db.query<Task>(
    `INSERT INTO tasks (id, status, progress, duration)
     VALUES ($1, 'pending', 0, $2)
     RETURNING *`,
    [id, duration],
  );
  return rows[0];
}

export async function getTask(id: string): Promise<Task | null> {
  const { rows } = await db.query<Task>('SELECT * FROM tasks WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function updateTask(id: string, status: TaskStatus, progress: number): Promise<void> {
  await db.query(
    `UPDATE tasks SET status = $2, progress = $3, updated_at = NOW() WHERE id = $1`,
    [id, status, progress],
  );
  await db.query('SELECT pg_notify($1, $2)', [
    'task_updates',
    JSON.stringify({ taskId: id, status, progress }),
  ]);
}
