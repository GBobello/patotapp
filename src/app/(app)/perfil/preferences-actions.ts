"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { FONT_SCALES, PREF_COOKIES } from "@/lib/preferences";

const schema = z.discriminatedUnion("name", [
  z.object({ name: z.literal("fontScale"), value: z.enum(FONT_SCALES) }),
  z.object({ name: z.literal("highContrast"), value: z.boolean() }),
  z.object({ name: z.literal("reduceMotion"), value: z.boolean() }),
]);

/** RF06: salva uma preferência de acessibilidade neste aparelho por 1 ano. */
export async function savePreference(input: { name: string; value: string | boolean }) {
  const pref = schema.parse(input);
  const jar = await cookies();
  const options = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" as const };

  if (pref.name === "fontScale") jar.set(PREF_COOKIES.fontScale, pref.value, options);
  if (pref.name === "highContrast") jar.set(PREF_COOKIES.highContrast, pref.value ? "high" : "normal", options);
  if (pref.name === "reduceMotion") jar.set(PREF_COOKIES.reduceMotion, pref.value ? "reduce" : "normal", options);

  revalidatePath("/", "layout");
}
