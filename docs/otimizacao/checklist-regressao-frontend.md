# Checklist de Regressão Manual — Frontend

Usado na refatoração do frontend (`docs/planos_implementacao/plano-refatoracao-frontend.md`).
Executar **antes** de iniciar cada fase 3–8 e **depois** de concluí-la. Marque `[x]` apenas na cópia da execução (ex.: no corpo do PR); mantenha este arquivo como modelo.

**Ambiente:** backend rodando (`backend`: `npm run dev`), frontend (`frontend`: `npm run dev`). Testar em **mobile (375 px)** e **desktop**.

Fase/commit testado: `__________`   Data: `__________`   Resultado: ☐ OK ☐ Regressão

---

## Motorista

### Acesso e turma
- [ ] Login como motorista leva à seleção de turma
- [ ] Selecionar uma turma abre o painel; o nome da turma aparece no cabeçalho
- [ ] Trocar de turma pela pílula do cabeçalho funciona e recarrega as listas
- [ ] "Chat geral" (sem turma) abre e permite voltar para a seleção de turmas
- [ ] Recarregar a página (F5) mantém a turma e o trajeto selecionados

### Operação da viagem (aba Operações)
- [ ] Donut mostra faltantes/total coerentes com a lista
- [ ] Alternar **Ida / Volta** muda as listas e persiste após recarregar
- [ ] Ida: "Finalizar Ida" → zera embarques, abre espera da Volta, muda para Volta
- [ ] Volta (aguardando): "Declarar Partida" → alunos deixam de ver o contador
- [ ] Volta (em viagem): "Finalizar Volta" → zera embarques e volta para Ida
- [ ] Volta (em viagem): "Reabrir espera" funciona
- [ ] Cancelar viagem de hoje (uma turma / várias / geral) mostra estado "cancelado"
- [ ] Desfazer cancelamento restaura o painel

### Alunos (aba Alunos)
- [ ] **A Embarcar:** marcar embarque move o aluno para "Embarcados" e o contador atualiza
- [ ] **Embarcados:** desfazer embarque devolve o aluno para "A Embarcar"
- [ ] Estados vazios corretos (todos embarcaram / ninguém embarcou / sem alunos)
- [ ] **Todos → Ativos:** badges de pagamento (Pago / Confirmar Pgto / pendente) corretos
- [ ] Confirmar pagamento e rejeitar pagamento funcionam
- [ ] Cadastrar aluno (nome, e-mail, senha temporária, turma); erros de validação aparecem
- [ ] Desativar aluno (modal de confirmação) → aparece em **Inativos**
- [ ] Reativar aluno em **Inativos**
- [ ] A lista atualiza sozinha (polling ~15 s) sem piscar o "Carregando"

### Avisos
- [ ] Publicar aviso para uma turma e para várias/geral; aparece na lista
- [ ] Mensagem vazia não publica

### Chat (aba Chat)
- [ ] Lista de conversas carrega; badge de não lidas no menu inferior atualiza
- [ ] Abrir conversa, enviar mensagem (Enter envia), recebe resposta em tempo real
- [ ] Indicador "Online / Reconectando..." coerente
- [ ] Paginar mensagens antigas ("carregar mais")
- [ ] Apagar mensagem **para mim** e **para todos** (menu: clique direito, chevron e toque longo no mobile)
- [ ] Limpar conversa (modal de confirmação)
- [ ] Respostas rápidas enviam o texto correto (perfil motorista)
- [ ] Botão de ligar: com telefone abre `tel:`; sem telefone mostra aviso
- [ ] Badges do aluno no cabeçalho (embarcado / não vai / só ida / só volta / turma)

### Configurações
- [ ] Alterar tema (claro/escuro) persiste
- [ ] Configurações de pagamento e notificações salvam
- [ ] Sair (logout) volta ao login

---

## Aluno

- [ ] Login como aluno abre o painel
- [ ] Alterar status do dia (vai normal / só ida / só volta / não vai) salva e reflete no motorista
- [ ] Contador de faltantes aparece na espera e some quando o motorista declara partida
- [ ] Aviso de viagem cancelada aparece quando o motorista cancela
- [ ] Marcar o próprio embarque (check-in) funciona
- [ ] Informar pagamento; estado "aguardando confirmação"
- [ ] Mural de avisos lista os avisos da turma
- [ ] Chat com o motorista: enviar, receber, apagar, limpar, respostas rápidas (perfil aluno)
- [ ] Botão de ligar para o motorista (sem telefone → aviso)
- [ ] Perfil: foto, telefone e rotina semanal salvam
- [ ] Notificações push: banner de permissão aparece/funciona

---

## Admin (`/admin`)

- [ ] Login admin abre painel; acesso negado para quem não é admin
- [ ] Gestão de motoristas: listar, criar, editar, desativar
- [ ] Gestão de alunos: listar, criar, editar, desativar
- [ ] Gestão de admins: listar e gerenciar (respeitando RBAC)

---

## Geral

- [ ] Sem erros no console do navegador durante os fluxos acima
- [ ] Sem requisições com 4xx/5xx inesperadas na aba Network
- [ ] Layout sem quebras em 375 px e em desktop (modais, listas, bottom nav)
- [ ] Recuperação de senha (`ResetPassword`) abre e valida
- [ ] PWA: app instala e carrega o service worker sem erro
