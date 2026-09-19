# Claude Code — Instruções deste repositório

Este projeto usa o arquivo [`AGENTS.md`](AGENTS.md), na raiz, como fonte principal de contexto (visão do produto, stack, convenções, escopo do MVP e o que está deliberadamente fora de escopo). **Leia-o antes de qualquer tarefa.**

## Notas específicas para Claude Code

- É um monorepo simples, sem ferramenta de build compartilhado: rode comandos dentro de `frontend/` ou `backend/`, não a partir da raiz.
- Comandos comuns: `npm run dev` em cada pasta; `npx prisma migrate dev` e `npx prisma generate` em `backend/` após mudanças em `prisma/schema.prisma`.
- O backend segue arquitetura em camadas (`routes → controllers → services → repositories`). Ao adicionar uma funcionalidade, siga esse padrão: repositório para acesso ao Prisma, serviço para a regra de negócio, controller só traduzindo HTTP, rota registrando o endpoint em `src/routes/index.ts`.
- O frontend ainda não tem telas de login/cadastro — ver o `TODO` em `frontend/src/App.tsx` antes de assumir que a autenticação está pronta.
- Antes de sugerir ou instalar uma dependência nova, verifique se o que ela resolve já está coberto pela stack definida em `AGENTS.md` — o projeto prioriza deliberadamente poucas dependências.
- O autor é iniciante em programação (2º semestre de Ciências da Computação). Ao gerar código, prefira soluções simples e explicadas a padrões avançados ou abstrações desnecessárias para o porte do projeto.
- Mudanças que envolvam chat, gateway de pagamento, GPS ou WebSocket estão marcadas como fora de escopo em `AGENTS.md` — confirme com o autor antes de implementar qualquer uma delas.
