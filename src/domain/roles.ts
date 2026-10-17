// Papéis e tipos de integrante (RF11, RF12) e regras sobre eles (RN02).

export const ROLES = ["ORGANIZER", "CO_ORGANIZER", "PLAYER"] as const;
export type Role = (typeof ROLES)[number];

export const MEMBER_TYPES = ["MENSALISTA", "DIARISTA"] as const;
export type MemberType = (typeof MEMBER_TYPES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  ORGANIZER: "Organizador",
  CO_ORGANIZER: "Co-organizador",
  PLAYER: "Jogador",
};

export const MEMBER_TYPE_LABELS: Record<MemberType, string> = {
  MENSALISTA: "Mensalista",
  DIARISTA: "Diarista",
};

/** Organizadores e co-organizadores administram o dia a dia da patota. */
export function canManage(role: Role) {
  return role === "ORGANIZER" || role === "CO_ORGANIZER";
}

/** Só o organizador mexe em papéis, configurações sensíveis e pode excluir a patota. */
export function isOrganizer(role: Role) {
  return role === "ORGANIZER";
}

/**
 * RN02: toda patota precisa de pelo menos um organizador.
 * Retorna uma mensagem de erro se a mudança deixaria a patota sem organizador.
 */
export function checkOrganizerRemains(
  currentRole: Role,
  newRole: Role | null, // null = sair/remover
  organizerCount: number,
): string | null {
  if (currentRole === "ORGANIZER" && newRole !== "ORGANIZER" && organizerCount <= 1) {
    return "A patota precisa de pelo menos um organizador. Promova outra pessoa antes.";
  }
  return null;
}

// Sem caracteres ambíguos (0/O, 1/I/L) para facilitar ditar o código.
const INVITE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateInviteCode(length = 8, random: (n: number) => Uint8Array = randomBytes) {
  const bytes = random(length);
  return Array.from(bytes, (b) => INVITE_ALPHABET[b % INVITE_ALPHABET.length]).join("");
}

function randomBytes(n: number) {
  return crypto.getRandomValues(new Uint8Array(n));
}

/** Aceita o código puro ou o link inteiro colado do WhatsApp. */
export function extractInviteCode(input: string): string | null {
  const match = input.trim().toUpperCase().match(/([A-Z0-9]{6,12})\/?$/);
  return match ? match[1] : null;
}
