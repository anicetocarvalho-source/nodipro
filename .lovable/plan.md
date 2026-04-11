

## Análise de Gaps — Plataforma de Referência para Instituições Públicas e Organizações Internacionais

### O que já existe (sólido)

A plataforma já cobre os módulos fundamentais: Gestão de Projectos, Portfólios, Programas, Quadro Lógico, Teoria da Mudança, EVM, KPIs, Riscos, Stakeholders, Orçamentos, Aquisições, Change Requests, Documentos com Workflows, Relatórios, Governação, RBAC, Multi-tenancy e SaaS.

---

### Funcionalidades em Falta

#### 1. CRÍTICO — Gestão de Beneficiários e Resultados de Impacto
Instituições como o Banco Mundial e PNUD exigem registo e rastreamento de beneficiários (directos e indirectos), desagregados por género, idade, região. Não existe nenhum módulo de beneficiários.

**Necessário**: Tabela `beneficiaries`, ligação a projectos, indicadores de impacto social, desagregação demográfica, dashboards de impacto.

#### 2. CRÍTICO — Notificações e Alertas em Tempo Real
As notificações são estáticas (hardcoded). Não existem alertas automáticos para: tarefas atribuídas, aprovações pendentes, deadlines, desvios orçamentais, workflows de documentos, ou expirações de subscrição.

**Necessário**: Tabela `notifications`, triggers automáticos, sino de notificações funcional, notificações por email (edge function).

#### 3. CRÍTICO — Fluxo de Aprovação Orçamental Multi-nível
A feature flag `budget_approval_workflow` existe mas não está implementada. Entidades públicas precisam de aprovações hierárquicas (preparado por → verificado por → aprovado por) com assinaturas digitais.

**Necessário**: Tabela `budget_approvals` com níveis, estados e histórico, UI de aprovação no módulo de orçamento.

#### 4. IMPORTANTE — Exportação Profissional (Excel/XLSX)
O sistema exporta apenas CSV e PDF. Instituições internacionais exigem relatórios em Excel com múltiplas folhas, formatação, gráficos embebidos.

**Necessário**: Integrar biblioteca `xlsx` ou `exceljs`, gerar relatórios Excel com formatação profissional.

#### 5. IMPORTANTE — Gestão de Desembolsos e Tranches
Projectos financiados internacionalmente operam por tranches/desembolsos (1ª tranche condicionada a marcos). O módulo de desembolsos nos relatórios é apenas visualização — não existe gestão de tranches.

**Necessário**: Tabela `disbursement_tranches` (tranche, condição, estado, valor, data), ligação a marcos do projecto, dashboard de desembolsos.

#### 6. IMPORTANTE — Lições Aprendidas (Knowledge Base)
O módulo de retrospectivas é Scrum-specific. Instituições exigem um repositório transversal de Lições Aprendidas (por projecto/programa) para reutilização de conhecimento.

**Necessário**: Tabela `lessons_learned`, categorização, pesquisa, ligação a projectos e programas.

#### 7. IMPORTANTE — Log de Auditoria Completo e Exportável
O `audit_logs` existe mas é usado pontualmente. Falta: registo automático de todas as acções CRUD, exportação para conformidade, filtros avançados para auditores.

**Necessário**: Triggers automáticos nas tabelas principais, página de auditoria na interface (não apenas SuperAdmin), exportação CSV/PDF.

#### 8. MODERADO — Plano de Trabalho Anual (PTA/AWP)
Organizações públicas e ONGs trabalham com Planos de Trabalho Anuais que vinculam actividades a orçamentos e trimestres. Não existe esta abstracção.

**Necessário**: Módulo PTA com actividades planeadas por trimestre, orçamento associado, taxa de execução física vs financeira.

#### 9. MODERADO — Relatórios para Doadores (Donor Reports)
Os relatórios actuais são operacionais. Faltam templates específicos para doadores: relatório de progresso semestral, relatório financeiro por componente, relatório de resultados e indicadores (formato Banco Mundial/PNUD).

**Necessário**: Templates de relatório no formato padrão de doadores, com secções obrigatórias (contexto, progresso, desvios, recomendações, próximos passos).

#### 10. MODERADO — Gestão de Acordos e Contratos de Financiamento
O módulo de aquisições gere contratos de fornecedores, mas não contratos/acordos com financiadores (grant agreements, financing agreements). Falta o ciclo de vida: negociação → assinatura → vigência → encerramento.

**Necessário**: Tabela `funding_agreements`, ligação a financiadores e projectos, condições de desembolso, datas-chave.

#### 11. MENOR — Assinatura Electrónica / Aprovação Digital
Workflows de documentos existem mas sem assinatura digital. Para conformidade institucional, é necessário pelo menos um mecanismo de "aprovação com registo" (não necessariamente assinatura criptográfica).

**Necessário**: Registo de aprovação com timestamp, IP, user, e comentário obrigatório.

#### 12. MENOR — Internacionalização Completa (i18n)
Existem 3 locales (PT, EN, FR) mas muitas strings estão hardcoded em português na UI. Para organizações internacionais, toda a interface deve ser traduzível.

**Necessário**: Auditoria de strings hardcoded, migração para chaves i18n em todas as páginas.

---

### Prioridade de Implementação Sugerida

| Fase | Módulos | Impacto |
|---|---|---|
| **Fase 1** | Notificações em tempo real, Fluxo de aprovação orçamental, Beneficiários | Requisitos mínimos de conformidade |
| **Fase 2** | Desembolsos/Tranches, Relatórios para doadores, Exportação Excel | Capacidade de reportar a financiadores |
| **Fase 3** | Lições aprendidas, Plano de Trabalho Anual, Auditoria completa | Maturidade institucional |
| **Fase 4** | Acordos de financiamento, Assinatura digital, i18n completo | Excelência e internacionalização |

---

### Nota Técnica

Cada fase envolve migrações SQL (tabelas, RLS, triggers), hooks React, páginas/componentes, e actualizações ao sidebar e permissões. A Fase 1 é estimada em 3-4 iterações de implementação; as restantes fases em 2-3 iterações cada.

Deseja aprovar a implementação da **Fase 1** (Notificações, Aprovação Orçamental, Beneficiários)?

