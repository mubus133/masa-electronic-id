import type { DailyAuthorization } from "@/lib/types";

export type PassState = "valid" | "used" | "expired" | "revoked";

export const passState = (pass: Pick<DailyAuthorization, "authorization_status" | "expires_at">): PassState => {
  if (pass.authorization_status === "redeemed") return "used";
  if (pass.authorization_status === "revoked") return "revoked";
  if (pass.authorization_status === "expired" || new Date(pass.expires_at).getTime() <= Date.now()) return "expired";
  return "valid";
};
