"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";

export async function listMyNotifications() {
  const user = await requireUser();
  return db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function unreadNotificationCount() {
  const user = await requireUser();
  return db.notification.count({ where: { userId: user.id, read: false } });
}

/** IDOR-safe: filters by (id AND userId), so marking someone else's notification id is a silent no-op. */
export async function markNotificationRead(notificationId: string) {
  const user = await requireUser();
  await db.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { read: true },
  });
  revalidatePath("/dashboard");
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  await db.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  revalidatePath("/dashboard");
}
