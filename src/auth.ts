import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/server/db";
import { sendMagicLink } from "@/server/email";

const DAY = 24 * 60 * 60;

const providers: Provider[] = [
  // Link mágico por e-mail: o usuário não precisa criar senha (RF01).
  Resend({
    apiKey: process.env.AUTH_RESEND_KEY,
    from: process.env.EMAIL_FROM,
    maxAge: DAY,
    sendVerificationRequest: ({ identifier, url }) => sendMagicLink(identifier, url),
  }),
];

// O login com Google só aparece quando as credenciais estão configuradas.
export const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
if (googleEnabled) providers.push(Google);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers,
  // RF02: sessão de 30 dias, renovada a cada dia de uso (sessão deslizante).
  // Quem abre o app pelo menos uma vez a cada 30 dias nunca precisa logar de novo.
  session: {
    strategy: "database",
    maxAge: 30 * DAY,
    updateAge: DAY,
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verificar",
    error: "/login",
  },
  trustHost: true,
});
