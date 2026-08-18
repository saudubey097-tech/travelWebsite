"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole, createSession } from "@/lib/auth/session";
import { hashPassword, checkPasswordStrength, isPasswordCompromised } from "@/lib/auth/password";
import { generateToken, isExpired } from "@/lib/auth/tokens";
import { recordSecurityEvent } from "@/lib/auth/security-log";
import { sendStaffInvitationEmail } from "@/lib/email/auth-emails";
import { inviteStaffSchema, acceptInvitationSchema } from "@/lib/validation/auth";
import { homeRouteForRole } from "@/lib/auth/routing";
import { createHash } from "node:crypto";
import type { ActionResult } from "@/lib/actions/auth";
import type { VehicleClass } from "@prisma/client";

interface StoredDriverProfile {
  driverLicenseNo?: string;
  vehicleClass?: VehicleClass;
  vehicleCapacity?: number;
  vehicleDescription?: string;
}

const INVITATION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

/** Admin-only. Coordinators, Drivers, and Admins are never created directly — only invited. */
export async function inviteStaff(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const parsed = inviteStaffSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Please check the invitation details." };
  const data = parsed.data;

  const existingUser = await db.appUser.findUnique({ where: { email: data.email } });
  if (existingUser) return { ok: false, error: "A user with that email already exists." };

  const existingInvite = await db.staffInvitationToken.findFirst({
    where: { email: data.email, consumedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
  });
  if (existingInvite) return { ok: false, error: "There's already a pending invitation for that email." };

  const { raw, hash } = generateToken();
  const driverProfile =
    data.role === "DRIVER"
      ? {
          driverLicenseNo: data.driverLicenseNo,
          vehicleClass: data.vehicleClass,
          vehicleCapacity: data.vehicleCapacity,
          vehicleDescription: data.vehicleDescription,
        }
      : undefined;

  await db.staffInvitationToken.create({
    data: {
      email: data.email,
      name: data.name,
      role: data.role,
      invitedById: admin.id,
      tokenHash: hash,
      driverProfile,
      expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
    },
  });

  const emailResult = await sendStaffInvitationEmail({
    to: data.email,
    role: data.role,
    invitedByName: admin.name,
    token: raw,
  });
  await recordSecurityEvent({
    userId: admin.id,
    type: "STAFF_INVITED",
    metadata: { invitedEmail: data.email, role: data.role, emailDelivered: emailResult.ok },
  });

  revalidatePath("/admin/users");
  if (!emailResult.ok) {
    return { ok: false, error: `Invitation created, but the email couldn't be sent (${emailResult.error ?? "unknown error"}). Share the link manually if needed.` };
  }
  return { ok: true };
}

export async function listPendingInvitations() {
  await requireRole("ADMIN");
  return db.staffInvitationToken.findMany({
    where: { consumedAt: null, revokedAt: null },
    orderBy: { createdAt: "desc" },
    include: { invitedBy: { select: { name: true } } },
  });
}

export async function revokeInvitation(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("invitationId") ?? "");
  const invitation = await db.staffInvitationToken.findUnique({ where: { id } });
  if (!invitation) return { ok: false, error: "Invitation not found." };

  await db.staffInvitationToken.update({ where: { id }, data: { revokedAt: new Date() } });
  await recordSecurityEvent({ userId: admin.id, type: "STAFF_INVITATION_REVOKED", metadata: { email: invitation.email } });
  revalidatePath("/admin/users");
  return { ok: true };
}

/** Public — reads the raw token from the URL, never trusts a userId from the client. */
export async function getInvitationPreview(token: string) {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const invitation = await db.staffInvitationToken.findUnique({ where: { tokenHash } });
  if (!invitation || invitation.consumedAt || invitation.revokedAt || isExpired(invitation.expiresAt)) {
    return null;
  }
  return { email: invitation.email, name: invitation.name, role: invitation.role };
}

/** The invitee sets their own password — no temporary password is ever admin-chosen for the new-invite path. */
export async function acceptInvitation(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = acceptInvitationSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Please check the form and try again." };

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const invitation = await db.staffInvitationToken.findUnique({ where: { tokenHash } });
  if (!invitation || invitation.consumedAt || invitation.revokedAt || isExpired(invitation.expiresAt)) {
    return { ok: false, error: "This invitation is invalid or has expired. Ask an admin to send a new one." };
  }

  const strength = checkPasswordStrength(parsed.data.password);
  if (!strength.ok) return { ok: false, error: strength.error };
  if (await isPasswordCompromised(parsed.data.password)) {
    return { ok: false, error: "That password has appeared in a known data breach. Please choose another." };
  }

  const existingUser = await db.appUser.findUnique({ where: { email: invitation.email } });
  if (existingUser) return { ok: false, error: "An account with that email already exists. Try signing in." };

  const passwordHash = await hashPassword(parsed.data.password);
  const driverProfile = (invitation.driverProfile ?? {}) as StoredDriverProfile;

  const user = await db.$transaction(async (tx) => {
    const created = await tx.appUser.create({
      data: {
        name: invitation.name,
        email: invitation.email,
        role: invitation.role,
        passwordHash,
        emailVerifiedAt: new Date(), // invitation email itself is proof of ownership
        driverLicenseNo: driverProfile.driverLicenseNo,
        vehicleClass: driverProfile.vehicleClass,
        vehicleCapacity: driverProfile.vehicleCapacity,
        vehicleDescription: driverProfile.vehicleDescription,
      },
    });
    await tx.staffInvitationToken.update({ where: { id: invitation.id }, data: { consumedAt: new Date() } });
    return created;
  });

  await recordSecurityEvent({ userId: user.id, type: "STAFF_INVITATION_ACCEPTED" });
  await createSession(user.id);
  redirect(homeRouteForRole(user.role));
}
