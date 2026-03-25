

## Restringir acesso: Membro só vê Perfil + Definições

### Situação actual

O `AccountLayout` mostra Perfil, Definições e Subscrição a todos os utilizadores (excepto platform_admin que só vê Perfil). O membro não deve ver Subscrição.

### Alterações

**1. `src/components/layout/AccountLayout.tsx`**

Filtrar o menu `accountMenuItems` com base no role:
- Importar `usePermissions` 
- Se o utilizador **não for** admin (`!isAdmin`), esconder o item `/subscription`
- Platform admin continua a ver apenas Perfil (lógica existente)

**2. `src/pages/Subscription.tsx`** (protecção de rota directa)

Adicionar verificação no topo do componente:
- Se `!isAdmin`, redirigir para `/profile` ou mostrar mensagem de acesso negado
- Isto previne acesso directo por URL

### Resultado

| Página | Admin | Manager | Member |
|--------|-------|---------|--------|
| Perfil | ✓ | ✓ | ✓ |
| Definições | ✓ | ✓ | ✓ |
| Subscrição | ✓ | ✗ | ✗ |

A Subscrição fica exclusiva para o Admin (owner da organização). Manager e Member acedem a Perfil e Definições.

### Ficheiros alterados

| Ficheiro | Alteração |
|----------|-----------|
| `src/components/layout/AccountLayout.tsx` | Filtrar menu por role |
| `src/pages/Subscription.tsx` | Guardar rota com redirect |

