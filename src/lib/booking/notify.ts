import "server-only";
import type { Prisma } from "@prisma/client";

/** Creates a notification row inside the given transaction. */
export async function notify(
  tx: Prisma.TransactionClient,
  params: { userId: string; type: string; title: string; body: string; link?: string }
) {
  await tx.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link,
    },
  });
}
