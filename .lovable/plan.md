

## Correcao: Carregamento estranho ao navegar entre paginas de Gestao

### Problema

Quando o utilizador clica em menus como Documentos, Comunicacao, Orcamento ou Relatorios, aparece um loader de ecra inteiro ("A carregar...") antes de mostrar a pagina. Isto acontece porque:

1. **`usePlatformAdmin()` e chamado em cada navegacao**: O `ProtectedRoute` e o `AppSidebar` instanciam `usePlatformAdmin()` independentemente, e cada instancia faz uma RPC `is_platform_admin` ao montar. Enquanto espera a resposta, `loading = true`, o que faz o `ProtectedRoute` mostrar o loader de ecra inteiro.

2. **`ProtectedRoute` bloqueia o render**: A condicao `if (authLoading || orgLoading || platformLoading)` mostra um spinner full-screen. Como `platformLoading` reinicia a `true` em cada mount do hook, isto causa o "flash" de carregamento em cada navegacao.

### Solucao

Mover o estado `isPlatformAdmin` para o `AuthContext`, que e montado uma unica vez. Isto elimina a RPC duplicada e o loading repetido.

---

### 1. Adicionar `isPlatformAdmin` ao AuthContext

**Ficheiro: `src/contexts/AuthContext.tsx`**

- Apos obter o utilizador e a role, fazer a RPC `is_platform_admin` uma unica vez
- Guardar `isPlatformAdmin` e `platformLoading` no contexto
- Expor ambos via `useAuthContext()`

### 2. Simplificar `usePlatformAdmin`

**Ficheiro: `src/hooks/usePlatformAdmin.ts`**

- Em vez de fazer a RPC `is_platform_admin` internamente, ler `isPlatformAdmin` do `useAuthContext()`
- Remover o `useState(loading)` e o `useEffect` que fazia a RPC
- O hook passa a ter `loading: false` por defeito (o loading ja foi tratado no contexto)

### 3. Simplificar `ProtectedRoute`

**Ficheiro: `src/components/auth/ProtectedRoute.tsx`**

- Remover a instancia de `usePlatformAdmin()` — usar `useAuthContext()` que ja tem `isPlatformAdmin` e `platformLoading`
- A condicao de loading fica: `if (authLoading || orgLoading)` (o platform loading ja e coberto pelo auth)

### 4. Simplificar `AppSidebar`

**Ficheiro: `src/components/layout/AppSidebar.tsx`**

- Ler `isPlatformAdmin` do `useAuthContext()` em vez de instanciar `usePlatformAdmin()`
- Remover o estado de loading separado para o menu

---

### Resultado esperado

- A RPC `is_platform_admin` e feita **uma unica vez** no login (via AuthContext)
- Navegar entre paginas nao mostra mais o loader de ecra inteiro
- A sidebar nao "pisca" entre menus
- Performance melhorada (menos chamadas RPC por navegacao)

### Ficheiros alterados

| Ficheiro | Alteracao |
|----------|-----------|
| `src/contexts/AuthContext.tsx` | Adicionar `isPlatformAdmin` e carregar uma vez |
| `src/hooks/usePlatformAdmin.ts` | Ler do contexto em vez de fazer RPC |
| `src/components/auth/ProtectedRoute.tsx` | Usar contexto, remover `usePlatformAdmin()` |
| `src/components/layout/AppSidebar.tsx` | Usar contexto para `isPlatformAdmin` |

