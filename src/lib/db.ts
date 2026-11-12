import fs from "fs";
import path from "path";

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

export function splitSql(sql: string) {
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
  const directory = path.join(process.cwd(), ".data/imasa");
  fs.mkdirSync(directory, { recursive: true });
  const client = new PGlite(directory);
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
  const sql = postgres(url, { max: 10, ssl: url.includes("localhost") ? false : "require" });
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

export function databaseMode() {
  if (process.env.DATABASE_URL) return "postgres" as const;
  return "pglite" as const;
}

async function openDatabase() {
  if (process.env.DATABASE_URL) return createPostgres(process.env.DATABASE_URL);
  return createPglite();
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
    })();
  }
  await store.imasaReady;
}
