

## Correcção: Restringir menus por role (Manager e Member)

### Problema

1. **BD**: O role `member` tem `budget.view` e `report.view` na tabela `role_permissions`, dando acesso a menus que não deveria ver.
2. **Sidebar**: Vários menus não têm `requiresPermission` — aparecem para todos os roles.

### Matriz de acesso esperada

| Menu | Admin | Manager | Member | Observer |
|------|-------|---------|--------|----------|
| Dashboard | ✓ | ✓ | ✓ | ✓ |
| Governance | ✓ | ✓ | ✗ | ✗ |
| Projects | ✓ | ✓ | ✓ | ✓ |
| Portfolio | ✓ | ✓ | ✗ | ✗ |
| Methodologies | ✓ | ✓ | ✗ | ✗ |
| LogFrame | ✓ | ✓ | ✓ | ✓ |
| KPI | ✓ | ✓ | ✓ | ✓ |
| EVM | ✓ | ✓ | ✗ | ✗ |
| Procurement | ✓ | ✓ | ✗ | ✗ |
| Risks | ✓ | ✓ | ✗ | ✗ |
| Stakeholders | ✓ | ✓ | ✓ | ✓ |
| Change Requests | ✓ | ✓ | ✗ | ✗ |
| Team | ✓ | ✓ | ✓ | ✓ |
| Documents | ✓ | ✓ | ✓ | ✓ |
| Communication | ✓ | ✓ | ✓ | ✓ |
| Budget | ✓ | ✓ | ✗ | ✗ |
| Reports | ✓ | ✓ | ✗ | ✗ |
| Admin | ✓ | ✗ | ✗ | ✗ |

### Alterações

**1. Base de dados — remover permissões do `member`**

Migration SQL para remover `budget.view` e `report.view` do role `member` na tabela `role_permissions`.

**2. `src/hooks/usePermissions.ts` — adicionar novas flags**

Adicionar permissões de navegação em falta:
- `canAccessPortfolio`: já existe, mas verificar que usa `portfolio.view`
- `canAccessMethodologies`: nova flag — `isManagerLevel || hasPermission("project.create")`
- `canManageRisks`: restringir — remover fallback `hasPermission("task.edit")`, usar apenas `isManagerLevel`

**3. `src/components/layout/AppSidebar.tsx` — adicionar `requiresPermission`**

Adicionar verificação aos menus que faltam:

| Menu | requiresPermission |
|------|--------------------|
| Portfolio | `canAccessPortfolio` |
| Methodologies | `canAccessMethodologies` (nova) |
| Risks | `canManageRisks` |
| EVM | `canViewBudget` (já tem) |
| Procurement | `canViewBudget` (já tem) |
| Change Requests | `canViewBudget` (já tem) |

### Ficheiros alterados

| Ficheiro | Alteração |
|----------|-----------|
| Migration SQL | Remover `budget.view` e `report.view` do member |
| `src/hooks/usePermissions.ts` | Adicionar `canAccessMethodologies`, corrigir `canManageRisks` |
| `src/components/layout/AppSidebar.tsx` | Adicionar `requiresPermission` aos menus Portfolio, Methodologies, Risks |

### Resultado

- **Manager**: vê todos os menus (tem todas as permissões de gestão na BD)
- **Member**: vê apenas Dashboard, Projects, LogFrame, KPI, Stakeholders, Team, Documents, Communication
- **Observer**: mesma restrição que member (sem permissões de gestão)

