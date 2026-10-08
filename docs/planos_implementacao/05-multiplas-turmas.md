# Plano de Implementação: Múltiplas Turmas

Este plano detalha as tarefas necessárias para introduzir o conceito de "Turmas" (Classes) no sistema UniDrive, de acordo com o documento `docs/ideias/01-multiplas-turmas.md` e os princípios de segurança do projeto (`docs/seguranca/01-principios-seguranca.md`).

## Fase 1: Banco de Dados e Schema Prisma

### Tarefa 1.1: Atualização do `schema.prisma`
1. **Criar modelo `Class`**:
   - Campos: `id` (uuid), `driverId` (FK para Driver), `name` (string), `createdAt` (datetime).
   - Relação: Um `Driver` tem várias `Class`.
2. **Atualizar `Student`**:
   - Adicionar `classId` (FK obrigatória para `Class`).
3. **Atualizar `TripCancellation`**:
   - Adicionar `classId` (FK para `Class`).
   - Mudar a restrição de unicidade de `@@unique([driverId, date])` para `@@unique([classId, date])`, permitindo cancelar por turma.
4. **Atualizar `Announcement`**:
   - Adicionar `classId` (FK para `Class`).
5. **Atenção sobre `ChatMessage`**:
   - **NÃO** há alteração no modelo de chat. O chat continua sendo estritamente 1-a-1 (Driver <-> Student). O agrupamento por turma ou "Geral" será apenas um filtro visual (lista de contatos) no Frontend.

### Tarefa 1.2: Migration e Script de Migração de Dados
1. Criar um script (pode ser dentro de uma migration customizada ou no hook de startup) que:
   - Crie uma turma padrão (ex: "Turma Padrão") para cada `Driver` existente.
   - Atualize todos os `Student`, `TripCancellation` e `Announcement` atuais para apontarem para essa "Turma Padrão".
2. Rodar `npx prisma migrate dev --name add_classes`.

---

## Fase 2: Backend - Controladores, Serviços e Rotas

### Tarefa 2.1: CRUD de Turmas (`Class`)
1. **Schema Zod**: Criar esquemas para `createClass`, `updateClass`.
2. **Controller/Service**: Implementar `create`, `listByDriver`, `update`, `delete`.
3. **Segurança (BOLA)**: No service, toda operação (update/delete) deve verificar se `class.driverId === req.user.id`. Se não, retornar 404 (conforme `01-principios-seguranca.md`).
4. **Rotas**: Adicionar rotas protegidas por `authMiddleware` e `requireRole('driver')`.

### Tarefa 2.2: Ajustes no CRUD de Alunos
1. Atualizar criação e edição de `Student` para aceitar/requerer `classId`.
2. **Segurança**: Ao associar um aluno a uma turma, o backend **deve garantir** que o `classId` informado pertence ao `driverId` logado.

### Tarefa 2.3: Ajustes nos Domínios Afetados
1. **Contador/Status Diário (Dashboard)**:
   - A rota de listagem/resumo de status do dia deve passar a receber um `classId` na query string (ex: `GET /daily-status/summary?classId=...`).
   - O service deve garantir que o motorista que está lendo é o dono do `classId` (ou que o aluno está consultando o seu próprio).
2. **Mural (`Announcement`)**:
   - A rota `POST /announcements` deve ser atualizada para aceitar um array de `classIds` no body.
   - O service itera sobre os `classIds`, valida a posse de cada um (BOLA), e cria um registro de `Announcement` para cada turma selecionada.
3. **Cancelamento (`TripCancellation`)**:
   - O `POST /trip-cancellations` passa a aceitar um array de `classIds`.
   - Criar múltiplos registros, um por turma selecionada.
4. **Notificações Push**:
   - Adaptar o gatilho de "faltam N para embarcar" para rodar agrupado por turma.

---

## Fase 3: Backend - Listagem de Contatos no Chat

### Tarefa 3.1: Nova Rota de Listagem de Contatos
1. Criar ou atualizar a rota que o motorista usa para buscar com quem ele pode conversar (`GET /chat/contacts` ou similar):
   - Se receber um `classId` na query, retornar apenas os alunos daquela turma na lista.
   - Se não receber `classId` (ou receber parâmetro indicando "Geral"), retornar todos os alunos de todas as turmas daquele motorista.
2. **WebSocket e Mensagens**:
   - A lógica do WebSocket e o salvamento de mensagens (`ChatMessage`) **não mudam**. O envio e recebimento de mensagens continua sendo direto (1-a-1) entre `driverId` e `studentId`. O backend não precisa lidar com "salas" ou broadcast de chat.

---

## Fase 4: Frontend - Roteamento e Interface

### Tarefa 4.1: Tela Inicial e Gestão de Turmas
1. **Tela Inicial do Motorista (`ClassSelectionScreen`)**:
   - Listar cards simples de turmas.
   - Exibir indicadores de "faltantes" e "pendências" em cada card de forma simplificada.
   - Botão para **"Chat Geral"**.
2. **Contexto/Estado**:
   - Salvar o `activeClassId` no estado global (Context API ou Zustand) para que o dashboard não precise mudar drasticamente a estrutura das rotas.
   - Criar componente visual global ou botão no header para "Trocar de turma".

### Tarefa 4.2: Componentes Modificados
1. **Modal de Cancelamento do Dia**:
   - Atualizar para renderizar uma lista de checkboxes (selecionar várias turmas).
   - Incluir a opção "Selecionar todas".
2. **Modal do Mural de Avisos**:
   - Criar o "botão discreto" no header/menu do mural que abre o modal de checkboxes de turmas.
3. **Lista de Alunos / Criação**:
   - Ao criar o aluno, o motorista seleciona a turma dele em um `<select>`.
   - Exibir alunos filtrados pela turma ativa.
4. **Tela de Contatos / Chat**:
   - O chat continua sendo 1-a-1. Apenas a lista de alunos (contatos) muda.
   - Ao acessar o chat da turma atual, mostrar apenas os alunos daquela turma na lista de conversas.
   - Ao acessar o **Chat Geral**, listar todos os alunos (de todas as turmas do motorista) na lista de contatos, permitindo que o motorista selecione com quem deseja conversar.

---

## Observações Críticas de Segurança & Escopo
- **Sempre filtre os dados no backend**: A tela inicial pode pedir o `activeClassId`, mas todos os endpoints que recebem `classId` na query/body **precisam** validar com o banco de dados que a turma informada realmente pertence ao motorista autenticado (`driverId === req.user.id`). Responder sempre com `404 Not Found` caso não pertença (Princípio 2 e 4).
- **Sem `innerHTML` no Chat**: Mantenha renderização estrita de texto nas mensagens do chat (Princípio 8).
