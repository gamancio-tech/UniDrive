# Segurança — Guia para novas implementações

Este diretório define **como todo código novo deve se comportar** para não reintroduzir as falhas encontradas na auditoria (`docs/otimizacao/01-otimizacoes.md`, seção 7, V01–V15) e para reduzir brechas futuras.

> Leia este guia antes de criar ou alterar qualquer rota, serviço, evento de WebSocket ou tela que lide com dados de usuário. Use o checklist em [`02-checklist-pr.md`](02-checklist-pr.md) antes de concluir a tarefa.

Contexto do sistema: o atacante realista é um **usuário autenticado malicioso** (aluno, motorista ou admin comum) ou um anônimo. Nunca confie no frontend: tudo que vem do cliente (body, query, params, headers, payload de WebSocket, IDs, `role`) é entrada hostil.

## 1. Autenticação e sessão (V06, V13)
- Toda rota fora de login/health usa `authMiddleware`. Rotas por perfil usam `requireRole(...)` / `requireSuperAdmin`.
- O `authMiddleware` já valida a assinatura (`HS256` fixo) e se a conta está ativa. **Não** criar um segundo caminho de autenticação.
- Dados que podem mudar depois do login (ex.: `driverId` do aluno) devem ser lidos **do banco**, nunca do JWT.
- O WebSocket autentica na conexão e revalida a conta ativa. Eventos novos no WS devem assumir `ws.user` como única identidade.
- Nada de segredos, tokens ou hashes em logs, respostas ou mensagens de erro.

## 2. Autorização por recurso — BOLA/IDOR (V01, V02)
Esta é a falha mais grave do projeto. Regras:
1. **Todo acesso a recurso por ID** precisa confirmar que o recurso pertence ao usuário (ou à van do motorista). Checar "tem login" ou "tem o papel certo" **não basta**.
2. Prefira filtrar na própria query (`where: { id, driverId }`) ou validar o vínculo no service antes de agir. A checagem fica no **service**, nunca só no controller nem só no frontend.
3. Motorista nunca lista/lê dados fora da própria van. Listagens globais são exclusivas de admin.
4. Responda **404 igual** para "não existe" e "não é seu" (não use 403 nesse caso), para não revelar IDs válidos.
5. Ações que só o autor pode fazer (ex.: excluir mensagem para todos) comparam `senderId === user.id` no servidor.
6. Ações "somente para mim" devem alterar apenas o estado do próprio usuário (ex.: `hiddenForDriver`/`hiddenForStudent`), nunca o do outro lado.

## 3. Validação de entrada (V09, V10)
- **Toda** rota nova tem schema Zod em `backend/src/schemas/index.ts` e usa `validate(schema)`. Isso inclui `params`, `query` e `body`.
- IDs: `z.uuid()`. Opções fixas: `z.enum([...])`. Textos: sempre com `.min()`/`.max()`. Números: `.int()` com faixa (`.min()/.max()`). Datas: `z.iso.date()` com janela permitida.
- O `validate` só substitui `req.body`. Para `query`/`params`, **use o valor validado de forma segura** (ex.: reaplicar default/limite no controller) e nunca confie em `Number(req.query.x)` sem checar `NaN`.
- Payloads de **WebSocket não passam pelo `validate`**: valide com `schema.safeParse(...)` em `chatServer.ts` antes de chamar o service.
- Uploads/imagens: apenas `data:image/(jpeg|png|webp);base64,...`, com verificação de magic bytes e tamanho máximo. Nunca SVG.
- Nunca concatene SQL. Use Prisma parametrizado; em `$queryRaw` use sempre template literal com `${param}`.

## 4. Exposição de dados (V03)
- Use `select` explícito (lista branca) nas leituras. Jamais devolva a entidade Prisma inteira: `passwordHash`, tokens e campos internos vazam.
- Retorne só o necessário à tela. Foto em base64 não deve ir em listagens pesadas.
- Mensagens apagadas **para todos** têm o conteúdo sobrescrito no banco; o texto original não deve mais ser enviado a ninguém.
- Mensagens "ocultas" por um usuário não devem aparecer em histórico, prévia de conversa nem contagem de não lidas dele.

## 5. Abuso e disponibilidade (V07, V08)
- Todo endpoint novo herda o `globalLimiter`. Endpoints sensíveis ou custosos (login, envio de push, criação em massa) exigem limitador próprio, por IP **e** por identidade normalizada.
- WebSocket: respeitar `maxPayload`, limite de mensagens por janela e de conexões por usuário (já em `chatServer.ts`). Evento novo = mesmo rate limit.
- Limite tamanho de texto, tamanho de listas e profundidade de paginação (`limit` máx. 100).
- Notificações push: texto truncado, sem conteúdo sensível; o endpoint do push só aceita provedores permitidos (V04).

## 6. Erros e logs (V11, V14)
- Use `AppError` com o status correto (400/401/403/404/409). Nunca `new Error()` genérico (vira 500).
- Login/recuperação: mensagem genérica e **tempo constante** (sempre rodar `bcrypt.compare`, mesmo com usuário inexistente).
- Normalize e-mails (`toLowerCase().trim()`).
- Não registrar PII (e-mail, telefone, endpoint de push completo, conteúdo de mensagem) em logs de produção.
- Não devolver `stack`, SQL ou mensagens do Prisma ao cliente.

## 7. Tempo real (WebSocket)
- Eventos servidor→cliente só vão para quem **deve** recebê-los (`chatWebSocketManager.sendToUser(idDoDestinatario)`), com o ID do destinatário resolvido no servidor.
- Nunca repasse ID vindo do cliente como destinatário sem validar o vínculo (vaza presença e permite spam).
- Eventos de exclusão/limpeza notificam o outro participante **só** quando o efeito é para todos; ações "só para mim" notificam apenas as outras abas do próprio usuário.

## 8. Frontend
- Nunca use `dangerouslySetInnerHTML`/`innerHTML`; renderize texto via React (escapa por padrão). Não renderize URLs vindas do usuário em `<iframe>`/`<object>`.
- O frontend **não é barreira de segurança**: esconder um botão não substitui a checagem no backend.
- Não gravar dados sensíveis além do token em `localStorage`. (Migração para cookie `HttpOnly` está prevista como V15.)

## 9. Dependências e configuração
- Não adicionar dependência sem necessidade (ver `AGENTS.md`); preferir bibliotecas já usadas.
- Em produção: `FRONTEND_URL` sem `*`, `JWT_SECRET` com 32+ caracteres, HTTPS obrigatório.
- Segredos só em `.env` (nunca commitados).

## 10. Banco de dados
- Toda mudança de schema tem migration em `backend/prisma/migrations/` e deve ser aplicada antes de subir o código que depende dela.
- Exclusões de dados do usuário: preferir **soft delete / ocultação** quando outro usuário compartilha o dado (ex.: chat), e documentar o comportamento.

## Referências
- Auditoria completa: `docs/otimizacao/01-otimizacoes.md` (seção 7).
- Checklist de revisão: [`02-checklist-pr.md`](02-checklist-pr.md).
- Aplicação prática (exemplo): [`03-chat-exclusao-de-mensagens.md`](03-chat-exclusao-de-mensagens.md).
