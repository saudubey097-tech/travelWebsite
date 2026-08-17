/**
 * Seeds one demo account per role so the workflow can be exercised
 * end-to-end after a fresh migration. All names/emails/phones here are
 * placeholders, not real personal data. Every demo account shares the same
 * password below — treat this as a local/preview-only convenience and
 * rotate or delete these accounts before any production use.
 *
 * Run with: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const DEMO_PASSWORD = "ChangeMe123!";

async function upsertUser(data: {
  email: string;
  name: string;
  phone?: string;
  role: "CUSTOMER" | "COORDINATOR" | "DRIVER" | "ADMIN";
  driverLicenseNo?: string;
  vehicleClass?: "SEDAN" | "VAN" | "XL_VAN";
  vehicleCapacity?: number;
  vehicleDescription?: string;
}) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  return db.appUser.upsert({
    where: { email: data.email },
    update: {},
    create: { ...data, passwordHash },
  });
}

async function main() {
  const admin = await upsertUser({
    email: "admin@example.com",
    name: "Demo Admin",
    role: "ADMIN",
  });

  const coordinator = await upsertUser({
    email: "coordinator@example.com",
    name: "Demo Coordinator",
    role: "COORDINATOR",
  });

  const driver = await upsertUser({
    email: "driver@example.com",
    name: "Demo Driver",
    role: "DRIVER",
    driverLicenseNo: "DEMO-0001",
    vehicleClass: "VAN",
    vehicleCapacity: 8,
    vehicleDescription: "Demo Toyota Hiace (white)",
  });

  const customer = await upsertUser({
    email: "customer@example.com",
    name: "Demo Customer",
    role: "CUSTOMER",
  });

  console.log("Seeded demo accounts (password for all: %s):", DEMO_PASSWORD);
  console.log({ admin: admin.email, coordinator: coordinator.email, driver: driver.email, customer: customer.email });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
