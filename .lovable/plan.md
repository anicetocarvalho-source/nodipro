

## Melhorias ao Modulo de Gestao SaaS — Plano Completo

Este plano adiciona 4 grandes melhorias ao backoffice do Super Admin, transformando-o num painel de controlo completo para a gestao da plataforma.

---

### 1. Detalhe de Organizacao (Modal)

Ao clicar numa linha da tabela de organizacoes, abre um modal/sheet com informacoes detalhadas:

- **Informacoes gerais**: nome, tipo de entidade, sector, provincia, data de criacao, website
- **Membros**: lista dos membros com role na organizacao (usando uma RPC nova `get_org_members_for_admin`)
- **Projectos**: lista resumida dos projectos activos
- **Historico de pagamentos**: todos os pagamentos associados a essa organizacao
- **Uso de quotas**: projectos/membros/portfolios actuais vs. limites do plano
- **Accoes rapidas**: alterar plano, suspender organizacao

**Ficheiros novos:**
- `src/components/superadmin/OrganizationDetailSheet.tsx` — Sheet lateral com tabs internas (Resumo, Membros, Projectos, Pagamentos)

**Ficheiros alterados:**
- `src/components/superadmin/OrganizationsTable.tsx` — Tornar linhas clicaveis, abrir o sheet ao clicar

**Migracoes SQL:**
- Nova funcao RPC `get_org_detail_for_admin(org_id)` que retorna membros, projectos e pagamentos de uma organizacao (SECURITY DEFINER, restrita a platform admins)

---

### 2. Metricas Avancadas (MRR, Churn, Evolucao Temporal)

Expandir o separador de metricas com indicadores financeiros e de crescimento:

- **MRR (Monthly Recurring Revenue)**: calculado a partir de subscricoes activas e precos dos planos
- **Taxa de churn**: organizacoes que cancelaram ou expiraram vs. total
- **Crescimento mensal**: novas organizacoes por mes (ultimos 6 meses)
- **Evolucao de receita**: grafico de linha com receita mensal confirmada
- **ARPU (Average Revenue Per User)**: receita total / organizacoes activas

**Ficheiros alterados:**
- `src/components/superadmin/PlatformMetrics.tsx` — Adicionar novos cards de KPI e graficos de evolucao temporal

**Migracoes SQL:**
- Actualizar a funcao `get_platform_metrics` para incluir: `mrr`, `churn_rate`, `arpu`, `monthly_growth` (array com registos/receita dos ultimos 6 meses)

---

### 3. Gestao de Planos de Subscricao

Interface CRUD para gerir planos directamente no backoffice:

- **Lista de planos**: tabela com nome, slug, precos (mensal/anual), limites, estado (activo/inactivo)
- **Criar plano**: formulario modal com todos os campos (nome, precos, max_projects, max_members, max_storage, max_portfolios, features)
- **Editar plano**: mesmo formulario pre-preenchido
- **Activar/desactivar plano**: toggle sem eliminar

**Ficheiros novos:**
- `src/components/superadmin/PlansManager.tsx` — Componente principal com tabela e accoes
- `src/components/superadmin/PlanFormModal.tsx` — Modal de criacao/edicao de plano

**Ficheiros alterados:**
- `src/pages/SuperAdmin.tsx` — Adicionar novo tab "Planos"
- `src/hooks/usePlatformAdmin.ts` — Adicionar funcoes `fetchPlans`, `createPlan`, `updatePlan`, `togglePlanActive`

**Migracoes SQL:**
- Novas funcoes RPC com SECURITY DEFINER:
  - `platform_create_plan(...)` — Cria um plano novo
  - `platform_update_plan(...)` — Actualiza campos de um plano
  - `platform_toggle_plan(plan_id)` — Alterna is_active
- Politica RLS para `subscription_plans`: permitir SELECT para platform admins (ja existe para authenticated), e ALL para platform admins via RPCs

---

### 4. Logs de Auditoria da Plataforma

Vista dedicada para o Super Admin ver todas as accoes administrativas:

- **Tabela de logs**: accao, utilizador, alvo, data/hora, valores antigos/novos
- **Filtros**: por tipo de accao (create/update/delete), por tabela alvo, por intervalo de datas
- **Pesquisa**: por nome do utilizador ou do alvo
- **Paginacao**: dados podem ser volumosos

**Ficheiros novos:**
- `src/components/superadmin/PlatformAuditLogs.tsx` — Componente com tabela filtrada e paginada

**Ficheiros alterados:**
- `src/pages/SuperAdmin.tsx` — Adicionar novo tab "Auditoria"
- `src/hooks/usePlatformAdmin.ts` — Adicionar funcao `fetchAuditLogs` com filtros e paginacao

**Migracoes SQL:**
- Nova funcao RPC `get_platform_audit_logs(limit, offset, action_filter, target_filter, date_from, date_to)` com SECURITY DEFINER restrita a platform admins
- Politica RLS adicional em `audit_logs` para SELECT por platform admins (actualmente so admins de organizacao podem ver)

---

### Resumo de Ficheiros

| Accao | Ficheiro |
|-------|---------|
| Novo | `src/components/superadmin/OrganizationDetailSheet.tsx` |
| Novo | `src/components/superadmin/PlansManager.tsx` |
| Novo | `src/components/superadmin/PlanFormModal.tsx` |
| Novo | `src/components/superadmin/PlatformAuditLogs.tsx` |
| Alterado | `src/pages/SuperAdmin.tsx` (2 novos tabs: Planos e Auditoria) |
| Alterado | `src/components/superadmin/OrganizationsTable.tsx` (linhas clicaveis) |
| Alterado | `src/components/superadmin/PlatformMetrics.tsx` (metricas avancadas) |
| Alterado | `src/hooks/usePlatformAdmin.ts` (novas funcoes) |

### Migracoes SQL

- `get_org_detail_for_admin(_org_id uuid)` — detalhe de organizacao
- `get_platform_metrics` actualizada — MRR, churn, evolucao mensal
- `platform_create_plan`, `platform_update_plan`, `platform_toggle_plan` — CRUD de planos
- `get_platform_audit_logs(...)` — logs de auditoria com filtros
- Politica RLS em `audit_logs` para platform admins
- Politica RLS em `subscription_plans` para platform admins (gestao)

### Ordem de Implementacao

1. Migracoes SQL (RPCs e politicas)
2. Metricas avancadas (altera componente existente)
3. Detalhe de organizacao (novo componente + integracao na tabela)
4. Gestao de planos (novos componentes + tab)
5. Logs de auditoria (novo componente + tab)

