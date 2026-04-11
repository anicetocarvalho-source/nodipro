

## Mensagens diferenciadas por role: Admin vs outros utilizadores

### Problema
Actualmente, tanto o `TrialExpiredBanner` como o `UpgradePrompt` mostram a mesma mensagem a todos os utilizadores, incluindo o botão "Ver Planos" que redireciona para `/subscription`. Mas apenas administradores podem aceder a essa página — os restantes são redireccionados automaticamente. A mensagem deve ser adaptada ao role do utilizador.

### Alterações

**1. `src/components/subscription/TrialExpiredBanner.tsx`**
- Importar `usePermissions` e verificar `isAdmin`
- **Admin**: manter mensagem actual + botão "Ver Planos"
- **Outros**: mostrar "O plano da sua organização expirou. Contacte o administrador do sistema para renovação ou upgrade." Sem botão "Ver Planos"
- Para trial a expirar: Admin vê "Faça upgrade"; outros vêem "Contacte o administrador"

**2. `src/components/subscription/UpgradePrompt.tsx`**
- Importar `usePermissions` e verificar `isAdmin`
- **Admin**: manter mensagem actual + botão "Ver Planos"
- **Outros**: mostrar "Esta funcionalidade requer um plano superior. Contacte o administrador da sua organização para upgrade." Sem botão de navegação para `/subscription`

### Ficheiros alterados
| Ficheiro | Alteração |
|---|---|
| `src/components/subscription/TrialExpiredBanner.tsx` | Mensagem e CTA condicionais por role |
| `src/components/subscription/UpgradePrompt.tsx` | Mensagem e CTA condicionais por role |

