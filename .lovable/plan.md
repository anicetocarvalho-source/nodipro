

## Auditoria SaaS — Gaps Identificados e Correcções

### Situacao Actual

A componente SaaS tem uma boa estrutura base (planos, quotas, pagamentos Multicaixa, gestao SuperAdmin), mas tem **7 gaps criticos** que impedem o funcionamento correcto para novas empresas.

---

### Gap 1: CRITICO — Feature Gating nao esta aplicado

O hook `useSubscription` expoe `hasFeature()` mas **nenhuma pagina o usa**. Um utilizador no plano Free acede a Gantt, EVM, LogFrame, KPIs, Procurement, Reports, Scrum, etc. sem qualquer bloqueio.

O componente `UpgradePrompt` existe mas **nunca e importado** em nenhum ficheiro.

**Correccao**: Nas paginas de modulos gated (Gantt, EVM, LogFrame, KPIs, Procurement, Reports, Scrum, Change Requests, Budget avancado, Stakeholders, Briefings), verificar `hasFeature()` e mostrar `UpgradePrompt` quando a feature nao esta incluida no plano.

Paginas afectadas: `EVM.tsx`, `LogFrame.tsx`, `KPI.tsx`, `Procurement.tsx`, `Reports.tsx`, `Sprints.tsx`, `ChangeRequests.tsx`, `Budget.tsx`, `Stakeholders.tsx`.

---

### Gap 2: CRITICO — Quotas nao sao enforced na criacao

`checkQuota()` so e usado para **exibir** barras na pagina de Subscricao. Quando o utilizador cria um projecto, membro ou portfolio, nao ha verificacao de quota. Pode exceder os limites do plano.

**Correccao**: Nos hooks `useCreateProject`, no `ProjectFormModal`, no fluxo de convite de membros (`Team.tsx`) e no `PortfolioFormModal`, chamar `checkQuota()` antes de criar e bloquear com `UpgradePrompt` se `allowed === false`.

---

### Gap 3: CRITICO — Trial expirado nao muda de status

A subscricao da org de teste tem `trial_ends_at: 2026-03-05` e `status: trial` — o trial expirou ha mais de 1 mes mas o status nao mudou. Nao existe cron job, trigger ou logica de expiracao.

Resultado: organizacoes com trial expirado continuam a aceder a tudo como se o trial estivesse activo.

**Correccao**:
1. Criar funcao SQL `expire_trials()` que actualiza `status = 'expired'` onde `trial_ends_at < now() AND status = 'trial'`
2. Criar cron job via `pg_cron` (ou verificacao no frontend no `useSubscription` como fallback) para executar diariamente
3. Adicionar banner de "Trial expirado" no frontend quando `status === 'expired'`

---

### Gap 4: IMPORTANTE — Moeda inconsistente (USD vs AOA)

Os planos estao definidos com `currency: USD` e precos em USD ($29, $79, $199). Mas o sistema de pagamentos gera referencias Multicaixa em AOA. A `PlanCard` mostra `$29/mes` mas o pagamento e gerado com o valor em AOA.

**Correccao**: Ou converter os planos para AOA, ou adicionar taxa de conversao no momento de gerar a referencia. Para o mercado angolano, faz mais sentido definir precos em AOA directamente.

---

### Gap 5: IMPORTANTE — Sem pagina/banner para trial expirado ou sem subscricao

Se uma org nao tem subscricao ou o trial expirou, o sistema simplesmente mostra tudo normalmente. Nao existe:
- Banner de aviso "Trial expirado — faca upgrade"
- Bloqueio de funcionalidades quando expirado
- Redireccao para pagina de subscricao

**Correccao**: Adicionar verificacao no `AppLayout` ou `ProtectedRoute`: se subscricao expirada, mostrar banner persistente com link para `/subscription`. Se `status === 'expired'`, bloquear acesso a modulos pagos.

---

### Gap 6: MENOR — Onboarding cria trial de 14 dias para TODOS os planos

No `OnboardingWizard`, mesmo se o utilizador escolhe o plano Free, o sistema cria `status: 'trial'` com `trial_ends_at`. O plano Free nao deveria ter trial — deveria ser `status: 'active'` imediatamente.

**Correccao**: No `handlePlanSelected`, verificar se o plano e Free. Se sim, criar com `status: 'active'` e `trial_ends_at: null`.

---

### Gap 7: MENOR — Precos mostrados em $ sem localizacao

`PlanCard` mostra `$29` (USD). Para o mercado angolano deveria mostrar em AOA com formatacao local (ex: `29.000 Kz`).

**Correccao**: Usar `toLocaleString('pt-AO')` com a moeda correcta do plano, ou pelo menos mostrar `{plan.currency}` em vez de `$` hardcoded.

---

### Plano de Implementacao

| Prioridade | Passo | Ficheiros |
|---|---|---|
| 1 | Migracao: funcao `expire_trials()` + corrigir trial actual | SQL |
| 2 | Corrigir onboarding: Free = active, nao trial | `OnboardingWizard.tsx` |
| 3 | Feature gating nas 9 paginas de modulos | `EVM.tsx`, `LogFrame.tsx`, `KPI.tsx`, `Procurement.tsx`, `Reports.tsx`, `Sprints.tsx`, `ChangeRequests.tsx`, `Budget.tsx`, `Stakeholders.tsx` |
| 4 | Quota enforcement na criacao de projectos/membros/portfolios | `ProjectFormModal.tsx`, `Team.tsx`, `PortfolioFormModal.tsx` |
| 5 | Banner de trial expirado no layout | `AppLayout.tsx` ou `AppSidebar.tsx` |
| 6 | Corrigir moeda: USD→AOA ou adicionar formatacao | Migracao SQL + `PlanCard.tsx` |
| 7 | Corrigir `$` hardcoded para moeda dinamica | `PlanCard.tsx`, `StepPlan.tsx` |

### Resultado

Apos estas correccoes:
- Novas empresas no plano Free so acedem a Kanban + Riscos (features incluidas)
- Trial expira automaticamente apos 14 dias
- Quotas sao verificadas antes de criar projectos/membros/portfolios
- Moeda e formatacao correctas para o mercado angolano
- Banner visivel quando trial expira, com CTA para upgrade

