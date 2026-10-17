// Confirmação de presença e lista de espera (RF18–RF22, RN03).

export const ATTENDANCE_STATUSES = ["CONFIRMED", "MAYBE", "DECLINED", "WAITLIST"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

/** O que o jogador pode escolher; a lista de espera é decidida pelo sistema. */
export const RESPONSES = ["CONFIRMED", "MAYBE", "DECLINED"] as const;
export type Response = (typeof RESPONSES)[number];

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  CONFIRMED: "Confirmado",
  MAYBE: "Talvez",
  DECLINED: "Não vai",
  WAITLIST: "Lista de espera",
};

/** Verifica se ainda dá para responder (RN03). Retorna mensagem de erro ou null. */
export function checkCanRespond(game: {
  status: "SCHEDULED" | "CANCELLED";
  startsAt: Date;
  confirmationDeadline: Date;
  now?: Date;
  isManager: boolean;
}): string | null {
  const now = game.now ?? new Date();
  if (game.status === "CANCELLED") return "Este jogo foi cancelado.";
  if (game.startsAt <= now && !game.isManager) return "Este jogo já começou.";
  if (game.confirmationDeadline <= now && !game.isManager) {
    return "O prazo de confirmação acabou. Fale com o organizador.";
  }
  return null;
}

/**
 * Status gravado quando alguém responde. Quem quer jogar entra no fim da fila (WAITLIST)
 * e `promotions` decide se já existe vaga — assim a ordem de chegada é sempre respeitada.
 */
export function initialStatus(wanted: Response, current: AttendanceStatus | null): AttendanceStatus {
  if (wanted !== "CONFIRMED") return wanted;
  return current === "CONFIRMED" ? "CONFIRMED" : "WAITLIST";
}

export type WaitlistEntry = { membershipId: string; isMensalista: boolean; since: Date };

/**
 * Quem sai da lista de espera para os confirmados (RF20, RF19).
 * Ordem de chegada; diaristas só entram quando `diaristasAllowed` (prioridade dos mensalistas).
 */
export function promotions(input: {
  maxPlayers: number;
  confirmedCount: number;
  waitlist: WaitlistEntry[];
  diaristasAllowed: boolean;
}): string[] {
  const free = input.maxPlayers - input.confirmedCount;
  if (free <= 0) return [];

  return input.waitlist
    .filter((w) => w.isMensalista || input.diaristasAllowed)
    .sort((a, b) => a.since.getTime() - b.since.getTime())
    .slice(0, free)
    .map((w) => w.membershipId);
}
