# Plano de Implementação: Chat em Tempo Real (Motorista ↔ Aluno)

## 1. Visão Geral e Objetivos

O objetivo desta funcionalidade é permitir a comunicação direta, bidirecional e em tempo real (1:1) entre o motorista da van e cada um dos seus passageiros (alunos), resolvendo imprevistos imediatos (ex: *"vou me atrasar 5 minutos"*, *"estou esperando no portão lateral"*).

### Premissas:
- **Privacidade e Foco**: O chat é exclusivamente individual entre o **Motorista** e um **Aluno**. Não há chat geral entre alunos (evitando dispersão e excesso de ruído).
- **Tempo Real**: Implementado com **WebSocket** nativo (biblioteca `ws` já instalada no backend).
- **Persistência**: Todas as mensagens são salvas no banco de dados (PostgreSQL/Neon via Prisma) para garantir histórico ao reabrir o app.
- **Fallback Push**: Se o destinatário estiver com o app fechado ou tela bloqueada, o servidor dispara uma **notificação push** no celular avisando sobre a nova mensagem.

---

## 2. Modelo de Dados (Prisma)

Adicionar ao arquivo `backend/prisma/schema.prisma` a entidade `ChatMessage`:

```prisma
model ChatMessage {
  id         String    @id @default(uuid())
  driverId   String
  studentId  String
  senderRole String    // "driver" | "student"
  senderId   String    // ID do usuário remetente (Driver ou Student)
  content    String    @db.Text
  readAt     DateTime? // nulo = não lida; preenchido quando o destinatário visualiza
  createdAt  DateTime  @default(now())

  driver     Driver    @relation(fields: [driverId], references: [id], onDelete: Cascade)
  student    Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@index([driverId, studentId, createdAt])
  @@index([studentId, readAt])
}
```

Atualizar as relações nos modelos `Driver` e `Student`:
- Em `Driver`: `chatMessages ChatMessage[]`
- Em `Student`: `chatMessages ChatMessage[]`

---

## 3. Arquitetura de Comunicação (WebSocket + REST)

A comunicação será híbrida:
- **REST**: Para carregamento inicial do histórico e contadores de mensagens não lidas.
- **WebSocket**: Para envio, recebimento instantâneo e confirmações de leitura.

### 3.1 Handshake e Autenticação
O cliente inicia a conexão WebSocket enviando o token JWT na query string:
```
ws://localhost:3333/ws/chat?token=<JWT_TOKEN>
```
No evento `connection`:
1. O backend extrai o token da URL e valida via `jwt.verify(token, env.jwtSecret)`.
2. Se inválido ou ausente, fecha a conexão com código de erro `4001` (Unauthorized).
3. Se válido, registra o socket no mapa de conexões ativas: `Map<userId, WebSocket>`.

### 3.2 Protocolo de Mensagens (JSON)

#### Do Cliente para o Servidor:
1. **Enviar Mensagem:**
   ```json
   {
     "type": "send_message",
     "payload": {
       "recipientId": "uuid-do-destinatario",
       "content": "Olá, já estou na esquina!"
     }
   }
   ```
2. **Marcar como Lidas:**
   ```json
   {
     "type": "mark_as_read",
     "payload": {
       "conversationWith": "uuid-do-outro-usuario"
     }
   }
   ```

#### Do Servidor para o Cliente:
1. **Confirmação de Envio (para o remetente):**
   ```json
   {
     "type": "message_sent",
     "payload": {
       "id": "uuid-mensagem",
       "tempId": "id-temporario-otimista",
       "createdAt": "2026-10-04T22:00:00.000Z"
     }
   }
   ```
2. **Nova Mensagem Recebida (para o destinatário conectado):**
   ```json
   {
     "type": "new_message",
     "payload": {
       "id": "uuid-mensagem",
       "senderId": "uuid-remetente",
       "senderRole": "student",
       "content": "Olá, já estou na esquina!",
       "createdAt": "2026-10-04T22:00:00.000Z"
     }
   }
   ```
3. **Notificação de Leitura:**
   ```json
   {
     "type": "messages_read",
     "payload": {
       "conversationWith": "uuid-do-usuario",
       "readAt": "2026-10-04T22:01:00.000Z"
     }
   }
   ```

### 3.3 Tratamento de Quedas de Rede Móvel (Resiliência)
- **Heartbeat (Ping/Pong)**: A cada 30 segundos, o servidor dispara um `ping`. Se o cliente não responder com `pong`, a conexão fantasma é encerrada.
- **Reconexão Exponencial no Frontend**: Em caso de desconexão (ex: celular sem sinal 4G temporário), o frontend tenta reconectar automaticamente (1s, 2s, 5s, 10s até reconectar).

---

## 4. Endpoints REST de Apoio

1. **`GET /api/chat/history/:partnerId`**
   - Retorna as últimas 50 mensagens trocadas entre o usuário logado e o parceiro de conversa (`partnerId`).
   - Suporte a paginação por cursor (`beforeId`) para carregar mensagens antigas no scroll para cima.
2. **`GET /api/chat/conversations` (exclusivo para o Motorista)**
   - Retorna a lista de alunos com:
     - Nome e foto/avatar do aluno
     - Última mensagem trocada e data/hora
     - Contador de mensagens não lidas (`unreadCount`)
3. **`GET /api/chat/unread-count` (para o Aluno)**
   - Retorna o número de mensagens pendentes do motorista para exibir badge numérico na navegação inferior.

---

## 5. Integração com Notificações Push (Web Push)

Quando o servidor receber uma mensagem via WebSocket e constatar que o destinatário **não está com socket aberto no momento**:
1. O backend busca o nome do remetente.
2. Dispara `pushService.notifyStudents(...)` ou `pushService.notifyDriver(...)`:
   - **Título**: `💬 Nova mensagem de ${remetente.name}`
   - **Corpo**: `${content}` (ou truncado em 60 caracteres)
   - **Tag**: `chat-${remetente.id}`
   - **URL**: Ao tocar, o PWA abre diretamente na janela do chat.

---

## 6. Estrutura de Telas e UX no Frontend

### 6.1 Visão do Aluno
- **Acesso**:
  - Nova aba no rodapé (`BottomNavigation`): **"Chat"** com badge vermelho para mensagens não lidas.
  - Ou botão de atalho direto no card de embarque da Home: *"Falar com o motorista"*.
- **Tela de Conversa**:
  - Cabeçalho: Nome do motorista + status *"Online / Visto por último"*.
  - Corpo da conversa:
    - Balões alinhados à direita (mensagens enviadas pelo aluno, tom azul).
    - Balões alinhados à esquerda (mensagens do motorista, tom escuro/card).
    - Indicador de horário e de visualização (`✓✓`).
  - Rodapé: Campo de texto de digitação rápida + botão Enviar.

### 6.2 Visão do Motorista
- **Acesso**:
  - Nova aba no rodapé ou item no menu: **"Chat"** com badge somatório de não lidas.
- **Lista de Conversas (Master View)**:
  - Lista de todos os alunos ativos da van.
  - Destaque no topo para quem mandou mensagem recente não respondida.
  - Indicador de "X mensagens não lidas" em vermelho.
- **Janela de Conversa (Detail View)**:
  - Ao tocar em um aluno, abre o chat individual com aquele aluno específico.
  - Botão de voltar para a lista de conversas.
  - Atalhos de mensagens rápidas do motorista (ex: *"Já estou saindo"*, *"Cheguei no ponto"*).

---

## 7. Roteiro Passo a Passo de Execução

### Fase 1: Banco e Infraestrutura WebSocket
1. Adicionar o model `ChatMessage` no `prisma/schema.prisma`.
2. Executar `npx prisma db push` e `npx prisma generate`.
3. Criar `backend/src/websocket/chatServer.ts` inicializando o servidor `ws` acoplado ao servidor HTTP.
4. Implementar middleware de autenticação JWT para conexões WebSocket.
5. Criar repositório `chatMessage.repository.ts` e serviço `chat.service.ts`.

### Fase 2: Protocolo WebSocket e Rotas REST
1. Implementar manipuladores dos eventos `send_message` e `mark_as_read`.
2. Adicionar disparador de notificação push caso o socket do destinatário esteja ausente.
3. Criar endpoints REST `/api/chat/history/:partnerId`, `/api/chat/conversations` e `/api/chat/unread-count`.

### Fase 3: Frontend (Hook e Componentes)
1. Criar `frontend/src/api/chat.ts` (chamadas REST e interfaces).
2. Criar hook `frontend/src/features/chat/useChat.ts` (conexão WS, reconexão automática, envio otimista e sincronização de mensagens).
3. Construir os componentes:
   - `ChatWindow.tsx`: Área de balões de mensagens com auto-scroll e input.
   - `DriverChatConversationList.tsx`: Lista de conversas para o motorista.
   - `StudentChatPage.tsx`: Tela de conversa direta do aluno com o motorista.
4. Integrar badges de mensagens não lidas na `BottomNavigation` e nos cabeçalhos.

### Fase 4: Testes e Validação
1. Testar envio instantâneo com duas abas abertas simultaneamente (motorista em uma, aluno em outra).
2. Testar persistência recarregando a página e verificando o histórico completo.
3. Testar recebimento de notificação push com a janela do chat fechada.
4. Testar reconexão simulando desconexão de rede (Offline no DevTools).
