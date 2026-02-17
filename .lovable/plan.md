

# Plano de Preparacao para Producao

## Resumo
A plataforma NODIPRO tem todas as funcionalidades implementadas e esta funcionalmente pronta. No entanto, existem **5 brechas de seguranca** que devem ser fechadas antes do lancamento em producao para proteger os dados das organizacoes.

## Accoes Necessarias

### 1. Corrigir RLS da tabela `document_history` (Critico)
- Adicionar politicas RLS que restrinjam o acesso ao historico de documentos apenas a membros da organizacao proprietaria
- Verificar pertenca via `project_id` -> `projects.organization_id`

### 2. Corrigir RLS de Templates de Metodologia (Medio)
- Adicionar politicas a `project_templates`, `template_phases` e `template_deliverables`
- Restringir acesso por `organization_id` para templates proprietarios

### 3. Eliminar Politicas RLS Permissivas (Medio)
- Identificar e corrigir as 3 politicas com `USING (true)` / `WITH CHECK (true)` em operacoes de escrita
- Substituir por verificacoes de pertenca a organizacao ou permissoes RBAC

### 4. Corrigir Warning de forwardRef (Menor)
- Actualizar o componente `RAGIndicator` ou o uso do `Badge` na pagina Projects para evitar o warning de ref

### 5. Configuracao Manual (Fora do Codigo)
- Activar "Leaked Password Protection" no painel de autenticacao do Lovable Cloud (Auth Policies)
- Esta e uma accao manual que nao pode ser automatizada

## Detalhes Tecnicos

### Migracao SQL prevista
- Criar politicas RLS para `document_history` baseadas em `organization_id` via joins
- Actualizar politicas de `project_templates`, `template_phases`, `template_deliverables` para filtrar por organizacao
- Identificar e substituir politicas `USING(true)` por logica de verificacao adequada

### Ficheiros a Editar
- Nova migracao SQL para politicas RLS
- `src/components/projects/RAGIndicator.tsx` ou `src/pages/Projects.tsx` (corrigir forwardRef warning)

## Resultado Esperado
Apos estas correccoes, a plataforma tera uma pontuacao de seguranca limpa e estara pronta para producao com isolamento de dados completo entre organizacoes.

## Estimativa
- Correccoes de seguranca: 1 sessao de implementacao
- Configuracao manual: 2 minutos no painel de autenticacao

