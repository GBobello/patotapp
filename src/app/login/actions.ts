"use server";

import { z } from "zod";
import { signIn } from "@/auth";
import { safeCallbackPath } from "@/lib/forms";

export type LoginState = { error?: string; email?: string };

const emailSchema = z.email();

export async function loginWithEmail(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const parsed = emailSchema.safeParse(email);

  if (!parsed.success) {
    return { email, error: "Informe um e-mail válido, por exemplo: nome@gmail.com" };
  }

  // Envia o link mágico e redireciona para /login/verificar.
  await signIn("resend", { email: parsed.data, redirectTo: safeCallbackPath(formData.get("callbackUrl")) });
  return {};
}

export async function loginWithGoogle(formData: FormData) {
  await signIn("google", { redirectTo: safeCallbackPath(formData.get("callbackUrl")) });
}
