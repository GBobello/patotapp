"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { memberName } from "@/domain/members";
import { isReaction } from "@/domain/reactions";
import { type ActionResult, fieldErrorsFrom, formValues } from "@/lib/forms";
import { logActivity } from "@/server/activity";
import { db } from "@/server/db";
import { guarded } from "@/server/guard";
import { ForbiddenError, requireManager, requireMember } from "@/server/patotas";

const textSchema = z.object({
  text: z.string().trim().min(2, "Escreva o aviso.").max(1000, "Use no máximo 1000 caracteres."),
});

/** RF46: organizador publica um aviso no mural. */
export async function postAnnouncement(patotaId: string, _prev: ActionResult, formData: FormData) {
  return guarded(async () => {
    const { membership, user } = await requireManager(patotaId);
    const parsed = textSchema.safeParse({ text: formData.get("text") ?? "" });
    if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values: formValues(formData) };

    await db.announcement.create({ data: { patotaId, authorId: membership.id, text: parsed.data.text } });
    await logActivity({
      patotaId,
      actorId: membership.id,
      message: `${memberName({ ...membership, user })} publicou um aviso no mural`,
      href: `/patotas/${patotaId}/mural`,
    });
    revalidatePath(`/patotas/${patotaId}`, "layout");
    return { ok: true, message: "Aviso publicado." };
  });
}

async function loadAnnouncement(id: string) {
  const announcement = await db.announcement.findUnique({ where: { id } });
  if (!announcement) throw new ForbiddenError("Aviso não encontrado.");
  return announcement;
}

export async function togglePin(id: string) {
  return guarded(async () => {
    const a = await loadAnnouncement(id);
    await requireManager(a.patotaId);
    await db.announcement.update({ where: { id }, data: { pinned: !a.pinned } });
    revalidatePath(`/patotas/${a.patotaId}/mural`);
    return { ok: true, message: a.pinned ? "Aviso desafixado." : "Aviso fixado no topo." };
  });
}

export async function deleteAnnouncement(id: string) {
  return guarded(async () => {
    const a = await loadAnnouncement(id);
    await requireManager(a.patotaId);
    await db.announcement.delete({ where: { id } });
    revalidatePath(`/patotas/${a.patotaId}/mural`);
    return { ok: true, message: "Aviso excluído." };
  });
}

/** Membros reagem aos avisos (marca/desmarca). */
export async function toggleReaction(id: string, emoji: string) {
  return guarded(async () => {
    if (!isReaction(emoji)) return { error: "Reação inválida." };
    const a = await loadAnnouncement(id);
    const { membership } = await requireMember(a.patotaId);

    const key = { announcementId: id, membershipId: membership.id, emoji };
    const existing = await db.announcementReaction.findUnique({
      where: { announcementId_membershipId_emoji: key },
    });
    if (existing) await db.announcementReaction.delete({ where: { announcementId_membershipId_emoji: key } });
    else await db.announcementReaction.create({ data: key });

    revalidatePath(`/patotas/${a.patotaId}/mural`);
    return {};
  });
}
