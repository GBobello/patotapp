"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { MEMBER_TYPES, ROLES, checkOrganizerRemains, generateInviteCode } from "@/domain/roles";
import { type ActionResult, fieldErrorsFrom, formValues } from "@/lib/forms";
import { parsePatotaForm } from "@/lib/schemas";
import { db } from "@/server/db";
import { guarded } from "@/server/guard";
import { ForbiddenError, requireManager, requireMember, requireOrganizer } from "@/server/patotas";

function refresh(patotaId: string) {
  revalidatePath(`/patotas/${patotaId}`, "layout");
  revalidatePath("/");
}

async function organizerCount(patotaId: string) {
  return db.membership.count({ where: { patotaId, role: "ORGANIZER" } });
}

/** Busca um integrante garantindo que ele pertence à patota informada. */
async function findMember(patotaId: string, membershipId: string) {
  const member = await db.membership.findFirst({ where: { id: membershipId, patotaId } });
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
