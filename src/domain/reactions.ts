// Reações do mural (RF46). Cada emoji tem um nome para leitores de tela.

export const REACTIONS = [
  { emoji: "👍", label: "Curtir" },
  { emoji: "⚽", label: "Bora jogar" },
  { emoji: "🔥", label: "Show" },
  { emoji: "😂", label: "Engraçado" },
] as const;

export type ReactionEmoji = (typeof REACTIONS)[number]["emoji"];

export function isReaction(value: string): value is ReactionEmoji {
  return REACTIONS.some((r) => r.emoji === value);
}
