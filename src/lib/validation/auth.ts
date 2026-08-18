import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254).toLowerCase(),
  phone: z.string().trim().min(6).max(30).optional(),
  password: z.string().min(10).max(200),
});

export const signInSchema = z.object({
  email: z.string().trim().email().max(254).toLowerCase(),
  password: z.string().min(1).max(200),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().trim().email().max(254).toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(10).max(200),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(10).max(200),
});

export const inviteStaffSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254).toLowerCase(),
  role: z.enum(["COORDINATOR", "DRIVER", "ADMIN"]),
  driverLicenseNo: z.string().trim().max(50).optional(),
  vehicleClass: z.enum(["SEDAN", "VAN", "XL_VAN"]).optional(),
  vehicleCapacity: z.coerce.number().int().min(1).max(20).optional(),
  vehicleDescription: z.string().trim().max(200).optional(),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(10).max(200),
});

export const mfaVerifySchema = z.object({
  code: z.string().trim().min(6).max(64), // 6-digit TOTP or an 11-char recovery code
});

export const revokeSessionSchema = z.object({
  sessionId: z.string().min(1).max(64),
});
