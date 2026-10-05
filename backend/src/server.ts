import http from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { initChatWebSocketServer } from "./websocket/chatServer";

const app = createApp();
const server = http.createServer(app);

// Inicializa o servidor WebSocket de Chat acoplado ao servidor HTTP
initChatWebSocketServer(server);

server.listen(env.port, () => {
  console.log(`Backend rodando em http://localhost:${env.port}`);
});
