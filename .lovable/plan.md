

# Plano Estrategico: Elevar o NODIPRO ao Nivel de Instituicoes Internacionais

## Contexto da Analise

Apos uma auditoria completa ao sistema, identifiquei **3 categorias de gaps criticos** que separam o NODIPRO dos padroes exigidos por instituicoes como o Banco Mundial, UNDP, AfDB ou USAID. Estas organizacoes utilizam ferramentas como MS Project Server, Primavera P6, ou plataformas proprias que cumprem normas rigorosas de prestacao de contas e transparencia.

---

## Categoria 1: Modulos com Dados Estaticos (Problema Critico)

Varios modulos existem apenas como interface visual com dados "hardcoded" -- nao persistem nem leem dados reais da base de dados. Isto e inaceitavel para producao.

### 1.1 Riscos e Licoes Aprendidas (`Risks.tsx`)
- **Estado actual**: Dados estaticos em arrays JavaScript. Sem tabelas na base de dados.
- **Accao**: Criar tabelas `risks`, `risk_responses`, `lessons_learned` com RLS. Implementar CRUD completo com formularios, filtros e ligacao a projectos.
- **Relevancia**: O Banco Mundial exige um Registo de Riscos formal em todos os projectos financiados (Risk Register conforme PMI/PRINCE2).

### 1.2 KPIs e Indicadores (`KPI.tsx`)
- **Estado actual**: Dados estaticos. Nenhum KPI e calculado a partir de dados reais.
- **Accao**: Criar tabelas `kpi_definitions`, `kpi_targets`, `kpi_measurements`. Ligar a projectos e organizacoes. Calcular metricas a partir de dados reais (tarefas, orcamento, cronograma).
- **Relevancia**: Frameworks de Resultados (Results Frameworks) sao obrigatorios em projectos financiados internacionalmente.

### 1.3 Equipa (`Team.tsx`)
- **Estado actual**: Dados estaticos. Nao utiliza a tabela `team_members` existente.
- **Accao**: Ligar a dados reais. Agregar tarefas, carga de trabalho e alocacao a partir da base de dados.

### 1.4 Configuracoes (`Settings.tsx`)
- **Estado actual**: Nao persiste nenhuma configuracao. O botao "Guardar" mostra um toast mas nao salva nada.
- **Accao**: Criar tabela `user_settings` e persistir preferencias.

---

## Categoria 2: Funcionalidades em Falta (Exigidas por Instituicoes)

### 2.1 Quadro Logico (Logical Framework / LogFrame)
- **O que e**: Ferramenta padrao do Banco Mundial que liga Objectivos -> Resultados -> Actividades -> Indicadores -> Meios de Verificacao -> Pressupostos.
- **Accao**: Criar modulo `LogFrame` com tabelas `logframe_levels`, `logframe_indicators`, `logframe_assumptions`. Vista em matriz hierarquica.
- **Impacto**: Sem LogFrame, nenhuma instituicao internacional consideraria a plataforma.

### 2.2 Teoria da Mudanca (Theory of Change)
- **O que e**: Visualizacao do caminho causal entre actividades e impacto final.
- **Accao**: Criar visualizacao interactiva da cadeia de resultados ligada ao LogFrame.

### 2.3 Gestao de Aquisicoes / Procurement
- **O que e**: Rastreio de processos de aquisicao (concursos, contratos, fornecedores) -- obrigatorio em projectos financiados.
- **Accao**: Criar tabelas `procurement_plans`, `procurement_items`, `contracts`, `suppliers`.

### 2.4 Gestao de Stakeholders
- **O que e**: Registo e classificacao de partes interessadas com analise de poder/interesse.
- **Accao**: Criar tabela `stakeholders` com campos de influencia, interesse e estrategia de envolvimento. Matriz poder/interesse.

### 2.5 Gestao de Mudancas (Change Requests)
- **O que e**: Processo formal para registar, avaliar e aprovar alteracoes ao escopo, cronograma ou orcamento.
- **Accao**: Criar tabela `change_requests` com fluxo de aprovacao (solicitado -> em analise -> aprovado/rejeitado).

### 2.6 Earned Value Management (EVM)
- **O que e**: Metodo padrao para medir desempenho do projecto cruzando cronograma e custo. Metricas: CPI, SPI, EAC, ETC, VAC.
- **Accao**: Calcular automaticamente a partir dos dados de tarefas e orcamento existentes. Apresentar em dashboard dedicado.

### 2.7 Multi-idioma Real
- **Estado actual**: A interface esta em Portugues mas nao existe i18n. A opcao de idioma nas Configuracoes nao funciona.
- **Accao**: Implementar i18n com `react-intl` ou `i18next`. Suportar Portugues, Ingles e Frances (as 3 linguas mais usadas em organizacoes internacionais em Africa).

### 2.8 Trilha de Auditoria Completa
- **Estado actual**: Existe tabela `audit_logs` mas a escrita e limitada.
- **Accao**: Garantir que TODAS as accoes criticas (criar, editar, eliminar projectos/tarefas/orcamento/documentos) geram registos de auditoria automaticos via triggers SQL.

---

## Categoria 3: Melhorias de Qualidade Professional

### 3.1 Exportacao PDF Profissional
- **Estado actual**: Os relatorios sao gerados com dados reais mas a exportacao e limitada.
- **Accao**: Implementar exportacao PDF via edge function com formatacao institucional (cabecalho com logo, tabelas formatadas, graficos, rodape com data e pagina).

### 3.2 Dashboard Executivo com Semaforos
- **Estado actual**: Dashboard funcional mas sem a linguagem visual de "semaforos" (RAG status: Red/Amber/Green) que e padrao em PMOs internacionais.
- **Accao**: Adicionar vista RAG (Red/Amber/Green) por projecto no dashboard de governacao.

### 3.3 Relatorios de Desembolso
- **Accao**: Adicionar vista de desembolsos por periodo, alinhada com os ciclos de financiamento dos doadores.

### 3.4 Baseline Management
- **O que e**: Capacidade de guardar "versoes base" do cronograma e orcamento para comparacao futura (Baseline vs Actual).
- **Accao**: Criar tabela `project_baselines` que guarda snapshots do plano original.

---

## Prioridade de Implementacao Sugerida

| Fase | Modulos | Justificacao |
|------|---------|--------------|
| 1 | Riscos (CRUD real), KPIs (dados reais), Equipa (dados reais) | Eliminar dados estaticos -- bloqueio critico |
| 2 | LogFrame + Teoria da Mudanca | Requisito #1 de instituicoes internacionais |
| 3 | EVM + Baseline Management | Diferenciador tecnico vs concorrencia |
| 4 | Procurement + Stakeholders + Change Requests | Completar o ciclo de gestao |
| 5 | i18n + Exportacao PDF profissional + Trilha de auditoria | Polimento para adopcao global |

---

## Detalhes Tecnicos

### Novas tabelas de base de dados necessarias (resumo):
- `risks` (project_id, title, probability, impact, status, owner_id, mitigation, response_plan, category, residual_risk)
- `risk_responses` (risk_id, action, responsible_id, due_date, status)
- `lessons_learned` (project_id, title, description, category, tags, created_by)
- `kpi_definitions` (organization_id, name, formula, unit, frequency, target)
- `kpi_measurements` (kpi_id, project_id, value, period, measured_by)
- `logframe_levels` (project_id, level_type, narrative, position, parent_id)
- `logframe_indicators` (level_id, name, baseline, target, means_of_verification)
- `stakeholders` (project_id, name, organization, role, influence, interest, strategy)
- `change_requests` (project_id, title, description, impact, status, requested_by, approved_by)
- `procurement_plans` (project_id, description, method, estimated_value, status)
- `contracts` (procurement_id, supplier, value, start_date, end_date, status)
- `project_baselines` (project_id, baseline_date, schedule_snapshot, budget_snapshot)
- `user_settings` (user_id, preferences JSONB)

### Todas as tabelas terao:
- RLS baseada em `organization_id` (padrao existente)
- Politicas INSERT/UPDATE/DELETE via `has_permission()`
- Publicacao em `supabase_realtime` onde relevante
- Triggers de auditoria automatica

### Frontend:
- Reutilizacao dos padroes existentes (hooks React Query, modais com Radix, formularios com react-hook-form + Zod)
- Componentes de visualizacao (matrizes, graficos EVM) usando Recharts

---

## Resultado Esperado

Com estas melhorias, o NODIPRO passaria de uma plataforma de gestao de projectos generica para um **sistema de gestao de programas e projectos de nivel institucional**, comparavel a:
- **Primavera P6** (gestao de cronograma e EVM)
- **DevResults** (M&E e LogFrames para desenvolvimento internacional)
- **Airtable + Asana** (flexibilidade operacional)

...mas com a vantagem de ser **localizado para o contexto Angolano/Lusofono** e **desenhado para multi-tenancy institucional**.

