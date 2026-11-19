import { database } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { badRequest } from "@/lib/access";
import type { Actor } from "@/lib/permissions";

export const SITE_CONTENT_DEFAULTS = {
  hero_title: "Student ID and Madrasa attendance, in one place.",
  hero_text:
    "Students check in at weekend classes. Teachers confirm who is in the room. Hostel staff can see whether a student has a valid pass for tonight.",
  hero_image: "",
  hero_image_alt: "IMASA students in a Madrasa class",
  announcement: "",
};

export type SiteContent = typeof SITE_CONTENT_DEFAULTS;
export type SiteContentKey = keyof SiteContent;

const KEYS = Object.keys(SITE_CONTENT_DEFAULTS) as SiteContentKey[];
const LIMITS: Record<SiteContentKey, number> = {
  hero_title: 120,
  hero_text: 400,
  hero_image: 2_500_000,
  hero_image_alt: 160,
  announcement: 300,
};

export async function getSiteContent(): Promise<SiteContent> {
  const rows = await database().query<{ key: string; value: string }>("SELECT key, value FROM site_content");
  const content = { ...SITE_CONTENT_DEFAULTS };
  for (const row of rows) {
    if ((KEYS as string[]).includes(row.key)) content[row.key as SiteContentKey] = row.value;
  }
  return content;
}

export async function updateSiteContent(input: Partial<Record<string, unknown>>, actor: Actor): Promise<SiteContent> {
  const changes = KEYS.filter((key) => typeof input[key] === "string").map((key) => [key, (input[key] as string).trim()] as const);
  if (!changes.length) throw badRequest("Nothing to save.");

  for (const [key, value] of changes) {
    if (value.length > LIMITS[key]) throw badRequest(key === "hero_image" ? "That photo is too large. Use one under 2 MB." : `"${key}" is too long.`);
    if (key === "hero_image" && value && !/^data:image\/(jpeg|png|webp);base64,/.test(value) && !/^https:\/\//.test(value)) {
      throw badRequest("Upload a JPEG, PNG or WebP photo.");
    }
    if (key === "hero_title" && !value) throw badRequest("The headline can't be empty.");
  }

  await database().transaction(async (tx) => {
    for (const [key, value] of changes) {
      await tx.query(
        `INSERT INTO site_content (key, value, updated_by, updated_at) VALUES ($1, $2, $3, now())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = now()`,
        [key, value, actor.id],
      );
    }
    await logAudit({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "website.update",
      affectedRecordType: "site_content",
      reason: "Website content changed",
      newValue: Object.fromEntries(changes.map(([key, value]) => [key, key === "hero_image" ? (value ? "photo updated" : "photo removed") : value])),
    });
  });
  return getSiteContent();
}
