import { formatDate } from "@/lib/time";
import type { Session } from "@/lib/types";

const timeOf = (value: string, timezone: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit" }).format(new Date(value));

export const sessionWhen = (session: Pick<Session, "session_date" | "starts_at" | "ends_at">, timezone: string) =>
  `${formatDate(session.session_date, timezone)} · ${timeOf(session.starts_at, timezone)}–${timeOf(session.ends_at, timezone)}`;
