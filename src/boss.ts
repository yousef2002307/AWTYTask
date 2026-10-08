import PgBoss from 'pg-boss';

let instance: PgBoss | null = null;

export async function getBoss(): Promise<PgBoss> {
  if (instance) return instance;
  instance = new PgBoss({ connectionString: process.env.DATABASE_URL! });
  await instance.start();
  return instance;
}
