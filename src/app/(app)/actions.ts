"use server";

import { signOut } from "@/auth";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

/** RF03: encerra a sessão em todos os aparelhos (ex.: celular perdido). */
export async function logoutEverywhere() {
  const user = await requireUser();
  await db.session.deleteMany({ where: { userId: user.id } });
  await signOut({ redirectTo: "/login" });
}
