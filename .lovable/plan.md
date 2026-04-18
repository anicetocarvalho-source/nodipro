

## Auditoria de Integridade de Dados — Plano

### Metodologia
Analisar (1) constraints `ON DELETE` em todas as foreign keys, (2) triggers de cálculos automáticos, (3) consistência UI vs DB através de queries de amostragem em tabelas-chave.

### Áreas a Investigar

**1. Cascade vs Preservação em Deletes**
- Verificar FKs nas tabelas críticas: `projects`, `tasks`, `budget_entries`, `documents`, `organizations`, `sprints`, `portfolios`, `programs`
- Identificar se relações têm `ON DELETE CASCADE`, `SET NULL`, `RESTRICT` ou nenhuma acção definida
- Detectar potenciais órfãos: ex. eliminar projecto → tarefas/orçamento/documentos ficam pendentes?
- Verificar se eliminar utilizador (auth.users) propaga para `profiles`, `user_roles`, `organization_members`

**2. Campos Calculados Automáticos**
- `projects.spent` — trigger `update_project_spent` em `budget_entries` (já existe, verificar se está activo)
- `documents.current_version` — trigger `log_version_upload` (já existe)
- `funding_agreements.disbursed_amount` — verificar se actualiza quando disbursements mudam de status
- `annual_work_plans` — totais trimestrais derivados de actividades
- Contagens em portfolios/programs (projects_count, total_budget) — calculadas em runtime ou armazenadas?

**3. Consistência UI vs DB**
- Amostrar dados de tabelas-chave e comparar com lógica de hooks (`useProjects`, `useDashboardData`, `useFundingAgreements`)
- Verificar se hooks fazem agregações que possam divergir do trigger `update_project_spent`
- Verificar `RAGIndicator` e `useProjectIntegrity` usam fontes consistentes

**4. Triggers Existentes vs Esperados**
- O bloco `<db-triggers>` mostra "There are no triggers in the database" — ALERTA: as funções existem mas os triggers podem não estar instalados!
- Validar se `update_project_spent`, `audit_trigger_func`, `check_budget_thresholds`, `notify_*` estão de facto attached às tabelas
- Se não estiverem, `projects.spent` não actualiza automaticamente → divergência crítica entre UI e DB

### Ferramentas a Usar (read-only)
- `supabase--read_query` — inspeccionar `information_schema.referential_constraints`, `information_schema.triggers`, e amostrar dados
- `supabase--linter` — detectar problemas estruturais
- `code--view` — confirmar lógica de hooks que assumem campos calculados

### Output Esperado
Relatório estruturado com:
| Severidade | Categoria | Problema | Localização | Correcção sugerida |
- **CRÍTICO**: triggers em falta, FKs sem acção (órfãos), campos calculados desactualizados
- **MODERADO**: divergências entre agregação UI e valor armazenado
- **MENOR**: inconsistências cosméticas

Sem alterações de código nesta fase — apenas diagnóstico. Após aprovação do relatório, plano de correcções (migrations SQL para adicionar triggers/FK actions em falta + ajustes em hooks) será apresentado em mensagem separada.

