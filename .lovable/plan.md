

## Reorganizar a area de Subscricao para fora do contexto de projectos

### Problema actual
A pagina de Subscricao (`/subscription`) esta integrada no mesmo layout (`AppLayout`) e sidebar que as paginas de gestao de projectos, orcamentos e equipa. Isto mistura a gestao comercial/conta com o ambiente de trabalho operacional, o que e confuso para o utilizador.

### Solucao proposta
Criar uma area dedicada de "Conta / Billing" com as seguintes alteracoes:

### 1. Criar um layout dedicado para paginas de conta
- Criar `src/components/layout/AccountLayout.tsx` -- um layout mais simples, sem a sidebar operacional completa
- Tera um menu lateral minimalista com links apenas para: Perfil, Definicoes, Subscricao e um botao para voltar ao Dashboard
- Mantém o TopBar para consistencia visual

### 2. Mover paginas de conta para o novo layout
As seguintes rotas passam a usar o `AccountLayout`:
- `/profile` -- Perfil do utilizador
- `/settings` -- Definicoes
- `/subscription` -- Gestao de subscricao

### 3. Actualizar a sidebar principal (`AppSidebar`)
- Remover o link directo para `/subscription` da seccao inferior da sidebar
- Substituir por um link para `/profile` (ou "Minha Conta") que serve como ponto de entrada para a area de conta
- Manter os links de Definicoes e Ajuda na sidebar principal como atalhos

### 4. Actualizar as rotas em `App.tsx`
- As rotas `/profile`, `/settings` e `/subscription` passam a usar um novo wrapper com o `AccountLayout` em vez do `AppLayout`

### 5. Actualizar breadcrumbs
- Garantir que o componente de breadcrumbs funciona correctamente no novo layout

---

### Detalhes tecnicos

**Novo ficheiro: `src/components/layout/AccountLayout.tsx`**
- Layout com sidebar estreita (aprox. 240px) contendo:
  - Logo NODIPRO (link para `/`)
  - Link "Voltar ao Dashboard" (`/dashboard`)
  - Separador
  - Links: Perfil, Definicoes, Subscricao
- Area de conteudo principal com padding consistente
- Reutiliza o `TopBar` existente

**Alteracoes em `src/App.tsx`**
- Criar um novo wrapper `AccountPageWrapper` que usa `AccountLayout` em vez de `AppLayout`
- Aplicar a `/profile`, `/settings`, `/subscription`

**Alteracoes em `src/components/layout/AppSidebar.tsx`**
- Remover `CreditCard` / `subscription` dos `bottomMenuItems`
- Opcionalmente adicionar um item "Minha Conta" que leva a `/profile`

**Alteracoes em i18n (pt.json, en.json, fr.json)**
- Adicionar chaves para "Minha Conta", "Voltar ao Dashboard", etc.

