import { z } from "zod";

export const roleSchema = z.enum(["CUSTOMER", "COORDINATOR", "DRIVER", "ADMIN"]);

// Direct staff creation with an admin-set temporary password was replaced
// by the invitation flow (see validation/auth.ts#inviteStaffSchema and
// actions/invitations.ts) — an admin no longer chooses a new staff
// member's password.


export const setUserActiveSchema = z.object({
  userId: z.string().min(1).max(64),
  active: z.boolean(),
});

export const changeUserRoleSchema = z.object({
  userId: z.string().min(1).max(64),
  role: roleSchema,
});

export const updateDriverProfileSchema = z.object({
  userId: z.string().min(1).max(64),
  vehicleClass: z.enum(["SEDAN", "VAN", "XL_VAN"]).optional(),
  vehicleCapacity: z.coerce.number().int().min(1).max(20).optional(),
  vehicleDescription: z.string().trim().max(200).optional(),
  driverLicenseNo: z.string().trim().max(50).optional(),
  driverAvailable: z.enum(["true", "false"]).optional(),
});
