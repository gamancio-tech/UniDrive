# Plano de Implementação: Rate Limiter

## 1. Objetivo
Proteger as rotas do backend (API) contra abusos, ataques de força bruta e picos de requisições maliciosas (DDoS). Como o projeto usa um banco de dados serverless (Neon), rajadas de requisições podem impactar faturamento e causar a exaustão das conexões ativas.

## 2. Ferramentas e Dependências
Será utilizada a biblioteca padrão para aplicações Node/Express:
- `express-rate-limit`

Comando de instalação previsto:
```bash
npm install express-rate-limit
npm install -D @types/express-rate-limit
```

## 3. Estratégia dos Limitadores

A aplicação precisará de dois níveis de mitigação devido à sua arquitetura que depende de verificações periódicas (Polling):

### 3.1 Rate Limiter Global (Moderado)
- **Alvo:** Todas as rotas baseadas em `/api/*` (excluindo as de autenticação que terão restrição maior).
- **Justificativa:** Como o frontend possui rotinas de Polling (ex: checar contador de mensagens não lidas ou status dos alunos na van a cada 5~10 segundos), definir limites muito baixos bloquearia usuários legítimos (especialmente se vários alunos estiverem usando o mesmo Wi-Fi de um prédio universitário, partilhando do mesmo IP público).
- **Regras:**
  - Janela: `15 minutos`
  - Limite: `500 requisições` por IP e usuário. (Permite em média 1 requisição a cada ~1.8 segundos).
  - Estratégia de Identificação (`keyGenerator`): Se o usuário estiver autenticado, a contagem é atrelada ao seu `req.user.id` (evita que alunos no mesmo Wi-Fi se bloqueiem mutuamente). Se não estiver, atrela ao `req.ip`.
  - Mensagem em caso de bloqueio: "Muitas requisições efetuadas. Aguarde um instante."

### 3.2 Rate Limiter de Autenticação (Rigoroso)
- **Alvo:** Rota `/api/auth/login/...` (e quaisquer futuras rotas de recuperação de senha ou criação de usuário pelo próprio).
- **Justificativa:** Rotas sensíveis devem blindar o sistema contra scripts de Força Bruta (Brute-Force) que testam dicionários de senhas massivamente até acertar o acesso de um motorista/aluno.
- **Regras:**
  - Janela: `15 minutos`
  - Limite: `15 requisições` por IP e usuário (deve-se verificar também o usuário já que o IP é domínio do usuário malicioso).
  - Estratégia de Identificação (`keyGenerator`): Combinação de `req.ip` + e-mail tentado no login (`req.body.email`). Isso impede tanto que um IP teste várias contas, quanto que uma conta específica sofra ataque massivo de dicionário.
  - Mensagem em caso de bloqueio: "Muitas tentativas de acesso. Tente novamente após 15 minutos."

## 4. Passo a Passo Técnico

1. **Criação do Middleware (`backend/src/middlewares/rateLimiter.middleware.ts`)**
   - Instanciar e exportar os objetos `globalLimiter` e `authLimiter` com suas configurações.

2. **Injeção no Fluxo de Rotas Globais (`backend/src/app.ts`)**
   - Importar `globalLimiter`.
   - Adicionar ao pipeline logo após o tratamento de CORS/JSON: `app.use('/api', globalLimiter);`

3. **Injeção no Fluxo de Autenticação (`backend/src/routes/auth.routes.ts`)**
   - Importar `authLimiter`.
   - Inserir na rota de login como middleware pré-controller.

## 5. Cuidados Adicionais (Checklist Final)
- [ ] O Express precisa estar ciente que está operando possivelmente atrás de um Proxy Reverso/Load Balancer (como a HostGator/Render fornecem). Configurar o Express com `app.set("trust proxy", 1)` é crucial, senão o Rate Limiter registrará o IP do Proxy em vez do IP real do usuário, bloqueando todos os usuários caso um deles atinja o limite.
