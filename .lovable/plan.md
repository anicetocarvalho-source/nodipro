

## Auditoria Completa da Plataforma — Estado Actual

### Veredicto Geral

A plataforma está em **bom estado de integração** após as correcções das Prioridades 1-3. Os gaps críticos anteriores (Feature Gating, Relatório de Desembolsos, isolamento de org nos hooks) foram resolvidos. Restam **6 gaps residuais**, nenhum crítico.

---

### O que está CORRECTO e INTEGRADO

| Área | Estado |
|---|---|
| Feature Gating nos 5 módulos novos | OK — `FeatureGate` em Beneficiaries, LessonsLearned, AWP, AuditLogs, FundingAgreements |
| Dashboard integra beneficiários, desembolsos, funding | OK — `useDashboardData` consulta as 3 tabelas; NGO e Public dashboards mostram KPIs |
| Relatório de desembolsos usa `disbursement_tranches` | OK — `useReportGeneration` faz query a tranches; `generateDisbursementReport` usa dados reais |
| Budget Approvals integrado na UI | OK — `BudgetNew.tsx` usa `useBudgetApprovals`, tem tab "Aprovações" com approve/reject |
| Digital Approvals integrado em Funding Agreements | OK — `DigitalApprovalPanel` em `FundingAgreements.tsx` |
| Hooks de beneficiários e desembolsos filtram por org | OK — ambos fazem query a projectos da org activa primeiro |
| Triggers de notificação | OK — `notify_budget_approval`, `notify_disbursement_change`, `notify_document_workflow`, `notify_change_request` activos no DB |
| Audit triggers | OK — 15+ tabelas com `audit_trigger_func` |
| Sprints redirect | OK — redireciona para `/projects` (corrigido) |

---

### GAPS RESIDUAIS

#### GAP 1: MODERADO — `submitForApproval` do Budget nunca é chamado na UI

O hook `useBudgetApprovals` expõe `submitForApproval` mas **nenhum botão na UI o invoca**. A tab "Aprovações" mostra aprovações pendentes para processar (approve/reject), mas não existe forma de **submeter** uma entrada para aprovação. O fluxo está incompleto: não há botão "Submeter para Aprovação" nas entradas orçamentais.

**Correcção**: Adicionar botão "Submeter para Aprovação" no `DropdownMenu` de cada entrada pendente, com selector de aprovador e nível.

#### GAP 2: MODERADO — Digital Approvals não integrado em Documentos nem Budget

O `DigitalApprovalPanel` só está em `FundingAgreements.tsx`. Falta integração em:
- `Documents.tsx` / `DocumentDetailModal.tsx` — para aprovar documentos no workflow
- `BudgetNew.tsx` — para assinatura digital nas aprovações orçamentais

**Correcção**: Adicionar `DigitalApprovalPanel` nos modais de detalhe de documentos e na secção de aprovações do Budget.

#### GAP 3: MODERADO — Dashboard Privado não mostra beneficiários nem desembolsos

O `PrivateEntityDashboard` não usa `stats.totalBeneficiaries`, `stats.disbursementRate` ou `stats.totalFundingValue`. Os dados estão disponíveis no `useDashboardData` mas o dashboard privado não os apresenta.

**Correcção**: Adicionar cards de impacto e desembolso ao `PrivateEntityDashboard`.

#### GAP 4: MODERADO — AWP `total_budget`/`total_executed` são campos manuais

O Plano de Trabalho Anual tem `total_budget` e `total_executed` como inputs manuais. Deveria calcular automaticamente a partir das `awp_activities` (soma de `planned_budget` e `executed_budget`).

**Correcção**: Adicionar cálculo automático no hook `useAnnualWorkPlans` ou criar trigger SQL para manter os totais sincronizados.

#### GAP 5: MENOR — Funding Agreements `disbursed_amount` é manual

O campo `disbursed_amount` nos acordos de financiamento não se alimenta das `disbursement_tranches` reais. Se um acordo está vinculado a um projecto, deveria calcular automaticamente o total desembolsado das tranches desse projecto.

**Correcção**: Adicionar cálculo derivado no hook `useFundingAgreements` ou criar função SQL para sincronizar.

#### GAP 6: MENOR — Relatórios não incluem Beneficiários, Lessons Learned nem Funding Agreements

O `useReportGeneration` já consulta tranches, mas não consulta:
- `beneficiaries` (para relatórios de impacto social)
- `lessons_learned` (para relatórios de doadores)
- `funding_agreements` (para relatórios financeiros completos)

**Correcção**: Adicionar queries adicionais ao `useReportGeneration` e enriquecer os geradores de relatório.

---

### Plano de Correcção

| Prioridade | Gap | Ficheiros |
|---|---|---|
| P1 | Gap 1 — Botão "Submeter para Aprovação" no Budget | `src/pages/BudgetNew.tsx` |
| P1 | Gap 2 — Digital Approvals em Documentos e Budget | `src/pages/Documents.tsx`, `src/components/documents/DocumentDetailModal.tsx`, `src/pages/BudgetNew.tsx` |
| P1 | Gap 3 — Dashboard Privado com KPIs de impacto | `src/components/dashboard/PrivateEntityDashboard.tsx` |
| P2 | Gap 4 — AWP cálculo automático | `src/hooks/useAnnualWorkPlans.ts` ou migração SQL |
| P2 | Gap 5 — Funding Agreements disbursed_amount automático | `src/hooks/useFundingAgreements.ts` |
| P2 | Gap 6 — Relatórios com dados novos | `src/hooks/useReportGeneration.ts`, `src/lib/reportGenerators.ts` |

