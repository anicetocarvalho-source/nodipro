import { format, differenceInDays, isPast } from "date-fns";
import { pt } from "date-fns/locale";

export type ReportType = "project" | "portfolio" | "team" | "financial" | "risk" | "kpi" | "performance";

export interface ReportMetric {
  label: string;
  value: string | number;
  subtext?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

export interface ReportTable {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

export interface ReportData {
  title: string;
  subtitle: string;
  generatedAt: string;
  organizationName: string;
  type: ReportType;
  metrics: ReportMetric[];
  tables: ReportTable[];
  recommendations?: string[];
}

// Helpers
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(value);

const formatDate = (date: string | null) =>
  date ? format(new Date(date), 'dd/MM/yyyy') : 'N/A';

const statusLabels: Record<string, string> = {
  active: 'Activo', delayed: 'Atrasado', completed: 'Concluído', on_hold: 'Em Pausa',
};

const priorityLabels: Record<string, string> = {
  high: 'Alta', medium: 'Média', low: 'Baixa',
};

const columnLabels: Record<string, string> = {
  backlog: 'Backlog', todo: 'A Fazer', in_progress: 'Em Progresso', review: 'Revisão', done: 'Concluído',
};

const now = () => format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: pt });

// ===== PROJECT STATUS =====
export function generateProjectReport(
  projects: any[], tasks: any[], team: any[], budget: any[], projectId: string | undefined, orgName: string, documents: any[] = []
): ReportData {
  const filtered = projectId && projectId !== 'all'
    ? projects.filter(p => p.id === projectId) : projects;
  const fTasks = tasks.filter(t => filtered.some(p => p.id === t.project_id));
  const fTeam = team.filter(t => filtered.some(p => p.id === t.project_id));
  const fDocs = documents.filter(d => filtered.some(p => p.id === d.project_id));

  const total = fTasks.length;
  const completed = fTasks.filter(t => t.column_id === 'done').length;
  const overdue = fTasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && t.column_id !== 'done').length;
  const totalBudget = filtered.reduce((s, p) => s + (p.budget || 0), 0);
  const totalSpent = filtered.reduce((s, p) => s + (p.spent || 0), 0);
  const avgProgress = filtered.length > 0
    ? Math.round(filtered.reduce((s, p) => s + p.progress, 0) / filtered.length) : 0;

  return {
    title: projectId && projectId !== 'all'
      ? `Relatório de Status - ${filtered[0]?.name || 'Projecto'}` : 'Relatório de Status dos Projectos',
    subtitle: 'Visão geral do estado actual dos projectos',
    generatedAt: now(), organizationName: orgName, type: "project",
    metrics: [
      { label: "Projectos", value: filtered.length, subtext: `${filtered.filter(p => p.status === 'active').length} activos` },
      { label: "Progresso Médio", value: `${avgProgress}%`, variant: avgProgress >= 50 ? "success" : "warning" },
      { label: "Tarefas Concluídas", value: `${completed}/${total}`, subtext: `${overdue} em atraso`, variant: overdue > 0 ? "danger" : "success" },
      { label: "Execução Orçamental", value: totalBudget > 0 ? `${Math.round((totalSpent / totalBudget) * 100)}%` : 'N/A', subtext: `${formatCurrency(totalSpent)} de ${formatCurrency(totalBudget)}` },
    ],
    tables: [
      {
        title: "Resumo dos Projectos",
        headers: ["Projecto", "Estado", "Progresso", "Orçamento", "Gasto", "Início", "Fim"],
        rows: filtered.map(p => [p.name, statusLabels[p.status] || p.status, `${p.progress}%`, formatCurrency(p.budget || 0), formatCurrency(p.spent || 0), formatDate(p.start_date), formatDate(p.end_date)]),
      },
      {
        title: "Distribuição de Tarefas",
        headers: ["Estado", "Quantidade", "Percentagem"],
        rows: Object.entries(
          fTasks.reduce((acc, t) => { const col = columnLabels[t.column_id] || t.column_id; acc[col] = (acc[col] || 0) + 1; return acc; }, {} as Record<string, number>)
        ).map(([status, count]) => [status, count as number, total > 0 ? `${Math.round(((count as number) / total) * 100)}%` : '0%']),
      },
      {
        title: "Documentos do Projecto",
        headers: ["Título", "Tipo", "Estado", "Fase"],
        rows: fDocs.map(d => [d.title, d.document_type || 'N/A', d.status || 'N/A', d.phase_name || 'N/A']),
      },
      {
        title: "Equipa do Projecto",
        headers: ["Nome", "Função", "Projecto"],
        rows: fTeam.map(m => {
          const project = filtered.find(p => p.id === m.project_id);
          return [m.name, m.role || 'N/A', project?.name || 'N/A'];
        }),
      },
    ],
  };
}

// ===== PORTFOLIO =====
export function generatePortfolioReport(
  projects: any[], portfolios: any[], programs: any[], tasks: any[], budget: any[], orgName: string, documents: any[] = []
): ReportData {
  const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0);
  const totalSpent = projects.reduce((s, p) => s + (p.spent || 0), 0);

  return {
    title: "Relatório de Portfólio Executivo",
    subtitle: "Visão consolidada de portfólios, programas e projectos",
    generatedAt: now(), organizationName: orgName, type: "portfolio",
    metrics: [
      { label: "Portfólios", value: portfolios.length },
      { label: "Programas", value: programs.length },
      { label: "Projectos", value: projects.length },
      { label: "Documentos", value: documents.length, subtext: `${documents.filter(d => d.status === 'approved').length} aprovados` },
      { label: "Investimento Total", value: formatCurrency(totalBudget), subtext: `${formatCurrency(totalSpent)} executado` },
    ],
    tables: [
      {
        title: "Portfólios",
        headers: ["Nome", "Estado", "Programas", "Projectos", "Orçamento Alocado"],
        rows: portfolios.map(pf => {
          const pfPrograms = programs.filter(pr => pr.portfolio_id === pf.id);
          const pfProjects = projects.filter(p => pfPrograms.some(pr => pr.id === p.program_id));
          return [pf.name, pf.status, pfPrograms.length, pfProjects.length, formatCurrency(pfProjects.reduce((s, p) => s + (p.budget || 0), 0))];
        }),
      },
      {
        title: "Programas",
        headers: ["Programa", "Portfólio", "Estado", "Projectos", "Início", "Fim"],
        rows: programs.map(pr => {
          const portfolio = portfolios.find(pf => pf.id === pr.portfolio_id);
          return [pr.name, portfolio?.name || 'N/A', pr.status, projects.filter(p => p.program_id === pr.id).length, formatDate(pr.start_date), formatDate(pr.end_date)];
        }),
      },
      {
        title: "Projectos por Estado",
        headers: ["Estado", "Quantidade", "Percentagem", "Orçamento"],
        rows: Object.entries(
          projects.reduce((acc, p) => {
            const s = statusLabels[p.status] || p.status;
            if (!acc[s]) acc[s] = { count: 0, budget: 0 };
            acc[s].count++; acc[s].budget += p.budget || 0;
            return acc;
          }, {} as Record<string, { count: number; budget: number }>)
        ).map(([status, d]: [string, any]) => [status, d.count, `${Math.round((d.count / Math.max(projects.length, 1)) * 100)}%`, formatCurrency(d.budget)]),
      },
    ],
  };
}

// ===== TEAM =====
export function generateTeamReport(projects: any[], tasks: any[], team: any[], orgName: string): ReportData {
  const assigneeStats = tasks.reduce((acc, t) => {
    const name = t.assignee_name || 'Não Atribuído';
    if (!acc[name]) acc[name] = { total: 0, completed: 0, overdue: 0, inProgress: 0 };
    acc[name].total++;
    if (t.column_id === 'done') acc[name].completed++;
    if (t.column_id === 'in_progress') acc[name].inProgress++;
    if (t.due_date && isPast(new Date(t.due_date)) && t.column_id !== 'done') acc[name].overdue++;
    return acc;
  }, {} as Record<string, { total: number; completed: number; overdue: number; inProgress: number }>);

  const completedAll = tasks.filter(t => t.column_id === 'done').length;

  return {
    title: "Relatório de Desempenho da Equipa",
    subtitle: "Análise de produtividade e alocação de recursos",
    generatedAt: now(), organizationName: orgName, type: "team",
    metrics: [
      { label: "Membros da Equipa", value: team.length },
      { label: "Tarefas Atribuídas", value: tasks.filter(t => t.assignee_name).length },
      { label: "Taxa de Conclusão", value: `${tasks.length > 0 ? Math.round((completedAll / tasks.length) * 100) : 0}%` },
      { label: "Tarefas Não Atribuídas", value: tasks.filter(t => !t.assignee_name).length, variant: tasks.filter(t => !t.assignee_name).length > 0 ? "warning" : "success" },
    ],
    tables: [
      {
        title: "Desempenho por Membro",
        headers: ["Membro", "Total Tarefas", "Concluídas", "Em Progresso", "Em Atraso", "Taxa Conclusão"],
        rows: Object.entries(assigneeStats)
          .sort((a, b) => (b[1] as any).total - (a[1] as any).total)
          .map(([name, s]: [string, any]) => [name, s.total, s.completed, s.inProgress, s.overdue, `${s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0}%`]),
      },
      {
        title: "Membros por Projecto",
        headers: ["Projecto", "Nº Membros", "Membros e Funções"],
        rows: projects.map(p => {
          const pt = team.filter(t => t.project_id === p.id);
          return [p.name, pt.length, pt.map(t => `${t.name} (${t.role || 'N/A'})`).join(', ') || 'Nenhum'];
        }),
      },
    ],
  };
}

// ===== FINANCIAL =====
export function generateFinancialReport(projects: any[], budget: any[], orgName: string): ReportData {
  const totalPlanned = budget.reduce((s, b) => s + b.planned_amount, 0);
  const totalActual = budget.reduce((s, b) => s + b.actual_amount, 0);
  const variance = totalPlanned - totalActual;
  const execRate = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0;

  const byCategory = budget.reduce((acc, b) => {
    const cat = (b.cost_categories as any)?.name || 'Sem Categoria';
    if (!acc[cat]) acc[cat] = { planned: 0, actual: 0 };
    acc[cat].planned += b.planned_amount; acc[cat].actual += b.actual_amount;
    return acc;
  }, {} as Record<string, { planned: number; actual: number }>);

  const byProject = budget.reduce((acc, b) => {
    const project = projects.find(p => p.id === b.project_id);
    const name = project?.name || 'Desconhecido';
    if (!acc[name]) acc[name] = { planned: 0, actual: 0, entries: 0 };
    acc[name].planned += b.planned_amount; acc[name].actual += b.actual_amount; acc[name].entries++;
    return acc;
  }, {} as Record<string, { planned: number; actual: number; entries: number }>);

  return {
    title: "Relatório Financeiro",
    subtitle: "Análise de execução orçamental e variações",
    generatedAt: now(), organizationName: orgName, type: "financial",
    metrics: [
      { label: "Orçamento Planeado", value: formatCurrency(totalPlanned) },
      { label: "Valor Executado", value: formatCurrency(totalActual) },
      { label: "Variação", value: formatCurrency(Math.abs(variance)), subtext: variance >= 0 ? 'Abaixo do planeado' : 'Acima do planeado', variant: variance >= 0 ? "success" : "danger" },
      { label: "Taxa de Execução", value: `${execRate}%`, variant: execRate > 100 ? "danger" : execRate >= 50 ? "success" : "warning" },
    ],
    tables: [
      {
        title: "Execução por Categoria",
        headers: ["Categoria", "Planeado", "Executado", "Variação", "% Execução"],
        rows: Object.entries(byCategory).sort((a, b) => (b[1] as any).planned - (a[1] as any).planned)
          .map(([cat, d]: [string, any]) => [cat, formatCurrency(d.planned), formatCurrency(d.actual), formatCurrency(Math.abs(d.planned - d.actual)), d.planned > 0 ? `${Math.round((d.actual / d.planned) * 100)}%` : 'N/A']),
      },
      {
        title: "Execução por Projecto",
        headers: ["Projecto", "Entradas", "Planeado", "Executado", "Variação", "% Execução"],
        rows: Object.entries(byProject).sort((a, b) => (b[1] as any).planned - (a[1] as any).planned)
          .map(([name, d]: [string, any]) => [name, d.entries, formatCurrency(d.planned), formatCurrency(d.actual), formatCurrency(Math.abs(d.planned - d.actual)), d.planned > 0 ? `${Math.round((d.actual / d.planned) * 100)}%` : 'N/A']),
      },
    ],
  };
}

// ===== RISK =====
export function generateRiskReport(projects: any[], tasks: any[], budget: any[], orgName: string, documents: any[] = []): ReportData {
  const delayedProjects = projects.filter(p => p.status === 'delayed');
  const overdueTasks = tasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && t.column_id !== 'done');
  const overBudget = projects.filter(p => p.budget && p.spent && p.spent > p.budget);
  const totalRisks = delayedProjects.length + overdueTasks.length + overBudget.length;
  const pendingDocs = documents.filter(d => ['pending_review', 'in_review'].includes(d.status));

  return {
    title: "Relatório de Riscos Activos",
    subtitle: "Identificação e análise de riscos nos projectos",
    generatedAt: now(), organizationName: orgName, type: "risk",
    metrics: [
      { label: "Riscos Identificados", value: totalRisks, variant: totalRisks > 5 ? "danger" : totalRisks > 0 ? "warning" : "success" },
      { label: "Projectos Atrasados", value: delayedProjects.length, variant: delayedProjects.length > 0 ? "danger" : "success" },
      { label: "Tarefas em Atraso", value: overdueTasks.length, variant: overdueTasks.length > 0 ? "warning" : "success" },
      { label: "Orçamentos Excedidos", value: overBudget.length, variant: overBudget.length > 0 ? "danger" : "success" },
    ],
    tables: [
      {
        title: "Projectos com Atraso",
        headers: ["Projecto", "Progresso", "Data Fim Prevista", "Orçamento", "Gasto"],
        rows: delayedProjects.map(p => [p.name, `${p.progress}%`, formatDate(p.end_date), formatCurrency(p.budget || 0), formatCurrency(p.spent || 0)]),
      },
      {
        title: "Tarefas em Atraso",
        headers: ["Tarefa", "Projecto", "Prioridade", "Data Limite", "Dias em Atraso"],
        rows: overdueTasks.map(t => {
          const proj = projects.find(p => p.id === t.project_id);
          return [t.title, proj?.name || 'N/A', priorityLabels[t.priority] || t.priority, formatDate(t.due_date), differenceInDays(new Date(), new Date(t.due_date))];
        }).sort((a, b) => (b[4] as number) - (a[4] as number)),
      },
      {
        title: "Projectos com Orçamento Excedido",
        headers: ["Projecto", "Orçamento", "Gasto", "Excesso", "% Excesso"],
        rows: overBudget.map(p => {
          const excess = (p.spent || 0) - (p.budget || 0);
          return [p.name, formatCurrency(p.budget || 0), formatCurrency(p.spent || 0), formatCurrency(excess), p.budget > 0 ? `${Math.round((excess / p.budget) * 100)}%` : '0%'];
        }),
      },
    ],
    recommendations: [
      ...(delayedProjects.length > 0 ? [`Rever planeamento de ${delayedProjects.length} projecto(s) com status de atraso.`] : []),
      ...(overdueTasks.length > 0 ? [`Priorizar resolução de ${overdueTasks.length} tarefa(s) com prazo ultrapassado.`] : []),
      ...(overBudget.length > 0 ? [`Auditar gastos de ${overBudget.length} projecto(s) com orçamento excedido.`] : []),
      ...(pendingDocs.length > 0 ? [`${pendingDocs.length} documento(s) aguardam aprovação — considere priorizar a revisão.`] : []),
    ],
  };
}

// ===== KPIs =====
export function generateKPIReport(
  projects: any[], tasks: any[], budget: any[], team: any[], orgName: string, documents: any[] = []
): ReportData {
  const totalP = projects.length;
  const activeP = projects.filter(p => p.status === 'active').length;
  const completedP = projects.filter(p => p.status === 'completed').length;
  const totalT = tasks.length;
  const completedT = tasks.filter(t => t.column_id === 'done').length;
  const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0);
  const totalSpent = projects.reduce((s, p) => s + (p.spent || 0), 0);
  const avgProgress = totalP > 0 ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / totalP) : 0;
  const delayedP = projects.filter(p => p.status === 'delayed').length;

  return {
    title: "Relatório de KPIs",
    subtitle: "Indicadores-chave de desempenho da organização",
    generatedAt: now(), organizationName: orgName, type: "kpi",
    metrics: [
      { label: "Conclusão de Projectos", value: `${totalP > 0 ? Math.round((completedP / totalP) * 100) : 0}%` },
      { label: "Conclusão de Tarefas", value: `${totalT > 0 ? Math.round((completedT / totalT) * 100) : 0}%` },
      { label: "Execução Orçamental", value: `${totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%` },
      { label: "Progresso Médio", value: `${avgProgress}%` },
    ],
    tables: [
      {
        title: "KPIs de Projectos",
        headers: ["Indicador", "Valor", "Meta", "Estado"],
        rows: [
          ["Projectos Activos", activeP, '-', activeP > 0 ? '✅ Em andamento' : '⚠️ Nenhum activo'],
          ["Projectos Concluídos", completedP, '-', completedP > 0 ? '✅' : '-'],
          ["Progresso Médio", `${avgProgress}%`, '100%', avgProgress >= 50 ? '✅ No caminho' : '⚠️ Abaixo do esperado'],
          ["Projectos Atrasados", delayedP, '0', delayedP === 0 ? '✅' : '🔴 Atenção'],
        ],
      },
      {
        title: "KPIs de Tarefas",
        headers: ["Indicador", "Valor", "Meta", "Estado"],
        rows: [
          ["Total de Tarefas", totalT, '-', '-'],
          ["Tarefas Concluídas", completedT, '-', '-'],
          ["Taxa de Conclusão", `${totalT > 0 ? Math.round((completedT / totalT) * 100) : 0}%`, '100%', completedT === totalT && totalT > 0 ? '✅' : '🔵 Em progresso'],
          ["Produtividade (Tarefas/Membro)", team.length > 0 ? (completedT / team.length).toFixed(1) : 'N/A', '-', '-'],
        ],
      },
      {
        title: "KPIs Financeiros",
        headers: ["Indicador", "Valor", "Meta", "Estado"],
        rows: [
          ["Orçamento Total", formatCurrency(totalBudget), '-', '-'],
          ["Total Executado", formatCurrency(totalSpent), '-', '-'],
          ["Taxa de Execução", `${totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%`, '100%', totalSpent <= totalBudget ? '✅' : '🔴 Excedido'],
          ["Variação", formatCurrency(Math.abs(totalBudget - totalSpent)), 'Kz 0', totalSpent <= totalBudget ? '✅ Dentro' : '🔴 Acima'],
        ],
      },
      {
        title: "KPIs Documentais",
        headers: ["Indicador", "Valor", "Meta", "Estado"],
        rows: [
          ["Total Documentos", documents.length, '-', '-'],
          ["Aprovados", documents.filter(d => d.status === 'approved').length, '-', documents.filter(d => d.status === 'approved').length > 0 ? '✅' : '-'],
          ["Pendentes Revisão", documents.filter(d => ['pending_review', 'in_review'].includes(d.status)).length, '0', documents.filter(d => ['pending_review', 'in_review'].includes(d.status)).length === 0 ? '✅' : '🔵 Em progresso'],
          ["Em Rascunho", documents.filter(d => d.status === 'draft').length, '0', documents.filter(d => d.status === 'draft').length === 0 ? '✅' : '⚠️ A completar'],
        ],
      },
    ],
  };
}

// ===== PERFORMANCE & DELAY IMPACT =====
export function generatePerformanceReport(
  projects: any[], tasks: any[], budget: any[], orgName: string
): ReportData {
  const today = new Date();

  const analysis = projects.map(p => {
    const pTasks = tasks.filter(t => t.project_id === p.id);
    const total = pTasks.length;
    const completed = pTasks.filter(t => t.column_id === 'done').length;
    const overdue = pTasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && t.column_id !== 'done').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    let deviation = 0;
    if (p.end_date && p.start_date) {
      const dur = differenceInDays(new Date(p.end_date), new Date(p.start_date));
      const elapsed = differenceInDays(today, new Date(p.start_date));
      const expected = dur > 0 ? Math.min(Math.round((elapsed / dur) * 100), 100) : 0;
      deviation = p.progress - expected;
    }

    return { name: p.name, status: p.status, progress: p.progress, totalTasks: total, completedTasks: completed, overdueTasks: overdue, completionRate: rate, scheduleDeviation: deviation, budget: p.budget || 0, spent: p.spent || 0 };
  });

  const allOverdue = tasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && t.column_id !== 'done');
  const avgCompl = analysis.length > 0 ? Math.round(analysis.reduce((s, p) => s + p.completionRate, 0) / analysis.length) : 0;
  const avgDev = analysis.length > 0 ? Math.round(analysis.reduce((s, p) => s + p.scheduleDeviation, 0) / analysis.length) : 0;
  const onTrack = analysis.filter(p => p.scheduleDeviation >= 0).length;

  const overdueDetails = allOverdue.map(t => {
    const proj = projects.find(p => p.id === t.project_id);
    return {
      title: t.title, project: proj?.name || 'N/A', priority: t.priority,
      dueDate: t.due_date, daysOverdue: differenceInDays(today, new Date(t.due_date)),
      assignee: t.assignee_name || 'Não Atribuído', status: columnLabels[t.column_id] || t.column_id,
    };
  }).sort((a, b) => b.daysOverdue - a.daysOverdue);

  return {
    title: "Análise de Desempenho e Impacto de Atrasos",
    subtitle: "Avaliação detalhada do desempenho, desvios de cronograma e impacto operacional",
    generatedAt: now(), organizationName: orgName, type: "performance",
    metrics: [
      { label: "Taxa Média de Conclusão", value: `${avgCompl}%`, variant: avgCompl >= 60 ? "success" : avgCompl >= 30 ? "warning" : "danger" },
      { label: "Desvio Médio Cronograma", value: `${avgDev > 0 ? '+' : ''}${avgDev}%`, subtext: avgDev >= 0 ? 'Adiantado' : 'Atrasado', variant: avgDev >= 0 ? "success" : "danger" },
      { label: "Projectos no Prazo", value: `${onTrack}/${projects.length}`, variant: onTrack === projects.length ? "success" : "warning" },
      { label: "Tarefas em Atraso", value: allOverdue.length, variant: allOverdue.length === 0 ? "success" : allOverdue.length > 5 ? "danger" : "warning" },
    ],
    tables: [
      {
        title: "Desempenho por Projecto",
        headers: ["Projecto", "Estado", "Progresso", "Tarefas (C/T)", "Em Atraso", "Desvio", "Taxa Conclusão"],
        rows: analysis.sort((a, b) => a.scheduleDeviation - b.scheduleDeviation)
          .map(p => [p.name, statusLabels[p.status] || p.status, `${p.progress}%`, `${p.completedTasks}/${p.totalTasks}`, p.overdueTasks, `${p.scheduleDeviation > 0 ? '+' : ''}${p.scheduleDeviation}%`, `${p.completionRate}%`]),
      },
      {
        title: "Tarefas em Atraso — Detalhe",
        headers: ["Tarefa", "Projecto", "Responsável", "Prioridade", "Data Limite", "Dias Atraso", "Estado"],
        rows: overdueDetails.map(t => [t.title, t.project, t.assignee, priorityLabels[t.priority] || t.priority, formatDate(t.dueDate), t.daysOverdue, t.status]),
      },
      {
        title: "Impacto Orçamental dos Atrasos",
        headers: ["Projecto", "Orçamento", "Gasto", "% Execução", "Estado", "Risco Financeiro"],
        rows: analysis.filter(p => p.overdueTasks > 0 || p.scheduleDeviation < 0).map(p => {
          const exec = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0;
          return [p.name, formatCurrency(p.budget), formatCurrency(p.spent), `${exec}%`, statusLabels[p.status] || p.status, exec > 90 ? 'Alto' : exec > 70 ? 'Médio' : 'Baixo'];
        }),
      },
    ],
    recommendations: [
      ...(analysis.filter(p => p.scheduleDeviation < -20).length > 0 ? [`${analysis.filter(p => p.scheduleDeviation < -20).length} projecto(s) com desvio >20% requerem revisão imediata do cronograma.`] : []),
      ...(overdueDetails.filter(t => t.priority === 'high').length > 0 ? [`${overdueDetails.filter(t => t.priority === 'high').length} tarefa(s) de alta prioridade em atraso devem ser repriorizadas urgentemente.`] : []),
      ...(analysis.filter(p => p.completionRate < 25 && p.totalTasks > 0).length > 0 ? [`${analysis.filter(p => p.completionRate < 25 && p.totalTasks > 0).length} projecto(s) com taxa <25% necessitam de intervenção.`] : []),
      avgDev < 0 ? `O desvio médio é de ${avgDev}%. Considere rever a alocação de recursos.` : 'O desempenho geral está dentro dos parâmetros esperados.',
    ],
  };
}
