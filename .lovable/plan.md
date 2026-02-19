

## Validacao de downgrade no servidor (backend)

### Problema actual
A validacao de downgrade existe apenas no frontend (no `PlanChangeConfirmDialog`). Isto significa que:
1. Um utilizador poderia contornar a validacao usando a API directamente
2. As quotas mostradas no dialogo podem estar desactualizadas (carregadas uma unica vez no mount da pagina)

### O que sera feito

#### 1. Criar funcao SQL `validate_plan_downgrade`
Uma funcao na base de dados que recebe o `organization_id` e o `new_plan_id`, e verifica se a organizacao pode mudar para esse plano sem exceder os limites. Retorna um objecto JSON com `allowed: boolean` e uma lista de conflitos.

```text
validate_plan_downgrade(_org_id, _new_plan_id)
  -> { allowed: true/false, conflicts: [...] }
```

Verifica:
- Projectos actuais vs `max_projects` do novo plano
- Membros actuais vs `max_members` do novo plano
- Portfolios actuais vs `max_portfolios` do novo plano
- Ignora limites ilimitados (`-1`)

#### 2. Actualizar `selectPlan` no hook `useSubscription`
Antes de executar o UPDATE/INSERT, chamar `validate_plan_downgrade` via `supabase.rpc()`. Se `allowed` for `false`, retornar `false` com mensagem de erro — impedindo a mudanca mesmo que o frontend seja contornado.

#### 3. Refrescar quotas ao abrir o dialogo
No `Subscription.tsx`, quando o `pendingPlanId` muda (dialogo abre), re-carregar as quotas para garantir que os dados apresentados sao actuais.

---

### Detalhes tecnicos

**Nova migracao SQL:**
- Criar funcao `validate_plan_downgrade(_org_id uuid, _new_plan_id uuid)` que:
  - Busca o novo plano em `subscription_plans`
  - Conta projectos, membros e portfolios da organizacao
  - Compara com os limites do novo plano
  - Retorna `jsonb` com `allowed` e array de `conflicts`

**Alteracoes em `src/hooks/useSubscription.ts`:**
- Na funcao `selectPlan`, adicionar chamada a `validate_plan_downgrade` antes do UPDATE/INSERT
- Se a validacao falhar, retornar `false` sem alterar a subscricao
- Expor os conflitos do servidor para o componente poder mostra-los

**Alteracoes em `src/pages/Subscription.tsx`:**
- Adicionar `useEffect` que re-carrega quotas quando `pendingPlanId` muda (para o dialogo mostrar dados frescos)

**Sem alteracoes necessarias:**
- `PlanChangeConfirmDialog.tsx` -- mantem-se igual, a validacao frontend continua como primeira camada
- Tabelas existentes -- sem alteracoes de schema
