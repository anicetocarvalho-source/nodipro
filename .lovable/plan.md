

# Modulo SaaS Multi-Tenant para NODIPRO

## Estado Actual

A plataforma ja possui a infraestrutura multi-tenant fundamental:
- Tabela `organizations` com isolamento por `organization_id`
- Tabela `organization_members` com roles (owner, admin, manager, member, viewer)
- Politicas RLS em todas as tabelas criticas
- Fluxo de onboarding para criacao de organizacoes (temporariamente desactivado)
- Contexto `OrganizationContext` para gestao do tenant activo

## O Que Falta para SaaS Completo

### 1. Sistema de Planos e Subscricoes

Criar tabelas para gerir planos de pricing e subscricoes das organizacoes:

- **`subscription_plans`** - Definicao dos planos (Free, Starter, Professional, Enterprise) com limites de projectos, membros, armazenamento, e funcionalidades incluidas
- **`organization_subscriptions`** - Subscricao activa de cada organizacao, com datas de inicio/fim, estado (active, trial, expired, cancelled), e referencia ao plano

### 2. Limites e Quotas por Plano

Definir restricoes por tier:

| Recurso | Free | Starter | Professional | Enterprise |
|---------|------|---------|--------------|------------|
| Projectos | 3 | 10 | 50 | Ilimitado |
| Membros | 5 | 15 | 50 | Ilimitado |
| Armazenamento (GB) | 1 | 5 | 25 | 100 |
| Portfolios | 0 | 2 | 10 | Ilimitado |
| Funcionalidades avancadas | -- | Parcial | Total | Total + API |

### 3. Controlo de Acesso por Plano (Feature Gating)

Um hook `useSubscription` que:
- Carrega o plano activo da organizacao
- Verifica se uma funcionalidade esta incluida no plano
- Fornece contadores de utilizacao (projectos criados vs limite)
- Mostra avisos de upgrade quando o limite e atingido

### 4. Reactivar e Expandir Onboarding

- Reactivar o fluxo de onboarding (actualmente desactivado)
- Adicionar passo de seleccao de plano (Step 5)
- Integrar com a criacao da subscricao

### 5. Pagina de Gestao de Subscricao

Nova pagina `/subscription` acessivel pelo owner/admin da organizacao para:
- Ver plano actual e limites de utilizacao
- Comparar planos disponiveis
- Fazer upgrade/downgrade

### 6. Landing Page com Pricing

Actualizar a pagina inicial (`Index.tsx`) para incluir uma seccao de pricing com os planos disponiveis.

## Detalhes Tecnicos

### Novas Tabelas (Migracao SQL)

```text
subscription_plans
  - id, name, slug, description
  - price_monthly, price_yearly, currency
  - max_projects, max_members, max_storage_gb, max_portfolios
  - features (jsonb) - mapa de funcionalidades incluidas
  - is_active, sort_order
  - created_at

organization_subscriptions
  - id, organization_id (FK), plan_id (FK)
  - status (trial, active, past_due, cancelled, expired)
  - trial_ends_at, current_period_start, current_period_end
  - cancelled_at, cancel_reason
  - created_at, updated_at
```

### Politicas RLS

- `subscription_plans`: leitura publica para autenticados, escrita apenas admin
- `organization_subscriptions`: leitura/escrita restrita a membros da organizacao (via `get_user_org_ids`)

### Novos Ficheiros

- `src/types/subscription.ts` - Tipos TypeScript
- `src/hooks/useSubscription.ts` - Hook para verificar plano, limites e quotas
- `src/pages/Subscription.tsx` - Pagina de gestao de subscricao
- `src/components/subscription/PlanCard.tsx` - Card de plano
- `src/components/subscription/UsageBar.tsx` - Barra de utilizacao
- `src/components/subscription/UpgradePrompt.tsx` - Modal de upgrade
- `src/components/subscription/PricingSection.tsx` - Seccao de pricing para landing page

### Ficheiros a Modificar

- `src/App.tsx` - Adicionar rota `/subscription`
- `src/pages/Index.tsx` - Adicionar seccao de pricing
- `src/contexts/OrganizationContext.tsx` - Reactivar onboarding
- `src/components/onboarding/OnboardingWizard.tsx` - Adicionar step de plano
- `src/components/layout/AppSidebar.tsx` - Adicionar link de subscricao
- `src/components/projects/ProjectFormModal.tsx` - Validar limite de projectos
- `src/pages/Team.tsx` - Validar limite de membros

### Funcao SQL de Verificacao

Criar funcao `check_org_quota(org_id, resource_type)` que retorna se a organizacao pode criar mais recursos, utilizada tanto no frontend (UX) como nas politicas RLS (seguranca).

### Nota sobre Pagamentos

Este plano implementa toda a logica de planos, quotas e feature gating **sem** integracao de pagamentos. A integracao com Stripe ou outro gateway pode ser adicionada posteriormente como fase 2, conectando o `organization_subscriptions.status` ao webhook de pagamento.

## Sequencia de Implementacao

1. Migracao SQL (tabelas + dados seed dos planos + RLS)
2. Tipos e hook `useSubscription`
3. Pagina de Subscricao e componentes
4. Feature gating nos formularios de criacao
5. Seccao de pricing na landing page
6. Reactivar onboarding com step de plano

