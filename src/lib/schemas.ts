import { z } from "zod";
import { emptyToNull } from "@/lib/forms";

const patotaSchema = z.object({
  name: z.string().trim().min(3, "Dê um nome com pelo menos 3 letras.").max(60, "Use no máximo 60 caracteres."),
  description: z.string().max(300, "Use no máximo 300 caracteres.").nullable(),
  location: z.string().max(120, "Use no máximo 120 caracteres.").nullable(),
});

export function parsePatotaForm(formData: FormData) {
  return patotaSchema.safeParse({
    name: formData.get("name") ?? "",
    description: emptyToNull(formData.get("description")),
    location: emptyToNull(formData.get("location")),
  });
}
