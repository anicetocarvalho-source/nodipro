

## Dialogo de confirmacao antes de mudar de plano

### O que sera feito

Criar um componente `PlanChangeConfirmDialog` usando AlertDialog que aparece quando o utilizador clica em "Seleccionar Plano". O dialogo mostra uma comparacao lado-a-lado do plano actual vs o novo plano e valida se um downgrade e possivel.

### Fluxo do utilizador

1. Utilizador clica "Seleccionar Plano" num PlanCard
2. Abre o dialogo de confirmacao mostrando:
   - Plano actual (nome, preco, limites) vs Plano novo (nome, preco, limites)
   - Indicacao se e upgrade ou downgrade
   - Se for downgrade: verifica quotas actuais contra limites do novo plano
3. Se houver conflito de quotas (ex: 5 projectos activos mas o novo plano so permite 3), mostra aviso vermelho e bloqueia a confirmacao
4. Se nao houver conflitos, permite confirmar

### Detalhes tecnicos

**Novo ficheiro: `src/components/subscription/PlanChangeConfirmDialog.tsx`**
- Recebe: `currentPlan`, `newPlan`, `quotas`, `yearly`, `isLoading`, `onConfirm`, `onCancel`, `open`
- Usa `AlertDialog` do shadcn/ui
- Mostra duas colunas: "Plano Actual" e "Novo Plano" com nome, preco e limites
- Calcula conflitos de downgrade comparando `quotas.current` com os limites do novo plano (`max_projects`, `max_members`, `max_portfolios`)
- Se existirem conflitos, mostra lista de avisos (ex: "Tem 5 projectos activos mas o novo plano permite apenas 3") e desabilita o botao de confirmar
- Badge visual "Upgrade" (verde) ou "Downgrade" (amarelo/vermelho)

**Alteracoes em `src/pages/Subscription.tsx`**
- Adicionar estado `pendingPlanId` para guardar o plano seleccionado antes da confirmacao
- O `handleSelectPlan` passa a abrir o dialogo em vez de executar directamente
- Nova funcao `handleConfirmChange` que executa o `selectPlan` e fecha o dialogo
- Renderizar o `PlanChangeConfirmDialog` com os dados necessarios

**Logica de validacao de downgrade:**
- Comparar `quotas.project.current` com `newPlan.max_projects` (se max_projects != -1)
- Comparar `quotas.member.current` com `newPlan.max_members` (se max_members != -1)
- Comparar `quotas.portfolio.current` com `newPlan.max_portfolios` (se max_portfolios != -1)
- Se qualquer quota actual exceder o limite do novo plano, marcar como conflito

**Sem alteracoes necessarias:**
- `PlanCard.tsx` -- mantem-se igual, continua a chamar `onSelect`
- `useSubscription.ts` -- mantem-se igual
- Base de dados -- sem alteracoes
- i18n -- textos hardcoded em portugues por agora (consistente com o resto dos componentes de subscricao)

