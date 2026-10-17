import type { ZodError } from "zod";

/** Resultado padrão das server actions de formulário. */
export type ActionResult = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Valores enviados, devolvidos em caso de erro para o formulário não perder o que foi digitado. */
  values?: Record<string, string>;
};

/** Copia os campos de texto do formulário (ignora arquivos). */
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData) if (typeof value === "string" && !key.startsWith("$")) values[key] = value;
  return values;
}

/** Converte os erros do Zod em { campo: primeira mensagem }. */
export function fieldErrorsFrom(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return fieldErrors;
}

/** Texto opcional: string vazia vira null. */
export function emptyToNull(value: FormDataEntryValue | null): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

/** Só aceita caminhos internos (evita redirecionar para outro site). */
export function safeCallbackPath(value: unknown, fallback = "/"): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
