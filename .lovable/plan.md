

## NODIPRO — Roadmap de Melhorias Estratégicas

Análise extensa e bem fundamentada. Concordo com a maioria das propostas. Vou organizar num roadmap faseado de implementação.

---

### Avaliação Rápida do Estado Actual

**Já existe na plataforma** (ajustar, não reconstruir):
- Multicaixa Reference (mas só por referência manual, não Express/TPA)
- PWA com offline básico (mem://technical/mobile-pwa-strategy)
- Chatbot NODIBot com Gemini e acesso a dados via RLS (mem://features/nodibot-ai-assistant)
- Procurement básico (planos, contratos, fornecedores)
- KPIs e EVM (mas não alimentam alertas preditivos)
- 11 templates de relatórios

**Lacunas confirmadas**:
- Sem Multicaixa Express/TPA real, sem multi-moeda, sem API pública
- Sem capacity planning nem timesheets
- Sem M&A formal (OCDE-CAD), sem gestão de activos, sem LMS
- Chatbot é read-only (não gera relatórios nem executa acções)

---

### Roadmap Proposto (4 Fases)

#### **Fase 1 — Lacunas Críticas de Mercado** (4-6 sprints)
Foco: desbloquear adopção em Angola/PALOPs.

1. **Multi-moeda com câmbio dinâmico**
   - Tabela `currencies` (AOA, USD, EUR, MZN, ZAR) + `exchange_rates` (atualização diária via edge function ou input manual)
   - Adicionar `currency` + `exchange_rate_to_base` em `budget_entries`, `disbursement_tranches`, `funding_agreements`
   - Conversão automática para moeda base da organização nos dashboards/EVM

2. **Multicaixa Express + TPA**
   - Edge function `multicaixa-express-checkout` com gateway EMIS (requer credenciais que o utilizador deverá fornecer mais tarde)
   - Webhook `multicaixa-callback` para confirmação automática
   - Manter referência manual como fallback

3. **Capacity Planning + Timesheets**
   - Tabela `time_entries` (user_id, task_id, date, hours, billable)
   - Tabela `user_capacity` (weekly_hours por utilizador)
   - UI: heatmap de alocação por equipa, alerta quando >100% antes de atribuir tarefa
   - Widget "Minhas horas esta semana" no dashboard

4. **Comparador de projectos + alertas preditivos EVM**
   - Página `/governance/benchmark` com side-by-side de SPI/CPI/progresso
   - Trigger que cria notificação quando SPI<0.85 ou CPI<0.9 por 2 semanas consecutivas

---

#### **Fase 2 — Diferenciação Funcional** (4-6 sprints)

5. **NODIBot Action-Capable**
   - Adicionar tool-calling ao edge function `platform-chatbot` (gerar PDF, criar tarefa, exportar relatório)
   - Comandos NL: "qual o burn rate do projecto X?", "exporta relatório mensal do projecto Y"
   - Streaming markdown já existe — adicionar acções estruturadas

6. **Risk Heatmap Agregado + Riscos Cruzados**
   - Coluna `affects_projects` (uuid[]) em `risks`
   - Dashboard executivo: matriz 5x5 (probabilidade x impacto) agregada por portfólio

7. **Stakeholder Engagement Plan**
   - Tabela `stakeholder_communications` (stakeholder_id, frequency, channel, owner, next_due, last_contact, status)
   - Vista calendário + alertas para comunicações em atraso

8. **Report Builder drag-and-drop**
   - UI tipo "blocos" (KPI card, tabela, gráfico, texto) que o utilizador arrasta
   - Salva como template em `report_templates` com `layout_json`
   - Templates AfDB e IFAD adicionados aos pré-existentes

---

#### **Fase 3 — Novos Módulos Estratégicos** (6-8 sprints)

9. **Monitorização & Avaliação (M&A) OCDE-CAD**
   - Tabelas `evaluations` (tipo: midterm/final/expost), `evaluation_criteria` (5 critérios CAD), `evaluation_findings`
   - Workflow formal: TOR → recolha → análise → relatório → resposta da gestão

10. **Gestão de Activos e Inventário**
    - Tabelas `assets`, `asset_movements`, `asset_depreciation`
    - QR codes para identificação física, transferências entre projectos com aprovação

11. **e-Procurement Avançado**
    - Estender módulo actual: `tenders` (publicação), `tender_proposals` (recepção), `evaluation_scorecards` (técnica + financeira)
    - Workflow de adjudicação documentada com trilho de auditoria

12. **HR-P (Recursos Humanos de Projecto)**
    - Tabelas `consultants`, `tor_documents`, `consultant_contracts`, `performance_evaluations`
    - Diferente de `team_members`: orientado a recursos externos contratados

---

#### **Fase 4 — Expansão e Ecossistema** (longo prazo)

13. **API Pública REST + Webhooks**
    - Edge functions `/api/v1/{projects,tasks,budget}` com autenticação por API key (`api_keys` table)
    - Sistema de webhooks com retries e logs (`webhook_subscriptions`, `webhook_deliveries`)
    - Documentação OpenAPI auto-gerada

14. **Conformidade Regulatória por País**
    - Configuração `country_compliance_configs` por jurisdição
    - Conector SIGFE (Angola) e e-SISTAFE (Moçambique) — adapters específicos
    - Templates de declarações fiscais por país

15. **Offline Robusto (Service Worker + IndexedDB)**
    - Upgrade do PWA actual: cache de leituras + queue de mutations
    - Sync resolver com detecção de conflitos (last-write-wins ou manual)

16. **LMS Interno + Marketplace**
    - LMS: cursos, módulos, quizzes, certificados
    - Marketplace: templates partilhados (gratuitos/pagos) + directório de consultores

17. **Localização Profunda + Sandbox Público**
    - Adicionar Espanhol (i18n já suporta extensão)
    - Formatos de data/moeda/fiscalidade por país
    - `/demo` com dataset read-only e reset diário

---

### O Que Recomendo Começar Já

Quatro itens de **Fase 1** entregam impacto imediato e desbloqueiam vendas:

| # | Item | Esforço | Impacto |
|---|------|---------|---------|
| 1 | Multi-moeda + câmbio | Médio | Alto (doadores internacionais) |
| 2 | Capacity + Timesheets | Médio | Alto (gestão real de equipa) |
| 3 | Alertas preditivos EVM | Baixo | Médio (usa dados existentes) |
| 4 | Comparador de projectos | Baixo | Médio (governance) |

Multicaixa Express requer credenciais EMIS — pode começar mais tarde quando disponíveis.

---

### Pergunta Antes de Avançar

Preciso saber por onde quer começar para evitar implementar tudo de uma vez (seria semanas de trabalho). Sugiro escolher entre:

- **Opção A**: Implementar os 4 itens de impacto rápido da Fase 1 agora
- **Opção B**: Começar apenas pelo multi-moeda (base para muitos outros módulos)
- **Opção C**: Salvar este roadmap como documento (`/mnt/documents/NODIPRO_Roadmap.md`) e decidir item-a-item nas próximas sessões
- **Opção D**: Outro módulo específico da lista que considere prioritário

