import { z } from "zod";

export const roleSchema = z.enum(["CUSTOMER", "COORDINATOR", "DRIVER", "ADMIN"]);

export const createStaffUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254).toLowerCase(),
  phone: z.string().trim().min(6).max(30).optional(),
  role: z.enum(["COORDINATOR", "DRIVER", "ADMIN"]),
  temporaryPassword: z.string().min(10).max(200),
  driverLicenseNo: z.string().trim().max(50).optional(),
  vehicleClass: z.enum(["SEDAN", "VAN", "XL_VAN"]).optional(),
  vehicleCapacity: z.coerce.number().int().min(1).max(20).optional(),
  vehicleDescription: z.string().trim().max(200).optional(),
});

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
