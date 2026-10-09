# Requisitos

## Requisitos Funcionais

| ID | Requisito | Observações |
|---|---|---|
| RF01 | O aluno pode definir seu status do dia: `vai normal` (padrão), `só ida`, `só volta`, `não vai` | O padrão evita que todo aluno precise agir todo dia — só quem tem exceção usa o app naquele dia. Pode ser sobrescrito pela rotina semanal padrão (RF12). |
| RF02 | O sistema exibe, para todos os alunos e para o motorista, um contador de faltantes para embarcar em tempo real | Filtrado por turma e viagem (`ida` / `volta`). Baseado em polling periódico REST a cada 10-15s (ver `04-stack-decisoes.md`). |
| RF03 | O sistema envia notificação push individual aos alunos que ainda não embarcaram quando o número de faltantes atinge um limite baixo (≤ 2) | Disparado na transição de estado da contagem de faltantes da turma. |
| RF04 | O aluno ou o motorista pode marcar que o aluno chegou na van (check-in de embarque) | Sem validação por GPS — autodeclarado ou conferido pelo motorista nas listas "A Embarcar" e "Embarcados". |
| RF05 | O motorista pode publicar um aviso (mural) para turmas específicas ou para todas as turmas, com notificação push | Via única (motorista → alunos), com histórico de recados. |
| RF06 | O motorista pode cancelar a operação do dia por turma ou para todas as turmas (feriado, manutenção etc.) | Zera os contadores e suspende notificações de faltantes do dia da turma cancelada. |
| RF07 | O sistema envia lembrete de pagamento ao aluno com antecedência configurável (padrão 3 dias antes e no dia) | Antecedência ajustável pelo aluno na aba de pagamentos. |
| RF08 | O aluno informa o pagamento da van (solicita baixa manual); o motorista confere e confirma o pagamento no painel | Pagamento em si ocorre fora do app (Pix direto ao motorista); motorista pode confirmar ou recusar a solicitação. |
| RF09 | O motorista pode cadastrar, desativar e reativar alunos vinculados à sua van e turmas | Cadastro com senha provisória e seleção da turma correspondente. |
| RF10 | Chat individual (1:1) em tempo real entre o motorista e cada aluno | Implementado via WebSocket nativo (`ws`), com histórico paginado, unread badge, exclusão pontual ("para mim" ou "para todos") e limpeza completa de conversa. |
| RF11 | Múltiplas turmas por motorista | Gestão de turmas (criar, editar, excluir), tela de seleção no primeiro acesso, pílula de troca rápida de turma e isolamento completo de contadores e presença. |
| RF12 | Perfil do usuário, foto de perfil, telefone e rotina semanal padrão | Upload de imagem com validação de magic bytes; atalho para ligação telefônica (`tel:`); configuração dos dias da semana em que o aluno normalmente vai de van. |
| RF13 | Painel administrativo (`/admin`) para gestão da plataforma | Controle de motoristas, alunos e administradores com níveis de permissão (Admin e Super Admin). |

---

## Requisitos Não Funcionais

| ID | Requisito |
|---|---|
| RNF01 | O app deve ser instalável como PWA em Android e iOS (com instruções de instalação para Safari/iOS e manifest configurado). |
| RNF02 | Toda entidade e rota confere permissão estrita no service (`driverId`, `classId`), mitigando vulnerabilidades BOLA/IDOR. |
| RNF03 | Autenticação com JWT assinado e senhas criptografadas com bcrypt; nenhum dado bancário sensível é armazenado. |
| RNF04 | O contador de presença reflete alterações em no máximo ~15 segundos (intervalo de polling REST). O chat opera em tempo real milissegundo via WebSocket. |
| RNF05 | Validação estrita de todos os dados de entrada com Zod (body, query, params e payloads de WebSocket). |
| RNF06 | Proteção contra abusos e força bruta através de rate limiters dedicados (login por IP e e-mail, chat, turmas e global). |
| RNF07 | Segurança HTTP através de cabeçalhos Helmet, sanitização de logs (sem PII ou tokens) e DTOs seguros que não expõem hashes de senha. |

---

## Limitações Conhecidas (Aceitas Conscientemente)

- **Push notification no iOS**: Requer instalação do PWA via Safari ("Adicionar à Tela de Início") e abertura pelo ícone.
- **Cold start no backend (free tier Render)**: A primeira requisição após inatividade pode levar ~20-30s. Aceitável dado o padrão concentrado de uso (manhã e fim de tarde).
- **Check-in autodeclarado**: Sem rastreamento GPS obrigatório, baseado na confiança entre motorista e alunos da van.

---

## Escopo: Funcionalidades Entregues

| Funcionalidade | Status | Detalhes |
|---|---|---|
| Confirmação de presença diária por exceção (RF01) | ✅ Concluído | Padrão "vai normal", só ida, só volta, não vai |
| Rotina semanal padrão do aluno (RF12) | ✅ Concluído | Configura dias fixos da semana |
| Contador de faltantes e status de viagem (RF02) | ✅ Concluído | Isolado por turma e tipo de viagem (Ida/Volta) |
| Notificações push VAPID (RF03) | ✅ Concluído | Alerta individual de últimos faltantes e avisos |
| Check-in e listas de embarque (RF04) | ✅ Concluído | Listas "A Embarcar", "Embarcados" e "Todos" |
| Mural de avisos com seleção de turmas (RF05) | ✅ Concluído | Envio para turmas selecionadas ou geral |
| Cancelamento diário por turma (RF06) | ✅ Concluído | Cancelamento individual ou em massa |
| Lembrete de pagamento e baixa manual (RF07/RF08) | ✅ Concluído | Aluno solicita confirmação, motorista dá baixa |
| Gestão de alunos pelo motorista (RF09) | ✅ Concluído | Cadastro com senha provisória, desativação e reativação |
| Chat 1:1 nativo via WebSocket (RF10) | ✅ Concluído | Mensagens em tempo real, exclusão e histórico |
| Múltiplas turmas por motorista (RF11) | ✅ Concluído | CRUD de turmas, seleção e alternância rápida |
| Perfis, fotos e ligações diretas (RF12) | ✅ Concluído | Upload seguro com magic bytes, link `tel:` |
| Painel Administrativo (RF13) | ✅ Concluído | Gestão de motoristas e alunos via `/admin` |
| Chat em grupo aberto entre todos os alunos | ❌ Fora de escopo | Foco na coordenação de transporte; chat é estritamente 1:1 |
| Gateway de pagamento integrado (Pix API bancária) | ❌ Fora de escopo | Transação externa ao app; controle via status e baixa manual |
| Rastreamento GPS contínuo da van | ❌ Fora de escopo | Alto consumo de bateria e infraestrutura desnecessária para o caso de uso |
