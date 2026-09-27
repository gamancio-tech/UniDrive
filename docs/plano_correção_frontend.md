# Plano Integrado de Correções e Melhorias (Frontend & Backend) — UniDrive

Este documento é o roteiro completo de correções técnicas, ajustes de regras de negócio e melhorias de UX para o UniDrive (PWA). Ele consolida as implementações já realizadas no frontend e todas as correções diagnosticadas no backend.

---

## 📊 Progresso Geral

- [x] **Fase 1 (Frontend):** Modularização do CSS (Separação em `index.css`, `components.css`, `layout.css`)
- [x] **Fase 2 (Frontend):** Menu Inferior Fixo (`BottomNavigation.tsx` com navegação por abas)
- [x] **Fase 3 (Frontend):** Limpeza de nomenclaturas técnicas (`[RF01]`, `[RF09]`, etc.)
- [x] **Fase 4 (Frontend):** Ajustes de responsividade mobile e correções no `Modal` e tela de `Login`
- [ ] **Fase 5 (Backend):** Correções de regras de negócio e erros críticos de API (8 tarefas)
- [ ] **Fase 6 (Frontend & Integração):** Sincronização de contratos de API e refinamentos de UI/UX (5 tarefas)

---

## 🏗️ Fase 1 a 4 — Melhorias no Frontend (Concluídas ✅)

### ✅ Tarefas Realizadas:
1. **Descentralização do CSS**: Redução drástica do `index.css` para apenas tokens, reset e tipografia base. Criação de `components.css` (botões, cards, badges, inputs, modais) e `layout.css` (header, tabs, bottom nav e containers).
2. **Bottom Navigation**: Componente `BottomNavigation.tsx` adicionado aos painéis de Aluno e Motorista, garantindo padrão de aplicativo móvel nativo.
3. **Limpeza Visual**: Remoção de referências de requisitos técnicos visíveis ao usuário final (`RF01`, `RF05`, `RF09`).
4. **Mobile First & Layout**: Ajuste do padding do container principal no mobile para evitar que os cards encostem nas bordas, e correção do espaçamento interno de modais.
5. **Feedback de Van Completa**: Exibição de mensagem amigável no painel do motorista quando `missingCount === 0`.

---

## 🔧 Fase 5 — Correções no Backend (Pendentes 🚀)

As seguintes tarefas foram mapeadas diretamente na auditoria do código do backend para sanar falhas de sincronização, erros de compilação e bloqueios indevidos:

### 🔴 Tarefas Críticas

#### `TASK-BE-01`: Correção do `driverId` na contagem de faltantes e cancelamento
* **Arquivo:** [`backend/src/controllers/dailyStatus.controller.ts`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/backend/src/controllers/dailyStatus.controller.ts) (método `getMissingCount`)
* **Problema:** O endpoint `GET /api/daily-status/missing-count` assume `const driverId = req.user.id;`. Para alunos, `req.user.id` é o ID do aluno, fazendo com que a busca de cancelamentos e alunos faltantes procure por um motorista inexistente.
* **Sintoma:** O aluno sempre recebe `missingCount: 0` e `cancelled: false`, mesmo se o motorista tiver cancelado a viagem do dia.
* **Solução:** Identificar se o usuário autenticado é aluno ou motorista:
  ```ts
  const driverId = req.user.role === "student" ? req.user.driverId : req.user.id;
  ```

---

#### `TASK-BE-02`: Implementação da rota para o motorista desfazer embarque de aluno
* **Arquivos:**
  * [`backend/src/routes/dailyStatus.routes.ts`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/backend/src/routes/dailyStatus.routes.ts)
  * [`backend/src/controllers/dailyStatus.controller.ts`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/backend/src/controllers/dailyStatus.controller.ts)
* **Problema:** Existe a rota `POST /checkin/:studentId`, mas não há a rota oposta para o motorista reverter o embarque (`POST /cancel-boarded/:studentId`).
* **Sintoma:** Ao clicar no botão "Desfazer" na lista de alunos do motorista, a requisição falha com **404 Not Found**.
* **Solução:**
  1. Adicionar o método `cancelBoardedByDriver` no `dailyStatusController`:
     ```ts
     const { studentId } = req.params;
     const updated = await dailyStatusService.cancelBoarded(studentId, new Date());
     res.status(StatusCodeHttp.OK).json(updated);
     ```
  2. Registrar em `dailyStatusRoutes`:
     ```ts
     dailyStatusRoutes.post("/cancel-boarded/:studentId", requireRole("driver"), dailyStatusController.cancelBoardedByDriver);
     ```

---

#### `TASK-BE-03`: Correção dos erros de compilação TypeScript no `student.controller.ts`
* **Arquivos:**
  * [`backend/src/services/student.service.ts`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/backend/src/services/student.service.ts)
  * [`backend/src/controllers/student.controller.ts`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/backend/src/controllers/student.controller.ts)
* **Problema:** O método `listActiveAll()` existe no `studentRepository`, mas não foi declarado no `studentService`. Além disso, a variável `let students;` ficou sem tipagem, gerando erros `TS2339` e `TS7006`.
* **Sintoma:** O backend falha no type-check estático (`npx tsc --noEmit`).
* **Solução:**
  1. Expor no `studentService`:
     ```ts
     listActiveAll() {
       return studentRepository.listActiveAll();
     }
     ```
  2. Tipar a variável `students` adequadamente no controller.

---

#### `TASK-BE-04`: Liberação de leitura do Mural de Avisos para Estudantes
* **Arquivo:** [`backend/src/controllers/announcement.controller.ts`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/backend/src/controllers/announcement.controller.ts) (método `list`)
* **Problema:** O método `list` contém a trava `if (!hasRole(req.user!, "driver"))`, bloqueando estudantes de lerem os avisos publicados pelo motorista.
* **Sintoma:** Os alunos recebem **403 Forbidden** ao carregar o mural.
* **Solução:** Permitir tanto motoristas quanto estudantes na listagem. Obter o `driverId` correto de acordo com a role:
  ```ts
  const driverId = req.user.role === "student" ? req.user.driverId : req.user.id;
  const announcements = await announcementService.list(driverId);
  ```

---

### 🟡 Tarefas de Contrato e Integração

#### `TASK-BE-05`: Retornar status diário e flag `isBoarded` na listagem de alunos
* **Arquivo:** [`backend/src/controllers/student.controller.ts`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/backend/src/controllers/student.controller.ts) (ou novo endpoint dedicado em `dailyStatus`)
* **Problema:** O endpoint `GET /api/students` traz apenas `{ id, name, email }`. Ele não inclui o status do dia nem a confirmação de embarque (`boardedAt`).
* **Sintoma:** Ao carregar a tela "Meus Alunos", o motorista não sabe quem já embarcou ou quem vai faltar hoje até que clique individualmente em algo.
* **Solução:** Utilizar `dailyStatusRepository.listStudentsWithStatusForDate(driverId, today)` para enriquecer o retorno com:
  ```json
  {
    "id": "...",
    "name": "...",
    "email": "...",
    "todayStatus": "vai_normal",
    "isBoarded": true
  }
  ```

---

#### `TASK-BE-06`: Correção de parâmetro na listagem de estudantes do Admin
* **Arquivo:** [`backend/src/controllers/admin.controller.ts`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/backend/src/controllers/admin.controller.ts) (método `getStudentByStatus`)
* **Problema:** O controller lê `const { status } = req.params;`, mas a rota em `admin.routes.ts` é `/list/students` (o parâmetro vem na query string: `?status=true`).
* **Sintoma:** O painel de admin quebra com **400 Bad Request ("Status inválido")**.
* **Solução:** Obter de `req.query`:
  ```ts
  const status = (req.query.status as string) || "true";
  ```

---

#### `TASK-BE-07`: Padronização de prefixo de rota Admin (`/admin` vs `/admins`)
* **Arquivo:** [`backend/src/routes/index.ts`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/backend/src/routes/index.ts) ou nos componentes de front
* **Problema:** O backend registra `routes.use("/admins", adminRoutes)`, mas os componentes do frontend chamam `/admin/list/...`.
* **Sintoma:** Requisições administrativas retornam **404 Not Found**.
* **Solução:** Aceitar ambas as rotas no backend ou padronizar para `/admin`.

---

#### `TASK-BE-08`: Permissões de pagamento para motoristas (RF08)
* **Arquivo:** [`backend/src/routes/payment.routes.ts`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/backend/src/routes/payment.routes.ts)
* **Problema:** A rota possui `requireRole("student")` como middleware global, impedindo o motorista de acessar a API para marcar pagamentos manuais.
* **Solução:** Reorganizar as rotas para que `/me/*` seja restrito a estudantes, e adicionar rotas para motorista listar pagamentos e marcar pagamento por aluno (`POST /payments/:studentId/pay`).

---

## 🎨 Fase 6 — Ajustes no Frontend e UI/UX (Pendentes 🚀)

Após as correções no backend, as seguintes tarefas alinharão a interface do usuário:

#### `TASK-FE-01`: Ajuste das URLs de administração
* **Arquivos:** [`DriverManagement.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/admin/DriverManagement.tsx) e [`StudentManagement.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/admin/StudentManagement.tsx)
* **Ação:** Sincronizar as chamadas de API com a rota padronizada no backend.

#### `TASK-FE-02`: Exibição em tempo real do status de embarque e presença na lista do motorista
* **Arquivo:** [`DriverStudentList.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/driver/DriverStudentList.tsx)
* **Ação:** Consumir os campos `isBoarded` e `todayStatus` retornados pela API atualizada, exibindo badges coloridos (ex.: Verde para "Embarcado", Azul para "Vai normal", Cinza para "Não vai hoje").

#### `TASK-FE-03`: Destaque visual do status ativo do aluno (UX-03)
* **Arquivo:** [`StudentDailyStatus.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/features/student/StudentDailyStatus.tsx)
* **Ação:** O botão do status atualmente selecionado deve ter destaque visual evidente (estilo sólido / ativo) para que o aluno saiba com clareza seu status atual sem dúvidas.

#### `TASK-FE-04`: Timestamp e indicador de polling ativo (UX-06)
* **Arquivos:** [`DriverHome.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/pages/DriverHome.tsx) e [`StudentHome.tsx`](file:///c:/Users/HP%20LAPTOP/Desktop/UniDrive/frontend/src/pages/StudentHome.tsx)
* **Ação:** Incluir legenda sutil: *"Atualizado às 17:42 • Ao vivo"*, transmitindo confiança e clareza sobre o tempo real.

#### `TASK-FE-05`: Tratamento de erro resiliente e feedbacks com toast/notificação
* **Arquivos:** Componentes de ação (`StudentHome`, `DriverStudentList`)
* **Ação:** Substituir chamadas nativas de `alert()` por mensagens de feedback integradas ao design do app.

---

## 🧪 Roteiro de Testes e Validação Final

Ao concluir as tarefas, o seguinte checklist deve ser validado:

1. **Fluxo do Aluno:**
   - [ ] Login como aluno.
   - [ ] Alterar status para "Só Volta" e verificar se persiste.
   - [ ] Observar o contador de faltantes refletindo a contagem correta da van.
   - [ ] Realizar check-in de embarque próprio e verificar atualização imediata.
   - [ ] Verificar se os avisos do motorista aparecem no mural sem erro 403.
2. **Fluxo do Motorista:**
   - [ ] Login como motorista.
   - [ ] Acessar "Meus Alunos" e ver a lista com o status de presença e embarque de cada um.
   - [ ] Marcar o embarque de um aluno manualmente.
   - [ ] Clicar em "Desfazer embarque" e verificar a reversão sem erro 404.
   - [ ] Cancelar a viagem do dia e verificar se a tela do aluno atualiza imediatamente via polling desabilitando o check-in.
   - [ ] Publicar um aviso no mural e verificar se os alunos recebem.
3. **Fluxo do Administrador:**
   - [ ] Login como admin.
   - [ ] Listar motoristas e cadastrar novo motorista.
   - [ ] Listar estudantes filtrando por ativos/inativos sem erro 400.
