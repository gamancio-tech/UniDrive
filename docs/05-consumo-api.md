# 🚐 UniDrive API — Rotas e Documentação de Endpoints

> Documentação completa dos endpoints da API REST e WebSocket do UniDrive (`/api`).
> Todas as rotas (exceto `/auth/*` e `/push/public-key`) exigem cabeçalho `Authorization: Bearer <token>`.

---

## 🔐 Autenticação (`/api/auth`)

| Método | Endpoint | Autenticação | Rate Limit | Descrição |
| --- | --- | --- | --- | --- |
| `POST` | `/admins/login` | Pública | IP + Email | Login de administrador |
| `POST` | `/drivers/login` | Pública | IP + Email | Login de motorista |
| `POST` | `/drivers/register`| Pública | IP + Email | Cadastro inicial de motorista |
| `POST` | `/students/login` | Pública | IP + Email | Login de estudante |

---

## 🏫 Turmas (`/api/classes`)

> Gestão de múltiplas turmas por motorista (RF11). Protegido contra BOLA/IDOR.

| Método | Endpoint | Autenticação | Descrição |
| --- | --- | --- | --- |
| `GET` | `/` | `driver` | Listar todas as turmas do motorista com contagem de alunos ativos |
| `POST` | `/` | `driver` | Criar nova turma (`name`) — sujeito a rate limit dedicado |
| `PUT` | `/:id` | `driver` | Atualizar nome da turma |
| `DELETE` | `/:id` | `driver` | Excluir turma (cascade nos alunos vinculados) |

---

## 📋 Daily Status & Operação (`/api/daily-status`)

> Controle diário de presença, embarques e contagem de faltantes (RF01, RF02, RF04).

| Método | Endpoint | Autenticação | Descrição |
| --- | --- | --- | --- |
| `POST` | `/` | `student` | Definir status diário pontual (`vai_normal`, `so_ida`, `so_volta`, `nao_vai` e `date`) |
| `POST` | `/checkin` | `student` | Aluno realiza o próprio check-in de embarque |
| `POST` | `/cancel-boarded` | `student` | Aluno desfaz o próprio check-in |
| `POST` | `/checkin/:studentId` | `driver` | Motorista confirma embarque do passageiro |
| `POST` | `/cancel-boarded/:studentId` | `driver` | Motorista desfaz embarque do passageiro |
| `POST` | `/reset-all` | `driver` | Finaliza trajeto e reseta embarques do dia (suporta `?classId=` opcional) |
| `POST` | `/trip-state` | `driver` | Atualiza o estado da viagem (`trip`: "ida"/"volta", `step`: "aguardando"/"em_viagem") |
| `GET` | `/missing-count` | `student` / `driver` | Retorna faltantes da viagem atual, status contextual e se a viagem foi cancelada (suporta `?trip=` e `?classId=`) |

---

## 💬 Chat em Tempo Real (`/api/chat` e `/ws/chat`)

> Chat individual 1:1 entre motorista e alunos (RF10).

### Endpoints REST

| Método | Endpoint | Autenticação | Descrição |
| --- | --- | --- | --- |
| `GET` | `/history/:partnerId` | `student` / `driver` | Histórico paginado da conversa (`?limit=50&beforeId=<uuid>`) |
| `DELETE`| `/messages/:id` | `student` / `driver` | Apagar mensagem pontual (`body: { scope: "me" \| "everyone" }`) com rate limit |
| `DELETE`| `/history/:partnerId` | `student` / `driver` | Limpar todo o histórico da conversa para o usuário logado com rate limit |
| `GET` | `/conversations` | `driver` | Lista de contatos/conversas com última mensagem e badges de não lidas (suporta `?classId=`) |
| `GET` | `/unread-count` | `student` / `driver` | Total de mensagens não lidas para o usuário autenticado |

### WebSocket (`ws://<host>/ws/chat?token=<jwt>`)

Eventos JSON bidirecionais suportados:
- **`send_message`**: Envia mensagem 1:1 para o destinatário (`{ partnerId, content }`).
- **`receive_message`**: Notificação push em tempo real de nova mensagem entregue.
- **`mark_as_read`**: Marca mensagens recebidas como lidas (`{ partnerId }`).
- **`message_read`**: Confirmação de leitura enviada ao remetente.
- **`delete_message`**: Apaga mensagem para si ou para todos (`{ messageId, scope }`).
- **`clear_conversation`**: Notifica a limpeza de histórico da conversa.

---

## 🎓 Alunos (`/api/students`)

| Método | Endpoint | Autenticação | Descrição |
| --- | --- | --- | --- |
| `GET` | `/me/profile` | `student` | Retorna o perfil completo do aluno e dados de contato do motorista |
| `PATCH` | `/me/photo` | `student` | Atualiza foto de perfil (base64 com verificação de magic bytes) |
| `PATCH` | `/me/phone` | `student` | Atualiza telefone para contato |
| `GET` | `/me/weekly-schedule` | `student` | Consulta a rotina semanal padrão de presença (segunda a sábado) |
| `PUT` | `/me/weekly-schedule` | `student` | Atualiza a rotina semanal padrão |
| `POST` | `/` | `driver` | Motorista cadastra aluno com senha provisória e turma vinculada |
| `GET` | `/` | `driver` | Lista alunos com status do dia ou por status ativo/inativo (suporta `?status=` e `?classId=`) |
| `PATCH` | `/:id/phone` | `driver` | Motorista atualiza o telefone de um aluno |
| `PATCH` | `/:id/reactivate` | `driver` | Reativa aluno desativado na van |
| `DELETE` | `/:id` | `driver` | Desativa aluno da van |

---

## 🚫 Cancelamentos de Viagem (`/api/trip-cancellations`)

| Método | Endpoint | Autenticação | Descrição |
| --- | --- | --- | --- |
| `POST` | `/` | `driver` | Cancela a operação do dia para uma ou mais turmas (`body: { date, reason, classIds: string[] }`) |
| `DELETE` | `/` | `driver` | Desfaz o cancelamento da data para as turmas especificadas |

---

## 📢 Mural de Avisos (`/api/announcements`)

| Método | Endpoint | Autenticação | Descrição |
| --- | --- | --- | --- |
| `GET` | `/` | `student` / `driver` | Lista avisos recentes (filtrado por `?classId=` ou da turma do aluno) |
| `POST` | `/` | `driver` | Publica aviso no mural para uma ou várias turmas (`body: { message, classIds: string[] }`) |

---

## 💳 Pagamentos (`/api/payments`)

| Método | Endpoint | Autenticação | Descrição |
| --- | --- | --- | --- |
| `GET` | `/me` | `student` | Retorna ciclo de pagamento do mês atual e dados da chave Pix do motorista |
| `GET` | `/me/history` | `student` | Histórico dos últimos ciclos de pagamento |
| `POST` | `/me/pay` | `student` | Aluno solicita confirmação de pagamento ao motorista |
| `PATCH` | `/me/reminder` | `student` | Configura dias de antecedência do lembrete de pagamento |
| `POST` | `/:studentId/pay` | `driver` | Motorista dá baixa manual confirmando o recebimento do mês |
| `POST` | `/:studentId/reject`| `driver` | Motorista recusa a solicitação de baixa de pagamento |
| `GET` | `/student/:studentId`| `driver` | Consulta status financeiro detalhado de um aluno |

---

## 🔔 Notificações Web Push (`/api/push`)

| Método | Endpoint | Autenticação | Descrição |
| --- | --- | --- | --- |
| `GET` | `/public-key` | Pública | Retorna a chave pública VAPID para registro do Service Worker |
| `POST` | `/subscribe` | Autenticado | Salva a inscrição PushSubscription no banco |
| `POST` | `/unsubscribe` | Autenticado | Remove a inscrição do dispositivo durante o logout |
| `POST` | `/test` | Autenticado | Dispara push de teste para o dispositivo atual |

---

## 🛠️ Painel Administrativo (`/api/admin`)

| Método | Endpoint | Autenticação | Descrição |
| --- | --- | --- | --- |
| `POST` | `/admin` | `super_admin` | Cadastrar novo administrador |
| `GET` | `/list/admins` | `super_admin` | Listar administradores |
| `DELETE` | `/admin/:id` | `super_admin` | Remover administrador |
| `POST` | `/driver` | `admin` | Cadastrar novo motorista no sistema |
| `GET` | `/list/drivers` | `admin` | Listar motoristas com contadores de alunos |
| `GET` | `/list/drivers/:id` | `admin` | Detalhes do motorista |
| `DELETE` | `/driver/:id` | `admin` | Desativar motorista |
| `PATCH` | `/driver/reactivate/:id` | `admin` | Reativar motorista |
| `GET` | `/list/students` | `admin` | Listar todos os estudantes da plataforma |
| `DELETE` | `/student/:id` | `admin` | Desativar estudante |
| `PATCH` | `/student/reactivate/:id` | `admin` | Reativar estudante |