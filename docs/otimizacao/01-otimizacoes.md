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
