import type { MetadataRoute } from "next";

/** RNF17: torna o app instalável no celular (PWA). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PatotApp — organize sua patota",
    short_name: "PatotApp",
    description: "Confirmação de presença, sorteio de times e pagamentos da patota de futebol.",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#F7FBF2",
    theme_color: "#1B6B3A",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
