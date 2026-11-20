import { it, expect } from "vitest";
import fs from "fs";
import { splitSql } from "@/lib/db";
it("every statement starts with SQL", () => {
  const stmts = splitSql(fs.readFileSync("supabase/migrations/001_schema.sql", "utf8"));
  const bad = stmts.filter((s) => !/^(CREATE|ALTER|DROP|INSERT|SELECT)\b/i.test(s));
  expect(bad).toEqual([]);
  expect(stmts.length).toBeGreaterThan(30);
});
