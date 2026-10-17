import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/server/db";

/**
 * Camada de acesso a dados (DAL): toda página/ação protegida chama esta função.
 * Lê a sessão uma vez por requisição e redireciona para o login se não houver usuário.
 */
export const requireUser = cache(async () => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");

  return user;
});
