# PatotApp

Solução colaborativa e acessível para gestão de patotas de futebol — projeto de extensão.

Confirmação de presença com lista de espera, sorteio de times balanceado por nota e posição, mensalidades e rateio com caixa da patota, mural de avisos e linha do tempo, tudo em português, instalável no celular (PWA) e seguindo WCAG 2.1 AA, Material Design 3 e as Heurísticas de Nielsen.

- Requisitos: [docs/01-requisitos.md](docs/01-requisitos.md)
- Plano de implementação: [docs/02-plano-implementacao.md](docs/02-plano-implementacao.md)
- Status e rastreabilidade: [docs/03-status-implementacao.md](docs/03-status-implementacao.md)

## Stack

Next.js 16 (App Router) · TypeScript · MUI (Material Design) · Prisma 7 + PostgreSQL · Auth.js v5 · Zod · Vitest

## Como rodar localmente

Pré-requisitos: Node.js 22+ e Docker Desktop.

```bash
npm install
cp .env.example .env        # depois gere o AUTH_SECRET com: npx auth secret
npm run db:up               # sobe o PostgreSQL na porta 5433
npm run db:migrate          # cria as tabelas
npm run db:seed             # (opcional) patota de demonstração com 15 integrantes
npm run dev                 # http://localhost:3000
```

**Login sem configurar e-mail:** se `AUTH_RESEND_KEY` estiver vazio, o link de acesso aparece no terminal do `npm run dev`. Basta copiá-lo e colá-lo no navegador.

**Demonstração:** depois do `db:seed`, entre com `organizador@patotapp.test` para ver a patota "Futebol de Quinta (demo)" com jogo, confirmados, cobrança e mural. Ótimo para as validações com a patota.

**Login com Google (opcional):** preencha `AUTH_GOOGLE_ID` e `AUTH_GOOGLE_SECRET`. O botão só aparece quando essas variáveis estão definidas.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm test` | Testes unitários (regras em `src/domain`) |
| `npm run db:up` | Sobe o PostgreSQL local (Docker) |
| `npm run db:migrate` | Aplica/cria migrations e regenera o cliente Prisma |
| `npm run db:seed` | Cria a patota de demonstração |
| `npm run db:studio` | Abre o Prisma Studio para ver os dados |

## Estrutura

```
src/
├─ app/
│  ├─ login/                 # login por link mágico / Google
│  ├─ convite/[codigo]/      # entrar numa patota pelo link
│  ├─ (app)/                 # área autenticada
│  │  ├─ page.tsx            # painel: próximos jogos e minhas patotas
│  │  ├─ perfil/             # perfil, acessibilidade, sessões, excluir conta
│  │  ├─ notificacoes/
│  │  └─ patotas/[id]/       # início, jogos, integrantes, mural, financeiro, atividades, ajustes
│  ├─ manifest.ts, icon.tsx  # PWA
│  └─ api/auth/              # rotas do Auth.js
├─ components/               # componentes de UI acessíveis
├─ domain/                   # regras de negócio puras + testes (sorteio, financeiro, presença…)
├─ server/                   # banco, sessão, permissões, atividades, notificações
├─ lib/                      # formulários e preferências
└─ theme/                    # tema Material Design 3 (claro/escuro, contraste AA)
```

As regras de negócio ficam em `src/domain`, como funções puras sem banco e sem UI. Toda server action confere no servidor se o usuário participa da patota e tem o papel necessário (`src/server/patotas.ts`).

## Decisões técnicas

- **Sessão de 30 dias (RF02):** sessão salva no banco com `maxAge` de 30 dias e renovação a cada dia de uso, em `src/auth.ts`.
- **Lista de espera sem furar fila:** as confirmações usam uma trava por jogo no PostgreSQL (`pg_advisory_xact_lock`), para que duas pessoas confirmando ao mesmo tempo não ultrapassem o limite de vagas.
- **Sorteio (`src/domain/draw.ts`):** distribui por posição, equilibra a soma das notas com busca local e escolhe ao acaso entre os melhores resultados. Testado com 150 elencos aleatórios.
- **Dinheiro em centavos:** rateio sem perder centavos (`splitCents`).
- **Notas secretas:** a nota do jogador só é enviada ao navegador de organizadores.
- **Acessibilidade:** auditada com axe-core (0 violações WCAG 2.1 AA). Inclui preferências de fonte, contraste e animação, e todas as ações funcionam por teclado.
- `cacheComponents` do Next 16 está desligado para manter o modelo de renderização dinâmica, que é mais simples com sessão.
