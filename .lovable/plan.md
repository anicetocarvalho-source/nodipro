

# RELATÓRIO DE AUDITORIA TÉCNICA E FUNCIONAL — NODIPRO

**Data**: 21 de Março de 2026
**Versão**: 1.0
**Classificação**: Confidencial

---

## 1. ARQUITECTURA GERAL

### Pontos Positivos
- Separação clara entre frontend (React/Vite) e backend (Lovable Cloud/Supabase)
- Multi-tenancy implementado via `organization_id` e RPCs com `SECURITY DEFINER`
- Sistema de permissões granular com roles hierárquicos e overrides por utilizador
- Contextos React bem definidos (`AuthContext`, `OrganizationContext`)
- Backoffice SaaS separado do fluxo de utilizador regular

### Falhas e Riscos Identificados

| # | Problema | Classificação |
|---|----------|--------------|
| A1 | **Queries sem filtro de organização**: Muitos hooks (`useProjects`, `useTasks`, `useStakeholders`, `useChangeRequests`) fazem `select("*")` sem filtrar por `organization_id`. Dependem exclusivamente de RLS, mas RLS em várias tabelas usa `USING: true` para SELECT (ex: projects, tasks), o que expõe dados cross-tenant a qualquer utilizador autenticado. | **BLOQUEANTE** |
| A2 | **SuperAdmin sem protecção de rota dedicada**: A rota `/superadmin` usa `ProtectedPageWrapper` (qualquer utilizador autenticado), não `AdminPageWrapper`. A protecção é feita apenas no componente via redirect, mas o componente renderiza brevemente antes do redirect. | **IMPORTANTE** |
| A3 | **Duplicação de lógica no OrganizationContext**: Linha 111 — `setOrganizations([])` chamado duas vezes consecutivas (bug de copiar/colar, ocorre em 2 locais). | OPCIONAL |
| A4 | **useReportGeneration faz queries globais**: `supabase.from("tasks").select("*")` e `supabase.from("team_members").select("*")` sem filtro de organização — carrega todos os dados da plataforma. | **BLOQUEANTE** |

### Resposta: A arquitectura suporta crescimento nacional?
**Parcialmente.** A estrutura multi-tenant existe, mas a falta de filtros `organization_id` no código cliente, combinada com RLS permissivas em tabelas críticas, significa que com centenas de organizações os utilizadores veriam dados de outros tenants. Isto é um bloqueio estrutural.

### Resposta: Há dependências ocultas entre módulos?
Sim. O `usePlatformAdmin` é carregado em **todos** os page loads (via `ProtectedRoute` e `AppSidebar`), fazendo uma RPC `is_platform_admin` para cada utilizador. Isto é uma query desnecessária para 99.9% dos utilizadores.

---

## 2. DADOS E QUALIDADE

| # | Problema | Classificação |
|---|----------|--------------|
| D1 | **Sem validação de dados extremos**: Campos `budget` e `spent` em `projects` são `numeric` sem limites. Valores negativos ou extremos (ex: 999 triliões) são aceites. | IMPORTANTE |
| D2 | **Datas inconsistentes**: `start_date` e `end_date` em projects são nullable e não têm validação de `end_date > start_date` nem no frontend nem no backend. | IMPORTANTE |
| D3 | **Detecção de duplicações inexistente**: Não há verificação de projectos, tarefas ou organizações com nomes duplicados. | OPCIONAL |
| D4 | **`progress` aceita valores fora de 0-100**: O campo `progress` em `projects` é `integer` sem CHECK constraint ou trigger de validação. | IMPORTANTE |
| D5 | **Perfil incompleto não é tratado**: Se o perfil de um utilizador não existir (ex: trigger de criação falhou), o sistema não apresenta erro claro — apenas mostra "Utilizador" como nome. | IMPORTANTE |

---

## 3. DASHBOARDS E KPIs

### Pontos Positivos
- Dashboards diferenciados por tipo de entidade (public, private, NGO)
- Métricas SaaS avançadas no backoffice (MRR, Churn, ARPU)
- Gráficos de evolução temporal

### Problemas

| # | Problema | Classificação |
|---|----------|--------------|
| K1 | **Dashboard carrega dados de todas as organizações**: `useProjects` sem filtro `organization_id` — os stats podem incluir projectos de outros tenants (dependendo das RLS). | **BLOQUEANTE** |
| K2 | **Sem alertas automáticos**: Não existe sistema de notificações/alertas para deadlines próximos, orçamentos excedidos ou tarefas atrasadas que sejam proactivos (push). | IMPORTANTE |
| K3 | **Métricas SaaS calculadas em tempo real**: A RPC `get_platform_metrics` recalcula tudo a cada chamada. Com crescimento, isto será lento. Falta caching ou materialização. | OPCIONAL |

### Resposta: Um decisor consegue tomar decisão em 5 minutos?
**Sim, para visão geral.** Os dashboards são bem organizados com KPIs visuais. Contudo, faltam alertas accionáveis e drill-down directo dos indicadores para a acção correctiva.

---

## 4. PERFORMANCE E USABILIDADE

| # | Problema | Classificação |
|---|----------|--------------|
| P1 | **`select("*")` em 21+ hooks**: Carrega todas as colunas de todas as tabelas, incluindo campos desnecessários. Com volume, isto degrada performance. | IMPORTANTE |
| P2 | **Limite de 1000 rows do Supabase não tratado**: Nenhum hook implementa paginação. Organizações com >1000 projectos, tarefas ou documentos perdem dados silenciosamente. | **BLOQUEANTE** |
| P3 | **RPC `is_platform_admin` chamada em cada navegação**: Via `ProtectedRoute` e `AppSidebar`, ambos instanciam `usePlatformAdmin()` independentemente, causando chamadas duplicadas. | IMPORTANTE |
| P4 | **Sem lazy loading de rotas**: Todos os 25+ page components são importados estaticamente no `App.tsx`, aumentando o bundle inicial. | IMPORTANTE |
| P5 | **Sidebar flash**: Já reportado pelo utilizador — a sidebar mostra brevemente o menu antigo antes de mostrar o correcto, devido ao loading assíncrono de `isPlatformAdmin`. | IMPORTANTE |

---

## 5. SEGURANÇA E CONFORMIDADE

### Resultados do Security Scan (10 findings)

| # | Problema | Nível | Classificação |
|---|----------|-------|--------------|
| S1 | **team_members expõe emails/telefones de TODAS as organizações** a qualquer utilizador autenticado (RLS: `USING: true`) | ERROR | **BLOQUEANTE** |
| S2 | **Leaked Password Protection desactivada** | WARN | **BLOQUEANTE** |
| S3 | **document_versions, document_workflows, document_comments, subtasks** legíveis por qualquer utilizador autenticado (cross-tenant) | WARN | **BLOQUEANTE** |
| S4 | **budget_alerts e budget_snapshots** modificáveis cross-tenant por utilizadores com permissão `project.edit` | WARN | **BLOQUEANTE** |
| S5 | **Política DELETE de organizations** tem bug: `organization_members.organization_id = organization_members.id` (nunca satisfeita) | WARN | IMPORTANTE |
| S6 | **Invitation tokens** só visíveis para admins — utilizadores convidados não conseguem aceitar convites via token | WARN | IMPORTANTE |
| S7 | **Sem funcionalidade de recuperação de password**: Não existe fluxo de "esqueci-me da password" | — | **BLOQUEANTE** |
| S8 | **Credenciais de teste expostas na página de login**: Emails e passwords hardcoded visíveis em produção (`Auth.tsx` linhas 418-444) | — | **BLOQUEANTE** |
| S9 | **Sem rate limiting** no login: Sujeito a ataques de força bruta | — | IMPORTANTE |
| S10 | **signUp existe no código mas sem UI de registo público**: A função está implementada mas não é utilizada — pode ser chamada via consola | — | OPCIONAL |

---

## 6. PRONTIDÃO PARA PRODUÇÃO

### BLOQUEANTES (Impedem go-live)

1. **Isolamento multi-tenant incompleto**: 8+ tabelas com RLS permissivas permitem leitura cross-tenant
2. **team_members expõe dados pessoais** (emails, telefones) a todos os utilizadores
3. **Credenciais de teste na página de login** — devem ser removidas
4. **Sem recuperação de password** — funcionalidade básica ausente
5. **Leaked Password Protection desactivada**
6. **Limite de 1000 rows** sem paginação — perda silenciosa de dados
7. **Reports carregam dados globais** sem filtro de organização

### IMPORTANTES (Devem ser corrigidos antes do piloto)

1. Validação de dados (datas, progresso, orçamento)
2. Bug na política DELETE de organizations
3. Invitations token inacessível para utilizadores convidados
4. Performance: lazy loading de rotas, cache de `isPlatformAdmin`
5. Sidebar flash para platform admins
6. Alertas automáticos para deadlines e orçamentos
7. Rate limiting no login

### OPCIONAIS (Melhorias desejáveis)

1. Detecção de duplicações
2. Materialização de métricas SaaS
3. Selecção de colunas específicas em queries (em vez de `select("*")`)
4. Separação clara entre dados demo e reais (seed functions existem mas sem flag)

---

## 7. RECOMENDAÇÕES

### Antes do Piloto
1. Corrigir TODAS as RLS policies com `USING: true` em tabelas com dados sensíveis — adicionar filtro `organization_id IN (get_user_org_ids(auth.uid()))`
2. Remover credenciais de teste do `Auth.tsx`
3. Implementar fluxo de recuperação de password
4. Activar Leaked Password Protection
5. Adicionar filtros `organization_id` nos hooks do cliente como camada adicional de segurança

### Antes da Produção Nacional
1. Implementar paginação em todos os hooks com potencial de >1000 registos
2. Adicionar lazy loading de rotas (`React.lazy`)
3. Cachear resultado de `is_platform_admin` no contexto de autenticação
4. Adicionar validação de dados no backend (triggers para datas, progresso, orçamento)
5. Implementar sistema de alertas/notificações proactivas
6. Corrigir bug da política DELETE de organizations
7. Auditar e corrigir política de invitations para permitir aceitação via token

### Veredicto Final
**A plataforma NÃO está pronta para produção.** Existem 7 problemas bloqueantes, maioritariamente relacionados com segurança multi-tenant e exposição de dados sensíveis. A arquitectura é sólida e o backoffice SaaS está bem concebido, mas as falhas de isolamento de dados representam um risco legal e operacional grave. Estimativa de correção: 2-3 sprints focados em segurança e qualidade de dados.

