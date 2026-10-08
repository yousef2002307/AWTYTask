import { getBoss } from '../boss';
import { updateTask } from './task.repo';

interface JobData {
  taskId: string;
  duration: number;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export async function startTaskWorker(): Promise<void> {
  const boss = await getBoss();

  await boss.work<JobData>(
    'process-task',
    { teamSize: 5, teamConcurrency: 5 },
    async (job) => {
      const { taskId, duration } = job.data;

      try {
        await updateTask(taskId, 'processing', 0);

        const steps = Math.max(1, duration);
        for (let step = 1; step <= steps; step++) {
          await sleep(1000);
          const progress = Math.round((step / steps) * 100);
          await updateTask(taskId, 'processing', progress);
        }

        await updateTask(taskId, 'completed', 100);
      } catch (err) {
        await updateTask(taskId, 'failed', 0).catch(() => undefined);
        throw err;
      }
    },
  );
}
