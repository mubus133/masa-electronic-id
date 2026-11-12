import {
  createHash,
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hex] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hex) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const actual = Buffer.from(hex, "hex");
  if (actual.length !== derived.length) return false;
  return timingSafeEqual(actual, derived);
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function randomToken() {
  return randomBytes(32).toString("base64url");
}

export function sessionSecret() {
  return process.env.SESSION_SECRET || "dev-only-insecure-session-secret";
}

export function sessionSecretIsDefault() {
  return !process.env.SESSION_SECRET;
}

export function signPayload(payload: Record<string, unknown>) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function readPayload<T>(token: string | undefined | null): T | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  const actualBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function randomBase32(bytes = 20) {
  const raw = randomBytes(bytes);
  let bits = "";
  for (const value of raw) bits += value.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0");
    out += BASE32[Number.parseInt(chunk, 2)];
  }
  return out;
}

function base32Decode(input: string) {
  const clean = input.replace(/=+$/g, "").toUpperCase().replace(/\s/g, "");
  let bits = "";
  for (const char of clean) {
    const index = BASE32.indexOf(char);
    if (index < 0) throw new Error("Invalid authenticator key");
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function hotp(secret: string, counter: number) {
  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", key).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0xf;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, "0");
}

export function verifyTotp(secret: string, code: string, now = Date.now()) {
  const normalized = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;
  const counter = Math.floor(now / 30_000);
  for (const step of [counter - 1, counter, counter + 1]) {
    if (step < 0) continue;
    const expected = hotp(secret, step);
    const a = Buffer.from(expected);
    const b = Buffer.from(normalized);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}

const loginFailures = new Map<string, { fails: number; lockUntil: number }>();

export function assertLoginAllowed(email: string) {
  const bucket = loginFailures.get(email);
  if (bucket && bucket.lockUntil > Date.now()) {
    const minutes = Math.max(1, Math.ceil((bucket.lockUntil - Date.now()) / 60_000));
    throw new Error(
      `This sign-in is temporarily locked after repeated failures. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    );
  }
}

export function recordLoginFailure(email: string) {
  const bucket = loginFailures.get(email) ?? { fails: 0, lockUntil: 0 };
  bucket.fails += 1;
  if (bucket.fails >= 5) {
    bucket.lockUntil = Date.now() + 15 * 60_000;
    bucket.fails = 0;
  }
  loginFailures.set(email, bucket);
}

export function clearLoginFailures(email: string) {
  loginFailures.delete(email);
}
