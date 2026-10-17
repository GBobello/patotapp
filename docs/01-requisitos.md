# PatotApp — Levantamento de Requisitos

> Solução colaborativa e acessível para gestão de patotas de futebol.
> Fundamentação: Modelo 3C de Colaboração (Comunicação, Coordenação, Cooperação + Percepção), Material Design 3, 10 Heurísticas de Nielsen e WCAG 2.1 nível AA.

## 1. Origem dos requisitos

| Fonte | Descrição |
|---|---|
| **Conversa inicial com a patota** | Login simples e persistente (30 dias); várias patotas por organizador; muitos integrantes; pagamentos (valor fixo ou rateio); confirmação de presença; sorteio de times balanceado por qualidade e posição. |
| **Projeto de extensão** | Funcionalidades guiadas pelo M3C; acessibilidade (WCAG); usabilidade (Material Design + Nielsen); solução gratuita. |
| **Derivados (análise)** | Requisitos que completam os anteriores para a solução funcionar no dia a dia (ex.: lista de espera, convites, mural). **Devem ser validados com a patota na etapa de Identificação de Requisitos.** |

Legenda de prioridade (MoSCoW): **M** = Must (obrigatório), **S** = Should (importante), **C** = Could (desejável), **W** = Won't (fora do escopo desta versão).
Legenda 3C: **Com** = Comunicação, **Coo** = Coordenação, **Cop** = Cooperação, **Per** = Percepção.

---

## 2. Atores

| Ator | Descrição |
|---|---|
| **Visitante** | Pessoa não autenticada (ex.: recebeu um link de convite). |
| **Jogador (membro)** | Integrante de uma ou mais patotas. Confirma presença, vê times, pagamentos e avisos. |
| **Organizador** | Cria e administra patotas. Pode administrar várias. Tem todos os poderes na patota. |
| **Co-organizador** | Membro promovido pelo organizador para ajudar (confirmar pagamentos, sortear times, publicar avisos). |

Um mesmo usuário pode ser organizador de uma patota e jogador comum em outra — o papel é **por patota**.

---

## 3. Requisitos Funcionais

### 3.1 Conta e autenticação

| ID | Requisito | Prior. | 3C |
|---|---|---|---|
| RF01 | Permitir cadastro/login simples, sem senha: **link mágico por e-mail** e/ou **login com Google**. | M | — |
| RF02 | Manter o usuário logado por **no mínimo 30 dias** (sessão renovada a cada uso — "sliding session"). | M | — |
| RF03 | Permitir sair (logout) e encerrar a sessão em todos os dispositivos. | S | — |
| RF04 | Permitir editar perfil: nome, apelido, foto, telefone (opcional), posição preferida e posições secundárias. | M | — |
| RF05 | Permitir excluir a conta e os dados pessoais (LGPD). | S | — |
| RF06 | Permitir preferências de acessibilidade: tema claro/escuro/alto contraste, tamanho de fonte, redução de animações. | S | — |

### 3.2 Patotas e integrantes

| ID | Requisito | Prior. | 3C |
|---|---|---|---|
| RF07 | Permitir criar uma patota (nome, descrição, local padrão, foto/escudo). | M | Coo |
| RF08 | Permitir que um organizador gerencie **várias patotas**, com troca rápida entre elas. | M | Coo |
| RF09 | Permitir convidar integrantes por **link/código de convite** (compartilhável no WhatsApp). | M | Coo |
| RF10 | Permitir que o organizador aprove/recuse pedidos de entrada (opcional por patota). | S | Coo |
| RF11 | Permitir definir papéis: organizador, co-organizador, jogador. | M | Coo |
| RF12 | Permitir classificar o integrante como **mensalista** ou **diarista/avulso**. | M | Coo |
| RF13 | Permitir cadastrar **convidado sem conta** (nome + posição + nota) para jogadores eventuais. | S | Coo |
| RF14 | Permitir remover integrante ou que o integrante saia da patota. | M | Coo |
| RF15 | Listar integrantes com busca e filtros (posição, tipo, situação de pagamento). | S | Per |

### 3.3 Jogos (agenda) e confirmação de presença

| ID | Requisito | Prior. | 3C |
|---|---|---|---|
| RF16 | Permitir configurar **jogos recorrentes** (ex.: toda quinta 20h) e jogos avulsos. | M | Coo |
| RF17 | Definir por jogo: local, data/hora, nº de jogadores por time, nº de times, **limite de vagas** e **prazo de confirmação**. | M | Coo |
| RF18 | Permitir ao jogador **confirmar, recusar ou marcar "talvez"** sua presença. | M | Coo |
| RF19 | Prioridade de vagas: mensalistas primeiro; diaristas entram quando abrir vaga ou após prazo definido. | S | Coo |
| RF20 | **Lista de espera** automática quando as vagas se esgotarem, com promoção automática ao abrir vaga. | S | Coo |
| RF21 | Exibir em tempo real a lista de confirmados, pendentes e ausentes (contadores + lista). | M | Per |
| RF22 | Permitir ao organizador confirmar/desconfirmar alguém manualmente e adicionar convidados ao jogo. | M | Coo |
| RF23 | Permitir cancelar um jogo, notificando todos. | M | Com |
| RF24 | Permitir **compartilhar a lista de confirmados** como texto formatado para o WhatsApp. | S | Com |

### 3.4 Qualidade dos jogadores e posições

| ID | Requisito | Prior. | 3C |
|---|---|---|---|
| RF25 | Cadastrar **posição principal** e secundárias: Goleiro (GOL), Zagueiro (ZAG), Lateral (LAT), Meio-campo (MEI), Atacante (ATA). | M | Cop |
| RF26 | Atribuir **nota (peso) de 1 a 5** a cada jogador, por patota (o mesmo jogador pode ter notas diferentes em patotas diferentes). | M | Cop |
| RF27 | A nota definida pelo organizador/co-organizador é visível só para eles (evita constrangimento). | S | — |
| RF28 | Permitir **avaliação entre pares** opcional (jogadores avaliam uns aos outros; a nota final é a média ponderada com a do organizador). | C | Cop |

### 3.5 Sorteio de times

| ID | Requisito | Prior. | 3C |
|---|---|---|---|
| RF29 | Sortear N times a partir dos confirmados, **balanceando a soma/média das notas**. | M | Cop |
| RF30 | **Restrições de posição**: goleiros distribuídos um por time; um time só recebe 2º goleiro se houver mais goleiros que times (ex.: 2 times → só pode haver 2 goleiros no mesmo time se houver ≥ 3 goleiros). | M | Cop |
| RF31 | Distribuir zagueiros, laterais, meias e atacantes de forma equilibrada (diferença máx. de 1 por posição entre times); nunca formar um time só de uma posição. | M | Cop |
| RF32 | Usar posições secundárias para completar posições faltantes. | S | Cop |
| RF33 | Permitir regras opcionais: **manter juntos** / **separar** determinados jogadores. | C | Cop |
| RF34 | Exibir indicador de equilíbrio (média de cada time e diferença) e permitir **novo sorteio** ou **ajuste manual** (mover jogador entre times). | M | Per |
| RF35 | Publicar os times para todos os integrantes e permitir compartilhar no WhatsApp. | M | Com |
| RF36 | Definir cores de colete por time e times "de fora" (próximo) quando houver mais de 2 times. | C | Coo |

### 3.6 Financeiro

| ID | Requisito | Prior. | 3C |
|---|---|---|---|
| RF37 | Configurar o **modelo de cobrança** da patota: **(a) mensalidade fixa** por mensalista + valor por jogo para diaristas; **(b) rateio** — custo total dividido entre os confirmados/presentes; **(c) misto**. | M | Coo |
| RF38 | Cadastrar **despesas** (aluguel da quadra, bola, coletes, arbitragem) — únicas ou recorrentes. | M | Cop |
| RF39 | Gerar automaticamente as **cobranças** de cada integrante por mês ou por jogo, conforme o modelo. | M | Coo |
| RF40 | Calcular sugestão de mensalidade para que a arrecadação **cubra os custos** (custo mensal ÷ nº de mensalistas). | S | Coo |
| RF41 | Permitir ao jogador informar "já paguei" (com comprovante opcional) e ao organizador **confirmar o pagamento**. | M | Cop |
| RF42 | Exibir a **chave PIX** da patota com botão "copiar". (Sem processar pagamento dentro do app.) | S | Com |
| RF43 | Mostrar **saldo do caixa** (entradas – despesas), inadimplentes e histórico mensal. | M | Per |
| RF44 | Permitir isenções/descontos (ex.: goleiro não paga). | C | Coo |
| RF45 | Exportar relatório financeiro (CSV/PDF) para prestação de contas. | C | Per |

### 3.7 Comunicação e percepção

| ID | Requisito | Prior. | 3C |
|---|---|---|---|
| RF46 | **Mural de avisos** da patota (organizador publica; membros reagem/comentam). | S | Com |
| RF47 | **Comentários por jogo** (ex.: "vou atrasar 10 min"). | C | Com |
| RF48 | **Notificações** (push no navegador/PWA e/ou e-mail): jogo aberto para confirmação, lembrete antes do prazo, times sorteados, cobrança vencendo, promoção da lista de espera. | S | Per |
| RF49 | **Linha do tempo de atividades** (quem confirmou, quem pagou, quem entrou na patota). | S | Per |
| RF50 | **Painel inicial** com o próximo jogo, status da minha confirmação e dos meus pagamentos em todas as patotas. | M | Per |

### 3.8 Cooperação no jogo e histórico

| ID | Requisito | Prior. | 3C |
|---|---|---|---|
| RF51 | **Tarefas do jogo** (levar bola, coletes, água) — qualquer membro pode assumir. | C | Cop |
| RF52 | Registrar **placar** das partidas e presença real (quem compareceu). | C | Cop |
| RF53 | **Estatísticas**: frequência, gols (opcional), vitórias por jogador. | C | Per |

### 3.9 Fora do escopo desta versão (Won't)

- Processamento de pagamentos dentro do app (cartão, PIX automático com conciliação).
- Chat em tempo real completo (o WhatsApp já cumpre esse papel; o app integra via compartilhamento).
- Aplicativo nativo nas lojas (será um PWA instalável).
- Reserva de quadras/integração com estabelecimentos.

---

## 4. Requisitos Não Funcionais

### 4.1 Acessibilidade (WCAG 2.1 AA)

| ID | Requisito |
|---|---|
| RNF01 | Contraste mínimo de **4.5:1** para texto e **3:1** para componentes gráficos e textos grandes (1.4.3, 1.4.11). |
| RNF02 | Navegação **100% por teclado**, foco sempre visível e ordem lógica (2.1.1, 2.4.3, 2.4.7). |
| RNF03 | Compatível com leitores de tela (NVDA, TalkBack, VoiceOver): HTML semântico, rótulos e ARIA quando necessário (1.3.1, 4.1.2). |
| RNF04 | Informação **nunca transmitida só por cor** (ex.: status de pagamento usa ícone + texto) (1.4.1). |
| RNF05 | Conteúdo legível com **zoom de 200%** e em telas de 320 px sem rolagem horizontal (1.4.4, 1.4.10). |
| RNF06 | Alvos de toque com no mínimo **48×48 dp** (Material) — supera o 2.5.5. |
| RNF07 | Mensagens de erro claras, associadas ao campo, com sugestão de correção (3.3.1, 3.3.3). |
| RNF08 | Atualizações dinâmicas (ex.: novo confirmado, resultado do sorteio) anunciadas via `aria-live` (4.1.3). |
| RNF09 | Respeitar `prefers-reduced-motion` e `prefers-color-scheme`. |
| RNF10 | Textos alternativos em imagens (fotos, escudos); idioma da página `pt-BR` (1.1.1, 3.1.1). |

### 4.2 Usabilidade e experiência

| ID | Requisito |
|---|---|
| RNF11 | Interface segue **Material Design 3** (componentes, tipografia, cores dinâmicas, elevação). |
| RNF12 | Interfaces avaliadas pelas **10 Heurísticas de Nielsen** (checklist em cada validação). |
| RNF13 | **Mobile-first**: a principal tarefa (confirmar presença) deve ser feita em **até 2 toques** a partir do painel. |
| RNF14 | Ações destrutivas pedem confirmação e oferecem **desfazer** quando possível (Heurística 3 e 5). |
| RNF15 | Meta de **SUS ≥ 70** (System Usability Scale) na verificação final. |
| RNF16 | Linguagem simples e do vocabulário da patota ("confirmar", "mensalista", "rachar a conta"). |

### 4.3 Técnicos, segurança e privacidade

| ID | Requisito |
|---|---|
| RNF17 | Aplicação web **PWA** instalável em Android/iOS/desktop. |
| RNF18 | Sessão persistente de 30 dias com cookie `HttpOnly`, `Secure`, `SameSite=Lax`. |
| RNF19 | Toda comunicação via **HTTPS**; controle de acesso por papel em toda rota/API (um membro nunca acessa dados de patota alheia). |
| RNF20 | Conformidade com a **LGPD**: consentimento, mínimo de dados, exclusão de conta, política de privacidade. |
| RNF21 | Tempo de carregamento inicial < 3 s em 4G; Lighthouse ≥ 90 em Acessibilidade e Performance. |
| RNF22 | Hospedagem com **custo zero** (camadas gratuitas) para que a solução seja disponibilizada gratuitamente. |
| RNF23 | Código versionado (Git), com testes automatizados para regras críticas (sorteio e financeiro). |
| RNF24 | Valores monetários armazenados em **centavos (inteiros)** para evitar erros de arredondamento; sobras de rateio distribuídas de forma determinística. |

---

## 5. Regras de negócio

| ID | Regra |
|---|---|
| RN01 | Um usuário só vê patotas das quais é integrante. |
| RN02 | Toda patota tem pelo menos 1 organizador; o último organizador não pode sair sem transferir o papel. |
| RN03 | Confirmações encerram no prazo definido; depois disso, só organizadores alteram a lista. |
| RN04 | Sorteio exige confirmados ≥ (nº de times × 2). |
| RN05 | Goleiros por time: `máx = ⌈goleiros ÷ times⌉`. Um time só pode ter 2 goleiros se `goleiros > times`. Se faltar goleiro, o sistema avisa e sorteia de linha. |
| RN06 | Para cada posição de linha, a diferença de quantidade entre quaisquer dois times é ≤ 1. |
| RN07 | Entre as combinações válidas, escolhe-se a de **menor diferença de soma de notas** entre times (com aleatoriedade entre soluções equivalentes, para não repetir sempre os mesmos times). |
| RN08 | Rateio: valor por pessoa = custo do jogo ÷ nº de presentes pagantes; centavos restantes distribuídos 1 a 1. |
| RN09 | Mensalidade sugerida = soma das despesas recorrentes do mês ÷ nº de mensalistas ativos (arredondada para cima). |
| RN10 | Pagamento só é considerado quitado após confirmação de um organizador/co-organizador. |

---

## 6. Pontos a validar com a patota

Levar estas perguntas para a etapa presencial de **Identificação de Requisitos** (etapas 5 e 6):

1. O login por **Google** ou **link no e-mail** atende? Alguém não usa e-mail? (Alternativa: código por SMS/WhatsApp, que tem custo.)
2. Quais posições vocês usam? (Society costuma ser GOL/ZAG/MEI/ATA; campo inclui LAT.)
3. A nota do jogador deve ser **secreta** (só o organizador vê) ou **pública**?
4. Mensalistas têm prioridade sobre diaristas? Até quando o diarista espera?
5. Como pagam hoje? (PIX para o organizador? Conta da patota?) Goleiro paga?
6. Querem notificações por push, e-mail, ou só o compartilhamento no WhatsApp?
7. Há integrantes com deficiência visual, auditiva, motora ou baixo letramento digital? (Direciona testes de acessibilidade e personas.)
