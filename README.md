# VanApp (nome provisório)

Aplicativo web (PWA) para motoristas de van universitária e seus alunos. Resolve o problema de comunicação de presença — hoje feito manualmente em grupo de WhatsApp — substituindo por um estado compartilhado em tempo real: cada aluno confirma se vai/não vai, o motorista vê quem falta para a van sair sem precisar perguntar, e os alunos só recebem notificação quando o número de faltantes fica baixo.

> Este README é o ponto de entrada. Para contexto completo do produto, requisitos e decisões técnicas, veja a pasta `docs/`.

## Documentação do produto

| Arquivo | Conteúdo |
|---|---|
| [`docs/01-visao-produto.md`](docs/01-visao-produto.md) | Problema, personas, objetivos, fora de escopo |
| [`docs/02-requisitos.md`](docs/02-requisitos.md) | Requisitos funcionais e não funcionais, escopo MVP x Fase 2 |
| [`docs/03-modelo-dados.md`](docs/03-modelo-dados.md) | Entidades, campos e relacionamentos (com diagrama) |
| [`docs/04-stack-decisoes.md`](docs/04-stack-decisoes.md) | Stack escolhida e justificativa de cada decisão |

## Contexto para agentes de IA

| Arquivo | Para quem |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Contexto geral do projeto — stack, convenções, escopo. Leia antes de qualquer tarefa. |
| [`CLAUDE.md`](CLAUDE.md) | Notas específicas para uso com Claude Code |

## Estrutura do repositório (monorepo)

```
van-app/
├── frontend/          # React + Vite + TypeScript (PWA)
├── backend/           # Node + Express + TypeScript + Prisma
├── docs/              # Documentação do produto
├── AGENTS.md          # Contexto para agentes de IA
├── CLAUDE.md          # Notas específicas para Claude Code
└── README.md          # Este arquivo
```

## Como rodar localmente

### Backend

```bash
cd backend
cp .env.example .env
# edite .env: DATABASE_URL (Neon), JWT_SECRET, e as chaves VAPID
npx web-push generate-vapid-keys   # copie o resultado para VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY no .env

npm install
npx prisma migrate dev --name init  # cria as tabelas no banco a partir de prisma/schema.prisma
npm run dev                         # sobe em http://localhost:3333
```

### Frontend

```bash
cd frontend
cp .env.example .env   # confira se VITE_API_URL aponta para o backend acima
npm install
npm run dev             # sobe em http://localhost:5173
```

> As telas de login/cadastro ainda não existem neste scaffold (ver `TODO` em `frontend/src/App.tsx`). Por ora, para testar, chame `POST /api/auth/drivers/register` (ou `/students/login`, depois de cadastrar um aluno) via Postman/Insomnia, pegue o `token` da resposta e salve manualmente com `localStorage.setItem("van-app:token", "...")` no console do navegador.

## Camadas do backend

```
routes/       → define os endpoints HTTP e aplica os middlewares (auth, papel)
controllers/  → traduz request/response, sem regra de negócio
services/     → regras de negócio (ex.: cálculo do contador de faltantes, regra do padrão "vai_normal")
repositories/ → único lugar que fala com o Prisma/banco de dados
```

## Status

Scaffold inicial criado: estrutura em camadas do backend com Prisma, e frontend React + PWA com o fluxo de presença (RF01-RF04) funcional. Faltam: telas de login/cadastro, cadastro de alunos pelo motorista na interface, e o restante das camadas de pagamento (RF07/RF08) e mural (RF05) no frontend (o backend já suporta ambos).
