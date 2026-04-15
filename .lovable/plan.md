

## Plano: Documento Word (.docx) — Descrição Completa da Plataforma NODIPRO

### Objectivo
Gerar um documento Word profissional e completo com a descrição da plataforma NODIPRO e todos os seus módulos, pronto para incluir numa apresentação ou enviar a stakeholders.

### Estrutura do Documento

1. **Capa** — Logo, nome da plataforma, tagline, data
2. **Sumário Executivo** — Visão geral da plataforma (SaaS multi-tenant, 3 tipos de entidade, i18n PT/EN/FR)
3. **Arquitectura e Tecnologia** — Multi-tenancy, RBAC granular (6 roles), SaaS com feature gating, dashboards diferenciados
4. **Onboarding e Configuração** — Wizard de 5 passos, planos de subscrição
5. **Módulos da Plataforma** (secção principal, ~20 módulos):
   - **Planeamento**: Dashboard, Governança Executiva, Projectos (Kanban/Gantt/Lista/Scrum), Portfólios e Programas
   - **Operações**: Metodologias, Quadro Lógico e Teoria da Mudança, KPIs, Gestão de Valor Ganho (EVM), Aquisições, Riscos, Stakeholders, Beneficiários, Controlo de Alterações, Equipa
   - **Gestão**: Documentos (com workflow), Comunicação, Orçamento (com aprovações), Desembolsos, Relatórios (11 templates incl. Banco Mundial/PNUD), Lições Aprendidas, Plano de Trabalho Anual, Auditoria, Acordos de Financiamento
6. **Funcionalidades Transversais** — Aprovações digitais, notificações automáticas, pesquisa global, chatbot, exportação Excel/PDF, audit trail
7. **Backoffice SaaS (Super Admin)** — Gestão de organizações, subscrições, pagamentos, planos, métricas, auditoria global
8. **Segurança e Conformidade** — RLS, RBAC, audit triggers, isolamento de dados por organização
9. **Internacionalização** — PT, EN, FR

### Implementação Técnica

- Usar skill `docx` com `docx-js` (Node.js) para gerar o ficheiro
- Estilos profissionais: headings hierárquicos, tabelas com bordas, cores institucionais
- Fonte Arial, US Letter, margens de 1 polegada
- Output em `/mnt/documents/NODIPRO_Descricao_Plataforma.docx`
- QA via conversão a PDF e validação visual

### Ficheiros Envolvidos
- Nenhum ficheiro do projecto é alterado
- Script temporário em `/tmp/` para gerar o .docx
- Output final em `/mnt/documents/`

