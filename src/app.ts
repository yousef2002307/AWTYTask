import 'dotenv/config';
import express from 'express';
import http from 'http';
import { db, runMigrations } from './db';
import { getBoss } from './boss';
import { startPgListener } from './pgListener';
import { taskRouter } from './tasks/task.router';
import { attachSocketServer } from './tasks/task.ws';

const app = express();
app.use(express.json());
app.use('/tasks', taskRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = http.createServer(app);
attachSocketServer(server);

const PORT = process.env.PORT ?? 3000;

async function bootstrap(): Promise<void> {
  await db.query('SELECT 1');
  await runMigrations();
  await getBoss();
  await startPgListener();
  server.listen(PORT, () => console.log(`API listening on :${PORT}`));
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
