import { database } from "@/lib/db";
import { hashPassword, newTemporaryPassword } from "@/lib/crypto";
import { logAudit } from "@/lib/audit";
import { badRequest, forbidden, notFound } from "@/lib/access";
import { can, isPresident, type Actor } from "@/lib/permissions";

type UserRow = { id: string; role: Actor["role"]; account_status: string; full_name: string };

// Who may manage an account depends on its role. Only the President manages
// administrators, and nobody can disable or reset the President through here.
const assertCanManage = (actor: Actor, user: UserRow) => {
  if (user.id === actor.id) throw forbidden("You can't change your own account here.");
  if (user.role === "super_admin") throw forbidden("The President's account can't be changed here.");
  const needed: Record<Actor["role"], string | null> = {
    super_admin: null,
    administrator: null,
    teacher: "teachers.manage",
    hostel_staff: "hostels.manage",
    student: "students.edit",
  };
  const permission = needed[user.role];
  if (user.role === "administrator" ? isPresident(actor) : permission && can(actor, permission)) return;
  throw forbidden("You don't have permission to manage this account.");
};

const loadUser = async (userId: string) => {
  const rows = await database().query<UserRow>("SELECT id, role, account_status, full_name FROM users WHERE id = $1", [userId]);
  if (!rows[0]) throw notFound("Account not found.");
  return rows[0];
};

export async function setAccountStatus(userId: string, status: "active" | "disabled", reason: string, actor: Actor) {
  const trimmed = reason?.trim() ?? "";
  if (trimmed.length < 5) throw badRequest("Give a reason. It's kept in the audit log.");
  if (status !== "active" && status !== "disabled") throw badRequest("Unknown account status.");
  const user = await loadUser(userId);
  assertCanManage(actor, user);

  return database().transaction(async (tx) => {
    await tx.query("UPDATE users SET account_status = $2 WHERE id = $1", [userId, status]);
    if (user.role === "teacher") await tx.query("UPDATE teachers SET account_status = $2 WHERE user_id = $1", [userId, status === "active" ? "active" : "inactive"]);
    if (user.role === "hostel_staff") await tx.query("UPDATE hostel_staff SET staff_status = $2 WHERE user_id = $1", [userId, status === "active" ? "active" : "inactive"]);
    await logAudit({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: status === "active" ? "account.enable" : "account.disable",
      affectedRecordType: "user",
      affectedRecordId: userId,
      reason: trimmed,
      previousValue: { status: user.account_status },
      newValue: { status },
    });
    return { id: userId, account_status: status };
  });
}

export async function resetPassword(userId: string, actor: Actor) {
  const user = await loadUser(userId);
  assertCanManage(actor, user);
  const temporaryPassword = newTemporaryPassword();
  await database().transaction(async (tx) => {
    await tx.query("UPDATE users SET password_hash = $2 WHERE id = $1", [userId, await hashPassword(temporaryPassword)]);
    await logAudit({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "account.password_reset",
      affectedRecordType: "user",
      affectedRecordId: userId,
      reason: `Temporary password issued for ${user.full_name}`,
    });
  });
  return { temporaryPassword };
}
