# Requisitos

## Requisitos funcionais — MVP

| ID | Requisito | Observações |
|---|---|---|
| RF01 | O aluno pode definir seu status do dia: `vai normal` (padrão), `só ida`, `só volta`, `não vai` | O padrão evita que todo aluno precise agir todo dia — só quem tem exceção usa o app naquele dia. |
| RF02 | O sistema exibe, para todos os alunos e para o motorista, um contador de "faltam X para embarcar" na volta, atualizado em tempo real | Baseado em polling periódico, não WebSocket (ver `04-stack-decisoes.md`). |
| RF03 | O sistema envia notificação push individual aos alunos que ainda não embarcaram quando o número de faltantes atinge um limite baixo (ex.: 2 ou menos) | Limite configurável futuramente; fixo no MVP. |
| RF04 | O aluno ou o motorista pode marcar que o aluno "chegou na van" (check-in de embarque) | Sem validação por GPS — autodeclarado. |
| RF05 | O motorista pode publicar um aviso (mural), visível a todos os alunos, com notificação | Via única (motorista → alunos), sem resposta dentro do app. |
| RF06 | O motorista pode cancelar o dia inteiro (feriado, van quebrada etc.), zerando a necessidade de presença/contagem daquele dia | Evita notificações e contadores incorretos em dias sem van. |
| RF07 | O sistema envia lembrete de pagamento ao aluno com antecedência configurável (padrão 3 dias antes e no dia) | Antecedência ajustável pelo aluno. |
| RF08 | O aluno (ou o motorista) pode marcar o pagamento do mês como "pago", interrompendo os lembretes daquele ciclo | Pagamento em si ocorre fora do app (Pix direto ao motorista); o app só registra o status. |
| RF09 | O motorista pode cadastrar, convidar e remover alunos | Convite via link ou código simples. |

## Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF01 | O app deve ser instalável como PWA em Android e iOS (com onboarding explicando o passo a passo, dada a limitação do iOS descrita abaixo). |
| RNF02 | Toda entidade de dados relevante deve incluir referência ao motorista (`driverId`), preparando o sistema para múltiplos motoristas no futuro sem migração estrutural. |
| RNF03 | Autenticação com senha hasheada (bcrypt ou equivalente); nenhum dado de pagamento sensível (cartão, chave de acesso bancário) é armazenado, já que a transação ocorre fora do app. |
| RNF04 | O contador de presença deve refletir mudanças em no máximo ~15 segundos (intervalo de polling), sem necessidade de tempo real abaixo disso para o caso de uso. |
| RNF05 | O sistema deve funcionar de forma aceitável mesmo com o cold start do backend em hospedagem gratuita (ver `04-stack-decisoes.md`) — não é um requisito de disponibilidade 24/7 crítica. |

## Limitações conhecidas (aceitas conscientemente)

- **Push notification no iOS** só funciona se o aluno instalar o PWA corretamente (Safari → "Adicionar à Tela de Início") e abrir por esse ícone. Uso apenas pelo navegador não recebe push. Mitigado com tutorial de instalação no onboarding.
- **Cold start no backend** (free tier): primeira requisição após período de inatividade pode levar 20-30 segundos. Aceitável dado o padrão de uso concentrado em horários previsíveis (manhã e final de tarde).
- **Check-in e status são autodeclarados**, sem validação de localização — assume-se boa-fé entre os usuários, adequado ao grupo pequeno e conhecido.

## Escopo: MVP x Fase 2

| Funcionalidade | MVP | Fase 2 |
|---|---|---|
| Confirmação de presença por exceção | ✅ | — |
| Contador de faltantes em tempo real | ✅ | — |
| Notificação individual de faltantes | ✅ | — |
| Check-in de embarque | ✅ | — |
| Mural de avisos (via única) | ✅ | — |
| Cadastro/gestão de alunos | ✅ | — |
| Cancelamento do dia | ✅ | — |
| Lembrete de pagamento + marcação manual | ✅ | — |
| Chat individual com o motorista | ❌ | Possível |
| Chat geral entre alunos | ❌ | Possível |
| Pagamento integrado (gateway/Pix API) | ❌ | Possível |
| Rastreamento GPS em tempo real | ❌ | Improvável no curto prazo |
| Multi-motorista (interface) | ❌ | Planejado, modelagem já preparada |
