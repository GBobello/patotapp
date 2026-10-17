// Preferências de acessibilidade (RF06), guardadas em cookies para valerem desde o primeiro
// carregamento da página (sem "piscar"). O tema claro/escuro fica a cargo do MUI.

export const FONT_SCALES = ["100", "115", "130"] as const;
export type FontScale = (typeof FONT_SCALES)[number];

export const FONT_SCALE_LABELS: Record<FontScale, string> = {
  "100": "Normal",
  "115": "Grande",
  "130": "Muito grande",
};

export const PREF_COOKIES = {
  fontScale: "patotapp-font",
  highContrast: "patotapp-contrast",
  reduceMotion: "patotapp-motion",
} as const;

export type Preferences = { fontScale: FontScale; highContrast: boolean; reduceMotion: boolean };

export function readPreferences(get: (name: string) => string | undefined): Preferences {
  const font = get(PREF_COOKIES.fontScale);
  return {
    fontScale: (FONT_SCALES as readonly string[]).includes(font ?? "") ? (font as FontScale) : "100",
    highContrast: get(PREF_COOKIES.highContrast) === "high",
    reduceMotion: get(PREF_COOKIES.reduceMotion) === "reduce",
  };
}
