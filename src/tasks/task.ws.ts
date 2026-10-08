import { Server, type Socket } from 'socket.io';
import { z } from 'zod';
import type { Server as HttpServer } from 'http';
import { getTask } from './task.repo';
import { taskEvents } from './taskEvents';

const SubscribeSchema = z.union([
  z.object({
    taskId: z.string().uuid(),
    type: z.string().optional(),
  }),
  z.string().uuid().transform((taskId) => ({ taskId })),
]);

function parseSubscribeData(data: unknown): { taskId: string } | null {
  let raw = data;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      // raw is plain string
    }
  }
  const parsed = SubscribeSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function attachSocketServer(server: HttpServer): Server {
  const io = new Server(server, { cors: { origin: '*' } });

  taskEvents.on('update', (event: { type: string; taskId: string; progress?: number; error?: string }) => {
    io.to(event.taskId).emit(event.type, event);
    io.to(event.taskId).emit('message', event);
  });

  io.on('connection', (socket: Socket) => {
    const handleSubscribe = async (raw: unknown) => {
      const parsed = parseSubscribeData(raw);
      if (!parsed) return;

      const { taskId } = parsed;
      socket.join(taskId);

      const task = await getTask(taskId);
      if (!task) return;

      const payload =
        task.status === 'completed'
          ? { type: 'completed', taskId }
          : task.status === 'failed'
            ? { type: 'failed', taskId }
            : { type: 'progress', taskId, progress: task.progress };

      socket.emit(payload.type, payload);
      socket.emit('message', payload);
    };

    socket.on('subscribe', handleSubscribe);
    socket.on('message', handleSubscribe);
  });

  return io;
}
