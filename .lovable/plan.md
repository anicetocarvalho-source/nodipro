
## Correcao: Super Admin redirecionado para /projects em vez de /superadmin

### Problema

A pagina de login (`Auth.tsx`) redireciona **todos** os utilizadores para `/projects` apos o login (linhas 126 e 143). O `ProtectedRoute` so redireciona platform admins para `/superadmin` quando estao em `/dashboard` ou `/` — nao cobre `/projects`.

### Solucao

Duas alteracoes simples:

**1. `src/pages/Auth.tsx`** — Redirecionar para `/dashboard` em vez de `/projects`

Alterar as duas ocorrencias de `navigate("/projects", ...)` para `navigate("/dashboard", ...)`. Isto garante que todos os utilizadores passam pelo `/dashboard`, onde:
- Platform admins sao redirecionados para `/superadmin` (via `ProtectedRoute` e `Dashboard.tsx`)
- Utilizadores normais veem o dashboard da sua organizacao

**2. `src/components/auth/ProtectedRoute.tsx`** — Adicionar `/projects` a lista de rotas que redirecionam platform admins

Expandir a condicao de redirect para incluir tambem `/projects`, caso o admin chegue la por outra via:

```
if (location.pathname === "/dashboard" || location.pathname === "/" || location.pathname === "/projects")
```

### Detalhe tecnico

| Ficheiro | Alteracao |
|----------|-----------|
| `src/pages/Auth.tsx` | Linhas 127 e 143: `/projects` passa a `/dashboard` |
| `src/components/auth/ProtectedRoute.tsx` | Linha 37: adicionar `location.pathname === "/projects"` a condicao de redirect do platform admin |

Esta abordagem garante que o fluxo pos-login passa sempre pelo ponto de decisao correcto, sem afectar utilizadores regulares.
