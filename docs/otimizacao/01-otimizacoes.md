# Otimizações de Performance e Refatorações

Este documento descreve as otimizações e correções de gargalos implementadas na aplicação para melhorar o desempenho geral, economizar banda de rede, reduzir latência e melhorar o uso do banco de dados. 

## 1. Otimizações de Banco de Dados (Prisma & PostgreSQL)

### 1.1 Eliminação de Consultas N+1 (Módulo de Chat)
- **O Problema:** A listagem de contatos do motorista iterava sobre todos os alunos fazendo duas buscas na tabela `ChatMessage` por aluno (uma para pegar a última mensagem e outra para contar o número de mensagens não lidas), resultando no problema clássico de N+1 (ex: 1 query para listar alunos + 30 queries separadas para buscar mensagens de 15 alunos).
- **A Solução:** Foram criadas novas rotinas no repositório (`getLatestMessagesPerStudent` e `getUnreadCountsGroupedByStudent`) que utilizam métodos avançados do Prisma, como `groupBy` (para contagem de não lidos) e o comando SQL puro `SELECT DISTINCT ON` para resgatar eficientemente as mensagens mais recentes de todos os alunos numa única operação de banco.

### 1.2 Criação de Índices (`schema.prisma`)
- **O Problema:** Durante varreduras, notou-se que a tabela `PushSubscription` não tinha índices para chaves estrangeiras (`studentId`, `driverId` e `adminId`). Como os envios de notificações (Web Push) são constantes, procuras frequentes desencadeavam "Full Table Scans", lendo a tabela inteira a cada push.
- **A Solução:** Inclusão de `@@index([studentId])`, `@@index([driverId])` e `@@index([adminId])` no modelo `PushSubscription`, aumentando consideravelmente a performance em queries de envio de avisos e notificações de embarque.

## 2. Otimizações de Payload e Rede (Backend Node.js)

### 2.1 Compressão Gzip/Brotli
- **O Problema:** Como a aplicação atende alunos em locais de rede instável (3G/4G no ambiente universitário ou durante o trajeto), os tamanhos das respostas HTTP consumiam banda valiosa e tornavam as respostas mais lentas. O framework Express não envia requisições comprimidas nativamente.
- **A Solução:** Instalação e acoplamento do middleware `compression` no arquivo principal `app.ts`. Isso reduz o tamanho final dos payloads da API JSON em torno de 60-80% antes de trafegar na rede.

### 2.2 Prevenção de Vazamento de Dados e Otimização de Respostas
- **O Problema:** Entidades inteiras da tabela `Student` estavam sendo transferidas para o frontend na hora de listagens globais (`studentService.listActiveByDriver` e `studentService.listByStatus`), o que incluía a coluna `passwordHash` das senhas codificadas no Payload do JSON.
- **A Solução:** Implementado filtro map explícito no Service, omitindo a coluna `passwordHash` (junto de demais lixos desnecessários) em toda a devolução das requisições REST da listagem de alunos, fechando uma brecha grave de segurança e secando o tráfego extra.

## 3. Otimizações de Re-render e Fetching (Frontend React)

### 3.1 Ciclo de Vida Abusivo das Abas (Tabs)
- **O Problema:** Nos painéis centrais (`DriverHome.tsx` e `StudentHome.tsx`), a lógica padrão de troca de abas destruía e remontava o componente filho constantemente (`{tab === 'home' && <HomeTab />}`). Como cada aba tinha hooks locais de requisição à API (Polling de Faltantes, Buscar Histórico de Mensagens, Buscar Rotinas), cada mudança banal de página disparava todas as requisições na rede novamente com um lag de tela em branco (Loading de 3 segundos).
- **A Solução:** Inclusão de uma variável de estado `visitedTabs`. Agora as abas mantêm os elementos no DOM apenas escondendo-os via CSS (`display: none` / `className="hidden"`). Essa técnica engaveta os resultados cacheados, preserva os estados em memória e deixa a navegação entre a aba 'Rotina' e 'Chat' estritamente instantânea após o primeiro carregamento.

### 3.2 Requisições de Polling Duplicadas
- **O Problema:** Múltiplos componentes estavam importando o hook `useUnreadChatCount` para ficar checando notificações, multiplicando os disparos (Polling a cada 5s) via REST para a mesma rota da API de chat simultaneamente.
- **A Solução:** Refatoração do hook para se aproveitar da nova rota central unificada de contagem no backend. Limpeza nas instâncias em que ele era importado desnecessariamente ou em abas ocultas, assegurando que o Polling ocorra apenas a partir do Top-Level (NavBar/HomeRoot) preservando os limites do banco de dados sob as chamadas simultâneas.

## 4. Otimizações de Segurança (Express & Rate Limiters)

### 4.1 Cabeçalhos HTTP de Segurança (Helmet)
- **O Problema:** A aplicação Express pura não emite as flags seguras HTTP. Sem elas, sites maliciosos poderiam embutir o frontend do UniDrive dentro de IFrames ocultos para roubar cliques (Clickjacking) ou farejar o conteúdo MIME do tráfego.
- **A Solução:** Instalação do middleware `helmet` no pipeline do `app.ts`. Isso fornece automaticamente 14 proteções nativas (como Content-Security-Policy, X-Frame-Options setado para DENY/SAMEORIGIN, HSTS), endurecendo a aplicação contra injeções diretas.

### 4.2 Rate Limiting contra Força Bruta
- **O Problema:** Por usar HTTP Polling agressivo no frontend, a API estava totalmente aberta. Um bot conseguiria mandar 10.000 requisições por segundo para testar senhas (`/api/students/login`) e derrubar o servidor.
- **A Solução:** Instalação da biblioteca `express-rate-limit`. Adição do `globalLimiter` em `/api` (500 requisições a cada 15 min) e um limitador rígido `authLimiter` nas rotas de login (15 tentativas). Configuração do `app.set("trust proxy", 1)` para impedir que o bloqueio afete o IP da plataforma de hospedagem (Render).

## 5. Processamento e Segurança de Imagens (Profile Photos)

### 5.1 Compressão Nativa Client-Side e Economia de Armazenamento
- **O Problema:** Alunos tentavam fazer upload de fotos de perfil com 5MB ou mais (fotos tiradas na câmera do celular). Enviar isso puro para a API derrubava requisições e causava consumo brutal da rede 3G e do banco de dados.
- **A Solução:** No frontend (`StudentProfilePhotoCard.tsx`), a imagem selecionada é redimensionada usando um elemento `<canvas>` nativo do HTML5 (`compressProfileImage`). A imagem é travada nas dimensões máximas de 256x256 e transformada em base64 (`data:image/jpeg`) com compressão de 85%, derrubando o peso das imagens para **~15 a 30KB** antes de atingir a rede.

### 5.2 Segurança e Validação de Payload no Servidor
- **O Problema:** Apesar do frontend estar protegido e mandar imagens leves de 20KB, um atacante poderia burlar a interface e mandar payloads gigantes de 10MB para estourar a memória (OOM), ou anexar payloads não-imagem (`javascript:alert('1')`) causando XSS ou corrupção no banco de dados.
- **A Solução:** 
  - Limite severo via Express: O `app.use(express.json({ limit: "1mb" }))` bloqueia conexões grosseiras acima de 1 MegaByte antes de entrarem na arquitetura.
  - Validação da Camada de Serviço: O arquivo `student.service.ts` garante que fotos enviadas sempre respeitem o limite de 500.000 caracteres (~500kb em base64) e obriga explicitamente que a String comece com a declaração `data:image/`, banindo formatos ou injeções nocivas.
