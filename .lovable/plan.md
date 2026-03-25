

## Configuracao de Privilegios — Todos na Mesma Organizacao

### Estado Actual

Cada utilizador e "owner" da sua propria organizacao isolada. Nenhum partilha dados.

| Email | user_role | org_role | Organizacao |
|-------|-----------|----------|-------------|
| superadmin@nodipro.com | admin + platform_admin | owner | Tech |
| admin@nodipro.com | admin | owner | Ministerio das Infraestruturas |
| manager@nodipro.com | manager | owner | TechCorp Angola |
| member@nodipro.com | member | owner | Mwango Brain |

### Configuracao Alvo

Organizacao principal: **Ministerio das Infraestruturas de Angola** (entidade publica, ja tem dados demo).

| Email | user_role (RBAC) | org_role (na org) | Descricao |
|-------|------------------|-------------------|-----------|
| superadmin@nodipro.com | admin + platform_admin | admin | Acesso total + backoffice da plataforma |
| admin@nodipro.com | admin | owner | Administrador da organizacao (tudo) |
| manager@nodipro.com | manager | manager | Gestao completa de projectos, portfolios, orcamento, relatorios |
| member@nodipro.com | member | member | Ver projectos, criar/editar tarefas, ver documentos |

### Alteracoes a Executar

**1. Dados (via insert tool — 3 operacoes SQL)**

- Adicionar `superadmin@nodipro.com` como membro da org "Ministerio" com `role = 'admin'`, `is_primary = false`
- Adicionar `manager@nodipro.com` como membro da org "Ministerio" com `role = 'manager'`, `is_primary = false`
- Adicionar `member@nodipro.com` como membro da org "Ministerio" com `role = 'member'`, `is_primary = false`

As organizacoes originais de cada utilizador permanecem (cada um continua owner da sua). A org "Ministerio" torna-se a org partilhada onde todos colaboram.

**2. Codigo — `src/pages/Auth.tsx`**

Actualizar as descricoes dos botoes de acesso rapido para reflectir os privilegios reais:
- Super Admin: "Plataforma + Admin da Org"
- Admin: "Administrador (owner da org)"
- Manager: "Gestao completa (projectos, orcamento, relatorios)"
- Member: "Operacional (tarefas, documentos)"

### Resultado

Ao fazer login com qualquer conta, o utilizador pode seleccionar a org "Ministerio das Infraestruturas" e ver os mesmos projectos/dados — cada um com o nivel de acesso correspondente ao seu role.

