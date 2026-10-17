# PatotApp — Especificação e Análise (UML)

Diagramas da etapa 11 do projeto de extensão, feitos a partir do código implementado (`prisma/schema.prisma`, `src/domain/*` e as server actions em `src/app/(app)/**/actions.ts`). Os códigos RF/RN/RNF remetem a [01-requisitos.md](01-requisitos.md).

Os diagramas estão em [Mermaid](https://mermaid.js.org/) e aparecem desenhados no GitHub. Para exportar como imagem para o relatório, cole o código em https://mermaid.live.

---

## 1. Diagrama de casos de uso

O Mermaid não tem diagrama de casos de uso nativo. Por isso, ele foi desenhado como fluxograma: atores à esquerda e casos de uso em elipses. A herança entre atores mostra que o **Co-organizador** faz tudo o que o **Jogador** faz e mais a gestão do dia a dia, e que o **Organizador** soma a isso as ações sensíveis.

```mermaid
flowchart LR
  V([Visitante]):::ator
  J([Jogador]):::ator
  C([Co-organizador]):::ator
  O([Organizador]):::ator
  C -. herda .-> J
  O -. herda .-> C

  subgraph Sistema[PatotApp]
    UC1((Entrar com link mágico ou Google))
    UC2((Entrar na patota pelo convite))
    UC3((Confirmar / talvez / não vou))
    UC4((Ver times publicados))
    UC5((Avisar pagamento - Já paguei))
    UC6((Comentar no jogo e reagir no mural))
    UC7((Ver estatísticas e atividades))
    UC8((Editar perfil e acessibilidade))
    UC9((Criar e editar jogo))
    UC10((Sortear e ajustar times))
    UC11((Registrar resultado e presença))
    UC12((Confirmar pagamentos e gerar cobranças))
    UC13((Publicar aviso no mural))
    UC14((Aprovar pedidos de entrada))
    UC15((Definir notas dos jogadores))
    UC16((Mudar papéis))
    UC17((Excluir patota))
  end

  V --> UC1
  V --> UC2
  J --> UC3 & UC4 & UC5 & UC6 & UC7 & UC8
  C --> UC9 & UC10 & UC11 & UC12 & UC13 & UC14 & UC15
  O --> UC16 & UC17

  classDef ator fill:#1B6B3A,color:#fff,stroke:#0B4D24
```

| Caso de uso | Requisitos |
|---|---|
| Entrar com link mágico ou Google | RF01, RF02 |
| Entrar na patota pelo convite / aprovar pedidos | RF09, RF10 |
| Confirmar presença | RF18, RF19, RF20 |
| Sortear e ajustar times / ver times | RF29–RF35 |
| Registrar resultado / estatísticas | RF52, RF53 |
| Pagamentos e cobranças | RF37–RF45 |
| Mural, comentários, atividades | RF46–RF49 |
| Notas dos jogadores | RF26, RF27 |
| Papéis e exclusão | RF11, RN02 |

---

## 2. Diagrama de classes (modelo de dados)

Mostra as entidades persistidas. Os modelos internos do Auth.js (`Account`, `Session`, `VerificationToken`) foram omitidos. O papel, o tipo, a nota e a situação de cada pessoa ficam em **Membership**, porque são *por patota* (RF26). Um convidado sem conta é um `Membership` sem `User` (RF13).

```mermaid
classDiagram
  direction LR

  class User {
    id
    email
    name
    nickname
    phone
    primaryPosition: Position
    secondaryPositions: Position[]
    notificationsSeenAt
  }

  class Patota {
    id
    name
    location
    inviteCode
    defaultWeekday
    defaultTime
    defaultMaxPlayers
    defaultTeamsCount
    defaultDeadlineHours
    diaristaWindowHours
    requireApproval: bool
    autoCreateGames: bool
    billingMode: BillingMode
    monthlyFeeCents
    dropInFeeCents
    gameCostCents
    monthlyCostCents
    pixKey
    keeperExempt: bool
  }

  class Membership {
    id
    role: Role
    type: MemberType
    status: MembershipStatus
    rating: 1..5
    guestName
    guestPosition
  }

  class Game {
    id
    startsAt
    location
    maxPlayers
    teamsCount
    confirmationDeadline
    diaristasOpenAt
    status: GameStatus
    draw: Json
    drawPublishedAt
    teamScores: Int[]
    resultSavedAt
  }

  class Attendance {
    status: AttendanceStatus
    statusChangedAt
    attended: bool?
    goals
  }

  class Charge {
    description
    amountCents
    competence
    status: ChargeStatus
    paidAt
  }

  class Expense {
    description
    amountCents
    date
  }

  class Announcement {
    text
    pinned
  }
  class AnnouncementReaction {
    emoji
  }
  class GameComment {
    text
  }
  class Activity {
    message
    href
    audience: Audience
  }

  User "1" --> "0..*" Membership
  Patota "1" *-- "0..*" Membership
  Patota "1" *-- "0..*" Game
  Game "1" *-- "0..*" Attendance
  Membership "1" --> "0..*" Attendance
  Patota "1" *-- "0..*" Charge
  Membership "1" --> "0..*" Charge
  Game "0..1" --> "0..*" Charge
  Patota "1" *-- "0..*" Expense
  Patota "1" *-- "0..*" Announcement
  Announcement "1" *-- "0..*" AnnouncementReaction
  Game "1" *-- "0..*" GameComment
  Patota "1" *-- "0..*" Activity
```

Enumerações: `Position` (GOL, ZAG, LAT, MEI, ATA) · `Role` (ORGANIZER, CO_ORGANIZER, PLAYER) · `MemberType` (MENSALISTA, DIARISTA) · `MembershipStatus` (ACTIVE, PENDING) · `AttendanceStatus` (CONFIRMED, MAYBE, DECLINED, WAITLIST) · `GameStatus` (SCHEDULED, CANCELLED) · `BillingMode` (FIXED_MONTHLY, SPLIT_PER_GAME) · `ChargeStatus` (PENDING, REPORTED, PAID, WAIVED) · `Audience` (ALL, MANAGERS).

Valores em dinheiro são inteiros em centavos (RNF24).

---

## 3. Diagrama de atividades — confirmação de presença com lista de espera

Implementado em `respond()` (`src/app/(app)/patotas/[id]/jogos/actions.ts`) e `fillSpots()` (`src/server/games.ts`), com as regras puras em `src/domain/attendance.ts`. Toda a parte entre a trava e a promoção roda numa **transação com trava por jogo** (`pg_advisory_xact_lock`). Assim, duas confirmações simultâneas não ultrapassam o limite de vagas (RF20).

```mermaid
flowchart TD
  A([Jogador toca em Vou / Talvez / Não vou]) --> B{Jogo cancelado?}
  B -- sim --> X1[/Erro: jogo cancelado/]
  B -- não --> C{Prazo encerrado<br/>e não é organizador?}
  C -- sim --> X2[/Erro: prazo acabou - RN03/]
  C -- não --> L[Trava o jogo no banco]
  L --> D{Resposta}
  D -- Talvez / Não vou --> E[Grava MAYBE / DECLINED]
  D -- Vou --> F{Já estava confirmado?}
  F -- sim --> G[Mantém CONFIRMED]
  F -- não --> H[Grava WAITLIST<br/>no fim da fila]
  E --> P
  G --> P
  H --> P
  P[Calcula vagas livres<br/>= máximo - confirmados] --> Q{Há vagas e alguém<br/>na lista de espera?}
  Q -- não --> R
  Q -- sim --> S{Diaristas já liberados?<br/>RF19}
  S -- sim --> T[Promove por ordem de chegada]
  S -- não --> U[Promove só mensalistas<br/>por ordem de chegada]
  T --> V[Registra atividade<br/>e notifica o promovido]
  U --> V
  V --> R[Libera a trava]
  R --> W([Mostra a situação ao jogador:<br/>confirmado / espera / talvez / não vai])
```

Requisitos: RF18, RF19, RF20, RF22, RN03.

---

## 4. Diagrama de atividades — sorteio de times

Implementado em `drawTeams()` (`src/domain/draw.ts`), uma função pura testada com 150 elencos aleatórios.

```mermaid
flowchart TD
  A([Organizador toca em Sortear times]) --> B{Confirmados ≥ 2 × nº de times?<br/>RN04}
  B -- não --> X[/Erro: confirmados insuficientes/]
  B -- sim --> C[Define a posição de cada jogador<br/>= posição principal]
  C --> D{Goleiros < nº de times?}
  D -- sim --> E[Completa com quem tem goleiro<br/>como posição secundária - RF32]
  E --> F{Ainda falta goleiro?}
  F -- sim --> G[Gera aviso:<br/>time sem goleiro fixo - RN05]
  F -- não --> H
  D -- não --> H
  G --> H
  H[Repete 60 vezes] --> I[Embaralha e ordena cada posição<br/>por nota, da maior para a menor]
  I --> J[Distribui posição por posição:<br/>time com menos jogadores daquela posição,<br/>depois menos jogadores, depois menor soma - RN06]
  J --> K[Busca local: troca ou move jogadores<br/>se diminuir a diferença de notas<br/>sem quebrar a regra de posições]
  K --> L{Fez as 60 tentativas?}
  L -- não --> I
  L -- sim --> M[Sorteia entre os resultados<br/>com a menor diferença - RN07]
  M --> N[Salva como rascunho<br/>visível só para organizadores]
  N --> O{Organizador ajusta?}
  O -- sim --> P[Mover jogador para outro time - RF34] --> O
  O -- não --> Q[Publicar times - RF35]
  Q --> R([Todos veem os times;<br/>compartilhar no WhatsApp])
```

Requisitos: RF29–RF35, RN04–RN07.

---

## 5. Diagrama de sequência — pagamento

Fluxo "Já paguei" → confirmação do organizador (RF41, RN10). O pagamento em si acontece fora do app, por PIX (RF42). O app só registra os estados da cobrança.

```mermaid
sequenceDiagram
  autonumber
  actor J as Jogador
  participant App as PatotApp (Next.js)
  participant SA as Server Action
  participant DB as PostgreSQL
  actor O as Organizador

  O->>App: Gerar mensalidades do mês / cobranças do jogo
  App->>SA: generateMonthlyCharges / generateGameCharges
  SA->>DB: createMany(Charge PENDING, skipDuplicates)
  J->>App: Abre Financeiro
  App->>DB: Cobranças do próprio jogador
  DB-->>App: Mensalidade R$ 50,00 (Pendente)
  Note over J: Paga pelo PIX copiando a chave da patota
  J->>App: Toca em "Já paguei"
  App->>SA: reportPayment(chargeId)
  SA->>DB: Confere que a cobrança é do jogador
  SA->>DB: Charge.status = REPORTED
  SA->>DB: Activity (somente organizadores)
  SA-->>App: "Avisamos o organizador"
  O->>App: Abre Financeiro → "Para confirmar"
  O->>App: Toca em "Confirmar"
  App->>SA: setChargeStatus(chargeId, PAID)
  SA->>DB: Confere que é organizador da patota
  SA->>DB: Charge.status = PAID, paidAt = agora
  SA-->>App: "Pagamento confirmado"
  Note over App,DB: Só cobranças PAID entram no saldo do caixa (RN10)
```

---

## 6. Rastreabilidade

| Diagrama | Código principal |
|---|---|
| Casos de uso | `src/app/**` (rotas e server actions) |
| Classes | `prisma/schema.prisma` |
| Confirmação | `src/domain/attendance.ts`, `src/server/games.ts` |
| Sorteio | `src/domain/draw.ts`, `src/domain/teams.ts` |
| Pagamento | `src/app/(app)/patotas/[id]/financeiro/actions.ts`, `src/domain/billing.ts` |
