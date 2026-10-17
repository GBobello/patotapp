"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { POSITIONS, normalizeSecondaryPositions } from "@/domain/positions";
import type { ActionResult } from "@/lib/forms";
import { db } from "@/server/db";
import { requireUser } from "@/server/session";

export type ProfileState = {
  ok?: boolean;
  fieldErrors?: Partial<Record<"name" | "nickname" | "phone" | "primaryPosition", string>>;
};

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((v) => v || null);

const profileSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome (mínimo 2 letras).").max(80, "Use no máximo 80 caracteres."),
  nickname: optionalText(30, "Use no máximo 30 caracteres."),
  phone: optionalText(20, "Telefone muito longo.").refine(
    (v) => v === null || /^[0-9()+\-\s]{8,20}$/.test(v),
    "Use só números, por exemplo: (47) 99999-9999.",
  ),
  primaryPosition: z.enum(POSITIONS, "Escolha sua posição principal."),
  secondaryPositions: z.array(z.enum(POSITIONS)),
});

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await requireUser();

  const parsed = profileSchema.safeParse({
    name: formData.get("name") ?? "",
    nickname: formData.get("nickname") ?? "",
    phone: formData.get("phone") ?? "",
    primaryPosition: formData.get("primaryPosition") || undefined,
    secondaryPositions: formData.getAll("secondaryPositions"),
  });

  if (!parsed.success) {
    const fieldErrors: ProfileState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof NonNullable<ProfileState["fieldErrors"]>;
      fieldErrors[field] ??= issue.message;
    }
    return { fieldErrors };
  }

  const { secondaryPositions, ...data } = parsed.data;
  await db.user.update({
    where: { id: user.id },
    data: {
      ...data,
      secondaryPositions: normalizeSecondaryPositions(data.primaryPosition, secondaryPositions),
    },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * RF05 (LGPD): exclui a conta e os dados pessoais.
 * Patotas em que a pessoa é a única integrante são apagadas junto; se ela for a última
 * organizadora de uma patota com outras pessoas, precisa passar o papel antes (RN02).
 */
export async function deleteAccount(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (String(formData.get("confirm") ?? "").trim().toUpperCase() !== "EXCLUIR") {
    return { fieldErrors: { confirm: 'Digite EXCLUIR para confirmar.' } };
  }

  const organizing = await db.membership.findMany({
    where: { userId: user.id, role: "ORGANIZER" },
    include: { patota: { include: { memberships: { where: { status: "ACTIVE" }, select: { role: true } } } } },
  });
  const blocking = organizing.filter(
    (m) => m.patota.memberships.length > 1 && m.patota.memberships.filter((x) => x.role === "ORGANIZER").length === 1,
  );
  if (blocking.length) {
    return {
      error: `Antes de excluir, promova outro organizador em: ${blocking.map((m) => m.patota.name).join(", ")}.`,
    };
  }

  const alone = organizing.filter((m) => m.patota.memberships.length === 1).map((m) => m.patotaId);
  await db.$transaction([
    db.patota.deleteMany({ where: { id: { in: alone } } }),
    db.user.delete({ where: { id: user.id } }),
  ]);

  redirect("/login?conta=excluida");
}
