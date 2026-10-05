# 📋 UniDrive — Plano de Implementação Frontend Baseado na API

> Mapeamento de rotas do backend com base no documento [`docs/05-consumo-api.md`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/docs/05-consumo-api.md), comparado com o estado atual do repositório [`frontend/`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src).

---

## 🔍 1. Matriz de Auditoria Geral das Rotas

Abaixo está o cruzamento completo de todas as rotas catalogadas no arquivo de referência contra o código do frontend existente.

| Seção | Método | Endpoint | Perfil / Auth | Status no Frontend | Onde está / Onde deveria estar |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/admins/login` | Público | ✅ Consumido | [`login.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/pages/login.tsx) |
| **Auth** | `POST` | `/api/auth/drivers/login` | Público | ✅ Consumido | [`login.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/pages/login.tsx) |
| **Auth** | `POST` | `/api/auth/students/login` | Público | ✅ Consumido | [`login.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/pages/login.tsx) |
| **Daily Status** | `POST` | `/api/daily-status/` | `student` | ✅ Consumido | [`useDailyStatus.ts`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/dailyStatus/useDailyStatus.ts) |
| **Daily Status** | `POST` | `/api/daily-status/checkin` | `student` | ✅ Consumido | [`useDailyStatus.ts`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/dailyStatus/useDailyStatus.ts) |
| **Daily Status** | `POST` | `/api/daily-status/cancel-boarded` | `student` | ✅ Consumido | [`useDailyStatus.ts`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/dailyStatus/useDailyStatus.ts) |
| **Daily Status** | `POST` | `/api/daily-status/checkin/:studentId` | `driver` | ✅ Consumido | [`DriverStudentList.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/driver/DriverStudentList.tsx) |
| **Daily Status** | `POST` | `/api/daily-status/cancel-boarded/:studentId` | `driver` | ✅ Consumido | [`DriverStudentList.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/driver/DriverStudentList.tsx) |
| **Daily Status** | `GET` | `/api/daily-status/missing-count` | Autenticado | ✅ Consumido | [`useDailyStatus.ts`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/dailyStatus/useDailyStatus.ts) |
| **Trip Cancellations** | `POST` | `/api/trip-cancellations/` | `driver` | ✅ Consumido | [`useDailyStatus.ts`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/dailyStatus/useDailyStatus.ts) |
| **Trip Cancellations** | `DELETE` | `/api/trip-cancellations/` | `driver` | ✅ Consumido | [`useDailyStatus.ts`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/dailyStatus/useDailyStatus.ts) |
| **Announcements** | `POST` | `/api/announcements/` | `driver` | ✅ Consumido | [`DriverHome.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/pages/DriverHome.tsx) |
| **Announcements** | `GET` | `/api/announcements/` | `student` / `driver` | ❌ **Ausente** | Deveria estar em `StudentHome.tsx` e `DriverHome.tsx` |
| **Admin** | `POST` | `/api/admin/admin` | `admin` | ❌ **Ausente** | Deveria estar no painel de administração (`AdminHome.tsx`) |
| **Admin** | `POST` | `/api/admin/driver` | `admin` | ✅ Consumido | [`DriverManagement.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/admin/DriverManagement.tsx) |
| **Admin** | `POST` | `/api/admin/student` | `admin` | ✅ Consumido | [`StudentManagement.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/admin/StudentManagement.tsx) |
| **Admin** | `GET` | `/api/admin/list/drivers` | `admin` | ✅ Consumido | [`DriverManagement.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/admin/DriverManagement.tsx) |
| **Admin** | `GET` | `/api/admin/list/drivers/:id` | `admin` | ❌ **Ausente** | Detalhes do motorista (modal/drawer) |
| **Admin** | `GET` | `/api/admin/list/students` | `admin` | ✅ Consumido | [`StudentManagement.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/admin/StudentManagement.tsx) |
| **Admin** | `GET` | `/api/admin/list/students/:id` | `admin` | ❌ **Ausente** | Detalhes do estudante (modal/drawer) |
| **Admin** | `DELETE` | `/api/admin/student/:id` | `admin` | ❌ **Ausente** | Ação de desativar aluno em `StudentManagement.tsx` |
| **Admin** | `DELETE` | `/api/admin/driver/:id` | `admin` | ✅ Consumido | [`DriverManagement.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/admin/DriverManagement.tsx) |
| **Admin** | `PATCH` | `/api/admin/student/reactivate/:id` | `admin` | ❌ **Ausente** | Botão de reativar aluno em `StudentManagement.tsx` |
| **Admin** | `PATCH` | `/api/admin/driver/reactivate/:id` | `admin` | ❌ **Ausente** | Aba/Ação de reativar motorista em `DriverManagement.tsx` |
| **Students** | `POST` | `/api/students/` | `driver` | ✅ Consumido | [`DriverStudentList.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/driver/DriverStudentList.tsx) |
| **Students** | `GET` | `/api/students/` | `driver` | ✅ Consumido | [`DriverStudentList.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/driver/DriverStudentList.tsx) |
| **Students** | `DELETE` | `/api/students/:id` | `driver` | ❌ **Ausente** | Ação de desativar passageiro em `DriverStudentList.tsx` |
| **Payments** | `GET` | `/api/payments/me` | `student` | ❌ **Ausente** | Aba "Pagamentos" em `StudentHome.tsx` |
| **Payments** | `GET` | `/api/payments/me/history` | `student` | ❌ **Ausente** | Histórico em `StudentHome.tsx` |
| **Payments** | `POST` | `/api/payments/me/pay` | `student` | ❌ **Ausente** | Botão "Marcar como Pago" em `StudentHome.tsx` |
| **Payments** | `PATCH` | `/api/payments/me/reminder` | `student` | ❌ **Ausente** | Configuração de lembretes em `StudentHome.tsx` |
| **Payments** | `POST` | `/api/payments/:studentId/pay` | `driver` | ❌ **Ausente** | Baixa de pagamento pelo motorista |
| **Payments** | `GET` | `/api/payments/student/:studentId` | `driver` | ❌ **Ausente** | Status financeiro do aluno na lista do motorista |
| **Push** | `GET` | `/api/push/public-key` | Público | ✅ Consumido | [`push.ts`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/api/push.ts) |
| **Push** | `POST` | `/api/push/subscribe` | Autenticado | ✅ Consumido | [`push.ts`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/api/push.ts) |

---
## 📌 2. Notas Técnicas e Resolução de Divergências da Documentação

> [!NOTE]
> **Status:** As inconsistências foram resolvidas e documentadas em [`docs/05-consumo-api.md`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/docs/05-consumo-api.md), que agora reflete fielmente as regras e roles do backend:
> 1. **`GET /api/announcements`**: Atualizado para autenticado (`student` / `driver`) — retorna os comunicados do motorista vinculado.
> 2. **`/api/students` (POST, GET, DELETE)**: Corrigido de `admin` para `driver` (RF09: gestão de passageiros da van pelo próprio motorista). As rotas globais de administrador permanecem sob `/api/admin/student` e `/api/admin/list/students`.
> 3. **`GET /api/daily-status/missing-count`**: Corrigido de pública para autenticado (`student` / `driver`) com dados contextuais de embarque do aluno.
> 4. **`POST /api/push/test`**: Adicionado à lista de rotas auxiliares sob autenticação.

---

## 📋 3. Detalhamento das Rotas Ausentes no Frontend

### 💳 Grupo A: Módulo de Pagamentos (`/api/payments`) — RF07 e RF08

#### 1. `GET /api/payments/me`
- **Role:** `student`
- **Payload:** Nenhum
- **Resposta:** Objeto `PaymentCycle`:
  ```ts
  interface PaymentCycle {
    id: string;
    studentId: string;
    referenceMonth: string; // ISO date
    reminderDaysBefore: number;
    paidAt: string | null;
    markedBy: "student" | "driver" | null;
  }
  ```
- **Onde entra no UI:** Substituir o placeholder `"Funcionalidade de pagamentos em breve!"` na aba de Pagamentos do [`StudentHome.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/pages/StudentHome.tsx) por um card com o status do mês atual (Pendente vs Pago, data de pagamento e quem confirmou).

#### 2. `GET /api/payments/me/history`
- **Role:** `student`
- **Payload:** Nenhum
- **Resposta:** Array de `PaymentCycle[]` com todos os ciclos anteriores do estudante.
- **Onde entra no UI:** Na aba de Pagamentos do aluno, logo abaixo do ciclo atual, exibir uma lista com meses anteriores e o status de quitação.

#### 3. `POST /api/payments/me/pay`
- **Role:** `student`
- **Payload:** Nenhum
- **Resposta:** Objeto `PaymentCycle` atualizado com `paidAt` preenchido e `markedBy: "student"`.
- **Onde entra no UI:** Botão *"Já paguei"* / *"Marcar como Pago"* no card de mensalidade em aberto do aluno.

#### 4. `PATCH /api/payments/me/reminder`
- **Role:** `student`
- **Payload:** `{ days: number }` (ex: 1, 2, 3 ou 5 dias de antecedência)
- **Resposta:** `PaymentCycle` atualizado com o novo `reminderDaysBefore`.
- **Onde entra no UI:** Seletor / Dropdown de configuração *"Lembrar-me X dias antes do vencimento"* na aba de Pagamentos do aluno.

#### 5. `GET /api/payments/student/:studentId`
- **Role:** `driver`
- **Parâmetros de Rota:** `studentId` (UUID)
- **Resposta:** `PaymentCycle` do mês atual para aquele passageiro.
- **Onde entra no UI:** Na lista de alunos do motorista ([`DriverStudentList.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/driver/DriverStudentList.tsx)), exibir um badge ou ícone indicativo do pagamento do mês (ex: 🟢 Pago / 🟡 Pendente).

#### 6. `POST /api/payments/:studentId/pay`
- **Role:** `driver`
- **Parâmetros de Rota:** `studentId` (UUID)
- **Payload:** Nenhum
- **Resposta:** `PaymentCycle` atualizado com `markedBy: "driver"`.
- **Onde entra no UI:** Ação no item do aluno ou em modal de detalhes para o motorista dar baixa manual no pagamento recebido (via Pix/dinheiro).

---

### 📢 Grupo B: Feed de Anúncios (`/api/announcements`) — RF05

#### 7. `GET /api/announcements`
- **Role:** `student` e `driver`
- **Payload:** Nenhum
- **Resposta:** Array `Announcement[]`:
  ```ts
  interface Announcement {
    id: string;
    driverId: string;
    message: string;
    createdAt: string;
  }
  ```
- **Onde entra no UI:**
  - **No Aluno ([`StudentHome.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/pages/StudentHome.tsx)):** Card ou aba de avisos com o mural dos comunicados mais recentes do motorista.
  - **No Motorista ([`DriverHome.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/pages/DriverHome.tsx)):** Na aba "Avisos", abaixo do formulário de envio, exibir o histórico dos recados já enviados com data/hora.

---

### 🎓 Grupo C: Gestão de Passageiros pelo Motorista (`/api/students`) — RF09

#### 8. `DELETE /api/students/:id`
- **Role:** `driver`
- **Parâmetros de Rota:** `id` (UUID do aluno)
- **Resposta:** `204 No Content`
- **Onde entra no UI:** Adicionar botão/ação *"Desativar aluno"* na listagem de passageiros do motorista ([`DriverStudentList.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/driver/DriverStudentList.tsx)), permitindo remover da van alunos que cancelaram o serviço.

---

### 🛠️ Grupo D: Painel Administrativo (`/api/admin`)

#### 9. `POST /api/admin/admin`
- **Role:** `admin`
- **Payload:** `{ name: string, email: string, password: string }`
- **Resposta:** `{ id: string, name: string, email: string }`
- **Onde entra no UI:** Em [`AdminHome.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/pages/AdminHome.tsx), adicionar nova aba ou botão modal para cadastro de novos administradores do sistema.

#### 10. `DELETE /api/admin/student/:id`
- **Role:** `admin`
- **Parâmetros de Rota:** `id` (UUID do aluno)
- **Resposta:** Aluno desativado
- **Onde entra no UI:** Em [`StudentManagement.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/admin/StudentManagement.tsx), na aba "Ativos", incluir o botão de ação *"Desativar"* para cada aluno.

#### 11. `PATCH /api/admin/student/reactivate/:id`
- **Role:** `admin`
- **Parâmetros de Rota:** `id` (UUID do aluno)
- **Resposta:** Aluno reativado
- **Onde entra no UI:** Em [`StudentManagement.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/admin/StudentManagement.tsx), na aba "Desativados", incluir o botão *"Reativar"*.

#### 12. `PATCH /api/admin/driver/reactivate/:id`
- **Role:** `admin`
- **Parâmetros de Rota:** `id` (UUID do motorista)
- **Resposta:** Motorista reativado
- **Onde entra no UI:** Em [`DriverManagement.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/admin/DriverManagement.tsx), criar alternador de filtro (Ativos / Desativados) similar ao dos alunos e adicionar o botão *"Reativar"*.

#### 13. `GET /api/admin/list/drivers/:id` e `GET /api/admin/list/students/:id`
- **Role:** `admin`
- **Parâmetros de Rota:** `id` (UUID)
- **Resposta:** Objeto completo da entidade com dados de relacionamento.
- **Onde entra no UI:** Modal de detalhes ao clicar em um motorista ou aluno na tabela administrativa.

---

## 🏗️ 4. Estrutura Recomendada para a Camada de API (`frontend/src/api`)

Atualmente, o frontend possui chamadas diretas com `apiRequest` espalhadas nos componentes. Recomenda-se organizar a camada em módulos tipados:

```
frontend/src/api/
├── client.ts              # Existente (fetch wrapper e storage)
├── push.ts                # Existente (Web Push)
├── auth.ts                # NOVO: loginAdmin, loginDriver, loginStudent
├── dailyStatus.ts         # NOVO: setDailyStatus, checkIn, cancelBoarded, getMissingCount
├── tripCancellation.ts    # NOVO: cancelTrip, uncancelTrip
├── announcements.ts       # NOVO: getAnnouncements, publishAnnouncement
├── payments.ts            # NOVO: getMyCycle, getMyHistory, markMyCyclePaid, updateReminderDays, ...
├── students.ts            # NOVO: getStudents, createStudent, deactivateStudent
└── admin.ts               # NOVO: crud de admins, motoristas e estudantes
```

---

## 🚀 5. Plano de Implementação em Fases e Tasks

Abaixo estão as tarefas ordenadas por prioridade de impacto para o MVP.

### FASE 1: Centralização e Tipagem da Camada de API
- [x] **Task 1.1**: Criar `frontend/src/api/announcements.ts` com tipagens (`Announcement`) e funções:
  - `getAnnouncements()` -> `GET /announcements`
  - `publishAnnouncement(message: string)` -> `POST /announcements`
- [x] **Task 1.2**: Criar `frontend/src/api/payments.ts` com tipagens (`PaymentCycle`, `MarkedBy`) e funções:
  - `getMyCurrentCycle()` -> `GET /payments/me`
  - `getMyPaymentHistory()` -> `GET /payments/me/history`
  - `payMyCycle()` -> `POST /payments/me/pay`
  - `updateReminderDays(days: number)` -> `PATCH /payments/me/reminder`
  - `getStudentPaymentStatus(studentId: string)` -> `GET /payments/student/:studentId`
  - `markStudentPaidByDriver(studentId: string)` -> `POST /payments/:studentId/pay`
- [x] **Task 1.3**: Criar `frontend/src/api/students.ts` com:
  - `getDriverStudents()` -> `GET /students`
  - `createDriverStudent(...)` -> `POST /students`
  - `deactivateDriverStudent(studentId: string)` -> `DELETE /students/:id`
- [x] **Task 1.4**: Criar `frontend/src/api/admin.ts` com:
  - `createAdmin(...)` -> `POST /admin/admin`
  - `getDriverById(id: string)` -> `GET /admin/list/drivers/:id`
  - `getStudentById(id: string)` -> `GET /admin/list/students/:id`
  - `deactivateAdminStudent(id: string)` -> `DELETE /admin/student/:id`
  - `reactivateAdminStudent(id: string)` -> `PATCH /admin/student/reactivate/:id`
  - `reactivateAdminDriver(id: string)` -> `PATCH /admin/driver/reactivate/:id`

---

### FASE 2: Implementação do Módulo de Pagamentos no Frontend (RF07 / RF08)
- [x] **Task 2.1**: Criar o componente `StudentPaymentsCard` em `frontend/src/features/payments/StudentPaymentsCard.tsx`:
  - Carregar dados de `getMyCurrentCycle()` e `getMyPaymentHistory()`.
  - Exibir status da mensalidade (Badge: "Pago" ou "Pendente").
  - Botão de ação "Marcar como Pago" que invoca `payMyCycle()`.
  - Seletor com confirmação para alterar dias de antecedência de lembrete (`updateReminderDays`).
  - Lista de meses anteriores do histórico.
- [x] **Task 2.2**: Integrar `StudentPaymentsCard` na aba `"payments"` de [`StudentHome.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/pages/StudentHome.tsx), substituindo o aviso provisório.
- [x] **Task 2.3**: Criar controle de pagamento na visão do motorista em [`DriverStudentList.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/driver/DriverStudentList.tsx):
  - Consultar `getStudentPaymentStatus(student.id)` para cada passageiro.
  - Exibir indicador visual de pagamento na listagem.
  - Adicionar botão para o motorista dar baixa manual (`markStudentPaidByDriver`).

---

### FASE 3: Feed e Mural de Avisos em Tempo Real (RF05)
- [x] **Task 3.1**: Criar o componente `AnnouncementList` em `frontend/src/features/announcements/AnnouncementList.tsx`:
  - Fazer busca periódica (polling a cada ~30s ou ao abrir a tela) de `getAnnouncements()`.
  - Renderizar os comunicados com formatação amigável de data e hora.
- [x] **Task 3.2**: Exibir `AnnouncementList` na tela do aluno ([`StudentHome.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/pages/StudentHome.tsx)), garantindo que o aluno veja os avisos emitidos pelo seu motorista.
- [x] **Task 3.3**: Exibir o histórico de avisos em [`DriverHome.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/pages/DriverHome.tsx) logo abaixo do formulário de publicação, atualizando a lista assim que uma nova mensagem for postada.

---

### FASE 4: Gestão Completa de Passageiros pelo Motorista (RF09)
- [x] **Task 4.1**: Adicionar botão/ação de desativação na listagem do motorista ([`DriverStudentList.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/driver/DriverStudentList.tsx)):
  - Modal de confirmação *"Deseja realmente desativar este aluno da van?"*.
  - Chamar `deactivateDriverStudent(student.id)`.
  - Atualizar o estado local e exibir toast de sucesso.

---

### FASE 5: Completar Ações do Painel Administrativo
- [x] **Task 5.1**: Em [`StudentManagement.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/admin/StudentManagement.tsx):
  - Adicionar botão "Desativar" no card de cada aluno ativo (`DELETE /admin/student/:id`).
  - Adicionar botão "Reativar" no card de cada aluno inativo (`PATCH /admin/student/reactivate/:id`).
- [x] **Task 5.2**: Em [`DriverManagement.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/admin/DriverManagement.tsx):
  - Adicionar abas de filtro "Ativos" e "Desativados".
  - Adicionar botão "Reativar" para motoristas inativos (`PATCH /admin/driver/reactivate/:id`).
- [x] **Task 5.3**: Em [`AdminHome.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/pages/AdminHome.tsx):
  - Adicionar botão/modal para criar novos administradores (`POST /admin/admin`).
- [x] **Task 5.4**: Criar modal de detalhes (`GET /admin/list/drivers/:id` e `GET /admin/list/students/:id`) para consulta rápida.

---

### FASE 6: Validação e Testes E2E
- [x] **Task 6.1**: Testar fluxo completo do aluno: verificar status do dia, marcar check-in, visualizar avisos, consultar ciclo de pagamento, marcar como pago e definir lembrete.
- [x] **Task 6.2**: Testar fluxo do motorista: ver contagem de faltantes, embarcar/desembarcar alunos, desativar aluno, dar baixa de pagamento, publicar e visualizar avisos.
- [x] **Task 6.3**: Testar fluxo do admin: criar admin, gerenciar ativação/desativação/reativação de alunos e motoristas.
