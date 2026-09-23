# Stack Técnica e Decisões

Registradas no formato "decisão → alternativas consideradas → motivo → trade-off aceito", para servir de referência tanto para humanos quanto para agentes de IA que forem trabalhar no código.

## Formato do app: PWA

- **Alternativas consideradas**: app nativo (Swift/Kotlin ou React Native/Expo), site comum sem recursos de PWA.
- **Motivo da escolha**: reaproveita o conhecimento atual do autor (React, Node), não exige conta de desenvolvedor paga (a Apple cobra US$99/ano para publicar na App Store), e permite deploy instantâneo sem revisão de loja.
- **Trade-off aceito**: notificação push no iOS só funciona se o aluno instalar o PWA via "Adicionar à Tela de Início" no Safari e abrir por esse ícone — mitigado com tutorial de instalação no onboarding. Site comum foi descartado por não suportar push (essencial para o RF03).

## Frontend: React + Vite + TypeScript

- **Alternativas consideradas**: Astro.
- **Motivo da escolha**: o app tem estado interativo constante (contador em tempo real, status de presença) — um caso de uso oposto ao ponto forte do Astro (conteúdo majoritariamente estático). React também é o que o autor está aprendendo no momento.
- **Ferramenta de PWA**: `vite-plugin-pwa`, que gera manifest e service worker automaticamente.

## Backend: Node + Express + TypeScript

- **Motivo da escolha**: stack já dominada pelo autor, sem necessidade de aprender nova linguagem/framework para entregar o MVP.

## ORM: Prisma

- **Alternativas consideradas**: SQL puro, outros ORMs (TypeORM, Drizzle).
- **Motivo da escolha**: tipagem automática em TypeScript a partir do schema, reduzindo erros antes mesmo de rodar o código — importante para quem está no início do aprendizado de banco relacional.

## Banco de dados: PostgreSQL via Neon

- **Alternativas consideradas**: Supabase (equivalente), SQLite.
- **Motivo da escolha**: relacional (dados com relações claras entre motorista, alunos, status diários e pagamentos), free tier viável sem custo, serverless (sem gerenciamento de servidor de banco).

## Tempo real: polling REST, não WebSocket

- **Motivo da escolha**: com ~15 usuários simultâneos, WebSocket adiciona complexidade (gerenciamento de conexão, reconexão, salas) sem benefício perceptível. Um polling a cada 10-15 segundos enquanto a viagem está ativa entrega a mesma percepção de "tempo real" para esse volume de uso, com implementação e depuração muito mais simples.
- **Trade-off aceito**: latência de até ~15 segundos para refletir mudanças — irrelevante para o caso de uso (esperar a van não exige atualização por segundo).

## Notificações: Web Push API (VAPID)

- **Motivo da escolha**: padrão nativo do navegador, sem dependência de serviço de terceiros pago (diferente de push nativo de app, que costuma depender de Firebase Cloud Messaging). Implementado no backend com a biblioteca `web-push`.

## Hospedagem: dividida entre serviços gratuitos e a hospedagem já paga

| Componente | Onde | Motivo |
|---|---|---|
| Backend (Express + Prisma) | Render (free tier) | Gratuito; aceita o cold start de ~20-30s como trade-off dado o padrão de uso concentrado em horários previsíveis. |
| Banco de dados | Neon (free tier) | Gratuito, serverless, integra bem com Prisma. |
| Frontend (build estático do PWA) | Vercel | Gratuito e oferece os recursos suficientes para essa apliacação. |

## Organização do repositório: monorepo simples

- **Alternativas consideradas**: dois repositórios separados (polyrepo); ferramentas de monorepo como Turborepo/Nx.
- **Motivo da escolha**: um repositório único facilita manter frontend e backend sincronizados (mudanças relacionadas no mesmo commit) e simplifica o portfólio do projeto. Ferramentas como Turborepo/Nx foram descartadas por serem overhead desnecessário em um projeto de dois pacotes sem build complexo entre eles.
- **Estrutura**: pastas `/frontend` e `/backend` na raiz, cada uma com seu próprio `package.json` independente — sem compartilhamento automático de dependências.
