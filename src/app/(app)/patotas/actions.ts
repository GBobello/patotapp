"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { extractInviteCode, generateInviteCode } from "@/domain/roles";
import { type ActionResult, fieldErrorsFrom, formValues } from "@/lib/forms";
import { parsePatotaForm } from "@/lib/schemas";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";

/** RF07: quem cria a patota vira organizador dela. */
export async function createPatota(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parsePatotaForm(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values: formValues(formData) };

  const patota = await db.patota.create({
    data: {
      ...parsed.data,
      inviteCode: generateInviteCode(),
      memberships: { create: { userId: user.id, role: "ORGANIZER" } },
    },
  });

  redirect(`/patotas/${patota.id}`);
}

/** Entrar digitando/colando o código ou link de convite. */
export async function goToInvite(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const code = extractInviteCode(String(formData.get("code") ?? ""));
  if (!code) return {
      fieldErrors: { code: "Cole o link ou digite o código de convite (ex.: ABCD2345)." },
      values: formValues(formData),
    };
  redirect(`/convite/${code}`);
}

/** RF09: aceitar convite. Se já for integrante, apenas abre a patota. */
export async function acceptInvite(code: string): Promise<ActionResult> {
  const user = await requireUser();
  const patota = await db.patota.findUnique({ where: { inviteCode: code } });
  if (!patota) return { error: "Convite inválido ou substituído por um novo. Peça o link atualizado ao organizador." };

  await db.membership.upsert({
    where: { patotaId_userId: { patotaId: patota.id, userId: user.id } },
    create: { patotaId: patota.id, userId: user.id },
    update: {},
  });

  revalidatePath("/");
  redirect(`/patotas/${patota.id}`);
}
