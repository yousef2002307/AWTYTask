# ADR — Architecture Decision Record

## 1. Framework: Express + Socket.IO

Express was chosen for robust REST routing and widespread familiarity. Socket.IO provides battle-tested room management (`socket.join(taskId)`), automatic reconnection fallbacks, and standard event-driven messaging across connected clients.

## 2. Queue Engine: pg-boss

pg-boss was mandated by the spec and fits well: it uses PostgreSQL as the durable queue store, eliminating the need for a separate message broker (Redis, RabbitMQ). pg-boss guarantees at-most-once delivery per worker via advisory locks, so two workers cannot process the same job simultaneously. Job state (created, active, completed, failed) persists across restarts.

Unfinished jobs (worker crash mid-task): pg-boss expires `active` jobs that exceed the configured `expireInSeconds` (default: 15 minutes) and moves them to `failed`. The worker's error handler also explicitly updates the task row to `failed` before rethrowing, so the DB reflects reality for any job the handler observes before crashing.

## 3. Cross-Process WebSocket Broadcasting: PostgreSQL LISTEN/NOTIFY

The API and worker run in separate containers (separate Node.js processes). An in-process `EventEmitter` alone cannot bridge them.

**Chosen approach**: the worker calls `pg_notify('task_updates', payload)` inside every `updateTask()` call. The API container maintains a dedicated `pg.Client` that `LISTEN`s on `task_updates`. Incoming notifications are translated into `taskEvents` emissions which the WS gateway forwards to subscribed clients.

**Alternatives considered**:
- *Redis pub/sub*: effective but adds an operational dependency (another service to run and monitor).
- *Polling the DB from the API*: simple but introduces latency and unnecessary DB load.
- *Single-process (API + worker)*: eliminates the cross-process problem entirely but prevents independent scaling of the worker pool.

PostgreSQL LISTEN/NOTIFY was selected because it reuses the existing dependency, has sub-100ms latency for the expected task granularity (1 s progress intervals), and requires zero additional infrastructure.

## 4. Reconnection and State Recovery

On WebSocket subscription (or re-subscription), the server immediately reads the latest task row from PostgreSQL and sends the current `status`/`progress`. This guarantees a client reconnecting mid-task receives a meaningful state snapshot before the next live event arrives, with no client-side caching required.

## 5. Database Migrations

Migrations run inline at bootstrap via `CREATE TABLE IF NOT EXISTS`, making the deployment self-contained without requiring a separate migration runner. The SQL is also kept as a standalone file in `migrations/` for documentation and external tooling compatibility.
