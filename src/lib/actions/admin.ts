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
  updateDriverProfileSchema,
} from "@/lib/validation/admin";
import { overrideAssignmentSchema, correctBookingStatusSchema, addNoteSchema, resendNotificationSchema } from "@/lib/validation/booking";
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

  const target = await db.appUser.findUnique({ where: { id: parsed.data.userId } });
  if (!target) return { ok: false, error: "User not found." };

  if (!parsed.data.active && target.role === "ADMIN") {
    const activeAdmins = await db.appUser.count({ where: { role: "ADMIN", active: true } });
    if (activeAdmins <= 1) {
      return { ok: false, error: "Can't deactivate the last active admin." };
    }
  }

  await db.appUser.update({ where: { id: parsed.data.userId }, data: { active: parsed.data.active } });
  await db.auditLog.create({
    data: {
      actorId: admin.id,
      targetUserId: target.id,
      action: "account_status_changed",
      previousValue: String(target.active),
      newValue: String(parsed.data.active),
    },
  });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${target.id}`);
  return { ok: true };
}

export async function changeUserRole(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const parsed = changeUserRoleSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Invalid role." };
  if (parsed.data.userId === admin.id) {
    return { ok: false, error: "You can't change your own role." };
  }

  const target = await db.appUser.findUnique({ where: { id: parsed.data.userId } });
  if (!target) return { ok: false, error: "User not found." };

  if (target.role === "ADMIN" && parsed.data.role !== "ADMIN") {
    const activeAdmins = await db.appUser.count({ where: { role: "ADMIN", active: true } });
    if (activeAdmins <= 1) {
      return { ok: false, error: "Can't remove the last active admin's role." };
    }
  }

  await db.appUser.update({ where: { id: parsed.data.userId }, data: { role: parsed.data.role } });
  await db.auditLog.create({
    data: {
      actorId: admin.id,
      targetUserId: target.id,
      action: "role_changed",
      previousValue: target.role,
      newValue: parsed.data.role,
    },
  });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${target.id}`);
  return { ok: true };
}

/** Audit history for a single user's account — role/status changes only
 *  (not their booking activity, which lives in booking_events). */
export async function listUserAuditHistory(userId: string) {
  await requireRole("ADMIN");
  return db.auditLog.findMany({
    where: { targetUserId: userId },
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { id: true, name: true } } },
  });
}

/** Full profile + activity for the /admin/users/[id] page. */
export async function getUserProfile(userId: string) {
  await requireRole("ADMIN");
  const user = await db.appUser.findUnique({ where: { id: userId } });
  if (!user) return null;

  const [bookingCount, assignmentCount] = await Promise.all([
    db.bookingRequest.count({ where: { customerId: userId } }),
    db.bookingAssignment.count({ where: { driverId: userId } }),
  ]);

  return { user, bookingCount, assignmentCount };
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
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  await requireRole("ADMIN");
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 20));

  const where: Record<string, unknown> = {
    status: filters.status,
    serviceType: filters.serviceType,
    coordinatorId: filters.coordinatorId,
    travelDate:
      filters.from || filters.to
        ? { gte: filters.from ? new Date(filters.from) : undefined, lte: filters.to ? new Date(filters.to) : undefined }
        : undefined,
    assignments: filters.driverId ? { some: { driverId: filters.driverId } } : undefined,
  };
  if (filters.search && filters.search.trim()) {
    const term = filters.search.trim();
    where.OR = [
      { reference: { contains: term, mode: "insensitive" } },
      { pickupAddress: { contains: term, mode: "insensitive" } },
      { dropoffAddress: { contains: term, mode: "insensitive" } },
      { customer: { name: { contains: term, mode: "insensitive" } } },
    ];
  }

  const [bookings, total] = await Promise.all([
    db.bookingRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        coordinator: { select: { id: true, name: true } },
        assignments: { where: { status: "ACCEPTED" }, include: { driver: { select: { id: true, name: true } } } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.bookingRequest.count({ where }),
  ]);

  return { bookings, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getAdminSummary() {
  await requireRole("ADMIN");
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const [
    totalBookings,
    newRequests,
    awaitingAssignment,
    scheduledToday,
    activeTrips,
    completedTrips,
    cancelledTrips,
    declinedAssignments,
    acceptedAssignments,
    reassignmentCount,
  ] = await Promise.all([
    db.bookingRequest.count(),
    db.bookingRequest.count({ where: { status: "SUBMITTED" } }),
    db.bookingRequest.count({ where: { status: { in: ["PENDING_ASSIGNMENT", "REASSIGNMENT_REQUIRED"] } } }),
    db.bookingRequest.count({ where: { status: "SCHEDULED", travelDate: { gte: startOfToday, lt: endOfToday } } }),
    db.bookingRequest.count({ where: { status: "IN_PROGRESS" } }),
    db.bookingRequest.count({ where: { status: "COMPLETED" } }),
    db.bookingRequest.count({ where: { status: "CANCELLED" } }),
    db.bookingAssignment.count({ where: { status: "DECLINED" } }),
    db.bookingAssignment.count({ where: { status: "ACCEPTED" } }),
    db.bookingRequest.count({ where: { status: "REASSIGNMENT_REQUIRED" } }),
  ]);

  const closedBookings = completedTrips + cancelledTrips;
  const completionRate = closedBookings > 0 ? Math.round((completedTrips / closedBookings) * 100) : 0;
  const respondedAssignments = declinedAssignments + acceptedAssignments;
  const driverAcceptanceRate =
    respondedAssignments > 0 ? Math.round((acceptedAssignments / respondedAssignments) * 100) : 0;

  return {
    totalBookings,
    newRequests,
    awaitingAssignment,
    scheduledToday,
    activeTrips,
    completedTrips,
    declinedAssignments,
    completionRate,
    driverAcceptanceRate,
    reassignmentCount,
  };
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

/**
 * Force-corrects a booking's status, bypassing the normal ALLOWED_TRANSITIONS
 * guard — this is deliberately an admin-only escape hatch for fixing a
 * booking stuck in a bad state, and always requires a reason. The audit
 * event is explicitly labelled as an override so it's never mistaken for a
 * routine transition when reviewing the timeline.
 */
export async function correctBookingStatus(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const parsed = correctBookingStatusSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "A reason is required to correct a booking's status." };

  const booking = await db.bookingRequest.findUnique({ where: { id: parsed.data.bookingId } });
  if (!booking) return { ok: false, error: "Booking not found." };

  await db.$transaction(async (tx) => {
    await tx.bookingRequest.update({ where: { id: booking.id }, data: { status: parsed.data.newStatus } });
    await tx.bookingEvent.create({
      data: {
        bookingRequestId: booking.id,
        actorId: admin.id,
        previousStatus: booking.status,
        newStatus: parsed.data.newStatus,
        context: { override: true, action: "status_corrected", reason: parsed.data.reason },
      },
    });
    await notify(tx, {
      userId: booking.customerId,
      type: "STATUS_UPDATE",
      title: "Your trip status was corrected",
      body: "An administrator corrected your trip's status. Contact support if this is unexpected.",
      link: `/dashboard/bookings/${booking.id}`,
    });
  });

  revalidatePath(`/admin/bookings/${booking.id}`);
  return { ok: true };
}

export async function addAdminNote(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const parsed = addNoteSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Note can't be empty." };

  await db.bookingMessage.create({
    data: { bookingRequestId: parsed.data.bookingId, senderId: admin.id, visibility: "INTERNAL", body: parsed.data.body },
  });

  revalidatePath(`/admin/bookings/${parsed.data.bookingId}`);
  return { ok: true };
}

/**
 * Re-delivers an existing notification by creating a fresh, unread copy for
 * the same recipient — useful when a coordinator/driver says they never saw
 * an assignment offer or status update. Does not re-send external email;
 * see PR notes for why that's out of scope here.
 */
export async function resendNotification(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireRole("ADMIN");
  const parsed = resendNotificationSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const original = await db.notification.findUnique({ where: { id: parsed.data.notificationId } });
  if (!original) return { ok: false, error: "Notification not found." };

  await db.notification.create({
    data: { userId: original.userId, type: original.type, title: original.title, body: original.body, link: original.link },
  });

  return { ok: true };
}

/**
 * Operational alerts for the admin overview: unassigned requests sitting
 * too long, offers a driver hasn't responded to within a day, bookings
 * stuck needing reassignment, and active trips — surfaced so an admin can
 * triage without hunting through every queue by hand.
 */
export async function getAdminAlerts() {
  await requireRole("ADMIN");
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [unassigned, overdueOffers, reassignmentRequired, activeTrips] = await Promise.all([
    db.bookingRequest.findMany({
      where: { status: "PENDING_ASSIGNMENT", createdAt: { lte: oneDayAgo } },
      select: { id: true, reference: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 10,
    }),
    db.bookingAssignment.findMany({
      where: { status: "OFFERED", offeredAt: { lte: oneDayAgo } },
      select: { id: true, bookingRequestId: true, offeredAt: true, driver: { select: { name: true } } },
      orderBy: { offeredAt: "asc" },
      take: 10,
    }),
    db.bookingRequest.findMany({
      where: { status: "REASSIGNMENT_REQUIRED" },
      select: { id: true, reference: true, updatedAt: true },
      orderBy: { updatedAt: "asc" },
      take: 10,
    }),
    db.bookingRequest.count({ where: { status: "IN_PROGRESS" } }),
  ]);

  return { unassigned, overdueOffers, reassignmentRequired, activeTrips };
}

export async function updateDriverProfile(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const admin = await requireRole("ADMIN");
  const parsed = updateDriverProfileSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: "Please check the driver's details." };

  const target = await db.appUser.findUnique({ where: { id: parsed.data.userId } });
  if (!target || target.role !== "DRIVER") return { ok: false, error: "Driver not found." };

  await db.appUser.update({
    where: { id: target.id },
    data: {
      vehicleClass: parsed.data.vehicleClass,
      vehicleCapacity: parsed.data.vehicleCapacity,
      vehicleDescription: parsed.data.vehicleDescription,
      driverLicenseNo: parsed.data.driverLicenseNo,
      driverAvailable: parsed.data.driverAvailable ? parsed.data.driverAvailable === "true" : undefined,
    },
  });
  await db.auditLog.create({
    data: { actorId: admin.id, targetUserId: target.id, action: "driver_profile_updated" },
  });

  revalidatePath(`/admin/users/${target.id}`);
  return { ok: true };
}

/**
 * Notifications correlated to this booking, found via the booking id
 * embedded in each notification's `link` (notifications aren't booking-
 * scoped in the schema — they're user-scoped — so this is a best-effort
 * correlation rather than a strict foreign-key relationship).
 */
export async function getBookingRelatedNotifications(bookingId: string) {
  await requireRole("ADMIN");
  return db.notification.findMany({
    where: { link: { contains: bookingId } },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, role: true } } },
    take: 30,
  });
}
