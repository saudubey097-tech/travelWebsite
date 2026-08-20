import { describe, it, expect, vi, beforeEach } from "vitest";

const currentUser = vi.hoisted(() => ({ current: null as { id: string; name: string; email: string; role: string } | null }));
const submitCalls = vi.hoisted(() => ({ calls: [] as unknown[] }));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: async () => currentUser.current,
}));

vi.mock("@/lib/booking/submit", () => ({
  submitBookingRequest: async (input: unknown) => {
    submitCalls.calls.push(input);
    return { id: "booking_1", reference: "SB-TEST1", status: "SUBMITTED" };
  },
}));

vi.mock("@/lib/email/notify-operator", () => ({
  sendOperatorNotificationEmail: async () => ({ ok: true, provider: "test" as const }),
}));

const { POST } = await import("@/app/api/booking-enquiries/route");

function jsonRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/booking-enquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validTransfer = {
  bookingType: "TRANSFER",
  name: "Form Name",
  email: "form-submitted@example.com",
  phone: "+64211234567",
  travelDate: "2026-12-01",
  guests: 2,
  pickup: "Auckland Airport",
  dropoff: "Sky City",
};

describe("POST /api/booking-enquiries — per-service-type validation", () => {
  beforeEach(() => {
    currentUser.current = null;
    submitCalls.calls = [];
  });

  it("rejects a transfer missing pickup/dropoff", async () => {
    const { pickup, dropoff, ...rest } = validTransfer;
    void pickup;
    void dropoff;
    const response = await POST(jsonRequest(rest));
    expect(response.status).toBe(400);
    expect(submitCalls.calls).toHaveLength(0);
  });

  it("rejects a day tour with no tour chosen", async () => {
    const response = await POST(
      jsonRequest({ ...validTransfer, bookingType: "DAY_TOUR", pickup: undefined, dropoff: undefined })
    );
    expect(response.status).toBe(400);
  });

  it("rejects hourly hire with no vehicle chosen", async () => {
    const response = await POST(
      jsonRequest({ ...validTransfer, bookingType: "HOURLY", pickup: undefined, dropoff: undefined })
    );
    expect(response.status).toBe(400);
  });

  it("accepts a valid transfer and persists it", async () => {
    const response = await POST(jsonRequest(validTransfer));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.reference).toBe("SB-TEST1");
    expect(submitCalls.calls).toHaveLength(1);
  });
});

describe("POST /api/booking-enquiries — identity enforcement", () => {
  beforeEach(() => {
    currentUser.current = null;
    submitCalls.calls = [];
  });

  it("uses the session account's own name/email for a signed-in customer, ignoring the form fields", async () => {
    currentUser.current = { id: "real_customer_id", name: "Real Account Name", email: "real-account@example.com", role: "CUSTOMER" };
    await POST(jsonRequest(validTransfer));

    expect(submitCalls.calls).toHaveLength(1);
    const submitted = submitCalls.calls[0] as { name: string; email: string; authedUserId: string | null };
    expect(submitted.authedUserId).toBe("real_customer_id");
    expect(submitted.name).toBe("Real Account Name");
    expect(submitted.email).toBe("real-account@example.com");
    // Explicitly NOT the form-submitted identity fields.
    expect(submitted.name).not.toBe(validTransfer.name);
    expect(submitted.email).not.toBe(validTransfer.email);
  });

  it("uses the submitted form fields for an anonymous visitor", async () => {
    currentUser.current = null;
    await POST(jsonRequest(validTransfer));

    const submitted = submitCalls.calls[0] as { name: string; email: string; authedUserId: string | null };
    expect(submitted.authedUserId).toBeNull();
    expect(submitted.name).toBe(validTransfer.name);
    expect(submitted.email).toBe(validTransfer.email);
  });

  it("does not treat a signed-in staff member as the booking's customer identity", async () => {
    currentUser.current = { id: "coord_id", name: "A Coordinator", email: "coord@example.com", role: "COORDINATOR" };
    await POST(jsonRequest(validTransfer));

    const submitted = submitCalls.calls[0] as { authedUserId: string | null };
    expect(submitted.authedUserId).toBeNull();
  });
});
