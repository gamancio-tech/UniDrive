# Visão do Produto

## Contexto e problema

Um motorista de van leva ~15 alunos diariamente para uma única faculdade. A ida tem horário fixo; a volta tem horário variável, pois o motorista espera todos os alunos saírem das aulas antes de partir.

Hoje esse processo é coordenado por um grupo de WhatsApp, o que gera dois problemas concretos:

1. **Ruído**: os alunos precisam mandar mensagem toda manhã avisando que vão, e ao longo da aula o motorista precisa ficar avisando no grupo quem falta para a volta. Isso gera muitas notificações por dia.
2. **Consequência do ruído**: para não ser incomodado, alunos silenciam o grupo — o que quebra justamente o caso em que a notificação importa (saber que só falta ele/ela para a van sair).

O problema não é falta de comunicação, é o **formato errado** para o tipo de informação: presença é um **estado** ("já embarquei" / "ainda não"), não uma sequência de mensagens de chat.

## Público-alvo

- **Motorista** de van universitária, atende uma única faculdade, contrata e disponibiliza o app para seus próprios alunos (não há uma instituição pagando ou intermediando).
- **Alunos**, adultos, usuários diretos e responsáveis pela própria confirmação de presença e pagamento — diferente de uma van escolar infantil, não há um terceiro ator (responsável/pai) no fluxo.

## Objetivo do produto

Substituir a coordenação por grupo de chat por um app onde:

- a presença do dia é um estado visível para todos, não uma mensagem que se perde;
- notificações são individuais e só disparam quando relevantes (poucos faltando), não em massa;
- o motorista visualiza diretamente quem falta, sem precisar perguntar.

## Personas

### Motorista
- Quer saber, sem perguntar, quantos e quais alunos faltam para a van sair na volta.
- Quer avisar imprevistos (cancelamento do dia, mudança de horário) sem gerar spam de mensagens.
- Recebe uma mensalidade dos alunos e quer visibilidade simples de quem já pagou no mês.

### Aluno
- Quer avisar que não vai (ida, volta, ou o dia todo) sem precisar entrar num grupo cheio de mensagens irrelevantes.
- Quer ser avisado individualmente quando estiver perto de ser o próximo/único faltante.
- Quer lembrete de pagamento em vez de precisar lembrar sozinho todo mês.

## Escopo do MVP (visão geral)

- Confirmação de presença por exceção (padrão "vai normal"; aluno só marca quando muda).
- Contador de "faltam X para embarcar" em tempo real, com notificação individual quando o número cai.
- Check-in de embarque (aluno ou motorista marca).
- Mural de avisos do motorista (via única, sem chat).
- Lembrete de pagamento configurável + marcação manual de "paguei".
- Cadastro e gestão dos alunos pelo motorista.
- Cancelamento do dia inteiro pelo motorista (feriado, van quebrada etc.).

Detalhamento completo em [`02-requisitos.md`](02-requisitos.md).

## Fora de escopo (deliberados)

- Chat em grupo aberto onde alunos conversam entre si (o app possui canal 1:1 direto aluno ↔ motorista).
- Pagamento integrado via gateway bancário automático (Pix API bancária, cartão de crédito — o controle é feito via solicitação e confirmação manual).
- Rastreamento contínuo por GPS da van em mapa ao vivo (alto consumo de bateria e complexidade desnecessária para o problema).

## Visão de crescimento

O produto atende motoristas e suas respectivas turmas de alunos. Toda a modelagem de dados e regras de negócio contêm isolamento por `driverId` e `classId`, garantindo segurança e escalabilidade para que a plataforma atenda múltiplos motoristas de forma robusta e independente.
