"use server";

import { z } from "zod";
import { signIn } from "@/auth";

export type LoginState = { error?: string; email?: string };

const emailSchema = z.email();

export async function loginWithEmail(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const parsed = emailSchema.safeParse(email);

  if (!parsed.success) {
    return { email, error: "Informe um e-mail válido, por exemplo: nome@gmail.com" };
  }

  // Envia o link mágico e redireciona para /login/verificar.
  await signIn("resend", { email: parsed.data, redirectTo: "/" });
  return {};
}

export async function loginWithGoogle() {
  await signIn("google", { redirectTo: "/" });
}
