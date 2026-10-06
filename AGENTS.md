# Contexto do Projeto para Agentes de IA

Leia este arquivo antes de executar qualquer tarefa de código neste repositório.

## O que é este projeto

App web (PWA) para um motorista de van universitária e ~15 alunos. Resolve o problema de coordenar presença na volta (quem falta embarcar) sem depender de grupo de WhatsApp: o status de cada aluno é um estado compartilhado em tempo real, não uma mensagem de chat.

Contexto completo de produto em `docs/01-visao-produto.md` e requisitos detalhados em `docs/02-requisitos.md`.

## Stack

- **Frontend**: React + Vite + TypeScript, como PWA (`vite-plugin-pwa`)
- **Backend**: Node + Express + TypeScript
- **ORM**: Prisma
- **Banco de dados**: PostgreSQL (Neon)
- **Tempo real**: polling REST periódico para status/contador de faltantes; **WebSocket nativo (biblioteca `ws`) apenas para o chat** (`backend/src/websocket/`). Não usar Socket.io (ver `docs/04-stack-decisoes.md`)
- **Notificações**: Web Push API com VAPID, biblioteca `web-push` no backend
- **Hospedagem**: backend no Render, banco no Neon, frontend estático na HostGator

## Estrutura de pastas

```
van-app/
├── frontend/          # React + Vite + TypeScript (PWA)
├── backend/           # Node + Express + TypeScript + Prisma
├── docs/              # Documentação do produto
├── AGENTS.md
├── CLAUDE.md
└── README.md
```

Cada pasta (`frontend/`, `backend/`) tem seu próprio `package.json` e é tratada como projeto Node independente — não há dependências compartilhadas automaticamente entre elas.

## Convenções de código

- Identificadores no código (variáveis, funções, nomes de tabelas/campos) em **inglês**.
- Textos de interface visíveis ao usuário e comentários sobre regras de negócio em **português**.
- TypeScript em modo `strict`.
- Commits em português, formato `tipo: descrição curta` (ex.: `feat: adiciona check-in de embarque do aluno`).

## Escopo atual (MVP) — o que construir

- RF01: status diário do aluno por exceção (`vai_normal` padrão / `so_ida` / `so_volta` / `nao_vai`)
- RF02: contador de faltantes em tempo real (via polling)
- RF03: notificação push individual quando poucos faltam
- RF04: check-in de embarque (aluno ou motorista marca)
- RF05: mural de avisos do motorista (via única)
- RF06: cancelamento do dia inteiro pelo motorista
- RF07/RF08: lembrete de pagamento configurável + aluno informa pagamento e motorista confirma a baixa manual
- RF09: cadastro/gestão de alunos pelo motorista

Lista completa e critérios em `docs/02-requisitos.md`.

## Fora de escopo — não adicionar sem confirmar com o autor

- Chat bidirecional (individual com o motorista ou geral entre alunos)
- Gateway de pagamento integrado (Pix API, cartão)
- Rastreamento por GPS em tempo real
- WebSocket fora do chat e Socket.io (status/contador continuam via polling, ver `docs/04-stack-decisoes.md`)

Se uma tarefa parecer exigir um desses itens, avise o autor em vez de implementar — são decisões deliberadas de escopo, não lacunas a preencher.

## Segurança — obrigatório em todo código novo

O projeto passou por uma auditoria de segurança (`docs/otimizacao/01-otimizacoes.md`, seção 7, V01–V15). Todo código novo ou alterado **deve seguir** `docs/seguranca/01-principios-seguranca.md` e passar pelo `docs/seguranca/02-checklist-pr.md` antes de a tarefa ser dada como concluída. Regras inegociáveis:

- **Autorização por recurso (BOLA/IDOR)**: todo acesso por ID confere dono/van no *service*; "não existe" e "não é seu" respondem 404 igual. Nunca confiar no frontend nem em dados do JWT que possam mudar (ex.: `driverId`).
- **Validação**: toda rota tem schema Zod aplicado com `validate(...)` (`params`, `query`, `body`); payloads de WebSocket são validados com `safeParse` em `chatServer.ts`.
- **Exposição de dados**: usar `select`/DTO; nunca devolver entidade inteira (`passwordHash` etc.).
- **Abuso**: respeitar rate limits (HTTP e WebSocket) e limites de tamanho/paginação.
- **Erros e logs**: `AppError` com status correto; sem PII, tokens ou conteúdo de mensagens em logs.
- **Frontend**: sem `dangerouslySetInnerHTML`/`innerHTML`; esconder botão não é controle de acesso.
- Mudanças de schema exigem migration aplicada. Se uma tarefa conflitar com algum princípio, avise o autor em vez de contornar.

## Sobre o autor

Estudante de Ciências da Computação (2º semestre), primeiro projeto de porte médio. Já sabe Node/Express/TypeScript básico e está aprendendo React agora. Priorize código didático e soluções simples em vez de abstrações "enterprise" desnecessárias para o tamanho do projeto (15 usuários).

## Referências

- `docs/01-visao-produto.md` — problema, personas, objetivos
- `docs/02-requisitos.md` — requisitos funcionais/não funcionais, escopo MVP x Fase 2
- `docs/03-modelo-dados.md` — entidades, campos, diagrama de relacionamento
- `docs/04-stack-decisoes.md` — justificativa de cada escolha técnica
- `docs/seguranca/` — princípios e checklist de segurança para novas implementações
- `docs/otimizacao/01-otimizacoes.md` — auditoria de segurança (seção 7) e otimizações
