# PatotApp — Status da Implementação

Rastreabilidade entre os requisitos de [01-requisitos.md](01-requisitos.md) e o que foi implementado nos 8 ciclos do [plano](02-plano-implementacao.md). Use esta tabela no relatório e nas validações com a patota.

Legenda: ✅ implementado e testado · 🟡 parcial · ⬜ não implementado (próximas versões)

## Requisitos funcionais

| ID | Requisito | Status | Onde / observação |
|---|---|---|---|
| RF01 | Login simples (link mágico / Google) | ✅ | `/login`; Google aparece quando configurado |
| RF02 | Sessão de 30 dias | ✅ | `src/auth.ts` — renovada a cada dia de uso |
| RF03 | Logout e sair de todos os aparelhos | ✅ | Menu da conta; Perfil → Sessões |
| RF04 | Perfil com posições | ✅ | `/perfil` |
| RF05 | Excluir conta (LGPD) | ✅ | Perfil → Excluir conta (bloqueia último organizador) |
| RF06 | Preferências de acessibilidade | ✅ | Tema, fonte (100/115/130%), alto contraste, menos animação |
| RF07 | Criar patota | ✅ | `/patotas/nova` |
| RF08 | Várias patotas por organizador | ✅ | Painel lista todas |
| RF09 | Convite por link/código | ✅ | Botão WhatsApp, copiar, gerar novo link |
| RF10 | Aprovar pedidos de entrada | ✅ | Ajustes → "Aprovar quem entra pelo link"; pedidos em Integrantes |
| RF11 | Papéis | ✅ | Organizador, co-organizador, jogador |
| RF12 | Mensalista / diarista | ✅ | Integrantes → menu de ações |
| RF13 | Convidado sem conta | ✅ | Integrantes → Adicionar convidado |
| RF14 | Remover / sair | ✅ | Com regra do último organizador (RN02) |
| RF15 | Busca e filtro de integrantes | ✅ | |
| RF16 | Jogos recorrentes | ✅ | O próximo jogo semanal é criado sozinho (pode desligar em Ajustes) |
| RF17 | Vagas, times e prazo por jogo | ✅ | Jogo pode ser editado; menos vagas devolve à espera quem confirmou por último |
| RF18 | Confirmar / talvez / não vou | ✅ | Em 1 toque, no painel e no jogo |
| RF19 | Prioridade de mensalistas | ✅ | Ajustes → Regras dos jogos |
| RF20 | Lista de espera automática | ✅ | Promoção por ordem de chegada, com trava contra corrida |
| RF21 | Lista em tempo real | ✅ | Atualiza a cada ação (sem WebSocket) |
| RF22 | Organizador ajusta presença | ✅ | Inclusive após o prazo |
| RF23 | Cancelar jogo | ✅ | |
| RF24 | Compartilhar lista no WhatsApp | ✅ | |
| RF25 | Posições | ✅ | GOL, ZAG, LAT, MEI, ATA |
| RF26 | Nota 1–5 por patota | ✅ | Integrantes (organizadores) |
| RF27 | Nota secreta | ✅ | Verificado: a nota não chega ao navegador do jogador |
| RF28 | Avaliação entre pares | ⬜ | |
| RF29 | Sorteio balanceado | ✅ | `src/domain/draw.ts` |
| RF30 | Regra dos goleiros | ✅ | 2º goleiro só se houver mais goleiros que times |
| RF31 | Posições distribuídas | ✅ | Diferença máx. de 1 por posição |
| RF32 | Usa posições secundárias | 🟡 | Usado para completar goleiros |
| RF33 | Juntos / separados | ⬜ | |
| RF34 | Indicador de equilíbrio e ajuste manual | ✅ | "Mover para…" acessível por teclado |
| RF35 | Publicar e compartilhar times | ✅ | Rascunho só para organizadores |
| RF36 | Coletes / times de fora | 🟡 | Times nomeados A–F; sem cores de colete |
| RF37 | Modelos de cobrança | ✅ | Mensalidade fixa ou rateio por jogo |
| RF38 | Despesas | ✅ | |
| RF39 | Gerar cobranças | ✅ | Mensalidades do mês e cobranças do jogo, sem duplicar |
| RF40 | Sugestão de mensalidade | ✅ | Calculada ao digitar o custo fixo |
| RF41 | "Já paguei" + confirmação | ✅ | |
| RF42 | Chave PIX | ✅ | Com botão copiar |
| RF43 | Caixa e inadimplentes | ✅ | |
| RF44 | Isenção (goleiro) | ✅ | E isenção manual por cobrança |
| RF45 | Exportar relatório | ✅ | CSV que abre no Excel |
| RF46 | Mural de avisos | ✅ | Fixar, excluir, reações |
| RF47 | Comentários no jogo | ✅ | |
| RF48 | Notificações | 🟡 | No app (sino com contador). Push e e-mail ainda não |
| RF49 | Linha do tempo | ✅ | Aba Atividades |
| RF50 | Painel com próximo jogo | ✅ | |
| RF51 | Tarefas do jogo | ⬜ | |
| RF52 | Placar e presença real | ✅ | Depois do jogo; rateio/avulso passa a cobrar quem compareceu |
| RF53 | Estatísticas | ✅ | Aba Estatísticas: jogos, frequência, gols, V/E/D, artilheiros |

**Resumo:** 47 de 53 requisitos implementados e testados, 3 parciais e 3 não implementados (RF28, RF33, RF51). Todos os **Must** foram implementados; os pendentes são **Could**.

## Requisitos não funcionais

| ID | Status | Evidência |
|---|---|---|
| RNF01–RNF10 (WCAG 2.1 AA) | ✅ | Auditoria automática com axe-core (17/10/2026): 14 páginas no tema claro e 11 no escuro, **0 violações** após as correções. Foram corrigidas 2 falhas encontradas: contraste do avatar no modo escuro e nome acessível do sino |
| RNF05 (zoom/reflow) | ✅ | Texto em 130% numa tela de 375 px sem rolagem horizontal |
| RNF06 (alvos de 48dp) | ✅ | Botões com no mínimo 48 px no tema |
| RNF11 (Material Design 3) | ✅ | MUI com tokens M3 (`src/theme/theme.ts`) |
| RNF12 (Nielsen) | 🟡 | Aplicado no desenvolvimento (confirmações, desfazer, mensagens claras); falta o checklist formal nas validações |
| RNF13 (2 toques) | ✅ | Painel → "Vou" |
| RNF15 (SUS ≥ 70) | ⬜ | Aplicar nas etapas 28–29 |
| RNF17 (PWA) | ✅ | Manifest e ícones gerados; instalável |
| RNF18–RNF20 (segurança/LGPD) | ✅ | Cookie HttpOnly; permissão checada no servidor em toda ação; exclusão de conta; política de privacidade pública em `/privacidade` |
| RNF21 (desempenho) | ⬜ | Medir com Lighthouse no deploy |
| RNF22 (custo zero) | 🟡 | Stack compatível com Vercel + Neon gratuitos; deploy ainda não feito |
| RNF23 (testes) | ✅ | 66 testes unitários (sorteio, financeiro, presença, datas, agenda, estatísticas) |
| RNF24 (centavos) | ✅ | Todos os valores em centavos inteiros |

## Testes realizados

- **Unitários (Vitest):** `npm test` — 66 testes, incluindo 150 elencos aleatórios no sorteio.
- **Especificação (UML):** diagramas de casos de uso, classes, atividades e sequência em [04-uml.md](04-uml.md), validados com o parser do Mermaid.
- **Fluxos no navegador:** login por link, convite, lista de espera com promoção, sorteio e publicação, cobranças (gerar, "já paguei", confirmar), despesas, CSV, mural, comentários, notificações, preferências e exclusão de conta.
- **Acessibilidade:** axe-core (WCAG 2.1 A/AA) nos temas claro e escuro.

## Sugestões para as próximas versões

1. Notificações push (Web Push) e por e-mail (RF48).
2. Regras "juntos/separados" no sorteio (RF33) e cores de colete (RF36).
3. Tarefas do jogo (RF51) e avaliação entre pares (RF28).
4. Deploy na Vercel + Neon e medição com Lighthouse (RNF21, RNF22).
