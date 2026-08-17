import { PrismaClient } from "@prisma/client";

// Standard singleton pattern for Prisma on serverless platforms (Vercel):
// each function invocation can reuse a warm connection instead of opening
// a new one, and hot-reload in dev doesn't spawn a fresh client per edit.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
