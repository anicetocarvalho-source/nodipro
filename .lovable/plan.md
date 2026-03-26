

## Auditoria Completa de Privilégios — Gaps Identificados

Após análise de todas as rotas, páginas e componentes, aqui está tudo o que pode ser ajustado:

---

### 1. Rotas sem protecção de role (acesso directo por URL)

Páginas que usam `ProtectedPageWrapper` (qualquer utilizador autenticado) mas deveriam ser restritas:

| Rota | Wrapper actual | Deveria ser | Problema |
|------|---------------|-------------|----------|
| `/portfolio` | ProtectedPageWrapper | ManagerPageWrapper | Member acede por URL directamente |
| `/methodologies` | ProtectedPageWrapper | ManagerPageWrapper | Member acede por URL directamente |
| `/programs/:id` | ProtectedPageWrapper | ManagerPageWrapper | Detalhe de programa acessível a member |

O menu sidebar esconde estes itens, mas **nada impede o acesso directo por URL**.

---

### 2. Páginas sem verificação de permissões em acções

| Página | Problema | Correcção |
|--------|----------|-----------|
| **Team** | Botão "Adicionar Membro" e "Remover" visíveis a todos — não usa `usePermissions` | Esconder acções de gestão para member/observer |
| **Documents** | Botão "Novo Documento", eliminar e aprovar workflow visíveis a todos — não usa `usePermissions` | Restringir upload/delete/approve por role |
| **Stakeholders** | Provavelmente sem restrições de criação/edição | Verificar e restringir |
| **LogFrame** | Sem restrição de edição — member pode alterar indicadores | Restringir edição a manager+ |
| **KPI** | Sem restrição de criação/edição de KPIs | Restringir gestão a manager+ |
| **Communication** | Sem restrições — ok para todos | Sem alteração necessária |

---

### 3. Dashboard — informação sensível exposta

O dashboard mostra a todos:
- Orçamento total e gastos
- Métricas financeiras (execução orçamental)

**Member/Observer não deveria ver dados financeiros** no dashboard (alinhado com a restrição do menu Budget).

---

### 4. Sprints — rota sem protecção

| Rota | Estado | Nota |
|------|--------|------|
| `/sprints` | ProtectedPageWrapper | Avaliar se member pode gerir sprints ou apenas ver |

---

### 5. Acções em ProjectDetail

| Acção | Estado actual | Correcção |
|-------|---------------|-----------|
| Eliminar projecto | Sem verificação `canDeleteProject` | Adicionar guard |
| Editar projecto | Sem verificação `canEditProject` | Adicionar guard |
| Gerar relatório | Visível a todos | Restringir a manager+ |

---

### 6. SuperAdmin — protecção insuficiente

A rota `/superadmin` usa `ProtectedPageWrapper` em vez de verificar `isPlatformAdmin`. Qualquer utilizador autenticado pode aceder por URL.

---

### Resumo de prioridades

```text
CRÍTICO (segurança):
├── Portfolio/Methodologies/Programs — proteger rotas com ManagerPageWrapper
├── SuperAdmin — adicionar verificação isPlatformAdmin na rota
└── Team — esconder "Adicionar/Remover" para member

IMPORTANTE (consistência):
├── Documents — restringir upload/delete/approve por role
├── Dashboard — esconder métricas financeiras para member
├── ProjectDetail — guards em editar/eliminar/relatório
├── LogFrame/KPI — restringir edição a manager+
└── Stakeholders — verificar acções

MENOR (polish):
└── Sprints — definir nível de acesso para member
```

### Plano de implementação

**Ficheiros a alterar:**

| Ficheiro | Alteração |
|----------|-----------|
| `src/App.tsx` | Mudar Portfolio, Methodologies, Programs para `ManagerPageWrapper`; proteger SuperAdmin |
| `src/pages/Team.tsx` | Importar `usePermissions`, esconder botões de gestão para member |
| `src/pages/Documents.tsx` | Importar `usePermissions`, restringir criação/eliminação/aprovação |
| `src/pages/ProjectDetail.tsx` | Adicionar guards em editar/eliminar/gerar relatório |
| `src/pages/LogFrame.tsx` | Restringir edição de indicadores a manager+ |
| `src/pages/KPI.tsx` | Restringir gestão de KPIs a manager+ |
| `src/pages/Stakeholders.tsx` | Restringir criação/edição a manager+ |
| `src/components/dashboard/*` | Esconder cards financeiros para member/observer |

Nenhuma alteração de base de dados necessária — tudo é enforcement na UI (a BD já tem RLS correcto).

