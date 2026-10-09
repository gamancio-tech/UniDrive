# 🚐 UniDrive

Aplicativo web progressivo (PWA) para motoristas de van universitária e seus alunos. O UniDrive substitui a confusão de grupos de mensagens por um **estado compartilhado em tempo real**: cada passageiro confirma sua presença com base na rotina semanal, o motorista acompanha instantaneamente quem falta embarcar na ida e na volta, e os alunos recebem notificações push direcionadas apenas quando a saída da van está próxima.

---

## ✨ Principais Funcionalidades

- **📋 Presença Diária por Exceção (RF01/RF12)**: O aluno configura sua rotina semanal padrão (`vai normal`, `só ida`, `só volta`, `não vai`). Ele só precisa mexer no app se tiver um imprevisto ou exceção no dia.
- **⏱️ Contador de Faltantes em Tempo Real (RF02)**: Contagem em tempo real de quem falta embarcar, atualizada via polling periódica a cada 10-15s, sem sobrecarga de conexões.
- **🔔 Notificações Push Individuais (RF03/RF05)**: Disparo automático de Web Push (VAPID) quando restam poucos passageiros a embarcar (≤ 2) ou quando o motorista publica um comunicado no mural.
- **✅ Listas e Check-in de Embarque (RF04)**: Divisão clara das viagens entre *"A Embarcar"*, *"Embarcados"* e *"Todos"*. O check-in pode ser feito pelo próprio aluno ou confirmado pelo motorista.
- **🏫 Suporte a Múltiplas Turmas (RF11)**: O motorista gerencia diferentes turmas (ex.: *Unifran Manhã*, *Direito Noite*), com alternância rápida no painel, contadores independentes e envio de comunicados individuais ou gerais.
- **💬 Chat Individual 1:1 em Tempo Real (RF10)**: Canal direto e privado entre o motorista e cada passageiro via WebSocket nativo (`ws`), com histórico paginado, badges de mensagens não lidas, exclusão ("para mim" ou "para todos") e limpeza de conversa.
- **📢 Mural de Avisos da Van (RF05)**: Motorista publica avisos direcionados para turmas selecionadas ou para toda a van com notificação push imediata.
- **🚫 Cancelamento de Viagem (RF06)**: Cancelamento da operação do dia (feriado, imprevisto) direcionado por turma ou geral, suspendendo contadores e lembretes da data.
- **💳 Gestão de Mensalidades (RF07/RF08)**: Lembretes automáticos antes do vencimento; o aluno informa o pagamento com um toque e o motorista confere e dá a baixa manual.
- **👤 Perfil com Foto e Contato Rápido**: Fotos de perfil sanitizadas (validação rigorosa de magic bytes) e atalho para ligação telefônica instantânea (`tel:`).
- **🛡️ Painel Administrativo com RBAC (RF13)**: Gestão global de motoristas, alunos e administradores via `/admin`.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| **Frontend** | React 18 + Vite + TypeScript (PWA) | SPA reativa, tipagem estrita, instalável no celular via `vite-plugin-pwa` |
| **Backend** | Node.js + Express + TypeScript | Arquitetura limpa em camadas, tipagem consistente e alta performance |
| **Banco de Dados**| PostgreSQL via Neon Serverless | Banco relacional escalável com pool serverless |
| **ORM** | Prisma ORM | Modelagem tipada e migrações seguras (`prisma/migrations`) |
| **Tempo Real** | Polling REST (status) + WebSocket Nativo (`ws`) | Polling de 15s para contadores (baixo custo) e WebSocket para o chat 1:1 |
| **Notificações** | Web Push API (VAPID) com `web-push` | Notificações nativas no dispositivo sem dependência de serviços pagos |
| **Segurança** | Zod + Helmet + Rate Limiters + BCrypt | Validação estrita de entradas, proteção contra força bruta e BOLA/IDOR |

---

## 📁 Estrutura do Repositório (Monorepo)

```
UniDrive/
├── frontend/               # Aplicação React + Vite + TypeScript (PWA)
│   ├── src/
│   │   ├── api/            # Clientes HTTP REST e chamadas de API tipadas
│   │   ├── features/       # Módulos de domínio (driver, chat, dailyStatus, announcements, etc.)
│   │   ├── pages/          # Páginas principais (DriverHome, StudentHome, AdminDashboard, etc.)
│   │   └── websocket/      # Gerenciamento da conexão WebSocket do chat
├── backend/                # API REST + WebSocket (Node + Express + Prisma)
│   ├── prisma/             # Schema do banco e histórico de migrations
│   ├── src/
│   │   ├── routes/         # Definição de endpoints HTTP e middlewares
│   │   ├── controllers/    # Tradução de requisições e respostas
│   │   ├── services/       # Regras de negócio e mitigação BOLA/IDOR
│   │   ├── repositories/   # Comunicação direta com o Prisma/PostgreSQL
│   │   ├── schemas/        # Schemas Zod modulares por responsabilidade
│   │   ├── middlewares/    # Autenticação JWT, validação Zod e Rate Limiters
│   │   └── websocket/      # Servidor WebSocket nativo do chat
└── docs/                   # Documentação detalhada do produto e arquitetura
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Node.js 18+ instalado
- Instância do PostgreSQL (ou conta no [Neon](https://neon.tech))

### 1. Backend

```bash
cd backend

# Copie o arquivo de variáveis de ambiente
cp .env.example .env

# Configure o .env com sua DATABASE_URL do Neon, JWT_SECRET e chaves VAPID:
# Para gerar as chaves VAPID:
npx web-push generate-vapid-keys

# Instale as dependências
npm install

# Aplique as migrations no banco de dados
npx prisma migrate dev

# Inicie o servidor de desenvolvimento (porta 3333)
npm run dev
```

### 2. Frontend

```bash
cd frontend

# Copie as variáveis de ambiente
cp .env.example .env

# Certifique-se de que VITE_API_URL aponta para http://localhost:3333
# Instale as dependências
npm install

# Inicie o servidor Vite (porta 5173)
npm run dev
```

Abra `http://localhost:5173` no navegador ou instale o PWA pelo dispositivo móvel.

---

## 🔒 Princípios de Segurança e Boas Práticas

O projeto foi auditado e segue regras inegociáveis de segurança:
1. **Autorização por Recurso (BOLA/IDOR Mitigado)**: Todo acesso por ID confere dono e van na camada de *service*. Acessos não autorizados respondem 404 para não vazar a existência do ID em outra van.
2. **Validação Estrutural Completa**: 100% das rotas HTTP validam `body`, `query` e `params` com schemas Zod modulares. Mensagens WebSocket são validadas com `safeParse`.
3. **Exposição Mínima de Dados**: Uso estrito de DTOs e cláusulas `select` no Prisma — hashes de senha (`passwordHash`) e dados sensíveis nunca trafegam para o cliente.
4. **Proteção Contra Força Bruta e Abusos**: Rate limiters dedicados para tentativas de login por IP e e-mail, mutações de turmas, exclusões de mensagens e requisições globais.
5. **Sanitização de Uploads**: Fotos de perfil recebidas em base64 passam por validação de tamanho e checagem de assinatura de arquivo binário (*magic bytes* para JPEG, PNG e WebP).

---

## 📚 Documentação Complementar

| Documento | Descrição |
|---|---|
| [`docs/01-visao-produto.md`](docs/01-visao-produto.md) | Visão do produto, problemas resolvidos e personas atendidas |
| [`docs/02-requisitos.md`](docs/02-requisitos.md) | Requisitos funcionais (RF01–RF13) e não funcionais detalhados |
| [`docs/03-modelo-dados.md`](docs/03-modelo-dados.md) | Diagrama de relacionamento (ER) e descrição de todas as entidades |
| [`docs/04-stack-decisoes.md`](docs/04-stack-decisoes.md) | Justificativa técnica e trade-offs de cada decisão de arquitetura |
| [`docs/05-consumo-api.md`](docs/05-consumo-api.md) | Referência completa de todos os endpoints REST e eventos WebSocket |
| [`docs/seguranca/`](docs/seguranca/) | Princípios de segurança e checklist de verificação de PR |
| [`AGENTS.md`](AGENTS.md) | Contexto de desenvolvimento, escopo e convenções para agentes de IA |
