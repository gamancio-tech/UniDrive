# Modelo de Dados

Modelagem relacional (PostgreSQL via Prisma). Todas as entidades vinculadas a um motorista carregam `driverId`, e os alunos e operações da van (viagens, avisos) são associados à sua respectiva `Class` (Turma), permitindo suporte completo a múltiplas turmas por motorista com isolamento de acesso (BOLA/IDOR).

## Entidades

### Admin (Administrador da Plataforma)
| Campo | Tipo | Observação |
|---|---|---|
| id | uuid | PK |
| name | string | Nome do administrador |
| email | string | único, usado para login |
| passwordHash | string | Hash da senha (bcrypt) |
| isSuperAdmin | boolean | Se verdadeiro, gerencia outros administradores |
| createdAt | datetime | Data de criação |

### Driver (Motorista)
| Campo | Tipo | Observação |
|---|---|---|
| id | uuid | PK |
| name | string | Nome do motorista |
| email | string | único, usado para login |
| passwordHash | string | Hash da senha (bcrypt) |
| pixKey | string? | Chave Pix exibida aos alunos para pagamento manual |
| photoUrl | string? | Foto de perfil (base64 sanitizado com validação de magic bytes) |
| phone | string | Telefone de contato para ligações rápidas |
| active | boolean | Status de atividade do motorista |
| createdAt | datetime | Data de cadastro |

### Class (Turma do Motorista)
| Campo | Tipo | Observação |
|---|---|---|
| id | uuid | PK |
| driverId | uuid | FK → Driver (deletado em cascata com o motorista) |
| name | string | Nome/identificador da turma (ex: "Unifran Manhã", "Direito Noite") |
| createdAt | datetime | Data de criação |

### Student (Aluno / Passageiro)
| Campo | Tipo | Observação |
|---|---|---|
| id | uuid | PK |
| driverId | uuid | FK → Driver |
| classId | uuid | FK → Class (deletado em cascata com a turma) |
| name | string | Nome do passageiro |
| email | string | único, usado para login |
| passwordHash | string | Hash da senha (bcrypt) |
| photoUrl | string? | Foto de perfil (base64 com validação de magic bytes) |
| phone | string? | Telefone de contato |
| active | boolean | Permite desativar aluno da van sem apagar histórico |
| createdAt | datetime | Data de cadastro |

### DailyStatus (Status diário do aluno)
| Campo | Tipo | Observação |
|---|---|---|
| id | uuid | PK |
| studentId | uuid | FK → Student |
| date | date | Dia de referência (YYYY-MM-DD) |
| status | enum | `vai_normal` \| `so_ida` \| `so_volta` \| `nao_vai` |
| boardedAt | datetime? | Preenchido no check-in de embarque (RF04); nulo = ainda não embarcou |
| updatedAt | datetime | Última alteração |

> Um registro por aluno por data. Se não existir registro pontual para a data, o sistema consulta a rotina semanal padrão (`StudentWeeklySchedule`) do aluno ou assume `vai_normal`.

### StudentWeeklySchedule (Rotina semanal padrão do aluno)
| Campo | Tipo | Observação |
|---|---|---|
| id | uuid | PK |
| studentId | uuid | FK → Student |
| dayOfWeek | int | 0 = Domingo, 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado |
| status | enum | `vai_normal` \| `so_ida` \| `so_volta` \| `nao_vai` |
| createdAt | datetime | Data de criação |
| updatedAt | datetime | Última atualização |

### TripCancellation (Cancelamento da viagem por turma)
| Campo | Tipo | Observação |
|---|---|---|
| id | uuid | PK |
| driverId | uuid | FK → Driver |
| classId | uuid | FK → Class |
| date | date | Data do cancelamento |
| reason | string? | Motivo opcional (ex.: "feriado", "van em manutenção") |
| createdAt | datetime | Data de registro |

### Announcement (Aviso do mural da turma)
| Campo | Tipo | Observação |
|---|---|---|
| id | uuid | PK |
| driverId | uuid | FK → Driver |
| classId | uuid | FK → Class |
| message | text | Conteúdo do comunicado |
| createdAt | datetime | Data de publicação |

### ChatMessage (Mensagem do Chat 1:1)
| Campo | Tipo | Observação |
|---|---|---|
| id | uuid | PK |
| driverId | uuid | FK → Driver |
| studentId | uuid | FK → Student |
| senderRole | string | `"driver"` \| `"student"` |
| senderId | string | ID do usuário remetente |
| content | text | Texto da mensagem |
| readAt | datetime? | Data/hora de leitura pelo destinatário (nulo = não lida) |
| createdAt | datetime | Data/hora de envio |
| deletedForEveryoneAt | datetime? | Preenchido se a mensagem foi apagada para todos |
| hiddenForDriver | boolean | `true` se o motorista apagou para si |
| hiddenForStudent | boolean | `true` se o aluno apagou para si |

### PaymentCycle (Ciclo de pagamento mensal)
| Campo | Tipo | Observação |
|---|---|---|
| id | uuid | PK |
| studentId | uuid | FK → Student |
| referenceMonth | date | Primeiro dia do mês de referência (ex.: 2026-10-01) |
| reminderDaysBefore | int | Antecedência configurável pelo aluno (padrão 3) |
| paidAt | datetime? | Data/hora da baixa confirmada (nulo = pendente) |
| markedBy | enum? | `student` \| `driver` |
| paymentRequestedAt | datetime? | Data/hora em que o aluno informou o pagamento (aguardando baixa do motorista) |

### PushSubscription (Inscrição Web Push VAPID)
| Campo | Tipo | Observação |
|---|---|---|
| id | uuid | PK |
| studentId | uuid? | FK → Student (nulo se for motorista/admin) |
| driverId | uuid? | FK → Driver (nulo se for aluno/admin) |
| adminId | uuid? | FK → Admin (nulo se for aluno/motorista) |
| endpoint | text | Endpoint único fornecido pelo navegador |
| keys | json | Chaves `p256dh` e `auth` da Web Push API |
| createdAt | datetime | Data de registro |

---

## Diagrama de Relacionamento

```mermaid
erDiagram
    ADMIN ||--o{ PUSHSUBSCRIPTION : "recebe push"
    DRIVER ||--o{ CLASS : "gerencia turmas"
    DRIVER ||--o{ STUDENT : "possui"
    DRIVER ||--o{ CHATMESSAGE : "troca mensagens 1:1"
    DRIVER ||--o{ PUSHSUBSCRIPTION : "recebe push"

    CLASS ||--o{ STUDENT : "pertence a"
    CLASS ||--o{ TRIPCANCELLATION : "cancela dia por turma"
    CLASS ||--o{ ANNOUNCEMENT : "mural de avisos por turma"

    STUDENT ||--o{ DAILYSTATUS : "tem status diário"
    STUDENT ||--o{ STUDENTWEEKLYSCHEDULE : "tem rotina semanal padrão"
    STUDENT ||--o{ PAYMENTCYCLE : "tem ciclos de pagamento"
    STUDENT ||--o{ CHATMESSAGE : "troca mensagens 1:1"
    STUDENT ||--o{ PUSHSUBSCRIPTION : "recebe push"
```

---

## Regras Derivadas Importantes

- **Contador de Faltantes (RF02)**: Calculado dinamicamente por turma (`classId`), somando alunos ativos daquela turma cujo status diário (`DailyStatus` ou `StudentWeeklySchedule`) prevê a viagem atual (`ida` ou `volta`) e cujo `boardedAt` ainda é nulo.
- **Cancelamento de Viagem (RF06)**: Pode ser direcionado para turmas específicas ou para todas as turmas do motorista simultaneamente. Se a turma estiver cancelada na data, contadores e lembretes daquela turma são suspensos.
- **Mural de Avisos (RF05)**: O motorista pode publicar um aviso para uma turma específica ou disparar para múltiplas turmas selecionadas ao mesmo tempo.
- **Chat 1:1 (RF10)**: O motorista visualiza conversas filtradas pela turma ativa ou agregadas em modo "Chat Geral". Alunos conversam exclusivamente com o seu próprio motorista.
