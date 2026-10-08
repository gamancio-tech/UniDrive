import { z } from "zod";

export const chatHistorySchema = z.object({
  params: z.object({ partnerId: z.uuid("ID inválido") }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
    beforeId: z.uuid("ID inválido").optional(),
  }),
});

export const chatPartnerParamSchema = z.object({
  params: z.object({ partnerId: z.uuid("ID inválido") }),
});

export const deleteChatMessageSchema = z.object({
  params: z.object({ id: z.uuid("ID inválido") }),
  query: z.object({
    scope: z.enum(["me", "everyone"]).default("me"),
  }),
});

// Payloads recebidos pelo WebSocket do chat (não passam pelo middleware validate).
export const wsSendMessagePayloadSchema = z.object({
  recipientId: z.string().max(64).optional(),
  content: z.string().min(1).max(1000),
  tempId: z.string().max(64).optional(),
});

export const wsMarkAsReadPayloadSchema = z.object({
  conversationWith: z.uuid("ID inválido"),
});
