import { Pool } from "pg"

const connectionString = process.env.DATABASE_URL

declare global {
  // eslint-disable-next-line no-var
  var __dashboardPool: Pool | undefined
  // eslint-disable-next-line no-var
  var __dashboardSchemaPromise: Promise<void> | undefined
}

export const pool =
  globalThis.__dashboardPool ??
  new Pool({
    connectionString,
  })

if (!globalThis.__dashboardPool) {
  globalThis.__dashboardPool = pool
}

async function createSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      progress INTEGER NOT NULL DEFAULT 0,
      tasks_count INTEGER NOT NULL DEFAULT 0,
      completed_tasks INTEGER NOT NULL DEFAULT 0,
      due_date DATE,
      created_at DATE NOT NULL DEFAULT CURRENT_DATE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      color TEXT NOT NULL DEFAULT 'oklch(0.55 0.15 195)'
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      avatar TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'todo',
      assignees JSONB NOT NULL DEFAULT '[]'::jsonb,
      dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,
      start_date DATE,
      due_date DATE,
      project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL,
      remarks TEXT,
      notes TEXT,
      links JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at DATE NOT NULL DEFAULT CURRENT_DATE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS subtasks (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'todo',
      task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      assignees JSONB NOT NULL DEFAULT '[]'::jsonb,
      start_date DATE,
      due_date DATE,
      remarks TEXT,
      notes TEXT,
      created_at DATE NOT NULL DEFAULT CURRENT_DATE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
    CREATE INDEX IF NOT EXISTS idx_subtasks_status ON subtasks(status);
  `)

  await pool.query(`
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    ALTER TABLE team_members ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    ALTER TABLE team_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS remarks TEXT;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS links JSONB NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `)
}

export async function ensureSchema() {
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required")
  }

  if (!globalThis.__dashboardSchemaPromise) {
    globalThis.__dashboardSchemaPromise = createSchema().catch((error) => {
      globalThis.__dashboardSchemaPromise = undefined
      throw error
    })
  }

  await globalThis.__dashboardSchemaPromise
}
