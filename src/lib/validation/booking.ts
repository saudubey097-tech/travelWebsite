import { z } from "zod";

export const serviceTypeSchema = z.enum(["DAY_TOUR", "TRANSFER", "HOURLY", "CUSTOM"]);
export const vehicleClassSchema = z.enum(["SEDAN", "VAN", "XL_VAN"]);

export const createBookingRequestSchema = z.object({
  serviceType: serviceTypeSchema,
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254).toLowerCase(),
  phone: z.string().trim().min(6).max(30),
  travelDate: z.string().date(),
  paxCount: z.coerce.number().int().min(1).max(11),
  pickup: z.string().trim().max(200).optional(),
  dropoff: z.string().trim().max(200).optional(),
  vehicleClass: vehicleClassSchema.optional(),
  tourSlug: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(2000).optional(),
  quotedPriceCents: z.coerce.number().int().positive().max(10_000_000).optional(),
});

export const updateBookingDetailsSchema = z.object({
  bookingId: z.string().min(1).max(64),
  travelDate: z.string().date().optional(),
  paxCount: z.coerce.number().int().min(1).max(11).optional(),
  pickupAddress: z.string().trim().max(200).optional(),
  dropoffAddress: z.string().trim().max(200).optional(),
  vehicleClass: vehicleClassSchema.optional(),
  notes: z.string().trim().max(2000).optional(),
  // Collected from coordinators in whole NZD, converted to cents in the action.
  confirmedPrice: z.coerce.number().positive().max(100_000).optional(),
});

export const assignDriverSchema = z.object({
  bookingId: z.string().min(1).max(64),
  driverId: z.string().min(1).max(64),
});

export const respondToAssignmentSchema = z.object({
  assignmentId: z.string().min(1).max(64),
  decision: z.enum(["ACCEPT", "DECLINE"]),
  declineReason: z.string().trim().min(3).max(500).optional(),
}).refine((v) => v.decision === "ACCEPT" || Boolean(v.declineReason), {
  message: "A reason is required to decline an assignment.",
  path: ["declineReason"],
});

export const updateTripStatusSchema = z.object({
  bookingId: z.string().min(1).max(64),
  status: z.enum(["IN_COMMUNICATION", "SCHEDULED", "IN_PROGRESS", "COMPLETED"]),
});

export const sendMessageSchema = z.object({
  bookingId: z.string().min(1).max(64),
  body: z.string().trim().min(1).max(4000),
  visibility: z.enum(["CUSTOMER_VISIBLE", "INTERNAL"]).default("CUSTOMER_VISIBLE"),
});

export const cancelBookingSchema = z.object({
  bookingId: z.string().min(1).max(64),
});

export const overrideAssignmentSchema = z.object({
  bookingId: z.string().min(1).max(64),
  driverId: z.string().min(1).max(64),
  reason: z.string().trim().min(3).max(500),
});
