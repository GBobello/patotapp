# PatotApp — Plano de Implementação

Este plano conecta os requisitos de [01-requisitos.md](01-requisitos.md) às etapas do projeto de extensão. As etapas 12 a 27 têm **8 ciclos de implementação de 8 h**, cada um seguido de uma **validação presencial de 8 h**. Como são só ~64 h de código, o escopo de cada ciclo é pequeno e entrega algo que a patota consegue usar e avaliar.

---

## 1. Stack recomendada

| Camada | Tecnologia | Por quê |
|---|---|---|
| Front + back | **Next.js 15 (App Router) + TypeScript** | Um único projeto para front e API, deploy gratuito, PWA possível. |
| UI | **MUI (Material UI) v6** com tema baseado nos tokens do Material Design 3 | Componentes Material prontos e já acessíveis (ARIA, foco, teclado). |
| Banco | **PostgreSQL** (Neon ou Supabase, plano gratuito) + **Prisma ORM** | Relacional (o domínio tem muitas relações), migrations versionadas. |
| Autenticação | **Auth.js (NextAuth v5)**: Google + link mágico por e-mail (Resend, plano gratuito) | Sem senha = login simples. Sessão no banco com `maxAge` de 30 dias e renovação a cada uso. |
| Validação | **Zod** | O mesmo schema valida o formulário e a API. |
| Notificações | **Web Push** (PWA) + e-mail | Gratuito; funciona com o app instalado. |
| Testes | **Vitest** (regras de negócio), **Playwright + axe-core** (fluxos e acessibilidade automática) | O sorteio e o financeiro precisam de testes; o axe verifica WCAG a cada build. |
| Hospedagem | **Vercel** (app) + Neon/Supabase (banco) | Custo zero, HTTPS automático. |

> **Alternativa:** se você tiver mais familiaridade com mobile, **Flutter** implementa o Material 3 de forma nativa (com Supabase como back-end). A troca afeta só a camada de UI deste plano. Como o projeto exige WCAG, que é uma norma para web, a recomendação é a opção web.

### Configuração da sessão de 30 dias (RF02)
```ts
// auth.ts
session: {
  strategy: "database",
  maxAge: 30 * 24 * 60 * 60, // 30 dias
  updateAge: 24 * 60 * 60,   // renova a validade 1x por dia de uso
}
```
Quem usa o app pelo menos uma vez a cada 30 dias não precisa logar de novo.

---

## 2. Modelo de dados (resumo)

```
User ─┬─< Membership >─┬─ Patota ─┬─< Game ─┬─< Attendance (status: CONFIRMED|DECLINED|MAYBE|WAITLIST)
      │  (role, type,   │          │          ├─< TeamDraw ─< DrawTeam ─< DrawTeamPlayer
      │   rating 1–5,   │          │          └─< GameComment
      │   positions)    │          ├─< RecurringSchedule
      │                 │          ├─< Expense (único|recorrente)
      │                 │          ├─< Charge (membro, competência, valor_centavos, status)
      │                 │          ├─< Announcement ─< Reaction
      │                 │          ├─< Invite (código, expiração)
      │                 │          └─< ActivityLog
      └─< PushSubscription
Guest (convidado sem conta) ─ pertence a Patota
```

Pontos principais:
- **`Membership`** guarda o papel (ORGANIZER/CO_ORGANIZER/PLAYER), o tipo (MENSALISTA/DIARISTA), a **nota** e as posições, porque tudo isso é **por patota** (RF26).
- **`Patota.billingMode`**: `FIXED_MONTHLY | SPLIT_PER_GAME | MIXED`, além de `monthlyFeeCents`, `dropInFeeCents` e `pixKey`.
- Valores sempre em **centavos (Int)** (RNF24).

---

## 3. Algoritmo de sorteio (RF29–RF33, RN04–RN07)

Os testes unitários desta parte devem estar prontos **antes** da interface.

1. **Entrada:** confirmados `{id, nota, posPrincipal, posSecundárias}`, `nTimes` e regras opcionais (juntos/separados).
2. **Goleiros:** distribui um goleiro por time, do maior para o menor nota. Os goleiros que sobrarem só entram como 2º goleiro se `goleiros > times`; caso contrário, entram como jogadores de linha. Se faltarem goleiros, o sistema avisa (RN05).
3. **Linha, por posição** (ZAG → LAT → MEI → ATA): ordena os jogadores por nota com desempate aleatório e distribui em **"cobra"** (1-2-3-3-2-1…), sempre começando pelo time com menor soma. Assim a diferença por posição fica ≤ 1 (RN06).
4. **Refinamento:** testa trocas de **jogadores da mesma posição** entre times e aplica a troca se ela reduzir `max(soma) − min(soma)`. Repete até não haver melhora (busca local, poucas iterações).
5. **Aleatoriedade:** executa os passos 2–4 cerca de 50 vezes com embaralhamentos diferentes e sorteia entre as soluções com o menor desequilíbrio. Assim os times variam de uma semana para outra e continuam justos (RN07).
6. **Saída:** times, soma/média de cada um e o índice de equilíbrio (RF34).

Casos de teste obrigatórios: 2 times com 2 goleiros (1 por time); 2 times com 3 goleiros (um time pode ter 2); 2 times com 1 goleiro; 3 times; jogadores sem posição; regras de juntos/separados conflitantes; nº ímpar de jogadores.

---

## 4. Estrutura do repositório

```
patotapp/
├─ docs/                    # requisitos, plano, personas, UML, evidências
├─ prisma/schema.prisma
├─ src/
│  ├─ app/                  # rotas (App Router)
│  │  ├─ (auth)/login
│  │  ├─ patotas/[id]/      # painel, jogos, membros, financeiro, mural
│  │  └─ api/
│  ├─ components/           # componentes de UI acessíveis
│  ├─ domain/               # regras puras e testáveis: draw.ts, billing.ts, waitlist.ts
│  ├─ server/               # acesso a dados + checagem de permissão
│  └─ theme/                # tema Material 3 (cores, tipografia, alto contraste)
└─ tests/ (unit + e2e)
```

As regras de negócio ficam em `src/domain`, como funções puras sem banco e sem UI. Isso facilita os testes e a explicação no paper.

---

## 5. Cronograma por ciclo (etapas 12–27)

Cada ciclo = **implementação (8 h)** + **validação presencial (8 h)** com fotos/vídeos como evidência. Em toda validação, aplique o checklist das Heurísticas de Nielsen e um teste rápido de acessibilidade (teclado + leitor de tela no celular).

| Ciclo | Etapas | Entregas (implementação) | O que validar com a patota |
|---|---|---|---|
| **1 – Fundação e login** | 12 / 13 | Setup Next.js + MUI + Prisma + deploy na Vercel; tema M3 claro/escuro; login Google + link mágico; sessão de 30 dias; perfil com posições (RF01–RF04, RF25). CI com lint + axe. | Todos conseguem entrar? O login é simples? Instalar o PWA no celular. |
| **2 – Patotas e integrantes** | 14 / 15 | Criar patota; troca entre várias patotas; convite por link; papéis; mensalista/diarista; sair/remover (RF07–RF12, RF14). | O organizador cria a patota real e convida o grupo pelo WhatsApp. |
| **3 – Jogos e confirmação** | 16 / 17 | Jogo recorrente/avulso; vagas e prazo; confirmar/recusar/talvez; painel do próximo jogo; compartilhar lista no WhatsApp (RF16–RF18, RF21–RF24, RF50). | **Uso real** num jogo da semana: confirmar em até 2 toques. |
| **4 – Lista de espera e qualidade** | 18 / 19 | Prioridade de mensalistas; lista de espera com promoção; convidados sem conta; notas 1–5 por patota, visíveis só para organizadores (RF13, RF19, RF20, RF26, RF27). | O organizador atribui notas; validar se a escala 1–5 faz sentido. |
| **5 – Sorteio de times** | 20 / 21 | `domain/draw.ts` + testes; tela de sorteio com indicador de equilíbrio; novo sorteio; ajuste manual (arrastar e botões "mover para", para acessibilidade); publicar e compartilhar (RF29–RF32, RF34, RF35). | Sortear **no dia do jogo** e coletar a percepção de justiça dos times. |
| **6 – Financeiro** | 22 / 23 | Modelo de cobrança (fixo/rateio/misto); despesas; geração de cobranças; mensalidade sugerida; "já paguei" + confirmação; PIX copiável; saldo e inadimplentes (RF37–RF43). | Comparar com a planilha/caderno atual do organizador. |
| **7 – Comunicação e percepção** | 24 / 25 | Mural de avisos com reações; comentários no jogo; linha do tempo de atividades; notificações push/e-mail (lembrete de confirmação, times sorteados, cobrança) (RF46–RF49). | As notificações ajudam ou incomodam? Ajustar a frequência. |
| **8 – Acessibilidade, polimento e extras** | 26 / 27 | Preferências de acessibilidade (alto contraste, fonte, menos animação); revisão WCAG completa; estados vazios e de erro; exclusão de conta (LGPD); itens **C** que couberem (tarefas do jogo, placar, regras juntos/separados) (RF05, RF06, RF33, RF51, RF52). | Teste com integrante que use leitor de tela/zoom (se houver); preparar a verificação final. |

Etapas **28–29 (verificação e validação):** aplicar o questionário **SUS** (meta ≥ 70), roteiro de tarefas cronometradas (confirmar presença, sortear, registrar pagamento), checklists do Sapo UX e auditoria Lighthouse/axe. Registrar e corrigir os problemas encontrados.

### Antes da implementação (etapas 7–11)
- **Baixa fidelidade (etapa 7):** wireframes de painel, jogo/confirmação, sorteio, financeiro e membros.
- **Alta fidelidade (etapas 8–9):** Figma com o **Material 3 Design Kit** oficial e o plugin **Stark** ou **A11y – Color Contrast Checker**. As 5 validações (a cada 20%) podem seguir a ordem dos fluxos acima.
- **UML (etapa 11):** casos de uso (atores da seção 2 dos requisitos), diagrama de atividades do **sorteio** e da **confirmação com lista de espera**, diagrama de classes (modelo da seção 2 deste plano) e diagrama de sequência do pagamento.

---

## 6. Definição de pronto (por funcionalidade)

- [ ] Funciona no celular (360 px) e no desktop.
- [ ] Navegável só com teclado; foco visível.
- [ ] Sem violações no axe; contraste conferido.
- [ ] Estados de carregando, vazio e erro tratados com mensagens claras.
- [ ] Permissões checadas no servidor (não só escondidas na UI).
- [ ] Regras de negócio com testes unitários (quando aplicável).
- [ ] Deploy feito e evidência (print/vídeo) registrada em `docs/evidencias/`.

---

## 7. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| 8 h por ciclo é pouco tempo | Priorizar os itens **M**; itens **C** só no ciclo 8. Manter as regras de negócio em funções puras e simples. |
| Integrantes sem e-mail/Google | Convidado sem conta (RF13); o organizador confirma por eles. |
| Notas geram atrito no grupo | Notas privadas por padrão (RF27). |
| Planos gratuitos com limites | O volume de uma patota é pequeno; monitorar o uso do Neon/Vercel. |
| Baixa adesão (o grupo continua só no WhatsApp) | Compartilhamento formatado para o WhatsApp (RF24/RF35) e link de convite: o app complementa o WhatsApp, não o substitui. |

---

## 8. Próximos passos imediatos

1. Validar a seção 6 do documento de requisitos com a patota (etapas 5–6).
2. Criar as personas (etapa 4), incluindo pelo menos uma com necessidade de acessibilidade.
3. Fazer os wireframes de baixa fidelidade dos 5 fluxos principais.
4. Em paralelo, preparar o esqueleto técnico (ciclo 1) para não gastar as horas de implementação com setup.
