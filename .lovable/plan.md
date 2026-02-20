

## Registo de Organizacoes pelo Super Admin

Adicionar a capacidade de o Super Admin criar novas organizacoes directamente no backoffice, associando-as a um plano de subscricao e definindo um utilizador owner.

---

### Funcionalidade

No tab "Organizacoes", adicionar um botao "Nova Organizacao" que abre um modal com:

- **Nome** da organizacao (obrigatorio)
- **Tipo de entidade**: public, private, ngo (obrigatorio)
- **Sector**: dropdown com sectores existentes (opcional)
- **Provincia**: dropdown com provincias existentes (opcional)
- **Dimensao**: small, medium, large, enterprise
- **Email do owner**: email do utilizador que sera o dono da organizacao (obrigatorio). Se o utilizador ja existir no sistema, e associado. Se nao existir, e enviado um convite.
- **Plano**: dropdown com planos activos (obrigatorio)
- **Descricao** (opcional)

Ao submeter, o sistema:
1. Cria a organizacao
2. Associa o utilizador como membro com role `owner`
3. Cria a subscricao com o plano seleccionado (status `trial` com 14 dias)
4. Marca o onboarding como completo
5. Regista a accao no log de auditoria

---

### Detalhes tecnicos

**Migracao SQL:**
- Nova funcao RPC `platform_create_organization(...)` com SECURITY DEFINER, restrita a platform admins
- Parametros: `_name`, `_entity_type`, `_sector_id`, `_province_id`, `_size`, `_description`, `_owner_email`, `_plan_id`
- Logica interna:
  - Cria a organizacao na tabela `organizations` com `onboarding_completed = true`
  - Procura o utilizador por email em `auth.users`
  - Se encontrado, insere na `organization_members` com role `owner` e `is_primary = true`
  - Se nao encontrado, regista o email para convite posterior (retorna flag `owner_not_found`)
  - Cria registo em `organization_subscriptions` com o plano indicado
  - Insere log de auditoria

**Ficheiros novos:**
- `src/components/superadmin/OrganizationFormModal.tsx` — Modal com formulario de criacao

**Ficheiros alterados:**

| Ficheiro | Alteracao |
|----------|-----------|
| `src/components/superadmin/OrganizationsTable.tsx` | Adicionar botao "Nova Organizacao" no header e integrar o modal |
| `src/hooks/usePlatformAdmin.ts` | Adicionar funcao `createOrganization` que chama a RPC |

**Dados de referencia:**
- O modal carrega sectores de `sectors` e provincias de `provinces` via queries directas (ja acessiveis por utilizadores autenticados)
- Planos carregados da lista `plans` ja disponivel no hook

### Ordem de implementacao

1. Migracao SQL (RPC `platform_create_organization`)
2. Componente `OrganizationFormModal.tsx`
3. Integracao no `OrganizationsTable.tsx` e `usePlatformAdmin.ts`

