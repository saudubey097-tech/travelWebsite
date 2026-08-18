import "server-only";
import { getEmailAdapter, type EmailSendResult } from "@/lib/email/adapter";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * Every sender here returns the adapter's real result — callers must not
 * assume success. This is what "never claim an email was sent if provider
 * delivery fails" means in practice: the caller (a Server Action) gets
 * `{ok: false, error}` back and decides what to tell the user, rather than
 * this module swallowing the failure.
 */

export async function sendVerificationEmail(params: { to: string; name: string; token: string }): Promise<EmailSendResult> {
  const link = `${siteUrl()}/verify-email/${params.token}`;
  return getEmailAdapter().send({
    to: params.to,
    subject: "Verify your Southbound account",
    text: `Hi ${params.name},\n\nConfirm your email to finish setting up your Southbound account:\n${link}\n\nThis link expires in 24 hours. If you didn't create an account, you can ignore this email.`,
    html: `<p>Hi ${escapeHtml(params.name)},</p><p>Confirm your email to finish setting up your Southbound account:</p><p><a href="${link}">${link}</a></p><p>This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>`,
  });
}

export async function sendPasswordResetEmail(params: { to: string; name: string; token: string }): Promise<EmailSendResult> {
  const link = `${siteUrl()}/reset-password/${params.token}`;
  return getEmailAdapter().send({
    to: params.to,
    subject: "Reset your Southbound password",
    text: `Hi ${params.name},\n\nWe received a request to reset your password. This link expires in 1 hour:\n${link}\n\nIf you didn't request this, you can ignore this email — your password won't change.`,
    html: `<p>Hi ${escapeHtml(params.name)},</p><p>We received a request to reset your password. This link expires in 1 hour:</p><p><a href="${link}">${link}</a></p><p>If you didn't request this, you can ignore this email — your password won't change.</p>`,
  });
}

export async function sendStaffInvitationEmail(params: {
  to: string;
  role: string;
  invitedByName: string;
  token: string;
}): Promise<EmailSendResult> {
  const link = `${siteUrl()}/invite/${params.token}`;
  const roleLabel = params.role.charAt(0) + params.role.slice(1).toLowerCase();
  return getEmailAdapter().send({
    to: params.to,
    subject: `You've been invited to join Southbound as a ${roleLabel}`,
    text: `Hi,\n\n${params.invitedByName} has invited you to join Southbound as a ${roleLabel}. Set up your account and choose your own password here:\n${link}\n\nThis invitation expires in 7 days.`,
    html: `<p>Hi,</p><p>${escapeHtml(params.invitedByName)} has invited you to join Southbound as a ${escapeHtml(roleLabel)}. Set up your account and choose your own password here:</p><p><a href="${link}">${link}</a></p><p>This invitation expires in 7 days.</p>`,
  });
}

function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c));
}
