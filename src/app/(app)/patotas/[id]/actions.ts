"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { memberName } from "@/domain/members";
import { POSITIONS } from "@/domain/positions";
import { MEMBER_TYPES, ROLES, checkOrganizerRemains, generateInviteCode } from "@/domain/roles";
import { type ActionResult, fieldErrorsFrom, formValues } from "@/lib/forms";
import { parsePatotaForm } from "@/lib/schemas";
import { logActivity } from "@/server/activity";
import { db } from "@/server/db";
import { guarded } from "@/server/guard";
import { ACTIVE, ForbiddenError, requireManager, requireMember, requireOrganizer } from "@/server/patotas";

function refresh(patotaId: string) {
  revalidatePath(`/patotas/${patotaId}`, "layout");
  revalidatePath("/");
}

async function organizerCount(patotaId: string) {
  return db.membership.count({ where: { patotaId, role: "ORGANIZER" } });
}

/** Busca um integrante garantindo que ele pertence à patota informada. */
async function findMember(patotaId: string, membershipId: string) {
  const member = await db.membership.findFirst({ where: { id: membershipId, patotaId, ...ACTIVE } });
  if (!member) throw new ForbiddenError("Integrante não encontrado.");
  return member;
}

// ---------- Configurações da patota ----------

export async function updatePatota(patotaId: string, _prev: ActionResult, formData: FormData) {
  return guarded(async () => {
    await requireManager(patotaId);
    const parsed = parsePatotaForm(formData);
    if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values: formValues(formData) };

    await db.patota.update({ where: { id: patotaId }, data: parsed.data });
    refresh(patotaId);
    return { ok: true, message: "Dados da patota salvos." };
  });
}

/** Gera um novo código; o link antigo deixa de funcionar. */
export async function regenerateInviteCode(patotaId: string) {
  return guarded(async () => {
    await requireManager(patotaId);
    await db.patota.update({ where: { id: patotaId }, data: { inviteCode: generateInviteCode() } });
    refresh(patotaId);
    return { ok: true, message: "Novo link gerado. O link antigo não funciona mais." };
  });
}

export async function deletePatota(patotaId: string, _prev: ActionResult, formData: FormData) {
  const result = await guarded(async () => {
    const { patota } = await requireOrganizer(patotaId);
    if (String(formData.get("confirmName") ?? "").trim() !== patota.name) {
      return { fieldErrors: { confirmName: `Digite exatamente "${patota.name}" para confirmar.` } };
    }
    await db.patota.delete({ where: { id: patotaId } });
    return { ok: true };
  });
  if (!result.ok) return result;

  revalidatePath("/");
  redirect("/");
}

// ---------- Integrantes ----------

export async function changeMemberRole(patotaId: string, membershipId: string, role: string) {
  return guarded(async () => {
    await requireOrganizer(patotaId);
    const newRole = z.enum(ROLES).parse(role);
    const member = await findMember(patotaId, membershipId);
    if (!member.userId) return { error: "Convidados sem conta não podem ter papel de organização." };

    const problem = checkOrganizerRemains(member.role, newRole, await organizerCount(patotaId));
    if (problem) return { error: problem };

    await db.membership.update({ where: { id: membershipId }, data: { role: newRole } });
    refresh(patotaId);
    return { ok: true, message: "Papel atualizado." };
  });
}

export async function changeMemberType(patotaId: string, membershipId: string, type: string) {
  return guarded(async () => {
    await requireManager(patotaId);
    const newType = z.enum(MEMBER_TYPES).parse(type);
    await findMember(patotaId, membershipId);

    await db.membership.update({ where: { id: membershipId }, data: { type: newType } });
    refresh(patotaId);
    return { ok: true, message: "Tipo atualizado." };
  });
}

export async function removeMember(patotaId: string, membershipId: string) {
  return guarded(async () => {
    const { membership: me } = await requireManager(patotaId);
    const member = await findMember(patotaId, membershipId);

    if (member.role === "ORGANIZER" && me.role !== "ORGANIZER") {
      return { error: "Só um organizador pode remover outro organizador." };
    }
    const problem = checkOrganizerRemains(member.role, null, await organizerCount(patotaId));
    if (problem) return { error: problem };

    await db.membership.delete({ where: { id: membershipId } });
    refresh(patotaId);
    return { ok: true, message: "Integrante removido." };
  });
}

export async function leavePatota(patotaId: string) {
  const { membership } = await requireMember(patotaId);
  const problem = checkOrganizerRemains(membership.role, null, await organizerCount(patotaId));
  if (problem) return { error: problem };

  await db.membership.delete({ where: { id: membership.id } });
  revalidatePath("/");
  redirect("/");
}

// ---------- Notas e convidados (ciclo 4) ----------

/** RF26: nota de 1 a 5 usada no balanceamento do sorteio. */
export async function setRating(patotaId: string, membershipId: string, rating: number) {
  return guarded(async () => {
    await requireManager(patotaId);
    const value = z.number().int().min(1).max(5).parse(rating);
    await findMember(patotaId, membershipId);
    await db.membership.update({ where: { id: membershipId }, data: { rating: value } });
    revalidatePath(`/patotas/${patotaId}/membros`);
    return { ok: true, message: "Nota salva." };
  });
}

const guestSchema = z.object({
  guestName: z.string().trim().min(2, "Informe o nome do convidado.").max(40, "Use no máximo 40 caracteres."),
  guestPosition: z.enum(POSITIONS, "Escolha a posição."),
  rating: z.coerce.number().int().min(1).max(5),
});

/** RF13: convidado sem conta (o organizador confirma a presença por ele). */
export async function addGuest(patotaId: string, _prev: ActionResult, formData: FormData) {
  return guarded(async () => {
    await requireManager(patotaId);
    const parsed = guestSchema.safeParse({
      guestName: formData.get("guestName") ?? "",
      guestPosition: formData.get("guestPosition") || undefined,
      rating: formData.get("rating") ?? 3,
    });
    if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values: formValues(formData) };

    await db.membership.create({ data: { ...parsed.data, patotaId, type: "DIARISTA" } });
    refresh(patotaId);
    return { ok: true, message: `${parsed.data.guestName} adicionado como convidado.` };
  });
}

const rulesSchema = z.object({
  diaristaWindowHours: z
    .union([z.literal(""), z.coerce.number().int().min(0, "Use 0 ou mais horas.").max(168, "Máximo de 168 horas (7 dias).")])
    .transform((v) => (v === "" ? null : v)),
});

/** RF19: janela de prioridade dos mensalistas. */
export async function updateGameRules(patotaId: string, _prev: ActionResult, formData: FormData) {
  return guarded(async () => {
    await requireManager(patotaId);
    const parsed = rulesSchema.safeParse({ diaristaWindowHours: String(formData.get("diaristaWindowHours") ?? "").trim() });
    if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values: formValues(formData) };

    await db.patota.update({ where: { id: patotaId }, data: parsed.data });
    refresh(patotaId);
    return { ok: true, message: "Regras salvas. Valem para os próximos jogos criados." };
  });
}

// ---------- Pedidos de entrada (RF10) ----------

export async function setRequireApproval(patotaId: string, enabled: boolean) {
  return guarded(async () => {
    await requireManager(patotaId);
    await db.patota.update({ where: { id: patotaId }, data: { requireApproval: enabled } });
    refresh(patotaId);
    return {
      ok: true,
      message: enabled ? "Agora quem usar o link precisa da sua aprovação." : "Quem usar o link entra direto na patota.",
    };
  });
}

async function findPending(patotaId: string, membershipId: string) {
  const member = await db.membership.findFirst({
    where: { id: membershipId, patotaId, status: "PENDING" },
    include: { user: true },
  });
  if (!member) throw new ForbiddenError("Pedido não encontrado (talvez já tenha sido respondido).");
  return member;
}

export async function approveMember(patotaId: string, membershipId: string) {
  return guarded(async () => {
    const { membership: me } = await requireManager(patotaId);
    const member = await findPending(patotaId, membershipId);
    await db.membership.update({ where: { id: membershipId }, data: { status: "ACTIVE" } });
    await logActivity({
      patotaId,
      actorId: me.id,
      message: `${memberName(member)} entrou na patota`,
      href: `/patotas/${patotaId}/membros`,
    });
    refresh(patotaId);
    return { ok: true, message: `${memberName(member)} agora faz parte da patota.` };
  });
}

export async function rejectMember(patotaId: string, membershipId: string) {
  return guarded(async () => {
    await requireManager(patotaId);
    const member = await findPending(patotaId, membershipId);
    await db.membership.delete({ where: { id: membershipId } });
    refresh(patotaId);
    return { ok: true, message: `Pedido de ${memberName(member)} recusado.` };
  });
}
