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
