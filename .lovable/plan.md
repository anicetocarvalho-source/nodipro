

## Auditoria Completa da Plataforma — Integracoes, Fluxo de Dados e Gaps

### Estado Geral

A plataforma tem **25+ modulos** com uma base arquitectural solida: multi-tenancy via RLS, RBAC granular, SaaS com feature gating, e dashboards diferenciados por tipo de entidade. Contudo, existem **gaps significativos** de integracao entre modulos e inconsistencias que impedem o fluxo coerente de dados.

---

### GAP 1: CRITICO — Modulos novos sem Feature Gating

Os modulos das Fases 3-4 nao estao protegidos por `FeatureGate`, permitindo acesso mesmo em planos que nao os incluem:

| Modulo | Feature Key no `PlanFeatures` | Tem `FeatureGate`? |
|---|---|---|
| Lessons Learned | `lessons_learned` | NAO |
| Annual Work Plan | `annual_work_plan` | NAO |
| Audit Logs | `audit_logs` | NAO |
| Funding Agreements | `funding_agreements` | NAO |
| Beneficiaries | Nao existe | NAO |

**Correccao**: Adicionar `FeatureGate` a cada pagina e adicionar `beneficiaries` ao `PlanFeatures`.

---

### GAP 2: CRITICO — Dashboard nao integra modulos novos

O `useDashboardData` agrega apenas: projectos, tarefas, SDGs, budget entries, provincias e financiadores. Nao integra:
- **Beneficiarios**: sem KPI de impacto social no dashboard
- **Desembolsos**: sem taxa de desembolso no dashboard
- **Notificacoes pendentes**: sem contagem de alertas
- **Funding Agreements**: sem valor total de financiamento

**Correccao**: Enriquecer `useDashboardData` com queries aos novos modulos; actualizar os 3 dashboards (Public/Private/NGO) com cards de impacto e desembolso.

---

### GAP 3: CRITICO — Relatorio de Desembolsos usa budget_entries em vez de disbursement_tranches

O `generateDisbursementReport()` em `reportGenerators.ts` gera o relatorio a partir de `budget_entries` (entradas orcamentais), nao da tabela `disbursement_tranches` que foi criada na Fase 2. O hook `useReportGeneration` tambem nao faz query a `disbursement_tranches`.

**Correccao**: Adicionar query a `disbursement_tranches` no `useReportGeneration` e reescrever `generateDisbursementReport` para usar os dados reais de tranches.

---

### GAP 4: IMPORTANTE — Beneficiarios sem organization_id (isolamento fraco)

A tabela `beneficiaries` depende de `project_in_user_orgs(project_id)` para RLS, mas o hook `useBeneficiaries` nao filtra por organizacao — faz `select *` sem filtro de org. Se o projecto nao estiver na org activa, os dados nao aparecem, mas a query e ineficiente e pode retornar beneficiarios de projectos de outras orgs onde o user e membro.

**Correccao**: Filtrar por `project_id IN (projectos da org activa)` no hook, similar ao padrao usado em `useLessonsLearned`.

---

### GAP 5: IMPORTANTE — Disbursement_tranches sem organization_id

A tabela `disbursement_tranches` nao tem `organization_id`. O RLS usa `project_in_user_orgs(project_id)` o que funciona, mas o hook `useDisbursements` faz `select *` sem nenhum filtro de organizacao, potencialmente retornando dados de todos os projectos do user em todas as orgs.

**Correccao**: Filtrar por projectos da organizacao activa no hook.

---

### GAP 6: IMPORTANTE — Budget Approvals sem integracao na UI do Budget

O `useBudgetApprovals` existe mas o modulo de Budget (`BudgetNew.tsx`) nao o utiliza. Nao ha botao "Submeter para Aprovacao" nas entradas orcamentais, nem visualizacao do estado de aprovacao.

**Correccao**: Integrar o fluxo de aprovacao na UI do Budget com botoes de submissao e painel de estado.

---

### GAP 7: IMPORTANTE — Digital Approvals nao integrado em nenhum modulo

O `useDigitalApprovals` existe com CRUD completo mas nao e usado em nenhuma pagina. Nao ha botao "Aprovar Digitalmente" nos documentos, orcamentos, ou qualquer outro modulo.

**Correccao**: Integrar na UI de documentos (workflow), orcamento (aprovacao), e funding agreements.

---

### GAP 8: MODERADO — Relatórios nao incluem dados dos modulos novos

O `useReportGeneration` consulta: projectos, tarefas, team, budget, portfolios, programas, documentos. Nao inclui:
- Beneficiarios (para relatorios de impacto)
- Lessons Learned (para relatorios de doadores)
- Funding Agreements (para relatorios financeiros)
- Disbursement Tranches (para relatorios de desembolso real)

---

### GAP 9: MODERADO — Notificacoes apenas para budget approvals

O trigger `notify_budget_approval` gera notificacoes automaticas, mas nao existem triggers para:
- Tarefas atribuidas
- Documentos com workflow pendente
- Tranches de desembolso aprovadas/rejeitadas
- Deadlines proximos
- Change requests

---

### GAP 10: MODERADO — AWP nao vincula automaticamente ao orcamento do projecto

O Plano de Trabalho Anual (AWP) tem `total_budget` e `total_executed` como campos manuais, sem calculo automatico a partir das `budget_entries` do projecto nem das `awp_activities`.

---

### GAP 11: MENOR — Funding Agreements sem ligacao a Disbursement Tranches

Os acordos de financiamento tem `disbursed_amount` manual mas nao se alimentam das tranches reais da tabela `disbursement_tranches`. Deveria haver calculo automatico.

---

### GAP 12: MENOR — Sprints redireciona para /projects sem funcionalidade

A pagina Sprints e apenas um `<Navigate to="/projects?tab=sprints">` mas a pagina Projects nao tem tab "sprints".

---

### Plano de Correccao Priorizado

| Prioridade | Gap | Accao |
|---|---|---|
| P1 | Gap 1 | Adicionar FeatureGate aos 5 modulos sem proteccao |
| P1 | Gap 3 | Corrigir relatorio de desembolsos para usar `disbursement_tranches` |
| P1 | Gap 6 | Integrar budget approvals na UI do Budget |
| P2 | Gap 2 | Enriquecer dashboards com dados de beneficiarios e desembolsos |
| P2 | Gap 4-5 | Corrigir filtros de organizacao nos hooks de beneficiarios e desembolsos |
| P2 | Gap 7 | Integrar digital approvals nos workflows de documentos e orcamento |
| P3 | Gap 8 | Adicionar dados novos ao motor de relatorios |
| P3 | Gap 9 | Criar triggers de notificacao para tarefas e documentos |
| P3 | Gap 10-11 | Vincular AWP e Funding Agreements a dados reais |
| P3 | Gap 12 | Corrigir redirect de Sprints |

### Detalhes Tecnicos

**Ficheiros principais a alterar:**
- `src/pages/LessonsLearned.tsx`, `AnnualWorkPlan.tsx`, `AuditLogs.tsx`, `FundingAgreements.tsx`, `Beneficiaries.tsx` — adicionar `FeatureGate`
- `src/types/subscription.ts` — adicionar `beneficiaries: boolean` ao `PlanFeatures`
- `src/hooks/useBeneficiaries.ts`, `useDisbursements.ts` — filtrar por org activa
- `src/hooks/useReportGeneration.ts` + `src/lib/reportGenerators.ts` — integrar `disbursement_tranches`
- `src/pages/BudgetNew.tsx` — integrar `useBudgetApprovals`
- `src/hooks/useDashboardData.ts` + dashboards — queries adicionais
- Migracao SQL — triggers de notificacao para tarefas e documentos

Deseja aprovar a implementacao comecando pela **Prioridade 1** (FeatureGate, Relatorio Desembolsos, Budget Approvals UI)?

