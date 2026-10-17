import "server-only";
import type { ActionResult } from "@/lib/forms";
import { ForbiddenError } from "@/server/patotas";

/** Converte erros de permissão em mensagem amigável; outros erros (inclusive redirect) seguem adiante. */
export async function guarded(fn: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: e.message };
    throw e;
  }
}
