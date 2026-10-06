# Exemplo aplicado: exclusão de mensagens e limpeza de conversa

Revisão de segurança da funcionalidade "excluir mensagem (só para mim / para todos)" e "limpar conversa", contra a auditoria V01–V15.

| Risco (auditoria) | Como a funcionalidade trata |
|---|---|
| V01 BOLA/IDOR | `deleteMessage` só age se o usuário for participante da conversa (motorista dono ou aluno dono). Excluir **para todos** exige `senderId === user.id`. `clearConversation` valida o vínculo motorista-aluno lendo do banco. |
| Enumeração de IDs | "Mensagem não existe" e "mensagem de outra conversa" retornam o mesmo **404**. |
| V06 / V13 | Rotas atrás do `authMiddleware` (conta ativa, HS256). O `driverId` do aluno vem do banco, não do JWT. |
| V08 | Payloads do WebSocket (`send_message`, `mark_as_read`) agora passam por Zod (`wsSendMessagePayloadSchema`, `wsMarkAsReadPayloadSchema`): `content` 1–1000, `tempId` ≤ 64, `conversationWith` UUID. |
| V09 | `DELETE /chat/messages/:id`, `DELETE /chat/history/:partnerId` e `GET /chat/history/:partnerId` validados com Zod (`z.uuid`, `scope` enum, `limit` 1–100). Corrige também o `limit` inválido (`NaN`) que gerava 500 no histórico. |
| V03 | Nenhuma entidade com dados sensíveis é devolvida; a resposta de exclusão é só `{ success, message }`. |
| Privacidade | Exclusão para todos **sobrescreve** o conteúdo no banco (`"Mensagem apagada"`); a prévia do motorista e as contagens ignoram mensagens ocultas/apagadas. |
| V14 (vazamento via WS) | Eventos `message_deleted` / `conversation_cleared` são enviados só ao destinatário real (resolvido no servidor) e às outras abas do próprio usuário. Ações "só para mim" **não** notificam o outro lado. |

## Rotas

| Método | Rota | Proteção |
|---|---|---|
| `DELETE` | `/api/chat/messages/:id?scope=me\|everyone` | `authMiddleware` + `chatDeletionLimiter` + `validate(deleteChatMessageSchema)` + checagem de participante/autoria no service |
| `DELETE` | `/api/chat/history/:partnerId` | `authMiddleware` + `chatClearLimiter` + `validate(chatPartnerParamSchema)` + vínculo motorista-aluno no service |
| `GET` | `/api/chat/history/:partnerId` | `authMiddleware` + `validate(chatHistorySchema)` |

## Pendências tratadas e resolvidas
- **Validação de `query` e `params` no `validate`:** o middleware `validate` foi atualizado para atribuir também `req.query` e `req.params` com os objetos parseados e transformados pelo Zod (descartando propriedades estranhas e aplicando coerções como `z.coerce.number`).
- **Rate limiting dedicado:** foram criados `chatDeletionLimiter` (máx. 30 exclusões/min por usuário) e `chatClearLimiter` (máx. 5 limpezas de histórico/min por usuário), aplicados antes do controller nas rotas `DELETE /api/chat/messages/:id` e `DELETE /api/chat/history/:partnerId`.

