import fs from "fs";
import path from "path";
import { AsyncLocalStorage } from "async_hooks";

export type Queryable = {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
};

export type Db = Queryable & {
  exec(sql: string): Promise<void>;
  transaction<T>(fn: (query: Queryable) => Promise<T>): Promise<T>;
};

type GlobalDb = { imasaDb?: Db; imasaReady?: Promise<void> };

function globalStore() {
  return globalThis as typeof globalThis & GlobalDb;
}

export function useDatabase(db: Db) {
  globalStore().imasaDb = db;
  globalStore().imasaReady = Promise.resolve();
}

export function database() {
  const db = globalStore().imasaDb;
  if (!db) throw new Error("Database is not ready.");
  return db;
}

// Splits a migration into statements. Line comments are dropped first so a
// semicolon inside a comment can't cut a statement in half.
export function splitSql(source: string) {
  const sql = source
    .split("\n")
    .map((line) => line.replace(/^\s*--.*$/, "").replace(/\s--\s.*$/, ""))
    .join("\n");
  const statements: string[] = [];
  let current = "";
  let dollar = false;
  for (let i = 0; i < sql.length; i += 1) {
    if (sql.startsWith("$$", i)) {
      dollar = !dollar;
      current += "$$";
      i += 1;
      continue;
    }
    if (!dollar && sql[i] === ";") {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = "";
      continue;
    }
    current += sql[i];
  }
  const trimmed = current.trim();
  if (trimmed) statements.push(trimmed);
  return statements;
}

export async function migrate(db: Db) {
  const file = path.join(process.cwd(), "supabase/migrations/001_schema.sql");
  const sql = fs.readFileSync(file, "utf8");
  await db.exec(sql);
}

async function createPglite(): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const inMemory = process.env.PGLITE_IN_MEMORY === "true";
  const directory = path.join(process.cwd(), ".data/imasa");
  if (!inMemory) fs.mkdirSync(directory, { recursive: true });
  // DATE columns (oid 1082) stay as YYYY-MM-DD strings so calendar dates never shift by timezone.
  const options = { parsers: { 1082: (value: string) => value } };
  const client = inMemory ? new PGlite(options) : new PGlite(directory, options);
  let chain: Promise<unknown> = Promise.resolve();
  const enqueue = <T>(fn: () => Promise<T>) => {
    const run = chain.then(fn, fn);
    chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };
  return {
    query: (sql, params) =>
      enqueue(async () => {
        const result = await client.query(sql, params);
        return result.rows as never;
      }),
    exec: (sql) => enqueue(() => client.exec(sql).then(() => undefined)),
    transaction: (fn) =>
      enqueue(() =>
        client.transaction(async (tx) =>
          fn({
            query: async (sql, params) => {
              const result = await tx.query(sql, params);
              return result.rows as never;
            },
          }),
        ),
      ),
  };
}

async function createPostgres(url: string): Promise<Db> {
  const postgres = (await import("postgres")).default;
  const sql = postgres(url, {
    max: 10,
    ssl: url.includes("localhost") ? false : "require",
    onnotice: () => undefined, // "already exists, skipping" notices from re-run migrations
    types: {
      date: { to: 1082, from: [1082], serialize: (value: string) => value, parse: (value: string) => value },
    },
  });
  const queryable = (runner: { unsafe: (query: string, parameters?: any, options?: any) => Promise<any> }): Queryable => ({
    query: async <T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]> => {
      const rows = await runner.unsafe(text, params as never);
      return rows as T[];
    },
  });
  return {
    query: <T = Record<string, unknown>>(text: string, params?: unknown[]) => queryable(sql as any).query<T>(text, params),
    exec: async (script) => {
      for (const statement of splitSql(script)) {
        await (sql as any).unsafe(statement);
      }
    },
    transaction: (fn) => (sql as any).begin(async (tx: any) => fn(queryable(tx))),
  };
}

export function shouldSeedDemo() {
  if (process.env.SEED_DEMO === "true") return true;
  if (process.env.SEED_DEMO === "false") return false;
  return process.env.NODE_ENV !== "production";
}

async function loadSessionKey(db: Db) {
  if (process.env.SESSION_SECRET) return;
  const { randomBytes } = await import("crypto");
  await db.query("INSERT INTO app_secrets (name, value) VALUES ('session', $1) ON CONFLICT (name) DO NOTHING", [
    randomBytes(48).toString("base64url"),
  ]);
  const rows = await db.query<{ value: string }>("SELECT value FROM app_secrets WHERE name = 'session'");
  (globalThis as { imasaSessionSecret?: string }).imasaSessionSecret = rows[0].value;
}

// On a fresh production database, creates the President's account from
// PRESIDENT_EMAIL / PRESIDENT_PASSWORD / PRESIDENT_NAME. Does nothing once any user exists.
async function createFirstPresident(db: Db) {
  const email = process.env.PRESIDENT_EMAIL?.trim().toLowerCase();
  const password = process.env.PRESIDENT_PASSWORD;
  if (!email || !password) return;
  const existing = await db.query<{ count: number }>("SELECT count(*)::int AS count FROM users");
  if (Number(existing[0]?.count ?? 0) > 0) return;
  if (password.length < 12) {
    // Don't take the whole site down over this; report it and wait for a fixed value.
    console.error("PRESIDENT_PASSWORD is shorter than 12 characters, so the President account was not created.");
    return;
  }
  const { hashPassword } = await import("@/lib/crypto");
  await db.query(
    `INSERT INTO users (email, password_hash, role, account_status, full_name)
     VALUES ($1, $2, 'super_admin', 'active', $3)`,
    [email, await hashPassword(password), process.env.PRESIDENT_NAME?.trim() || "President of IMASA"],
  );
}

export function databaseMode() {
  if (process.env.DATABASE_URL) return "postgres" as const;
  return "pglite" as const;
}

const activeTransaction = new AsyncLocalStorage<Queryable>();

// Queries issued while a transaction is running (audit writes, lookups in helpers)
// join that transaction instead of waiting on a new connection or queue slot.
function joinActiveTransactions(db: Db): Db {
  return {
    query: (sql, params) => {
      const tx = activeTransaction.getStore();
      return tx ? tx.query(sql, params) : db.query(sql, params);
    },
    exec: (sql) => db.exec(sql),
    transaction: (fn) => {
      const tx = activeTransaction.getStore();
      if (tx) return fn(tx);
      return db.transaction((inner) => activeTransaction.run(inner, () => fn(inner)));
    },
  };
}

async function openDatabase() {
  const db = process.env.DATABASE_URL ? await createPostgres(process.env.DATABASE_URL) : await createPglite();
  return joinActiveTransactions(db);
}

export async function ensureReady() {
  const store = globalStore();
  if (store.imasaDb) return;
  if (!store.imasaReady) {
    store.imasaReady = (async () => {
      const db = await openDatabase();
      await migrate(db);
      store.imasaDb = db;
      if (shouldSeedDemo()) {
        const { seedDemoIfEmpty } = await import("@/lib/seed");
        await seedDemoIfEmpty(db);
      }
      await loadSessionKey(db);
      await createFirstPresident(db);
    })();
  }
  await store.imasaReady;
}
