

## Correcção Completa dos Fluxos de Utilizador

### Problemas Identificados

**1. CRÍTICO — SuperAdmin acessível a Admin de organização**
A rota `/superadmin` usa `AdminPageWrapper` que verifica `requiredRole="admin"`. Um admin de organização regular também passa este check. Deveria verificar `isPlatformAdmin`.

**2. CRÍTICO — Onboarding: novo utilizador fica com role `member`**
O trigger `handle_new_user` atribui sempre `role = 'member'` em `user_roles`. Quando o utilizador cria uma organização no onboarding (e torna-se `owner` em `organization_members`), o seu `user_roles` permanece `member`. Resultado: o owner não tem acesso a funcionalidades de admin (Budget, Reports, Portfolio, etc.) na sua própria organização.

**Correcção**: Após criar a organização no onboarding, actualizar o `user_roles` para `admin` via uma nova função RPC `SECURITY DEFINER`.

**3. IMPORTANTE — Observer vê menus que levam a "Acesso Restrito"**
Na BD, o observer tem `budget.view`, `report.view`, `portfolio.view`. No sidebar, os menus Governance, EVM, Procurement, Change Requests usam `requiresPermission: "canViewBudget"`. O observer vê estes menus mas as rotas usam `ManagerPageWrapper` → vê página de erro "Acesso Restrito".

**Correcção**: Remover `budget.view`, `report.view`, `portfolio.view` do role `observer` na BD. O observer deve apenas observar conteúdo operacional (projectos, tarefas, documentos, equipa).

**4. MENOR — Auth page não tem fluxo de registo**
A página `/auth` só tem login. Não há formulário de registo (signUp está implementado no hook mas não exposto na UI). Novos utilizadores não conseguem criar conta.

**Correcção**: Adicionar tab/toggle de registo na página Auth com campos email, password, nome completo.

**5. MENOR — AlertDialog ref warning no Procurement**
Console warning: "Function components cannot be given refs" no `AlertDialogContent`. É um warning da versão do Radix, não bloqueia funcionalidade.

---

### Plano de Implementação

#### Passo 1: Migração BD — Limpar permissões do Observer
```sql
-- Remover permissões de gestão do observer
DELETE FROM role_permissions 
WHERE role = 'observer' 
AND permission_id IN (
  SELECT id FROM permissions WHERE name IN ('budget.view', 'report.view', 'portfolio.view')
);
```

#### Passo 2: Migração BD — Função para promover owner a admin
```sql
CREATE OR REPLACE FUNCTION public.promote_org_owner_to_admin(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_roles SET role = 'admin' WHERE user_id = _user_id;
END;
$$;
```

#### Passo 3: SuperAdmin route — verificar isPlatformAdmin
`src/App.tsx`: Criar novo wrapper `PlatformAdminPageWrapper` que verifica `isPlatformAdmin` em vez de `requiredRole="admin"`.

#### Passo 4: Onboarding — promover user após criar org
`src/components/onboarding/OnboardingWizard.tsx`: Após `createOrganization` com sucesso, chamar `supabase.rpc('promote_org_owner_to_admin', { _user_id: user.id })`.

#### Passo 5: Auth — adicionar formulário de registo
`src/pages/Auth.tsx`: Adicionar estado `isSignUp` com toggle entre login e registo. Formulário de registo com: nome completo, email, password, confirmação de password.

---

### Ficheiros alterados

| Ficheiro | Alteração |
|----------|-----------|
| Migração SQL | Limpar permissões observer + criar função `promote_org_owner_to_admin` |
| `src/App.tsx` | Novo `PlatformAdminPageWrapper` para `/superadmin` |
| `src/components/onboarding/OnboardingWizard.tsx` | Chamar RPC para promover owner a admin |
| `src/pages/Auth.tsx` | Adicionar formulário de registo |

### Resultado

- **SuperAdmin**: acessível apenas a platform admins (tabela `platform_admins`)
- **Onboarding**: novo utilizador que cria organização recebe role `admin` automaticamente
- **Observer**: vê apenas menus operacionais, sem links mortos para páginas restritas
- **Auth**: novos utilizadores podem registar-se directamente

