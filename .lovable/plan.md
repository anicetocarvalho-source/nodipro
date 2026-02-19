

## Super Admin — Experiencia Dedicada ao Backoffice

### Problema actual

O Super Admin (`superadmin@nodipro.com`) foi criado com a role `admin` e associado a uma organizacao. Quando faz login, ve todo o menu da aplicacao (dashboard, projectos, portfolio, etc.) como qualquer outro utilizador. Deveria ver **apenas** o backoffice de gestao do SaaS.

### O que sera alterado

O Super Admin tera uma experiencia completamente isolada: ao fazer login, sera redireccionado para `/superadmin` e vera apenas o menu do backoffice.

---

### 1. Redireccionamento automatico

**Ficheiro: `src/pages/Dashboard.tsx`** (ou o componente que controla o redireccionamento pos-login)

- Ao detectar que o utilizador e um platform admin, redirecionar automaticamente para `/superadmin` em vez do dashboard normal.

**Ficheiro: `src/components/auth/ProtectedRoute.tsx`**

- Adicionar logica para que, apos autenticacao, se o utilizador for platform admin, seja enviado para `/superadmin`.

### 2. Sidebar dedicada para Super Admin

**Ficheiro: `src/components/layout/AppSidebar.tsx`**

- Quando `isPlatformAdmin` for `true`, mostrar **apenas** os itens do backoffice:
  - Metricas
  - Organizacoes
  - Subscricoes
  - Pagamentos
  - Logout
- Esconder completamente os menus de planning, operations e management.

### 3. Seed do Super Admin sem organizacao

**Ficheiro: `supabase/functions/seed-test-users/index.ts`**

- O Super Admin nao precisa de ser associado a nenhuma organizacao (nao precisa de onboarding).
- Garantir que o utilizador nao e adicionado a `organization_members`.

### 4. Bypass do onboarding

**Ficheiro: `src/components/auth/ProtectedRoute.tsx`** ou equivalente

- O Super Admin nao deve ser obrigado a passar pelo onboarding (seleccionar organizacao/sector), pois a sua funcao e apenas gerir a plataforma.

---

### Detalhes tecnicos

**Alteracoes em `src/components/layout/AppSidebar.tsx`:**
- Condicao: se `isPlatformAdmin`, renderizar menu simplificado com apenas o link do Backoffice e opcoes de conta (perfil, logout).

**Alteracoes em `src/components/auth/ProtectedRoute.tsx`:**
- Adicionar verificacao de `is_platform_admin` para:
  - Ignorar a verificacao de onboarding (o super admin nao precisa de organizacao)
  - Redirecionar para `/superadmin` se a rota actual for `/dashboard`

**Alteracoes em `src/pages/Dashboard.tsx`:**
- No inicio do componente, se `isPlatformAdmin`, redirecionar com `<Navigate to="/superadmin" />`.

**Alteracoes em `supabase/functions/seed-test-users/index.ts`:**
- Separar o Super Admin dos utilizadores normais para que nao seja associado a organizacoes durante o seed ou onboarding.

**Resultado esperado:**
- O Super Admin faz login e ve imediatamente o backoffice com metricas, organizacoes, subscricoes e pagamentos.
- Nao ve menus de projectos, portfolio, tarefas, etc.
- Nao e obrigado a passar pelo fluxo de onboarding.

