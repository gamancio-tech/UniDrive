# Plano de Implementação: Gestão de Listas de Alunos (Tela do Motorista)

## 1. Visão Geral
A tela de gestão de alunos do motorista será remodelada para facilitar o controle de embarque (ida e volta). O layout será dividido em três listas/visualizações principais:

1. **Todos os Alunos**: Lista completa de alunos (como já existe hoje).
2. **A Embarcar (Ida/Volta)**: Alunos previstos para o trajeto atual, mas que ainda *não* entraram na van.
3. **Embarcados (Já buscados)**: Alunos do trajeto atual que o motorista já marcou como presentes.

O sistema também contará com a funcionalidade de **Alternar Trajeto (Finalizar Viagem)**, que muda o contexto de Ida para Volta (ou vice-versa) e reseta a lista de embarcados.

---

## 2. Estrutura de Estado (Frontend)

O componente principal da tela de alunos precisará dos seguintes estados React:

- `tripType`: `'ida' | 'volta'` — Armazena o contexto da viagem atual. O motorista pode iniciar o dia na 'ida'.
- `activeTab`: `'todos' | 'a_embarcar' | 'embarcados'` — Controla qual lista está visível no momento (via abas ou navegação horizontal).
- `boardedStudentIds`: `Set<string>` ou `string[]` — IDs dos alunos que já foram marcados como embarcados **no trajeto atual**.

*(Nota sobre o modelo de dados: Como o backend MVP possui apenas um campo `boardedAt` no `DailyStatus`, o reset da lista local ao finalizar a viagem também deve disparar uma limpeza do `boardedAt` no backend para preparar o sistema para o próximo trajeto).*

---

## 3. Comportamento das Listas

### 3.1 Lista: Todos os Alunos
- **Filtro**: Nenhum. Mostra todos os alunos vinculados ao motorista, idêntico ao comportamento atual.
- **Ação**: Visualização do perfil, edição ou exclusão.

### 3.2 Lista: A Embarcar (Ida ou Volta)
O título e conteúdo desta lista dependem do estado `tripType`.
- **Filtro de Trajeto**:
  - Se `tripType === 'ida'`: Exibir apenas alunos com status `vai_normal` OU `so_ida`.
  - Se `tripType === 'volta'`: Exibir apenas alunos com status `vai_normal` OU `so_volta`.
- **Filtro de Embarque**: Ocultar desta lista os alunos cujo ID já esteja no estado `boardedStudentIds`.
- **Ação do Item**: Um botão "Embarcou" (ou clique no card). Ao interagir:
  1. O aluno desaparece desta lista e vai para a lista "Embarcados".
  2. Faz chamada à API (`PATCH` check-in) para registrar o `boardedAt`.

### 3.3 Lista: Embarcados (Já buscados)
- **Filtro**: Mostrar apenas alunos cujo ID esteja em `boardedStudentIds` (e que pertencem ao trajeto atual).
- **Ação do Item**: Um botão "Desfazer". Ao interagir:
  1. Remove o ID do estado, fazendo o aluno retornar para a lista "A Embarcar".
  2. Faz chamada à API para anular o check-in (`boardedAt = null`).

---

## 4. Funcionalidade: Finalizar Viagem

No topo ou rodapé da interface, haverá um componente de controle de viagem com um botão, por exemplo: **"Finalizar Viagem de Ida"**.

**O que acontece ao acionar:**
1. **Confirmação**: Um alerta para evitar cliques acidentais (*"Deseja finalizar a Ida e iniciar a Volta?"*).
2. **Alternância**: O estado `tripType` inverte (ex: de 'ida' vira 'volta').
3. **Reset**: O estado `boardedStudentIds` é esvaziado no frontend, fazendo a lista de "Embarcados" voltar a ficar vazia.
4. **Sincronização**: É feita uma requisição ao backend para resetar o status de embarque (`boardedAt`) de todos os alunos do dia, liberando o sistema para começar os check-ins do novo trajeto.

---

## 5. Passos para o Desenvolvimento

1. **Criar os Componentes de UI**
   - Implementar o componente de **Abas (Tabs)** na tela de alunos.
   - Criar o painel de **Controle de Viagem** (indicador do trajeto atual + botão de finalizar).

2. **Implementar a Lógica de Filtragem (Hooks)**
   - Usar `useMemo` no React para derivar as 3 listas a partir da lista original de alunos recebida da API, usando os filtros descritos acima.

3. **Integrar as Ações**
   - Adicionar o manipulador de clique para check-in e check-out (desfazer).
   - Implementar a função de "Finalizar Viagem".

4. **Revisão de Backend (Se necessário)**
   - Verificar se o endpoint atual de check-in (`RF04`) suporta remover o check-in.
   - Criar um endpoint (ou adaptar existente) para "Resetar Check-ins do Dia" para que a funcionalidade de Finalizar Viagem limpe os dados no banco.
