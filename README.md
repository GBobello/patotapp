# PatotApp

Solução colaborativa e acessível para gestão de patotas de futebol. Projeto de extensão.

- Requisitos: [docs/01-requisitos.md](docs/01-requisitos.md)
- Plano de implementação: [docs/02-plano-implementacao.md](docs/02-plano-implementacao.md)

## Stack

Next.js 16 (App Router) · TypeScript · MUI (Material Design) · Prisma 7 + PostgreSQL · Auth.js v5 · Zod · Vitest

## Como rodar localmente

Pré-requisitos: Node.js 22+ e Docker Desktop.

```bash
npm install
cp .env.example .env        # depois gere o AUTH_SECRET com: npx auth secret
npm run db:up               # sobe o PostgreSQL na porta 5433
npm run db:migrate          # cria as tabelas
npm run dev                 # http://localhost:3000
```

**Login sem configurar e-mail:** se `AUTH_RESEND_KEY` estiver vazio, o link de acesso aparece no terminal do `npm run dev`. Basta copiá-lo e colá-lo no navegador.

**Login com Google (opcional):** preencha `AUTH_GOOGLE_ID` e `AUTH_GOOGLE_SECRET`. O botão só aparece quando essas variáveis estão definidas.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm test` | Testes unitários (regras em `src/domain`) |
| `npm run db:up` | Sobe o PostgreSQL local (Docker) |
| `npm run db:migrate` | Aplica/cria migrations do Prisma |
| `npm run db:studio` | Abre o Prisma Studio para ver os dados |

## Estrutura

```
src/
├─ app/
│  ├─ login/            # login por link mágico / Google
│  ├─ (app)/            # área autenticada: painel e perfil
│  └─ api/auth/         # rotas do Auth.js
├─ components/          # componentes de UI reutilizáveis
├─ domain/              # regras de negócio puras + testes (sorteio, financeiro…)
├─ server/              # banco (db.ts), sessão (session.ts), e-mail
├─ theme/               # tema Material Design 3 (claro/escuro, contraste AA)
└─ auth.ts              # configuração do Auth.js (sessão de 30 dias)
```

## Decisões do ciclo 1

- **Sessão de 30 dias (RF02):** sessão salva no banco com `maxAge` de 30 dias e renovação a cada dia de uso, em `src/auth.ts`.
- **Login sem senha (RF01):** link mágico por e-mail (Resend) e Google opcional.
- **Toda página protegida chama `requireUser()`** (`src/server/session.ts`), que redireciona para `/login` se não houver sessão.
- **Acessibilidade:** `lang="pt-BR"`, link "Pular para o conteúdo", foco visível, alvos de toque de 48px, mensagens de erro ligadas aos campos e anunciadas, `prefers-reduced-motion` e tema claro/escuro automático.
- `cacheComponents` do Next 16 está desligado para manter o modelo de renderização dinâmica, que é mais simples com sessão.
