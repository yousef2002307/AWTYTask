import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { createTask, getTask } from './task.repo';
import { getBoss } from '../boss';

export const taskRouter = Router();

const CreateTaskSchema = z.object({
  duration: z.number().int().positive().max(300),
});

taskRouter.post('/', async (req, res, next) => {
  const parsed = CreateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const id = randomUUID();
  const task = await createTask(id, parsed.data.duration);

  const boss = await getBoss();
  await boss.send('process-task', { taskId: id, duration: parsed.data.duration });

  res.status(201).json({ id: task.id, status: task.status });
});

taskRouter.get('/:id', async (req, res, next) => {
  const task = await getTask(req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.json({ id: task.id, status: task.status, progress: task.progress });
});
