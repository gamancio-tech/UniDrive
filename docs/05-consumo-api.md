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
| `POST` | `/` | `student` | Criar ou atualizar status diário de um estudante |
| `POST` | `/checkin` | `student` | Registrar que um estudante embarcou ⚠️ *verificar* |
| `POST` | `/cancel-boarded` | `student` | Cancelar o embarque de um estudante já registrado |
| `POST` | `/checkin/:studentId` | `driver` | Motorista registrar embarque do estudante ⚠️ *verificar erros* |
| `POST` | `/cancel-boarded/:studentId` | `driver` | Cancelar o embarque de um estudante |
| `GET` | `/missing-count` | — | Obter contagem de estudantes que não fizeram check-in |

---

## 🚫 Trip Cancellations

`/api/trip-cancellations`

| Método | Endpoint | Autenticação | Descrição |
| --- | --- | --- | --- |
| `POST` | `/` | `driver` | Cancelar viagem de hoje |
| `DELETE` | `/` | `driver` | Desfazer cancelamento de hoje |

---

## 📢 Announcements

`/api/announcements`

| Método | Endpoint | Autenticação | Descrição |
| --- | --- | --- | --- |
| `GET` | `/` | — | Listar anúncios |
| `POST` | `/` | `driver` | Publicar anúncio ⚠️ *verificar se admin também pode* |

---

## 🛠️ Admin

`/api/admin`

| Método | Endpoint | Autenticação | Descrição |
| --- | --- | --- | --- |
| `POST` | `/admin` | `admin` | Criar administrador |
| `POST` | `/driver` | `admin` | Criar motorista |
| `POST` | `/student` | `admin` | Criar estudante |
| `GET` | `/list/drivers` | `admin` | Listar motoristas |
| `GET` | `/list/drivers/:id` | `admin` | Listar motorista por ID |
| `GET` | `/list/students` | `admin` | Listar estudantes |
| `GET` | `/list/students/:id` | `admin` | Listar estudante por ID |
| `DELETE` | `/student/:id` | `admin` | Desativar estudante |
| `DELETE` | `/driver/:id` | `admin` | Desativar motorista |
| `PATCH` | `/student/reactivate/:id` | `admin` | Reativar estudante |
| `PATCH` | `/driver/reactivate/:id` | `admin` | Reativar motorista |

---

## 🎓 Students

`/api/students`

| Método | Endpoint | Autenticação | Descrição |
| --- | --- | --- | --- |
| `POST` | `/` | `admin` | Criar estudante |
| `GET` | `/` | `admin` | Listar estudantes |
| `DELETE` | `/:id` | `admin` | Desativar estudante |

---

## 💳 Payments

`/api/payments`

| Método | Endpoint | Autenticação | Descrição |
| --- | --- | --- | --- |
| `GET` | `/me` | `student` | Ciclo atual |
| `GET` | `/me/history` | `student` | Histórico de pagamentos |
| `POST` | `/me/pay` | `student` | Pagar |
| `PATCH` | `/me/reminder` | `student` | Atualizar lembretes |
| `POST` | `/:studentId/pay` | `driver` | Registrar pagamento de um estudante |
| `GET` | `/student/:studentId` | `driver` | Status de pagamento do estudante |

---

## 🔔 Push Notifications

`/api/push`

| Método | Endpoint | Autenticação | Descrição |
| --- | --- | --- | --- |
| `GET` | `/public-key` | — | Obter chave pública |
| `POST` | `/subscribe` | autenticado | Inscrever-se para receber notificações |

---

### Legendas

- `student` / `driver` / `admin` → tipo de usuário exigido para autenticação
- ⚠️ → ponto sinalizado para revisão/verificação
- `—` → rota pública, sem autenticação