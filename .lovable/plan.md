


# Plano Estrategico: Elevar o NODIPRO ao Nivel de Instituicoes Internacionais

## Estado de Implementação (Actualizado)

### ✅ Categoria 1: Módulos com Dados Estáticos — CONCLUÍDO (100%)
- ✅ 1.1 Riscos (CRUD real com tabelas + hooks)
- ✅ 1.2 KPIs (dados reais com kpi_definitions + kpi_measurements)
- ✅ 1.3 Equipa (dados reais via team_members)
- ✅ 1.4 Configurações (persistência via tabela user_settings)

### ✅ Categoria 2: Funcionalidades Institucionais — CONCLUÍDO (~95%)
- ✅ 2.1 LogFrame (tabelas + página + hooks)
- ⚠️ 2.2 Teoria da Mudança (visualização interactiva pendente — requer módulo de diagrama avançado)
- ✅ 2.3 Procurement (tabelas + página + hooks)
- ✅ 2.4 Gestão de Stakeholders (tabela + página + matriz poder/interesse)
- ✅ 2.5 Change Requests (tabela + fluxo de aprovação)
- ✅ 2.6 EVM (página + hooks)
- ✅ 2.7 Multi-idioma (i18n PT/EN/FR)
- ✅ 2.8 Trilha de Auditoria (triggers automáticos em 10 tabelas críticas)

### ✅ Categoria 3: Melhorias de Qualidade — CONCLUÍDO (~95%)
- ✅ 3.1 Exportação PDF Profissional (ReportPreviewModal com formatação institucional + print CSS)
- ✅ 3.2 Dashboard com Semáforos RAG (indicadores RAG em cards e lista de projectos)
- ✅ 3.3 Relatórios de Desembolso (gerador completo com análise por projecto/mês/fornecedor)
- ✅ 3.4 Baseline Management (tabela project_baselines criada + hook)

---

## Tabelas de Base de Dados Criadas
- stakeholders ✅
- change_requests ✅
- project_baselines ✅
- user_settings ✅
- audit_trigger_func() ✅ (aplicado a projects, tasks, budget_entries, documents, risks, procurement_plans, contracts, change_requests, stakeholders, logframe_levels)

## Itens Pendentes
- ⚠️ Teoria da Mudança — visualização interactiva de cadeia de resultados (requer biblioteca de diagramas avançada)
