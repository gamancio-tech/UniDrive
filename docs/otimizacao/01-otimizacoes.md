# Otimizações de Performance e Refatorações

Este documento descreve as otimizações e correções de gargalos implementadas na aplicação para melhorar o desempenho geral, economizar banda de rede, reduzir latência e melhorar o uso do banco de dados. 

## 1. Otimizações de Banco de Dados (Prisma & PostgreSQL)

### 1.1 Eliminação de Consultas N+1 (Módulo de Chat)
- **O Problema:** A listagem de contatos do motorista iterava sobre todos os alunos fazendo duas buscas na tabela `ChatMessage` por aluno (uma para pegar a última mensagem e outra para contar o número de mensagens não lidas), resultando no problema clássico de N+1 (ex: 1 query para listar alunos + 30 queries separadas para buscar mensagens de 15 alunos).
- **A Solução:** Foram criadas novas rotinas no repositório (`getLatestMessagesPerStudent` e `getUnreadCountsGroupedByStudent`) que utilizam métodos avançados do Prisma, como `groupBy` (para contagem de não lidos) e o comando SQL puro `SELECT DISTINCT ON` para resgatar eficientemente as mensagens mais recentes de todos os alunos numa única operação de banco.

### 1.2 Criação de Índices (`schema.prisma`)
- **O Problema:** Durante varreduras, notou-se que a tabela `PushSubscription` não tinha índices para chaves estrangeiras (`studentId`, `driverId` e `adminId`). Como os envios de notificações (Web Push) são constantes, procuras frequentes desencadeavam "Full Table Scans", lendo a tabela inteira a cada push.
- **A Solução:** Inclusão de `@@index([studentId])`, `@@index([driverId])` e `@@index([adminId])` no modelo `PushSubscription`, aumentando consideravelmente a performance em queries de envio de avisos e notificações de embarque.

## 2. Otimizações de Payload e Rede (Backend Node.js)

### 2.1 Compressão Gzip/Brotli
- **O Problema:** Como a aplicação atende alunos em locais de rede instável (3G/4G no ambiente universitário ou durante o trajeto), os tamanhos das respostas HTTP consumiam banda valiosa e tornavam as respostas mais lentas. O framework Express não envia requisições comprimidas nativamente.
- **A Solução:** Instalação e acoplamento do middleware `compression` no arquivo principal `app.ts`. Isso reduz o tamanho final dos payloads da API JSON em torno de 60-80% antes de trafegar na rede.

### 2.2 Prevenção de Vazamento de Dados e Otimização de Respostas
- **O Problema:** Entidades inteiras da tabela `Student` estavam sendo transferidas para o frontend na hora de listagens globais (`studentService.listActiveByDriver` e `studentService.listByStatus`), o que incluía a coluna `passwordHash` das senhas codificadas no Payload do JSON.
- **A Solução:** Implementado filtro map explícito no Service, omitindo a coluna `passwordHash` (junto de demais lixos desnecessários) em toda a devolução das requisições REST da listagem de alunos, fechando uma brecha grave de segurança e secando o tráfego extra.

## 3. Otimizações de Re-render e Fetching (Frontend React)

### 3.1 Ciclo de Vida Abusivo das Abas (Tabs)
- **O Problema:** Nos painéis centrais (`DriverHome.tsx` e `StudentHome.tsx`), a lógica padrão de troca de abas destruía e remontava o componente filho constantemente (`{tab === 'home' && <HomeTab />}`). Como cada aba tinha hooks locais de requisição à API (Polling de Faltantes, Buscar Histórico de Mensagens, Buscar Rotinas), cada mudança banal de página disparava todas as requisições na rede novamente com um lag de tela em branco (Loading de 3 segundos).
- **A Solução:** Inclusão de uma variável de estado `visitedTabs`. Agora as abas mantêm os elementos no DOM apenas escondendo-os via CSS (`display: none` / `className="hidden"`). Essa técnica engaveta os resultados cacheados, preserva os estados em memória e deixa a navegação entre a aba 'Rotina' e 'Chat' estritamente instantânea após o primeiro carregamento.

### 3.2 Requisições de Polling Duplicadas
- **O Problema:** Múltiplos componentes estavam importando o hook `useUnreadChatCount` para ficar checando notificações, multiplicando os disparos (Polling a cada 5s) via REST para a mesma rota da API de chat simultaneamente.
- **A Solução:** Refatoração do hook para se aproveitar da nova rota central unificada de contagem no backend. Limpeza nas instâncias em que ele era importado desnecessariamente ou em abas ocultas, assegurando que o Polling ocorra apenas a partir do Top-Level (NavBar/HomeRoot) preservando os limites do banco de dados sob as chamadas simultâneas.

## 4. Otimizações de Segurança (Express & Rate Limiters)

### 4.1 Cabeçalhos HTTP de Segurança (Helmet)
- **O Problema:** A aplicação Express pura não emite as flags seguras HTTP. Sem elas, sites maliciosos poderiam embutir o frontend do UniDrive dentro de IFrames ocultos para roubar cliques (Clickjacking) ou farejar o conteúdo MIME do tráfego.
- **A Solução:** Instalação do middleware `helmet` no pipeline do `app.ts`. Isso fornece automaticamente 14 proteções nativas (como Content-Security-Policy, X-Frame-Options setado para DENY/SAMEORIGIN, HSTS), endurecendo a aplicação contra injeções diretas.

### 4.2 Rate Limiting contra Força Bruta
- **O Problema:** Por usar HTTP Polling agressivo no frontend, a API estava totalmente aberta. Um bot conseguiria mandar 10.000 requisições por segundo para testar senhas (`/api/students/login`) e derrubar o servidor.
- **A Solução:** Instalação da biblioteca `express-rate-limit`. Adição do `globalLimiter` em `/api` (500 requisições a cada 15 min) e um limitador rígido `authLimiter` nas rotas de login (15 tentativas). Configuração do `app.set("trust proxy", 1)` para impedir que o bloqueio afete o IP da plataforma de hospedagem (Render).

## 5. Processamento e Segurança de Imagens (Profile Photos)

### 5.1 Compressão Nativa Client-Side e Economia de Armazenamento
- **O Problema:** Alunos tentavam fazer upload de fotos de perfil com 5MB ou mais (fotos tiradas na câmera do celular). Enviar isso puro para a API derrubava requisições e causava consumo brutal da rede 3G e do banco de dados.
- **A Solução:** No frontend (`StudentProfilePhotoCard.tsx`), a imagem selecionada é redimensionada usando um elemento `<canvas>` nativo do HTML5 (`compressProfileImage`). A imagem é travada nas dimensões máximas de 256x256 e transformada em base64 (`data:image/jpeg`) com compressão de 85%, derrubando o peso das imagens para **~15 a 30KB** antes de atingir a rede.

### 5.2 Segurança e Validação de Payload no Servidor
- **O Problema:** Apesar do frontend estar protegido e mandar imagens leves de 20KB, um atacante poderia burlar a interface e mandar payloads gigantes de 10MB para estourar a memória (OOM), ou anexar payloads não-imagem (`javascript:alert('1')`) causando XSS ou corrupção no banco de dados.
- **A Solução:** 
  - Limite severo via Express: O `app.use(express.json({ limit: "1mb" }))` bloqueia conexões grosseiras acima de 1 MegaByte antes de entrarem na arquitetura.
  - Validação da Camada de Serviço: O arquivo `student.service.ts` garante que fotos enviadas sempre respeitem o limite de 500.000 caracteres (~500kb em base64) e obriga explicitamente que a String comece com a declaração `data:image/`, banindo formatos ou injeções nocivas.

## 6. Validação Estrutural de Payloads (Zod DTOs)

### 6.1 Interceptação de Dados Maliciosos ou Malformados
- **O Problema:** Os controllers recebiam os dados do `req.body` (ex: `name, email, password`) assumindo de forma "cega" que eles vinham exatamente com o formato e tipo que o frontend deveria enviar. Se um atacante enviasse um Objeto no lugar de uma String, ou um texto de 10.000 caracteres no lugar do nome, a aplicação quebrava na tentativa de execução do Prisma ou do Bcrypt, gerando logs sujos e risco de negação de serviço.
- **A Solução:** Implementada uma camada oficial de Data Transfer Object (DTO) usando **Zod**. Foi criado o middleware `validate.middleware.ts` e uma série de schemas rigorosos (`schemas/index.ts`). Agora, antes da requisição atingir a lógica de negócio do Controller, o Express valida rigidamente:
  - Tipagem estrita (se é String, se é número).
  - Formato (se o E-mail é estruturalmente válido, ou se as rotinas da semana respeitam os Enums corretos).
  - Limites máximos de comprimento (`.max(100)` para e-mails e nomes, impedindo payloads inchados que poderiam impactar as tabelas).
  - O sistema aborta a operação automaticamente retornando `400 Bad Request` detalhando o erro sem tocar no banco de dados.

## 7. Auditoria de Segurança (Revisão White-Box como Atacante)

Auditoria estática do backend feita pensando como um usuário malicioso autenticado (aluno, motorista ou admin comum) ou anônimo. **Status: correções implementadas no backend (V01 a V14 corrigidas; V15 documentada como recomendação arquitetural futura).**

| ID | Severidade | Vulnerabilidade | Local | Status |
|----|-----------|-----------------|-------|--------|
| V01 | Crítica | BOLA/IDOR: motorista age em alunos de outra van | `student.controller.ts`, `dailyStatus.controller.ts`, `payment.controller.ts` | **Corrigido** |
| V02 | Alta | Motorista lista TODOS os alunos da plataforma | `student.controller.ts` (`list`) + `listByStatus` | **Corrigido** |
| V03 | Alta | Vazamento de `passwordHash` em rotas de admin | `driver.repository.ts`, `admin.controller.ts` | **Corrigido** |
| V04 | Alta | SSRF e sequestro de inscrição no push subscribe | `schemas/index.ts`, `pushSubscription.repository.ts` | **Corrigido** |
| V05 | Alta | `/push/unsubscribe` sem autenticação | `push.routes.ts` | **Corrigido** |
| V06 | Alta | Conta desativada continua com acesso (login e JWT de 30 dias) | `auth.service.ts`, `auth.middleware.ts`, `accountStatus.ts` | **Corrigido** |
| V07 | Média | Rate limit contornável (spray de e-mails, chave por IP) | `rateLimiter.middleware.ts` | **Corrigido** |
| V08 | Média | WebSocket sem limite de tamanho/taxa de mensagens (DoS) | `chatServer.ts`, `chat.service.ts` | **Corrigido** |
| V09 | Média | Rotas sem validação Zod e `validate` não aplica o resultado | `routes/*`, `validate.middleware.ts` | **Corrigido** |
| V10 | Média | Foto aceita qualquer `data:image/*` (SVG) sem checar conteúdo | `student.service.ts` | **Corrigido** |
| V11 | Média | Enumeração de contas por tempo de resposta e mensagens | `auth.service.ts`, `student.service.ts` | **Corrigido** |
| V12 | Média | Política de senha fraca (mínimo 6 chars) | `schemas/index.ts` | **Corrigido** |
| V13 | Baixa | JWT longo, sem algoritmo fixo, sem validação de força do segredo | `auth.service.ts`, `auth.middleware.ts`, `env.ts` | **Corrigido** |
| V14 | Baixa | CORS `*` como fallback, e-mail case-sensitive, erros 500 indevidos | `app.ts`, `payment.service.ts`, `errorHandler.middleware.ts` | **Corrigido** |
| V15 | Baixa | Token JWT no `localStorage` | `frontend/src/api/client.ts` | Arquitetura Futura |

### V01 — BOLA/IDOR entre vans (Crítica)
- **Ataque:** um motorista logado chama `DELETE /api/students/<id-de-aluno-de-outra-van>`. O controller `deactivate` não confere `student.driverId === req.user.id`, e o service só busca por `id`. O mesmo vale para `POST /daily-status/checkin/:studentId`, `POST /daily-status/cancel-boarded/:studentId` (embarque falso ou desfeito em outra van) e `GET /payments/student/:studentId` (lê e **cria** ciclo de pagamento de qualquer aluno). Os IDs são UUIDs, mas vazam via V02.
- **Observação:** `reactivate` e `updatePhone` já checam dono; `deactivate` e os demais não. A checagem está espalhada e inconsistente.
- **Correção:** centralizar em um helper `assertStudentBelongsToDriver(studentId, driverId)` no service e chamar em toda rota `/:studentId`. Alternativa mais segura: o repository receber `driverId` e filtrar na própria query (`where: { id, driverId }`), retornando 404 se não achar.

### V02 — Listagem global de alunos para motoristas (Alta)
- **Ataque:** `GET /api/students?status=true` como motorista cai em `studentService.listByStatus`, que usa `listActiveAll()` sem filtro por van. Retorna nome, e-mail, telefone e foto de todos os alunos do sistema, e fornece os UUIDs para o V01.
- **Correção:** motorista só usa `listActiveByDriver(driverId)` (ou variante inativa filtrada por `driverId`). `listByStatus` global deve ficar exclusivo da rota de admin.

### V03 — Vazamento de `passwordHash` (Alta)
- **Ataque:** como admin comum, `GET /admin/list/drivers`, `GET /admin/list/drivers/:id` e `GET /admin/list/students/:id` devolvem o objeto Prisma inteiro, incluindo o hash bcrypt. `DELETE /admin/student/:id` e a desativação de motorista também retornam a entidade completa. Permite quebra offline de senhas (principalmente com senhas de 6 caracteres, ver V12). A correção da seção 2.2 cobriu só as listagens de aluno.
- **Correção:** usar `select` explícito no Prisma (lista branca de campos) em todas as queries de leitura, ou extensão global do Prisma Client com `omit: { passwordHash: true }`. Criar DTOs de resposta por entidade.

### V04 — SSRF e sequestro no Push Subscribe (Alta)
- **Ataque 1 (SSRF):** `savePushSubscriptionSchema` aceita qualquer URL. A lib `web-push` faz `POST` do servidor para o `endpoint`. Um aluno pode cadastrar `http://169.254.169.254/...` ou um serviço interno do Render, fazendo o backend disparar requisições para dentro da rede. Cada notificação do sistema repete a chamada.
- **Ataque 2 (sequestro):** o `upsert` por `endpoint` troca o dono (`studentId`/`driverId`) de uma inscrição existente. Quem conhece o endpoint de outra pessoa a "rouba" ou a redireciona.
- **Correção:** exigir `https:` e validar o host contra lista de provedores de push (`fcm.googleapis.com`, `*.push.services.mozilla.com`, `*.notify.windows.com`, `web.push.apple.com`). No upsert, só atualizar se a inscrição já pertencer ao mesmo usuário; senão, recusar com 409.

### V05 — Unsubscribe anônimo (Alta)
- **Ataque:** `POST /api/push/unsubscribe` não usa `authMiddleware`. Qualquer anônimo que conheça um endpoint remove a inscrição de alguém (silenciando alertas de embarque ou pagamento).
- **Correção:** adicionar `authMiddleware` e deletar com `where: { endpoint, <campo do dono>: req.user.id }`. Validar o body com Zod.

### V06 — Contas desativadas mantêm acesso (Alta)
- **Ataque:** `loginStudent` e `loginDriver` não checam `active`. Mesmo que checassem, o JWT dura 30 dias e o `authMiddleware` só valida a assinatura. Um aluno removido da van continua usando a API, o chat e recebendo avisos. Admin removido (`deleteAdmin`) também segue com token válido.
- **Correção:** bloquear login quando `active === false` (mensagem genérica). Reduzir a vida do JWT (ver V13) e, no `authMiddleware`, consultar o usuário (com cache curto em memória, 15 usuários não pesam) para validar `active`/existência. Alternativa: coluna `tokenVersion` no usuário incluída no JWT.

### V07 — Rate limit contornável (Média)
- **Ataque:** `authLimiter` usa chave `IP + email`. Um único IP testa uma senha fraca (`123456`) contra centenas de e-mails sem bater no limite de 15 (password spraying), limitado só pelo global de 500 req/15 min. O `globalLimiter` roda antes do `authMiddleware`, então `req.user` nunca existe e a chave sempre é o IP: alunos na mesma rede da faculdade (NAT) dividem a cota. O e-mail na chave não é normalizado (`A@x.com` vs `a@x.com` geram chaves distintas).
- **Correção:** dois limitadores no login, um por IP (ex.: 30/15 min) e outro por e-mail normalizado (ex.: 10/15 min). Normalizar com `toLowerCase().trim()` e garantir `typeof === "string"`. Mover o limitador por usuário para depois do `authMiddleware`. Conferir o número de proxies reais para o `trust proxy` (se houver mais de um salto, `X-Forwarded-For` pode ser forjado).

### V08 — WebSocket sem limites (Média)
- **Ataque:** `WebSocketServer` não define `maxPayload` (padrão da lib `ws`: 100 MiB). Uma única mensagem enorme consome memória e CPU em `JSON.parse`. `content` do chat não tem tamanho máximo, vai para o banco e para o push. Não há limite de mensagens por segundo nem de conexões por usuário. O token vai na query string (`?token=`), que pode aparecer em logs de proxy.
- **Correção:** `maxPayload: 8 * 1024`, schema Zod no `payload` (`content` 1 a 1000 caracteres, `recipientId` UUID, `tempId` com tamanho máximo), contador de mensagens por conexão (ex.: 20 por 10 s, encerrando com código 1008), limite de 5 sockets por usuário, checagem de `Origin` na conexão. Preferir enviar o token em primeira mensagem de autenticação ou em ticket de uso único de curta duração.

### V09 — Rotas sem validação e `validate` incompleto (Média)
- **Ataque:** ficaram sem schema: `POST /announcements` (`message` sem limite: até 1 MB empurrado como push para todos os alunos), `PATCH /payments/me/reminder` (`days` negativo, `NaN` ou gigante), `POST /daily-status/trip-state` (`trip`/`step` livres, gravados em memória), `GET /daily-status/missing-count?trip=`, `PATCH /students/me/phone` e `/:id/phone`, `PATCH /students/me/photo`, `status` de queries, e todos os parâmetros `:id`/`:studentId` (podem ser lixo, gerando erro do Prisma e 500). Em `date` do status diário, `2026-99-99` passa no regex e vira `Invalid Date`, o que lança `RangeError` e dá 500; também aceita qualquer data passada ou futura.
- **Falha estrutural:** `validate` só confere; o `req.body` original (com campos extras) segue adiante. Use `parseAsync` e atribua o resultado. Zod `z.object` descarta chaves desconhecidas por padrão, mas hoje o resultado é jogado fora.
- **Correção:** criar schemas para todas as rotas acima, `z.uuid()` em todo parâmetro de ID, `z.enum` para `trip`/`step`/`status`, `message` 1 a 500 caracteres, `days` inteiro de 0 a 28, `date` validado com `z.iso.date()` e janela permitida (ex.: hoje a +30 dias). Usar `z.strictObject` onde extras devem ser recusados. Aplicar o valor parseado: `const parsed = await schema.parseAsync(...); req.body = parsed.body;`.

### V10 — Foto de perfil permissiva (Média)
- **Ataque:** o único filtro é `startsWith("data:image/")`. Passa `data:image/svg+xml;base64,...` com `<script>`/`onload`. Em `<img>` o SVG não executa, mas se a URL for aberta direto, ou renderizada em `<object>`/`<iframe>`, há XSS armazenado. Também passa `data:image/png;base64,` seguido de qualquer lixo, e payloads com `;charset=` ou parâmetros estranhos. Os 500.000 caracteres são por usuário e a foto viaja em toda listagem (peso e custo de banda).
- **Correção:** regex estrita `^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$`, decodificar e verificar magic bytes (`FF D8 FF`, `89 50 4E 47`, `RIFF....WEBP`), reduzir o limite para ~100 KB (o client já gera 15 a 30 KB). Recompressão no servidor com `sharp` é o ideal. Longo prazo: guardar em bucket de objetos e salvar só a URL, retirando a foto das listagens pesadas.

### V11 — Enumeração de contas (Média)
- **Ataque:** em `authService`, se o e-mail não existe, o `bcrypt.compare` não roda: a resposta é visivelmente mais rápida que com e-mail existente, revelando quais contas existem (usado para preparar V07). Motoristas também descobrem e-mails cadastrados pela mensagem de conflito ao criar aluno.
- **Correção:** executar sempre um `bcrypt.compare` contra um hash falso fixo quando o usuário não existe (tempo constante). Manter mensagem genérica no login. Na criação de aluno, aceitar a diferença apenas para usuários autenticados e com rate limit.

### V12 — Política de senha (Média)
- **Ataque:** mínimo de 6 caracteres, sem bloqueio de senhas comuns. A senha provisória definida pelo motorista nunca expira e não existe endpoint para o aluno trocá-la (o schema `updateStudentProfileSchema` com `temporaryPassword` não está ligado a nenhuma rota). Combinado com V03/V07, facilita quebra e spray. `SALT_ROUNDS = 10` é o mínimo aceitável.
- **Correção:** mínimo de 8 caracteres e lista curta de senhas proibidas, flag `mustChangePassword` no primeiro login, rota `PATCH /me/password` exigindo a senha atual (e invalidando tokens antigos, ver V06). Subir para `SALT_ROUNDS = 12`.

### V13 — Endurecimento do JWT (Baixa)
- **Problemas:** validade de 30 dias sem renovação nem revogação, `jwt.verify` sem `algorithms: ["HS256"]`, segredo sem checagem de comprimento, payload é aceito por cast (`as AuthenticatedUser`) sem validar formato, e `driverId` fica "congelado" no token se o aluno mudar de van.
- **Correção:** `jwt.sign(..., { algorithm: "HS256", expiresIn: "7d" })` e `jwt.verify(..., { algorithms: ["HS256"] })`. Em `env.ts`, recusar `JWT_SECRET` com menos de 32 caracteres. Considerar refresh token. Ler o `driverId` do banco quando necessário.

### V14 — Configuração e tratamento de erros (Baixa)
- `FRONTEND_URL=*` vira CORS aberto; em produção, recusar `*` ao iniciar.
- E-mails são comparados com sensibilidade a maiúsculas: `Aluno@x.com` e `aluno@x.com` criam duas contas. Normalizar com `.toLowerCase().trim()` no Zod (`z.email().toLowerCase()`).
- `paymentService` lança `new Error(...)` genérico, o que vira 500 em vez de 404. Usar `AppError`.
- JSON malformado no body chega ao `errorHandler` como erro desconhecido (500). Tratar `SyntaxError` do `express.json` como 400.
- `driverTripStates` é um `Map` em memória sem limpeza (cresce 1 chave por motorista por dia e some a cada restart do Render). Limpar chaves de dias anteriores ou persistir no banco.
- Logs de push gravam IDs e parte do endpoint: evitar PII em produção.
- `mark_as_read` do chat envia `messages_read` para um `conversationWith` arbitrário (vaza que um ID está online). Validar que o destinatário é o parceiro legítimo.

### V15 — Token no `localStorage` (Baixa)
- Não foram encontrados sinks de XSS no frontend (`dangerouslySetInnerHTML`/`innerHTML` ausentes, e o React escapa texto por padrão), então o risco hoje é baixo. Mas se algum XSS surgir, o token de 30 dias é roubado. **Correção futura:** cookie `HttpOnly; Secure; SameSite=Lax` com proteção CSRF, e CSP restritiva (o `helmet` padrão já ajuda) no frontend hospedado na HostGator.

### Pontos já protegidos (confirmados na revisão)
- Senhas com bcrypt, sem SQL concatenado (Prisma parametrizado; o único SQL cru, `DISTINCT ON`, usa parâmetros).
- Papéis verificados no servidor (`requireRole`, `requireSuperAdmin`), sem confiar em campos do frontend para escalar privilégio (o `role` vem do JWT assinado).
- Chat: motorista só envia/lê conversas dos próprios alunos; aluno só acessa a própria conversa.
- Limite de 1 MB no JSON, `helmet`, rate limit global e de login.

### Ordem de correção recomendada
1. **Imediato:** V01, V02, V03 (acesso a dados de terceiros e hash de senha).
2. **Curto prazo:** V04, V05, V06 (SSRF, unsubscribe anônimo, contas desativadas).
3. **Próxima iteração:** V07, V08, V09, V10, V11, V12.
4. **Endurecimento contínuo:** V13, V14, V15 e testes automatizados de autorização (um teste por rota `/:id` com um usuário de outra van deve retornar 403/404).
