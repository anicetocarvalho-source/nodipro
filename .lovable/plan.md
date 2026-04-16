

## Simulação de Fluxos Completos — Resultados da Auditoria UX

### Ecrãs Testados e Resultados

**1. Landing Page (`/`)** — OK
- Hero com gradient, tagline, 2 CTAs, 4 feature cards
- Pricing section carrega planos do DB correctamente
- Footer com copyright
- **Problema encontrado**: O botão "Ver Demonstração" não faz nada (sem `onClick`, sem link)
- **Problema encontrado**: Na secção de Pricing, **todos os 4 planos** mostram as 6 features novas (Acordos de Financiamento, Lições Aprendidas, AWP, Auditoria, Beneficiários, Desembolsos) como **indisponíveis (X vermelho)**, incluindo o plano Enterprise. Causa: a coluna `features` JSONB na tabela `subscription_plans` não contém as chaves `funding_agreements`, `lessons_learned`, `annual_work_plan`, `audit_logs`, `beneficiaries`, `disbursements`. O `PlanCard` lê `plan.features[key]` que retorna `undefined` → falsy → X.

**2. Página de Login (`/auth`)** — Problema parcial
- Layout split-screen profissional, animações Framer Motion suaves
- Demo quick-access buttons visíveis (Super Admin, Admin, Gestor, Membro)
- **Bug**: `loginForm.setValue("email", user.email)` não usa `{ shouldValidate: true, shouldDirty: true }`. Quando se clica num botão demo e depois em "Entrar", os valores são por vezes descartados pela validação Zod porque o campo não está marcado como "dirty/touched". Funciona inconsistentemente — em tentativas subsequentes funciona. Correcção simples no `setValue`.

**3. Dashboard (`/dashboard`)** — OK
- Saudação personalizada com nome + badge de entidade
- Trial expired banner com CTA "Ver Planos"
- 6 KPI cards (Projectos, Taxa Execução, Tarefas, ODS, Beneficiários, Taxa Desembolso)
- Secções de ODS e Execução Orçamental por Província
- Próximos Prazos com prioridades
- NODIBot FAB visível (canto inferior direito)

**4. Projectos (`/projects`)** — OK
- Grid de cards com RAG status, progresso, orçamento em AOA
- Tabs de filtro (Todos/Activos/Atrasados/Pausados/Concluídos) com contagens
- Pesquisa, toggle grid/lista, botão "Novo Projecto"
- Tab Sprints integrada

**5. Detalhe de Projecto (`/projects/:id`)** — OK
- Header com status, metodologia, funder
- 5 KPI cards (Prazo, Progresso, Equipa, Orçamento, Risco)
- Kanban com tarefas bloqueadas (highlight amarelo + lock icon)
- Painel de integridade (60%) com alertas
- Resumo cruzado (Orçamento, Documentos, Equipa)
- Breadcrumbs funcionais

**6. Sidebar de Navegação** — OK (com nota)
- 3 grupos colapsíveis (Planning, Operations, Management)
- Itens condicionais por permissão (RBAC)
- Labels em inglês quando browser é EN (i18n a funcionar por design)
- Scroll quando o conteúdo excede a altura
- **Nota**: O grupo "Management" está cortado — é preciso scroll para ver items como Documents, Budget, Reports, etc. Scroll funcional mas não óbvio visualmente.

---

### Problemas Identificados e Correcções

| # | Severidade | Problema | Correcção |
|---|---|---|---|
| 1 | **CRITICO** | Plans JSONB no DB não tem as 6 feature keys novas → todas aparecem como X em todos os planos | SQL migration: `UPDATE subscription_plans SET features = features || '{"funding_agreements": true, "lessons_learned": true, ...}'` para planos Professional e Enterprise |
| 2 | **MODERADO** | `loginForm.setValue` no quick-access não marca campos como dirty/validated → falha intermitente no login | Adicionar `{ shouldValidate: true, shouldDirty: true }` ao `setValue` |
| 3 | **MENOR** | Botão "Ver Demonstração" na landing page não tem acção | Adicionar scroll suave até a secção de pricing ou link para `/auth` |

### Plano de Implementação

**Ficheiros a alterar:**
- `src/pages/Auth.tsx` — linhas 642-643: adicionar opções ao `setValue`
- `src/pages/Index.tsx` — botão "Ver Demonstração": adicionar acção
- **Migração SQL** — actualizar `features` JSONB em `subscription_plans` para incluir as 6 novas feature keys com valores apropriados por plano (Free: todas false; Starter: `beneficiaries` true; Professional/Enterprise: todas true)

### Detalhe Técnico da Migração

```sql
-- Professional e Enterprise: todas as features novas activas
UPDATE subscription_plans SET features = features 
  || '{"funding_agreements": true, "lessons_learned": true, "annual_work_plan": true, "audit_logs": true, "beneficiaries": true, "disbursements": true}'::jsonb
WHERE slug IN ('professional', 'enterprise');

-- Starter: apenas beneficiaries
UPDATE subscription_plans SET features = features 
  || '{"funding_agreements": false, "lessons_learned": false, "annual_work_plan": false, "audit_logs": false, "beneficiaries": true, "disbursements": false}'::jsonb
WHERE slug = 'starter';

-- Free: nenhuma
UPDATE subscription_plans SET features = features 
  || '{"funding_agreements": false, "lessons_learned": false, "annual_work_plan": false, "audit_logs": false, "beneficiaries": false, "disbursements": false}'::jsonb
WHERE slug = 'free';
```

