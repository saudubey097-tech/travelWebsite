"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { transitionBooking } from "@/lib/booking/transition";
import { notify } from "@/lib/booking/notify";
import {
  createStaffUserSchema,
  setUserActiveSchema,
  changeUserRoleSchema,
} from "@/lib/validation/admin";
import { overrideAssignmentSchema } from "@/lib/validation/booking";
import type { ActionResult } from "@/lib/actions/auth";
import type { BookingStatus, ServiceType } from "@prisma/client";

export async function listUsers() {
  await requireRole("ADMIN");
  return db.appUser.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      active: true,
      driverAvailable: true,
      vehicleClass: true,
      vehicleCapacity: true,
      createdAt: true,
    },
  });
}

/** Coordinators, Drivers, and Admins are created only by an Admin — never self-registered. */
export async function createStaffUser(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRole("ADMIN");
  const parsed = createStaffUserSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Please check the new user's details." };
  const data = parsed.data;

  const existing = await db.appUser.findUnique({ where: { email: data.email } });
  if (existing) return { ok: false, error: "A user with that email already exists." };

  const passwordHash = await hashPassword(data.temporaryPassword);
  await db.appUser.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      passwordHash,
      driverLicenseNo: data.driverLicenseNo,
      vehicleClass: data.vehicleClass,
      vehicleCapacity: data.vehicleCapacity,
      vehicleDescription: data.vehicleDescription,
    },
  });

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setUserActive(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const parsed = setUserActiveSchema.safeParse({
    userId: formData.get("userId"),
    active: formData.get("active") === "true",
  });
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  if (parsed.data.userId === admin.id && !parsed.data.active) {
    return { ok: false, error: "You can't deactivate your own account." };
  }

  await db.appUser.update({ where: { id: parsed.data.userId }, data: { active: parsed.data.active } });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function changeUserRole(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const parsed = changeUserRoleSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Invalid role." };
  if (parsed.data.userId === admin.id) {
    return { ok: false, error: "You can't change your own role." };
  }

  await db.appUser.update({ where: { id: parsed.data.userId }, data: { role: parsed.data.role } });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function overrideAssignment(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const parsed = overrideAssignmentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "A reason is required to override an assignment." };
  const { bookingId, driverId, reason } = parsed.data;

  const [booking, driver] = await Promise.all([
    db.bookingRequest.findUnique({ where: { id: bookingId } }),
    db.appUser.findUnique({ where: { id: driverId } }),
  ]);
  if (!booking) return { ok: false, error: "Booking not found." };
  if (!driver || driver.role !== "DRIVER") return { ok: false, error: "Invalid driver." };

  await db.$transaction(async (tx) => {
    // Withdraw any live offers/acceptance, then force a fresh, already-accepted offer from the admin.
    await tx.bookingAssignment.updateMany({
      where: { bookingRequestId: bookingId, status: { in: ["OFFERED", "ACCEPTED"] } },
      data: { status: "REVOKED", respondedAt: new Date() },
    });
    await tx.bookingAssignment.create({
      data: {
        bookingRequestId: bookingId,
        driverId,
        offeredById: admin.id,
        status: "ACCEPTED",
        respondedAt: new Date(),
      },
    });
    if (!["ACCEPTED", "IN_COMMUNICATION", "SCHEDULED", "IN_PROGRESS"].includes(booking.status)) {
      await transitionBooking(tx, {
        bookingId,
        currentStatus: booking.status,
        newStatus: "ACCEPTED",
        actorId: admin.id,
        context: { override: true, reason },
      });
    } else {
      await tx.bookingEvent.create({
        data: {
          bookingRequestId: bookingId,
          actorId: admin.id,
          previousStatus: booking.status,
          newStatus: booking.status,
          context: { override: true, reason, driverId },
        },
      });
    }
    await notify(tx, {
      userId: driverId,
      type: "ASSIGNMENT_OVERRIDE",
      title: "You've been assigned by an administrator",
      body: `${booking.reference} was assigned to you directly by an admin.`,
      link: `/driver/trips/${bookingId}`,
    });
  });

  revalidatePath(`/admin/bookings/${bookingId}`);
  return { ok: true };
}

export async function listAllBookings(filters: {
  status?: BookingStatus;
  serviceType?: ServiceType;
  driverId?: string;
  coordinatorId?: string;
  from?: string;
  to?: string;
}) {
  await requireRole("ADMIN");
  return db.bookingRequest.findMany({
    where: {
      status: filters.status,
      serviceType: filters.serviceType,
      coordinatorId: filters.coordinatorId,
      travelDate:
        filters.from || filters.to
          ? { gte: filters.from ? new Date(filters.from) : undefined, lte: filters.to ? new Date(filters.to) : undefined }
          : undefined,
      assignments: filters.driverId ? { some: { driverId: filters.driverId } } : undefined,
    },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      coordinator: { select: { id: true, name: true } },
      assignments: { where: { status: "ACCEPTED" }, include: { driver: { select: { id: true, name: true } } } },
    },
    take: 200,
  });
}

export async function getAdminSummary() {
  await requireRole("ADMIN");
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const [newRequests, awaitingAssignment, scheduledToday, activeTrips, completedTrips, declinedAssignments] =
    await Promise.all([
      db.bookingRequest.count({ where: { status: "SUBMITTED" } }),
      db.bookingRequest.count({ where: { status: { in: ["PENDING_ASSIGNMENT", "REASSIGNMENT_REQUIRED"] } } }),
      db.bookingRequest.count({ where: { status: "SCHEDULED", travelDate: { gte: startOfToday, lt: endOfToday } } }),
      db.bookingRequest.count({ where: { status: "IN_PROGRESS" } }),
      db.bookingRequest.count({ where: { status: "COMPLETED" } }),
      db.bookingAssignment.count({ where: { status: "DECLINED" } }),
    ]);

  return { newRequests, awaitingAssignment, scheduledToday, activeTrips, completedTrips, declinedAssignments };
}

/** Full audit view for a single booking — every event, message, and assignment. Admin-only. */
export async function getFullBookingAudit(bookingId: string) {
  await requireRole("ADMIN");
  return db.bookingRequest.findUnique({
    where: { id: bookingId },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      coordinator: { select: { id: true, name: true } },
      assignments: { orderBy: { createdAt: "asc" }, include: { driver: { select: { id: true, name: true } }, offeredBy: { select: { id: true, name: true } } } },
      messages: { orderBy: { createdAt: "asc" }, include: { sender: { select: { id: true, name: true, role: true } } } },
      events: { orderBy: { createdAt: "asc" }, include: { actor: { select: { id: true, name: true, role: true } } } },
    },
  });
}
