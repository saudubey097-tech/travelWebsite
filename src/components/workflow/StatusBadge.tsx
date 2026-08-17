import { Badge } from "@/components/ui/Badge";
import type { BookingStatus } from "@prisma/client";

const STATUS_LABEL: Record<BookingStatus, string> = {
  SUBMITTED: "Request received",
  PENDING_ASSIGNMENT: "Driver being arranged",
  ACCEPTED: "Driver confirmed",
  IN_COMMUNICATION: "In communication",
  SCHEDULED: "Trip scheduled",
  IN_PROGRESS: "Trip in progress",
  COMPLETED: "Trip completed",
  DECLINED: "Declined",
  REASSIGNMENT_REQUIRED: "Reassigning driver",
  CANCELLED: "Cancelled",
};

const STATUS_TONE: Record<BookingStatus, "paper" | "pine" | "gold" | "ink"> = {
  SUBMITTED: "paper",
  PENDING_ASSIGNMENT: "gold",
  ACCEPTED: "pine",
  IN_COMMUNICATION: "pine",
  SCHEDULED: "pine",
  IN_PROGRESS: "gold",
  COMPLETED: "ink",
  DECLINED: "paper",
  REASSIGNMENT_REQUIRED: "gold",
  CANCELLED: "paper",
};

export function statusLabel(status: BookingStatus): string {
  return STATUS_LABEL[status] ?? status;
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  return <Badge tone={STATUS_TONE[status] ?? "paper"}>{STATUS_LABEL[status] ?? status}</Badge>;
}
