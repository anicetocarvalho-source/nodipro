

## Auditoria de Rotas da Plataforma — Resultados

### Metodologia
Analise estática completa de `App.tsx`, componentes de protecção (`ProtectedRoute`, `RoleProtectedRoute`, `PlatformAdminPageWrapper`), e contextos de autenticação/organização.

---

### Inventário de Rotas (31 rotas)

| Rota | Protecção | Wrapper | Estado |
|---|---|---|---|
| `/` | Publica | Nenhum | OK — redirect autenticados → `/projects` |
| `/auth` | Publica | Nenhum | OK |
| `/reset-password` | Publica | Suspense | OK |
| `/onboarding` | Semi-protegida (código interno) | Suspense | OK — redirect se já onboarded |
| `/dashboard` | ProtectedRoute | AppLayout | OK — redirect por entidade |
| `/projects` | ProtectedRoute | AppLayout | OK |
| `/projects/:id` | ProtectedRoute | AppLayout | OK |
| `/sprints` | ProtectedRoute | AppLayout | OK — redirect → `/projects` |
| `/logframe` | ProtectedRoute | AppLayout | OK |
| `/kpi` | ProtectedRoute | AppLayout | OK |
| `/stakeholders` | ProtectedRoute | AppLayout | OK |
| `/beneficiaries` | ProtectedRoute | AppLayout | OK |
| `/lessons-learned` | ProtectedRoute | AppLayout | OK |
| `/team` | ProtectedRoute | AppLayout | OK |
| `/documents` | ProtectedRoute | AppLayout | OK |
| `/communication` | ProtectedRoute | AppLayout | OK |
| `/help` | ProtectedRoute | AppLayout | OK |
| `/governance` | Manager+ | AppLayout | OK |
| `/evm` | Manager+ | AppLayout | OK |
| `/procurement` | Manager+ | AppLayout | OK |
| `/disbursements` | Manager+ | AppLayout | OK |
| `/change-requests` | Manager+ | AppLayout | OK |
| `/portfolio` | Manager+ | AppLayout | OK |
| `/programs/:id` | Manager+ | AppLayout | OK |
| `/methodologies` | Manager+ | AppLayout | OK |
| `/risks` | Manager+ | AppLayout | OK |
| `/budget` | Manager+ | AppLayout | OK |
| `/reports` | Manager+ | AppLayout | OK |
| `/annual-work-plan` | Manager+ | AppLayout | OK |
| `/funding-agreements` | Manager+ | AppLayout | OK |
| `/admin` | Admin | AppLayout | OK |
| `/audit-logs` | Admin | AppLayout | OK |
| `/superadmin` | PlatformAdmin | AppLayout | OK |
| `/profile` | ProtectedRoute | AccountLayout | OK |
| `/settings` | ProtectedRoute | AccountLayout | OK |
| `/subscription` | ProtectedRoute | AccountLayout | OK |
| `*` (404) | Nenhum | Suspense | OK |

---

### Problemas Encontrados

#### BUG 1: MENOR — Console warning `forwardRef` no `PricingSection`

O React emite um warning porque `Index.tsx` (linha 126) renderiza `<PricingSection />` sem ref, mas algo no tree está a tentar passar uma ref ao componente. O `PricingSection` é um function component sem `forwardRef`. O mesmo ocorre com `PlanCard`.

**Causa**: Provavelmente o `id="pricing"` na section interna do PricingSection não causa o problema directamente. O warning indica que algum parent tenta passar ref — possivelmente o Tooltip ou outro wrapper.

**Correcção**: Wrap `PricingSection` e `PlanCard` com `React.forwardRef` para suprimir os warnings.

#### BUG 2: INFORMATIVO — Rota `/` com tooltip "Ir para Dashboard" no logo

O tooltip no logo diz "Ir para Dashboard" mas o link vai para `/` (a própria landing page). Inconsistência textual menor.

**Correcção**: Alterar tooltip para "Página Inicial" ou alterar o link para `/dashboard`.

#### Tudo o Resto Está Correcto

- **Acesso sem autenticação**: Rotas protegidas fazem `<Navigate to="/auth">` — correcto
- **Redirect pós-login**: `ProtectedRoute` redirect para `/onboarding` se `needsOnboarding`, caso contrário permite acesso — correcto
- **Platform admin**: Redirect automático de `/dashboard`, `/`, `/projects` para `/superadmin` — correcto
- **Roles insuficientes**: `RoleProtectedRoute` mostra UI de "Acesso Restrito" com botão voltar — correcto (não redirect, mostra mensagem)
- **404**: Catch-all `*` renderiza `NotFound` com link "Return to Home" — correcto
- **Browser back/forward**: BrowserRouter com SPA fallback — correcto para Lovable hosting
- **Sprints**: Redirect permanente para `/projects` — correcto

---

### Plano de Correcção

| # | Severidade | Ficheiro | Correcção |
|---|---|---|---|
| 1 | MENOR | `src/components/subscription/PricingSection.tsx` | Wrap com `React.forwardRef` |
| 2 | MENOR | `src/components/subscription/PlanCard.tsx` | Wrap com `React.forwardRef` |
| 3 | INFORMATIVO | `src/pages/Index.tsx` | Alterar tooltip "Ir para Dashboard" → "Página Inicial" |

Estes são os unicos problemas. A arquitectura de routing está sólida: protecção por autenticação, role gating, onboarding redirect, e 404 todos funcionam correctamente.

