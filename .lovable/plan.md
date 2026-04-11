

## Consolidar Utilizadores de Teste numa Única Organização

### Situação actual

Existem 5 organizações na BD, com os utilizadores dispersos:

| Utilizador | Org primária | Role na org |
|---|---|---|
| superadmin@nodipro.com | Tech (privada) | owner |
| admin@nodipro.com | Ministério Infraestruturas | owner |
| manager@nodipro.com | TechCorp Angola | owner |
| member@nodipro.com | Mwango Brain | owner |

Todos os 4 estão no "Ministério das Infraestruturas de Angola" como secundários, mas cada um tem a sua própria org como primária. Isto cria problemas: cada user vê os dados da sua org primária, não da org partilhada.

### Objectivo

- Manter **1 única organização** de teste: "Ministério das Infraestruturas de Angola"
- Remover as organizações individuais (TechCorp, Mwango Brain, Tech, Test Org Direct)
- Todos os users ficam com esta org como **primária**
- O `seed-test-users` passa a garantir esta consolidação automaticamente

### Plano de implementação

**1. Migração SQL — Limpar organizações e consolidar membros**

```sql
-- Remover organizações individuais (não a partilhada)
-- Mover dados orphaned se existirem (projects, etc.)
-- Definir org partilhada como is_primary para todos os users
-- Remover org_members das orgs eliminadas
-- Eliminar organizações extras
```

Acções concretas:
- Eliminar memberships das orgs individuais
- Eliminar as 4 organizações extras (Test Org Direct, TechCorp Angola, Mwango Brain, Tech)
- Actualizar `is_primary = true` para todos os 4 users na org "Ministério das Infraestruturas de Angola"
- Garantir roles correctos: admin@→owner, superadmin@→admin, manager@→manager, member@→member

**2. Actualizar `seed-test-users` Edge Function**

Adicionar lógica ao final da função para:
- Criar a organização "Ministério das Infraestruturas de Angola" (tipo `public`) se não existir
- Adicionar todos os 4 users como membros com roles correctos (owner, admin, manager, member)
- Definir `is_primary = true` para todos
- Criar subscrição trial se não existir
- Remover qualquer outra organização/membership destes users

**3. Actualizar `seed-demo-data` para usar a org partilhada**

Verificar que o seed de dados demo usa a organização correcta.

### Mapeamento final de roles

| Email | system_role (user_roles) | org_role (organization_members) | platform_admin |
|---|---|---|---|
| superadmin@nodipro.com | admin | admin | Sim |
| admin@nodipro.com | admin | owner | Não |
| manager@nodipro.com | manager | manager | Não |
| member@nodipro.com | member | member | Não |

### Ficheiros alterados

| Ficheiro | Alteração |
|---|---|
| Migração SQL | Limpar orgs extras, consolidar memberships |
| `supabase/functions/seed-test-users/index.ts` | Adicionar consolidação de organização e memberships |

