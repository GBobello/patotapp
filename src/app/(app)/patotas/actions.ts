"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { extractInviteCode, generateInviteCode } from "@/domain/roles";
import { type ActionResult, fieldErrorsFrom, formValues } from "@/lib/forms";
import { parsePatotaForm } from "@/lib/schemas";
import { memberName } from "@/domain/members";
import { logActivity } from "@/server/activity";
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

  const existing = await db.membership.findUnique({
    where: { patotaId_userId: { patotaId: patota.id, userId: user.id } },
  });
  if (existing?.status === "PENDING") {
    return { ok: true, message: "Seu pedido já foi enviado. Aguarde a aprovação do organizador." };
  }
  if (!existing) {
    // RF10: com aprovação ligada, a entrada vira um pedido que o organizador aprova.
    const status = patota.requireApproval ? ("PENDING" as const) : ("ACTIVE" as const);
    const membership = await db.membership.create({ data: { patotaId: patota.id, userId: user.id, status } });
    const name = memberName({ ...membership, user });
    await logActivity({
      patotaId: patota.id,
      actorId: membership.id,
      message: status === "PENDING" ? `${name} pediu para entrar na patota` : `${name} entrou na patota`,
      href: `/patotas/${patota.id}/membros`,
      managersOnly: status === "PENDING",
    });
    if (status === "PENDING") {
      revalidatePath(`/convite/${code}`);
      return { ok: true, message: "Pedido enviado! Você entra assim que o organizador aprovar." };
    }
  }

  revalidatePath("/");
  redirect(`/patotas/${patota.id}`);
}
