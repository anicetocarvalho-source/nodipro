

## Backoffice SaaS — Painel de Gestao da Plataforma

### Situacao actual

O painel Admin (`/admin`) opera ao nivel da organizacao do admin autenticado. Gere utilizadores, permissoes e pagamentos apenas dessa organizacao. Nao existe um backoffice centralizado para a gestao global da plataforma SaaS.

### O que sera implementado

Criar um backoffice de plataforma acessivel apenas a "super admins" que permite gerir todas as organizacoes, subscricoes e pagamentos do SaaS.

---

### 1. Nova pagina: SuperAdmin (`/superadmin`)

Uma pagina dedicada, separada do Admin actual, com os seguintes separadores:

**Separador "Organizacoes"**
- Tabela com todas as organizacoes registadas
- Colunas: nome, tipo de entidade, sector, plano actual, status da subscricao, numero de membros, numero de projectos, data de criacao
- Filtros por plano, status e sector
- Accao para ver detalhes de cada organizacao

**Separador "Subscricoes"**
- Lista de todas as subscricoes activas, em trial e expiradas
- Possibilidade de alterar o plano de qualquer organizacao manualmente
- Visualizacao de trials proximos de expirar

**Separador "Pagamentos"**
- Lista global de todos os pagamentos pendentes de todas as organizacoes (nao apenas a do admin)
- Reutilizar o componente `AdminPaymentManager` existente mas alimentado com dados globais
- Confirmar ou rejeitar qualquer pagamento

**Separador "Metricas"**
- Total de organizacoes
- Distribuicao por plano (grafico)
- MRR estimado (receita recorrente mensal)
- Trials activos vs expirados
- Pagamentos pendentes vs confirmados

---

### 2. Conceito de Super Admin

Adicionar uma flag `is_platform_admin` na tabela `profiles` ou criar uma tabela dedicada `platform_admins` para distinguir admins de organizacao de administradores da plataforma.

---

### 3. Proteccao de acesso

- Nova rota `/superadmin` protegida por verificacao de `is_platform_admin`
- Funcoes SQL com `SECURITY DEFINER` para aceder a dados cross-organization
- Politicas RLS que permitam leitura global apenas para platform admins

---

### Detalhes tecnicos

**Nova migracao SQL:**
- Criar tabela `platform_admins` com `user_id` referenciando `auth.users`
- Criar funcao `is_platform_admin(_user_id uuid)` com `SECURITY DEFINER`
- Criar funcoes para consultas cross-org:
  - `get_all_organizations()` — lista todas as orgs com contagens
  - `get_all_pending_payments()` — pagamentos pendentes globais
  - `get_platform_metrics()` — metricas agregadas
- Politicas RLS nas tabelas `organizations`, `organization_subscriptions` e `payment_references` que permitam SELECT a platform admins

**Novos ficheiros:**
- `src/pages/SuperAdmin.tsx` — pagina principal com tabs
- `src/components/superadmin/OrganizationsTable.tsx` — tabela de organizacoes
- `src/components/superadmin/SubscriptionsManager.tsx` — gestao de subscricoes
- `src/components/superadmin/GlobalPaymentsManager.tsx` — pagamentos globais
- `src/components/superadmin/PlatformMetrics.tsx` — dashboard de metricas
- `src/hooks/usePlatformAdmin.ts` — hook para verificar acesso e carregar dados globais

**Alteracoes em ficheiros existentes:**
- `src/App.tsx` — adicionar rota `/superadmin` com proteccao especifica
- `src/components/layout/AppSidebar.tsx` — adicionar link ao backoffice para platform admins
- `src/hooks/usePayments.ts` — adicionar funcao `fetchAllPayments()` para consulta global

**Sem alteracoes:**
- O painel Admin actual (`/admin`) mantem-se inalterado para gestao ao nivel da organizacao
- Os componentes de pagamento existentes sao reutilizados

