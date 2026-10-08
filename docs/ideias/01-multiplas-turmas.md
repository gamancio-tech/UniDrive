# Pensamento: Múltiplas turmas por motorista

> Documento de ideia/contexto. Serve de base para o plano de implementação (a ser criado em `docs/planos_implementacao/`). Não é o plano.

## Problema

Hoje o sistema assume que **1 motorista = 1 grupo de alunos**. Na realidade o motorista atende **várias turmas, de várias faculdades**, cada uma com seus próprios alunos, horários e dinâmica. Misturar todos num único contador de faltantes, mural e chat não faz sentido: o "quantos faltam embarcar" de uma faculdade não tem relação com o de outra.

## Ideia

Introduzir o conceito de **Turma** (grupo de alunos de uma faculdade/horário que viajam juntos) e uma **tela inicial de seleção de turma** para o motorista. Ao escolher uma turma, ele é levado ao fluxo que já existe hoje (status, contador, check-in, mural, pagamentos, chat, alunos), mas **filtrado por aquela turma**.

```
Login do motorista → [Tela: escolher turma] → Dashboard atual (escopo = turma escolhida)
                           ↑___ botão "trocar turma" ___|
```

A experiência dentro da turma **não muda**: é a aplicação atual, só que com escopo.

## Conceitos

- **Turma (Class/Group)**: pertence a um motorista. **O motorista cria as turmas e escolhe o nome** de cada uma (ex.: "Direito noite"). Faculdade/cor são opcionais.
- **Aluno** passa a pertencer a **exatamente uma** turma. Como o aluno já viaja em uma turma específica, **o aluno não vê a tela de seleção**: entra direto na sua turma.
- A tela de seleção é, em essência, **do motorista**.

## O que muda por área

| Área | Impacto |
|---|---|
| Modelo de dados | Nova entidade `Class`; `Student` ganha `classId`. Entidades que hoje usam `driverId` (cancelamento, aviso, chat) passam a ter escopo de turma. |
| Autorização | Todo acesso por turma confere que ela pertence ao motorista (BOLA/IDOR, 404 igual para "não existe" e "não é seu"). Aluno só acessa a própria turma. |
| Contador / polling | Calculado por turma, não por motorista. |
| Cancelamento do dia (RF06) | Modal de escolha de turma(s); ver decisões. `TripCancellation` passa a ter `classId`. |
| Mural (RF05) | Por turma por padrão; botão discreto abre modal para enviar a várias turmas. |
| Push (RF03) | Gatilho por turma. |
| Pagamento (RF07/08) | Segue o aluno; a lista aparece filtrada pela turma. |
| Chat | Uma sala por turma + chat geral acessível por botão na página inicial. |
| Tela de seleção | Cards simples com nome da turma, faltantes e pendências de pagamento. |
| Frontend | Nova tela de seleção; turma ativa guardada no estado/rota (ex.: `/turmas/:id/...`); botão para trocar de turma; CRUD de turmas. |
| Migração | Dados existentes devem ir para uma turma padrão, sem perda. |

## Decisões tomadas

1. **Aluno em uma turma só.** `Student.classId` obrigatório.
2. **Cancelamento do dia**: ao acionar, abre um modal para escolher a turma. Se o motorista marcar mais de uma, o modal vira uma lista de checkboxes com todas as turmas, incluindo a opção "selecionar todas". Gera um `TripCancellation` por turma selecionada.
3. **Mural**: por turma por padrão. Um botão discreto (não chamativo) abre um modal de seleção de turmas para publicar o mesmo aviso em várias.
4. **Chat**: uma sala por turma. Na página inicial (seleção de turmas) há um botão que abre um **chat geral**. A definição de quem participa do geral (alunos de todas as turmas + motorista) e como o servidor WebSocket o trata entra no plano.
5. **Tela de seleção**: mostra resumo simples por turma (faltantes e pendências de pagamento). Sem gráficos nem detalhes extras.
6. **Cadastro de aluno**: o motorista escolhe a turma. Sem código de convite.

## Fora de escopo (por enquanto)

- Vários motoristas dividindo a mesma turma.
- Rotas/horários detalhados por turma.
- Mudanças em GPS, gateway de pagamento ou WebSocket fora do chat (continuam fora, conforme `AGENTS.md`).

## Princípios a respeitar na implementação

- Seguir `docs/seguranca/01-principios-seguranca.md` e o checklist de PR (autorização por recurso, Zod em toda rota, `select`/DTO, rate limits).
- Mudança de schema exige migration aplicada.
- Preferir solução simples e didática (15 alunos, primeiro projeto de porte médio).
