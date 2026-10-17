"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";

/** Marca as notificações como vistas e atualiza o contador do sino. */
export async function markNotificationsSeen() {
  const user = await requireUser();
  await db.user.update({ where: { id: user.id }, data: { notificationsSeenAt: new Date() } });
  revalidatePath("/", "layout");
}
