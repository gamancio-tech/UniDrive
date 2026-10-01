# 🚐 UniDrive API — Rotas

> Documentação de referência dos endpoints disponíveis em `https://unidrive.onrender.com/api`

---

## 🔐 Auth

`/api/auth`

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `POST` | `/admins/login` | Login de administrador |
| `POST` | `/drivers/login` | Login de motorista |
| `POST` | `/students/login` | Login de estudante |

---

## 📋 Daily Status

`/api/daily-status`

| Método | Endpoint | Autenticação | Descrição |
| --- | --- | --- | --- |
| `POST` | `/` | `student` | Criar ou atualizar status diário de um estudante (`vai_normal`, `so_ida`, `so_volta`, `nao_vai`) |
| `POST` | `/checkin` | `student` | Aluno registrar o próprio embarque |
| `POST` | `/cancel-boarded` | `student` | Aluno cancelar o próprio embarque registrado |
| `POST` | `/checkin/:studentId` | `driver` | Motorista registrar embarque de um estudante |
| `POST` | `/cancel-boarded/:studentId` | `driver` | Motorista cancelar o embarque de um estudante |
| `GET` | `/missing-count` | `student` / `driver` | Obter contagem de faltantes e status contextual do aluno |

---

## 🚫 Trip Cancellations

`/api/trip-cancellations`

| Método | Endpoint | Autenticação | Descrição |
| --- | --- | --- | --- |
| `POST` | `/` | `driver` | Cancelar viagem do dia |
| `DELETE` | `/` | `driver` | Desfazer cancelamento do dia |

---

## 📢 Announcements

`/api/announcements`

| Método | Endpoint | Autenticação | Descrição |
| --- | --- | --- | --- |
| `GET` | `/` | `student` / `driver` | Listar anúncios do mural da van vinculada |
| `POST` | `/` | `driver` | Publicar anúncio no mural (somente motorista) |

---

## 🛠️ Admin

`/api/admin`

| Método | Endpoint | Autenticação | Descrição |
| --- | --- | --- | --- |
| `POST` | `/admin` | `super_admin` | Criar administrador (exclusivo Super Admin) |
| `GET` | `/list/admins` | `super_admin` | Listar administradores (exclusivo Super Admin) |
| `DELETE` | `/admin/:id` | `super_admin` | Remover administrador (exclusivo Super Admin) |
| `POST` | `/driver` | `admin` | Criar motorista |
| `POST` | `/student` | `admin` | Criar estudante |
| `GET` | `/list/drivers` | `admin` | Listar motoristas |
| `GET` | `/list/drivers/:id` | `admin` | Obter motorista por ID |
| `GET` | `/list/students` | `admin` | Listar estudantes |
| `GET` | `/list/students/:id` | `admin` | Obter estudante por ID |
| `DELETE` | `/student/:id` | `admin` | Desativar estudante |
| `DELETE` | `/driver/:id` | `admin` | Desativar motorista |
| `PATCH` | `/student/reactivate/:id` | `admin` | Reativar estudante |
| `PATCH` | `/driver/reactivate/:id` | `admin` | Reativar motorista |

---

## 🎓 Students

`/api/students` (Gestão de Passageiros pelo Motorista — RF09)

| Método | Endpoint | Autenticação | Descrição |
| --- | --- | --- | --- |
| `POST` | `/` | `driver` | Cadastrar estudante vinculado à van do motorista |
| `GET` | `/` | `driver` | Listar estudantes vinculados à van do motorista |
| `DELETE` | `/:id` | `driver` | Desativar estudante da van |

---

## 💳 Payments

`/api/payments`

| Método | Endpoint | Autenticação | Descrição |
| --- | --- | --- | --- |
| `GET` | `/me` | `student` | Obter ciclo de pagamento atual |
| `GET` | `/me/history` | `student` | Histórico de pagamentos |
| `POST` | `/me/pay` | `student` | Aluno marcar ciclo como pago |
| `PATCH` | `/me/reminder` | `student` | Atualizar dias de antecedência dos lembretes |
| `POST` | `/:studentId/pay` | `driver` | Motorista registrar/confirmar pagamento de um estudante |
| `GET` | `/student/:studentId` | `driver` | Status de pagamento de um estudante específico |

---

## 🔔 Push Notifications

`/api/push`

| Método | Endpoint | Autenticação | Descrição |
| --- | --- | --- | --- |
| `GET` | `/public-key` | — | Obter chave pública VAPID |
| `POST` | `/subscribe` | `student` / `driver` / `admin` | Inscrever-se para receber notificações push |
| `POST` | `/test` | `student` / `driver` / `admin` | Enviar notificação push de teste para o usuário autenticado |

---

### Legendas

- `student` / `driver` / `admin` → tipo de usuário exigido para autenticação
- `student` / `driver` → acessível tanto para estudantes quanto motoristas autenticados
- `—` → rota pública, sem necessidade de autenticação