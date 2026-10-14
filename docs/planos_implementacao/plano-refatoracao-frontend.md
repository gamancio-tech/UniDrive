# Plano de Refatoração do Frontend — UniDrive

> **Objetivo:** quebrar os arquivos gigantes do frontend em peças pequenas, com responsabilidade única, para facilitar a **escalabilidade** (novas features sem inflar arquivos) e a **correção de bugs** (achar e isolar o problema rápido).
>
> **Regra de ouro:** é uma refatoração **pura**. Nenhuma fase muda comportamento visível, regra de negócio, contrato de API ou escopo (ver `AGENTS.md`). Bugs encontrados no caminho são **registrados** (seção 7) e corrigidos em commits separados.

---

## 📊 Progresso Geral

- [x] **Fase 0:** Rede de segurança (lint, testes de utilitários, checklist manual)
- [ ] **Fase 1:** Utilitários e constantes compartilhados
- [ ] **Fase 2:** Componentes de UI reutilizáveis + classes utilitárias de CSS
- [ ] **Fase 3:** `DriverStudentList.tsx` (1047 linhas)
- [ ] **Fase 4:** `ChatWindow.tsx` (835 linhas)
- [ ] **Fase 5:** `DriverHome.tsx` (859 linhas)
- [ ] **Fase 6:** Demais arquivos acima de 300 linhas
- [ ] **Fase 7:** Camada de dados (tirar `apiRequest` dos componentes)
- [ ] **Fase 8:** Divisão do `components.css` (2515 linhas)
- [ ] **Fase 9:** Guardrails para não voltar a crescer

---

## 1. Diagnóstico (estado atual)

### 1.1 Arquivos mais pesados (linhas)

| Arquivo | Linhas | Meta |
|---|---:|---:|
| `styles/components.css` | 2515 | vários arquivos ≤ 300 |
| `features/driver/DriverStudentList.tsx` | 1047 | ≤ 150 (container) |
| `pages/DriverHome.tsx` | 859 | ≤ 150 |
| `features/chat/ChatWindow.tsx` | 835 | ≤ 150 |
| `features/dailyStatus/DailyStatusCard.tsx` | 569 | ≤ 200 |
| `styles/layout.css` | 487 | ≤ 300 |
| `features/driver/ClassSelectionScreen.tsx` | 426 | ≤ 200 |
| `features/admin/DriverManagement.tsx` | 403 | ≤ 200 |
| `features/admin/StudentManagement.tsx` | 385 | ≤ 200 |
| `features/payments/StudentPaymentsCard.tsx` | 371 | ≤ 200 |
| `features/chat/DriverGeneralChat.tsx` | 361 | ≤ 200 |
| `features/settings/AppSettings.tsx` | 348 | ≤ 200 |
| `pages/AdminHome.tsx` | 336 | ≤ 200 |

### 1.2 Problemas recorrentes (causa raiz dos arquivos gigantes)

| # | Problema | Onde aparece | Consequência |
|---|---|---|---|
| P1 | **"Componente deus"**: um só componente cuida de dados, regras, estado de modais e markup | `DriverStudentList`, `DriverHome`, `ChatWindow` | Qualquer mudança arrisca quebrar outra coisa; difícil de ler |
| P2 | **Explosão de `useState`** (~25 estados em `DriverStudentList`: `loading`, `submitting`, `checkingInId`, `markingPaidId`, `rejectingPaymentId`, `deactivating`, `reactivatingId`…) | `DriverStudentList`, `ChatWindow`, `DriverHome` | Estados inconsistentes, bugs de "botão preso em loading" |
| P3 | **Markup duplicado**: cards de aluno "A Embarcar" e "Embarcados" quase idênticos; estados vazios repetidos | `DriverStudentList` | Corrigir 1 bug exige editar N lugares |
| P4 | **Regra de negócio duplicada**: filtro "quem participa do trajeto" (`vai_normal`/`so_ida`/`so_volta`) existe em `DriverHome` **e** em `DriverStudentList`; "finalizar viagem" existe nos dois com implementações diferentes | `DriverHome` × `DriverStudentList` | **Divergência de comportamento** (ver bug B1) |
| P5 | **`apiRequest` direto em componentes/páginas** | `DriverHome`, `AdminHome`, `DriverStudentList`, `StudentManagement`, `DriverManagement`, `login`, `useDailyStatus` | Sem ponto único para tratar erro/loading; URLs espalhadas |
| P6 | **Estilos inline** (`style={{…}}`) em ~31 arquivos | quase todos | JSX poluído, inconsistência visual, não dá para ajustar tema em um lugar |
| P7 | **Helpers puros dentro do componente** (`formatPhoneInput`, `getInitials`, `formatMessageTime/Date`, `quickReplies`) | `ChatWindow` | Recriados a cada render; impossíveis de testar; `Avatar` já existe e não é reutilizado |
| P8 | **Estado de navegação/preferência em `localStorage` espalhado** (`unidrive_driver_trip_type`, `unidrive_active_class_id`, `unidrive_active_class_name`) lido/escrito em vários componentes | `DriverHome`, `DriverStudentList` | Dois "donos" do mesmo estado (`tripType` existe em `DriverHome` e como `internalTripType` em `DriverStudentList`) |
| P9 | **Feedback inconsistente**: `alert()` no `ChatWindow` enquanto o resto usa `useToast` | `ChatWindow` | UX inconsistente |
| P10 | **CSS monolítico** de 2515 linhas, sem dono por componente | `components.css` | Medo de apagar/alterar CSS; classes mortas acumulam |
| P11 | **Sem lint e sem testes** (`package.json` só tem `dev`, `build`, `preview`) | projeto todo | Nada avisa quando uma refatoração quebra algo |

---

## 2. Princípios e limites (valem para todas as fases)

1. **Um arquivo, uma responsabilidade.** Se o nome exige "e" ("lista **e** modal **e** pagamento"), separe.
2. **Limites de tamanho (alvo, verificados na Fase 9):**
   - Componente `.tsx`: ≤ **200** linhas (containers ≤ 150)
   - Hook: ≤ **150** linhas
   - Função: ≤ **40** linhas
   - Arquivo CSS: ≤ **300** linhas
3. **Container × apresentação.**
   - *Container/hook:* busca dados, guarda estado, chama API.
   - *Componente de apresentação:* só recebe props e renderiza. Sem `apiRequest`, sem `localStorage`.
4. **Lógica pura vai para `utils/` e é testada** (filtros de trajeto, formatação de telefone/data, iniciais).
5. **Estado relacionado vira um hook ou `useReducer`**, não 6 `useState` soltos. Para ações em lote por ID (`checkingInId`, `markingPaidId`, …), usar um único `pendingActions: Record<string, ActionKind>` ou um hook `useAsyncAction`.
6. **Um dono para cada estado.** `tripType` e `activeClass` passam a viver em **Context** (ver Fase 5); os filhos só consomem.
7. **Sem abstração "enterprise".** Nada de Redux, Clean Architecture ou bibliotecas novas de estado. Apenas: pastas, hooks, Context e funções puras (autor está aprendendo React — priorizar código didático).
8. **Convenções do projeto continuam:** identificadores em inglês, textos de interface em português, TS `strict`.
9. **Segurança não regride** (`docs/seguranca/02-checklist-pr.md`): sem `dangerouslySetInnerHTML`/`innerHTML`; esconder botão não é controle de acesso; nenhum dado sensível em `console.log`.
10. **Um commit por passo**, em português, formato `refactor: extrai TripControlBar de DriverStudentList`. Nunca misturar refatoração com mudança de comportamento.

---

## 3. Estrutura de pastas alvo

```
frontend/src/
├── api/                         # só chamadas HTTP tipadas (1 arquivo por domínio)
│   ├── client.ts
│   ├── dailyStatus.ts           # NOVO (hoje as URLs ficam em useDailyStatus/DriverHome)
│   └── …
├── components/                  # UI genérica reutilizável (sem regra de negócio)
│   ├── EmptyState.tsx           # NOVO
│   ├── ConfirmModal.tsx         # NOVO (substitui N modais de confirmação)
│   ├── FilterPills.tsx          # NOVO
│   ├── Tabs.tsx                 # NOVO
│   └── …existentes (Button, Card, Modal, Avatar, Badge…)
├── context/                     # NOVO — estado compartilhado com 1 dono
│   ├── ActiveClassContext.tsx   # turma ativa (+ persistência em localStorage)
│   └── TripContext.tsx          # tripType/tripStep (+ persistência)
├── features/
│   ├── driver/
│   │   ├── students/
│   │   │   ├── DriverStudentList.tsx          # container (~120 linhas)
│   │   │   ├── hooks/
│   │   │   │   ├── useDriverStudents.ts       # fetch + polling
│   │   │   │   ├── useStudentPayments.ts      # status/ações de pagamento
│   │   │   │   ├── useTripActions.ts          # finalizar/declarar partida
│   │   │   │   └── useAddStudentForm.ts       # form + validação + submit
│   │   │   └── components/
│   │   │       ├── TripControlBar.tsx
│   │   │       ├── StudentTabs.tsx
│   │   │       ├── BoardingList.tsx           # serve p/ "A Embarcar" e "Embarcados"
│   │   │       ├── StudentRow.tsx             # linha genérica de aluno
│   │   │       ├── RegisteredStudentsPanel.tsx
│   │   │       ├── PaymentBadge.tsx
│   │   │       ├── AddStudentModal.tsx
│   │   │       ├── DeactivateStudentModal.tsx
│   │   │       └── FinishTripModal.tsx
│   │   └── class-selection/…
│   ├── chat/
│   │   ├── ChatWindow.tsx                     # container (~120 linhas)
│   │   ├── components/
│   │   │   ├── ChatTopBar.tsx
│   │   │   ├── ChatContactHeader.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageContextMenu.tsx
│   │   │   ├── ChatComposer.tsx
│   │   │   ├── QuickReplies.tsx
│   │   │   ├── PhoneModal.tsx
│   │   │   ├── DeleteMessageModal.tsx
│   │   │   └── ClearChatModal.tsx
│   │   ├── hooks/
│   │   │   ├── useLongPress.ts                # toque longo (1500 ms)
│   │   │   ├── useMessageMenu.ts              # posição/abertura do menu
│   │   │   ├── usePartnerPhone.ts             # telefone + salvar/ligar
│   │   │   └── useAutoScroll.ts
│   │   └── constants/quickReplies.ts
│   └── …
├── pages/
│   ├── DriverHome.tsx                         # só "casca": layout + abas (~120 linhas)
│   └── driver/                                # NOVO — uma aba por arquivo
│       ├── OperationsTab.tsx
│       ├── StudentsTab.tsx
│       ├── ChatTab.tsx
│       ├── AnnouncementsTab.tsx
│       └── SettingsTab.tsx
├── styles/
│   ├── index.css                # tokens, reset, tipografia
│   ├── utilities.css            # NOVO — .stack, .row, .text-muted, .center…
│   ├── layout/…                 # header, tabs, bottom-nav, containers
│   └── components/              # NOVO — 1 arquivo CSS por componente/feature
│       ├── button.css, card.css, modal.css, badge.css, list-item.css
│       ├── chat.css, students.css, daily-status.css, …
└── utils/
    ├── trip.ts                  # NOVO — regras de trajeto (puras)
    ├── phone.ts                 # NOVO — formatPhoneInput, toTelHref
    ├── date.ts                  # NOVO — formatMessageTime/Date
    ├── text.ts                  # NOVO — getInitials, firstName
    └── storage.ts               # NOVO — wrapper tipado de localStorage c/ chaves centralizadas
```

> [!NOTE]
> Não é necessário criar tudo de uma vez. Cada fase abaixo cria **apenas** o que ela usa.

---

## 4. Fases de implementação

### 🛡️ Fase 0 — Rede de segurança (pré-requisito)

**Por quê:** sem testes nem lint (P11), refatorar 1000 linhas é pular no escuro.

| Tarefa | Detalhe |
|---|---|
| **0.1** ✅ Garantir baseline verde | Rodar `npm run build` (`tsc -b && vite build`) e salvar como ponto de partida. Criar branch `refactor/frontend`. |
| **0.2** ✅ Adicionar ESLint | `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks` (regra `exhaustive-deps` evita bugs de closure ao extrair hooks). Script `npm run lint`. Config em [`frontend/eslint.config.js`](../../frontend/eslint.config.js). |
| **0.3** ✅ Adicionar Vitest | `vitest` (já integrado ao Vite). Script `npm run test`. Foco **apenas em funções puras** (Fases 1 e 3); não testar componentes agora. |
| **0.4** ✅ Checklist manual de regressão | [`docs/otimizacao/checklist-regressao-frontend.md`](../otimizacao/checklist-regressao-frontend.md) (motorista, aluno, admin e geral); executar **antes e depois** de cada fase 3–8. |

**Critério de aceite:** `npm run build`, `npm run lint` e `npm run test` rodam; checklist manual salvo. ✅

#### 📌 Baseline medido na Fase 0 (referência para as próximas fases)

| Item | Resultado |
|---|---|
| Branch | `refactor/frontend` (a partir de `main`) |
| `npm run build` | ✅ OK — 88 módulos; JS 453,82 kB (gzip 125,37 kB); CSS 59,74 kB (gzip 10,56 kB) |
| `npm run lint` | ✅ 0 erros · **14 avisos pré-existentes** (lista abaixo) |
| `npm run test` | ✅ Vitest 3 funcionando (ainda sem testes; `--passWithNoTests`). Primeiros testes entram na Fase 1 |
| `npm audit --omit=dev` | ✅ 0 vulnerabilidades em produção |

**14 avisos de lint pré-existentes** (não corrigir na Fase 0; resolver junto da fase do arquivo correspondente):

| Arquivo | Aviso | Fase |
|---|---|---|
| `ChatWindow.tsx` | `faChevronDown` não usado | 4 |
| `DriverStudentList.tsx` | `faCircleXmark` não usado | 3 |
| `DriverHome.tsx` | `faArrowLeft`, `isDriverChatOpen` não usados | 5 |
| `NotificationBanner.tsx` | `testing`, `handleTest` não usados | 6 |
| `DriverGeneralChat.tsx` | `tripType` não usado; `useEffect` sem dep. `selectedStudent` | 6 |
| `DriverChatConversationList.tsx` | `useEffect` sem dep. `selectedStudent` | 6 |
| `StudentManagement.tsx` | `useEffect` sem dep. `loadStudents`, `loadDrivers` | 6 |
| `AdminManagement.tsx` | `useEffect` sem dep. `loadAdmins` | 6 |
| `StudentWeeklyScheduleCard.tsx` | `useEffect` sem dep. `loadSchedule` | 6 |
| `chatSocket.ts` | `err` não usado | — (não será alterado) |

> [!NOTE]
> Os avisos `exhaustive-deps` indicam possíveis closures desatualizadas (potenciais bugs reais). Ao corrigi-los, conferir o comportamento: adicionar a dependência pode mudar quando o efeito dispara.

> [!WARNING]
> `npm audit` (somente **desenvolvimento**) ainda lista alertas em `vite`/`esbuild`, `vite-plugin-pwa`, `serialize-javascript`, `source-map-js` (já existiam antes da Fase 0) e em `vitest`/`tinypool` (introduzido agora). A correção exige `vite@8` / `vitest@5` (mudanças incompatíveis), fora do escopo desta refatoração. Esses pacotes não vão para o bundle de produção. Tratar em uma tarefa separada de atualização de dependências.

---

### 🔧 Fase 1 — Utilitários e constantes compartilhados

**Por quê:** resolve P4, P7, P8 e é a fase mais segura (código puro, testável) — base das demais.

| Tarefa | Origem → Destino |
|---|---|
| **1.1** `utils/trip.ts` | Extrair `isStudentInTrip(status, tripType)` e `filterStudentsForTrip(students, tripType, classId)`. Hoje duplicado em `DriverHome.tsx` (`tripStudentsCount`) e `DriverStudentList.tsx` (`tripFilteredStudents`). Exportar o tipo `TripType` daqui (hoje é exportado de um componente). |
| **1.2** `utils/phone.ts` | `formatPhoneInput` e a limpeza de dígitos para `tel:` (de `ChatWindow`). |
| **1.3** `utils/date.ts` | `formatMessageTime`, `formatMessageDate` (de `ChatWindow`). |
| **1.4** `utils/text.ts` | `getInitials` (de `ChatWindow`; avaliar reutilizar `Avatar`), `firstName`. |
| **1.5** `utils/storage.ts` | Centralizar chaves `unidrive_driver_trip_type`, `unidrive_active_class_id`, `unidrive_active_class_name` em constantes + `getStorage/setStorage` tipados com `try/catch`. |
| **1.6** `features/chat/constants/quickReplies.ts` | Mover as listas de respostas rápidas de aluno/motorista (hoje recriadas a cada render). |
| **1.7** Testes Vitest | Casos de `filterStudentsForTrip` (todos os status × ida/volta × turma nula/definida), `formatPhoneInput` (0, 2, 6, 10, 11+ dígitos), `formatMessageDate` (hoje/ontem/outra data). |

**Critério de aceite:** componentes passam a importar de `utils/`; nenhuma cópia local restante (`grep` por `vai_normal` só em `utils/trip.ts`); testes passam.

---

### 🎨 Fase 2 — Componentes de UI reutilizáveis + utilitários de CSS

**Por quê:** resolve P3 e P6. Sem isso, as fases 3–6 só mudam o código de lugar sem encolhê-lo.

| Tarefa | Detalhe |
|---|---|
| **2.1** `styles/utilities.css` | Classes pequenas que substituem os `style={{…}}` mais repetidos: `.row` (flex + gap + align center), `.row-wrap`, `.stack`, `.text-muted`, `.text-center`, `.icon-gap-sm`, `.btn-compact` (os `width:auto; minHeight:34px; padding…` repetidos em ~10 botões). Usar os tokens existentes (`var(--text-muted)`, `var(--radius-md)`…). **Sem Tailwind.** |
| **2.2** `EmptyState.tsx` | Props: `icon`, `title`, `description`, `action`. Substitui os 4+ blocos "centralizado + ícone grande + h3 + p" de `DriverStudentList`. |
| **2.3** `ConfirmModal.tsx` | Props: `isOpen`, `title`, `message`, `confirmLabel`, `variant`, `loading`, `onConfirm`, `onClose`. Substitui modais de confirmação de finalizar viagem, desativar aluno, limpar chat, apagar mensagem, cancelar viagem. Baseado no `Modal` existente. |
| **2.4** `FilterPills.tsx` e `Tabs.tsx` | Encapsulam `.filter-pills`/`.filter-pill` e `.tabs-container`/`.tab-btn` (tipados com genérico `<T extends string>`). |
| **2.5** Migração de `alert()` | Trocar `alert(...)` por `useToast` (P9). |

**Critério de aceite:** componentes novos usados em ≥ 2 lugares cada; sem mudança visual (comparar prints antes/depois nas telas do checklist).

---

### 🚌 Fase 3 — `DriverStudentList.tsx` (1047 → ~120 linhas)

**Passo a passo (cada item = 1 commit, app funcionando ao final de cada um):**

1. **3.1** Mover para `features/driver/students/` (somente move + ajustar imports).
2. **3.2** `useDriverStudents(activeClassId)` — encapsula `loadStudents`, polling de 15 s (`POLL_INTERVAL_MS`), `dailyStudents/activeStudents/inactiveStudents/availableClasses/loading`.
3. **3.3** `useStudentPayments(students)` — encapsula `paymentStatuses`, `markingPaidId`, `rejectingPaymentId` e as ações marcar/rejeitar. Cria `PaymentBadge.tsx`.
4. **3.4** `useTripActions(...)` — `handleConfirmFinishTrip`, `handleDeclareDeparture`, `finishingTrip`. Passa a usar `TripContext` (Fase 5.1) ou, até lá, recebe `tripType/onUpdateTripState` por props como hoje.
5. **3.5** `StudentRow.tsx` + `BoardingList.tsx` — unifica "A Embarcar" e "Embarcados" (diferem só em `variant`, badge e ação do botão). Elimina ~100 linhas duplicadas (P3).
6. **3.6** `TripControlBar.tsx` — painel Ida/Volta + botões "Declarar Partida"/"Finalizar".
7. **3.7** `RegisteredStudentsPanel.tsx` — aba "Todos" (sub-abas ativos/inativos, linha com turma, pagamento, desativar/reativar).
8. **3.8** `AddStudentModal.tsx` + `useAddStudentForm.ts` — campos `name/email/temporaryPassword/targetClassId`, erro, `submitting`.
9. **3.9** `DeactivateStudentModal.tsx` e `FinishTripModal.tsx` via `ConfirmModal`.
10. **3.10** Consolidar loading por ID (P2): trocar `checkingInId/markingPaidId/rejectingPaymentId/reactivatingId` por um único hook `useRowAction()` que expõe `isBusy(id, action)` e `run(id, action, fn)`.

**Observação de performance a registrar (não alterar agora):** `loadStudents` dispara 1 request de pagamento **por aluno ativo a cada 15 s** (N+1). Ver B3.

**Critério de aceite:** `DriverStudentList.tsx` ≤ 150 linhas; nenhum arquivo novo > 200; checklist manual da seção "motorista" ok; testes de `utils/trip.ts` passando.

---

### 💬 Fase 4 — `ChatWindow.tsx` (835 → ~120 linhas)

1. **4.1** `ChatTopBar` + `ChatContactHeader` (inclui badges de status do aluno: embarcado / não vai / só ida / só volta → um `TripStatusBadge` por mapa `status → {classe, ícone, texto}` em vez de 4 blocos `&&`).
2. **4.2** `useLongPress(onLongPress, {delay: 1500, tolerance: 10})` — move `longPressTimerRef`, `pointerStartPosRef`, `handlePointerDown/Move/Up`. **Limpar o timer no unmount** (hoje não há cleanup).
3. **4.3** `useMessageMenu()` + `MessageContextMenu.tsx` — `menuMessage`, `menuPosition`, `openMenuForMessage` (cálculo de limites da tela), fechar com `Esc`.
4. **4.4** `MessageList.tsx` + `MessageBubble.tsx` — render das mensagens, separador de data, paginação (`loadOlderMessages`/`hasMore`), `useAutoScroll`.
5. **4.5** `ChatComposer.tsx` + `QuickReplies.tsx` — input, Enter para enviar, painel de respostas rápidas (`showQuickReplies`).
6. **4.6** `usePartnerPhone(partnerId, partnerPhone, role)` + `PhoneModal.tsx` — `currentPhone`, `inputPhone`, validação ≥ 10 dígitos, salvar e ligar.
7. **4.7** `DeleteMessageModal` (escopo `me`/`everyone`) e `ClearChatModal` via `ConfirmModal`; remover `alert()`.
8. **4.8** Substituir os `<svg>` inline (seta de voltar) por `FontAwesomeIcon` (`faArrowLeft`), padrão do resto do app.

> [!IMPORTANT]
> Não alterar `useChat.ts`/`chatSocket.ts` nem o protocolo WebSocket. Payloads continuam validados no backend (`chatServer.ts`). Esta fase só toca a camada visual.

**Critério de aceite:** `ChatWindow.tsx` ≤ 150 linhas; checklist de chat ok em mobile (toque longo) e desktop (clique direito + chevron).

---

### 🏠 Fase 5 — `DriverHome.tsx` (859 → ~120 linhas)

1. **5.1** `context/ActiveClassContext.tsx` — `activeClassId`, `activeClassName`, `driverClasses`, `selectClass`, `clearClass`; dono único do `localStorage` da turma. Substitui os estados em `DriverHome` e as props `activeClassId/activeClassName` repassadas.
2. **5.2** `context/TripContext.tsx` — `tripType`, `setTripType` (persistido), integra `useDailyStatus` (`tripStep`, `updateTripState`, `refresh`). **Remove o `internalTripType` duplicado** de `DriverStudentList` (P8).
3. **5.3** `useTripFlow()` — **uma única** implementação de "finalizar ida / declarar partida / encerrar volta / reabrir espera", usada por `DriverHome` e `DriverStudentList` (resolve P4 e o bug B1).
4. **5.4** Dividir por aba em `pages/driver/`: `OperationsTab` (donut, ação principal, cancelar), `StudentsTab`, `ChatTab`, `AnnouncementsTab` (+ `useAnnouncementForm`: `message`, `publishing`, `selectedAnnouncementClassIds`), `SettingsTab`.
5. **5.5** Extrair `ClassPickerModal` (seleção multi-turma usada em cancelar e avisos — hoje 2 estados + 2 modais quase iguais).
6. **5.6** `DriverHome.tsx` vira casca: header + `BottomNavigation` + renderização da aba atual (manter o comportamento de `visitedTabs`, que mantém abas montadas).

**Critério de aceite:** `DriverHome.tsx` ≤ 150 linhas; `tripType` e `activeClass` com um único dono; fluxo Ida→Volta→Ida idêntico ao de antes.

---

### 📚 Fase 6 — Demais arquivos > 300 linhas

Aplicar a **mesma receita** (hook de dados/estado + componentes de apresentação + `ConfirmModal`/`EmptyState`), uma feature por vez, nesta ordem (impacto × risco):

| Ordem | Arquivo | Estratégia |
|---:|---|---|
| 6.1 | `DailyStatusCard.tsx` (569) | Separar seletor de status, bloco de contador/donut, estados "cancelado"/"em viagem"; lógica em `useDailyStatus` |
| 6.2 | `ClassSelectionScreen.tsx` (426) | `ClassCard`, `CreateClassModal`, `EditClassModal` |
| 6.3 | `DriverManagement.tsx` (403) e `StudentManagement.tsx` (385) | Unificar tabela/linha/modais de CRUD admin num `AdminEntityTable` genérico + modais por entidade |
| 6.4 | `StudentPaymentsCard.tsx` (371) | `PaymentStatusSummary`, `PaymentRequestButton`, hook `useStudentPayment` |
| 6.5 | `DriverGeneralChat.tsx` (361) + `DriverChatConversationList.tsx` (301) | Compartilhar `ConversationListItem`; extrair filtros por turma |
| 6.6 | `AppSettings.tsx` (348) | Uma seção por arquivo (perfil, tema, notificações, pagamento, rotina semanal) |
| 6.7 | `AdminHome.tsx` (336) | Mesmo padrão de abas de `DriverHome` |

**Critério de aceite:** nenhum `.tsx` > 300 linhas (meta final ≤ 200).

---

### 🌐 Fase 7 — Camada de dados (resolve P5)

1. **7.1** Criar `api/dailyStatus.ts` e mover para lá as URLs hoje espalhadas em `useDailyStatus.ts`, `DriverHome.tsx` (`/students?classId=…`, `/daily-status/trip-state`) e `DriverStudentList.tsx`.
2. **7.2** Revisar `api/admin.ts`, `api/students.ts` e criar o que faltar para `AdminHome`, `StudentManagement`, `DriverManagement` e `login.tsx`.
3. **7.3** **Regra:** componentes e páginas **não importam `apiRequest`** — só hooks da feature chamam funções de `api/*`. Verificar com `grep apiRequest src/{pages,components,features}` (deve retornar apenas hooks).
4. **7.4** Hook utilitário `useAsyncAction` (loading + erro + toast) para padronizar `try/catch/finally` repetido ~30 vezes.
5. **7.5** Eliminar fetch duplicado: `DriverHome` e `DriverStudentList` hoje buscam `/students` separadamente — expor a lista de um único hook/Context.

> [!NOTE]
> **Não adicionar React Query/SWR agora.** Para ~15 usuários, hooks próprios com polling bastam. Reavaliar apenas se o número de hooks de fetch crescer muito.

**Critério de aceite:** nenhuma chamada HTTP direta em componente; tipos de resposta definidos em `api/*`; respostas de erro continuam usando `AppError`/mensagens do backend (sem expor detalhes internos ao usuário).

---

### 🎛️ Fase 8 — Divisão do CSS (resolve P10)

1. **8.1** Inventário: listar seções de `components.css` (botões, cards, badges, inputs, modal, listas, chat, filtros, tabs, donut…).
2. **8.2** Dividir em `styles/components/<nome>.css` (≤ 300 linhas cada), mantendo **a mesma ordem de cascata** ao importar em `index.css`/`main.tsx` (importar na ordem original para não alterar especificidade).
3. **8.3** Quebrar `layout.css` (487) em `layout/header.css`, `layout/tabs.css`, `layout/bottom-nav.css`, `layout/containers.css`.
4. **8.4** Remover CSS morto: após as fases 3–6, buscar por classe (`grep -r "nome-da-classe" src`) e apagar as sem uso.
5. **8.5** Remover `style={{…}}` restantes que viraram classes utilitárias; os dinâmicos (valores calculados) permanecem inline.

**Critério de aceite:** nenhum CSS > 300 linhas; comparação visual das telas sem diferença; build sem erros.

---

### 🚧 Fase 9 — Guardrails (para não voltar a crescer)

| Tarefa | Detalhe |
|---|---|
| **9.1** ESLint `max-lines` | `max-lines: ["warn", { max: 250, skipBlankLines: true, skipComments: true }]` e `max-lines-per-function` (warn, 80) em `src/**/*.tsx`. |
| **9.2** Regra de import | `no-restricted-imports` impedindo `api/client` dentro de `components/` e `pages/`. |
| **9.3** Documentar convenções | Atualizar `AGENTS.md` (seção "Estrutura de pastas"/"Convenções") com: limites de tamanho, padrão container/hook/apresentação, onde ficam Contexts e utils. |
| **9.4** Checklist de PR | Acrescentar em `docs/seguranca/02-checklist-pr.md` (ou doc de PR) o item "arquivo novo > 250 linhas? justificar ou dividir". |

---

## 5. Ordem recomendada e estimativa

| Etapa | Fases | Risco | Esforço (aprox.) |
|---|---|---|---|
| Fundação | 0, 1, 2 | Baixo | 1–2 dias |
| Maior retorno | 3, 4 | Médio | 2–3 dias |
| Estado compartilhado | 5, 7 | **Médio-alto** (mexe em fluxo de viagem) | 2–3 dias |
| Restante | 6, 8 | Baixo-médio | 3–4 dias |
| Consolidação | 9 | Baixo | 0,5 dia |

> [!TIP]
> Dá para parar ao fim de qualquer fase e o app continua íntegro. Se o tempo for curto, **priorize 0 → 1 → 2 → 3 → 4**: resolvem os dois maiores arquivos e já definem o padrão para o resto.

---

## 6. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Quebrar fluxo de viagem (Ida/Volta/Finalizar) ao unificar lógica (Fase 5.3) | Testar o checklist completo; manter a regra atual de **cada** chamada até confirmar qual é a correta (ver B1) antes de unificar |
| `useEffect` com dependências erradas ao extrair hooks (polling duplicado, closures velhas) | `eslint-plugin-react-hooks` ativo desde a Fase 0; revisar cleanup de `setInterval`/timers |
| Mudança sutil de CSS ao dividir arquivos | Manter ordem de import; comparar telas antes/depois (mobile 375 px e desktop) |
| Re-render excessivo ao introduzir Context | Separar contextos (turma × viagem); `useMemo` no `value`; Context só para estado realmente global |
| PRs gigantes difíceis de revisar | Um commit por passo; um PR por fase |
| Regressão de segurança | Seguir `docs/seguranca/02-checklist-pr.md`; nenhum dado sensível em logs; sem `innerHTML` |

---

## 7. Bugs/inconsistências observados no diagnóstico (NÃO corrigir dentro da refatoração)

Registrar como tarefas separadas, com commit `fix:` próprio, após confirmar o comportamento esperado:

| ID | Local | Observação |
|---|---|---|
| **B1** | `DriverHome.tsx` → `handleExecuteTripAction` (caso `tripType === "ida"`) | Chama `resetAllDailyBoarded()` **sem** `activeClassId`, enquanto o caso de encerrar a volta e o `DriverStudentList` passam o `activeClassId`. Pode zerar o embarque de **todas as turmas** ao finalizar a ida de uma só. Confirmar se é intencional. |
| **B2** | `DriverHome.tsx` → `handleUncancelTrip` | Usa só `activeClassId` (ignora seleção multi-turma usada ao cancelar). Cancelar em N turmas e desfazer só em 1 pode deixar inconsistência. |
| **B3** | `DriverStudentList.tsx` → `loadStudents` | N+1: 1 request de pagamento por aluno ativo a cada 15 s. Avaliar endpoint em lote no backend (`GET /payments/status?classId=`). |
| **B4** | `ChatWindow.tsx` | `longPressTimerRef` sem limpeza no unmount; `alert()` em erros. (Tratados nas Fases 2.5 e 4.2.) |
| **B5** | `DriverHome.tsx` / `DriverStudentList.tsx` | Dois fetches independentes de `/students` e dois "donos" de `tripType`. (Tratados nas Fases 5 e 7.5.) |

---

## 8. Definição de pronto (para cada fase)

- [ ] `npm run build` sem erros de TypeScript (`strict`)
- [ ] `npm run lint` sem erros novos
- [ ] `npm run test` passando
- [ ] Checklist manual de regressão executado (telas afetadas)
- [ ] Nenhum arquivo novo acima dos limites da seção 2
- [ ] Nenhum comportamento, texto de interface ou contrato de API alterado
- [ ] Checklist de segurança do PR (`docs/seguranca/02-checklist-pr.md`) conferido
- [ ] Commits em português no formato `refactor: …`
- [ ] Caixas de progresso deste documento atualizadas

---

## 9. Referências

- `AGENTS.md` — convenções, escopo e regras de segurança
- `docs/seguranca/01-principios-seguranca.md` e `02-checklist-pr.md`
- `docs/planos_implementacao/plano_correção_frontend.md` — modularização anterior do CSS (Fase 1 daquele plano é o ponto de partida da Fase 8 deste)
- `docs/05-consumo-api.md` — contratos de API consumidos pelo frontend (base da Fase 7)
