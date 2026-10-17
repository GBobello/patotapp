import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components fica desligado: as telas dependem da sessão do usuário
  // e o modelo dinâmico clássico é mais simples de manter com o Auth.js.
};

export default nextConfig;
