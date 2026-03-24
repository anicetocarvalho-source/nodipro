

## Correcao: Passwords nos botoes de acesso rapido

### Problema
Os botoes de "Acesso Rapido (Demo)" preenchem a password `password123`, mas os utilizadores foram criados com passwords diferentes pela edge function `seed-test-users`.

### Solucao

Actualizar o array de utilizadores demo no `Auth.tsx` (linha 441-445) para usar as passwords correctas:

| Email | Password correcta |
|-------|-------------------|
| superadmin@nodipro.com | `SuperAdmin123!` |
| admin@nodipro.com | `Admin123!` |
| manager@nodipro.com | `Manager123!` |
| member@nodipro.com | `Member123!` |

### Alteracao

**Ficheiro:** `src/pages/Auth.tsx`

Actualizar o array de botoes (linhas 441-445) para incluir a password por utilizador, e no `onClick` (linha 452) usar a password especifica em vez de `password123`.

