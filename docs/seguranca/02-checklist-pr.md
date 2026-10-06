# Checklist de segurança antes de concluir uma tarefa

Marque mentalmente cada item. Se algum não se aplica, tudo bem; se aplica e não foi feito, **a tarefa não está pronta**. Detalhes em [`01-principios-seguranca.md`](01-principios-seguranca.md).

## Rotas HTTP novas
- [ ] Usa `authMiddleware` (e `requireRole`/`requireSuperAdmin` quando for por perfil).
- [ ] Tem schema Zod (`params`, `query`, `body`) aplicado com `validate(...)`; IDs com `z.uuid()`, textos com `.max()`, números com faixa.
- [ ] Todo recurso acessado por ID é verificado contra o dono/van **no service** (BOLA/IDOR). Teste mental: "e se for o ID de outra van?".
- [ ] "Não existe" e "não é seu" respondem 404 igual.
- [ ] Resposta usa `select`/DTO: sem `passwordHash`, sem campos internos.
- [ ] Erros usam `AppError` com status correto; nada de `new Error()` genérico.
- [ ] Endpoint custoso/sensível tem rate limit próprio.

## WebSocket / tempo real
- [ ] Payload validado com Zod (`safeParse`) antes de chegar ao service.
- [ ] Destinatário do evento resolvido no servidor e com vínculo validado.
- [ ] Respeita rate limit e `maxPayload` já existentes.
- [ ] Evento "para todos" x "só para mim" notifica apenas quem deve.

## Banco de dados
- [ ] Migration criada **e aplicada** antes de subir o código.
- [ ] Consultas novas filtram dados ocultos/apagados/inativos quando aplicável (histórico, prévia, contadores).
- [ ] Sem SQL concatenado; `$queryRaw` apenas com parâmetros.

## Frontend
- [ ] Sem `dangerouslySetInnerHTML`/`innerHTML`.
- [ ] Nenhuma regra de permissão depende só de esconder botão.
- [ ] Nada sensível em `localStorage` além do token atual.

## Logs e configuração
- [ ] Sem PII, tokens ou conteúdo de mensagens em logs.
- [ ] Sem novos segredos no código; variáveis novas documentadas e validadas em `env.ts`.

## Verificação mínima
- [ ] `npx tsc --noEmit` em `backend/` e `frontend/` sem erros.
- [ ] Testar manualmente com **dois usuários** (e uma van diferente) tentando acessar/alterar o recurso do outro: deve falhar com 404/403.
