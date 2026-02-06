import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface IntegrityCheck {
  id: string;
  severity: "info" | "warning" | "error";
  module: "budget" | "tasks" | "documents" | "team";
  title: string;
  description: string;
  actionLabel?: string;
  actionRoute?: string;
}

export interface ProjectCrossModuleData {
  // Budget
  budgetPlanned: number;
  budgetActual: number;
  budgetPending: number;
  budgetEntriesCount: number;
  budgetExecutionRate: number;
  hasBudgetOverrun: boolean;

  // Documents
  totalDocuments: number;
  pendingDocuments: number;
  approvedDocuments: number;
  draftDocuments: number;

  // Tasks
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  inProgressTasks: number;
  taskCompletionRate: number;

  // Team
  teamSize: number;
  unassignedTasks: number;

  // Integrity
  integrityChecks: IntegrityCheck[];
  integrityScore: number;
}

export function useProjectIntegrity(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-integrity", projectId],
    queryFn: async (): Promise<ProjectCrossModuleData> => {
      if (!projectId) throw new Error("No project ID");

      const [projectRes, tasksRes, budgetRes, docsRes, teamRes] = await Promise.all([
        supabase.from("projects").select("budget, spent, status, progress, end_date").eq("id", projectId).single(),
        supabase.from("tasks").select("id, column_id, due_date, assignee_name, priority").eq("project_id", projectId),
        supabase.from("budget_entries").select("id, planned_amount, actual_amount, status").eq("project_id", projectId),
        supabase.from("documents").select("id, status, phase_name").eq("project_id", projectId),
        supabase.from("team_members").select("id").eq("project_id", projectId),
      ]);

      const project = projectRes.data;
      const tasks = tasksRes.data || [];
      const budgetEntries = budgetRes.data || [];
      const documents = docsRes.data || [];
      const team = teamRes.data || [];

      // Budget calculations
      const budgetPlanned = budgetEntries.reduce((s, e) => s + (Number(e.planned_amount) || 0), 0);
      const budgetActual = budgetEntries.reduce((s, e) => s + (Number(e.actual_amount) || 0), 0);
      const budgetPending = budgetEntries
        .filter(e => e.status === "pending")
        .reduce((s, e) => s + (Number(e.actual_amount) || 0), 0);
      const budgetExecutionRate = budgetPlanned > 0 ? Math.round((budgetActual / budgetPlanned) * 100) : 0;
      const projectBudget = Number(project?.budget) || 0;
      const projectSpent = Number(project?.spent) || 0;
      const hasBudgetOverrun = projectBudget > 0 && projectSpent > projectBudget;

      // Task calculations
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.column_id === "done").length;
      const inProgressTasks = tasks.filter(t => t.column_id === "in_progress").length;
      const overdueTasks = tasks.filter(t => {
        if (!t.due_date || t.column_id === "done") return false;
        return new Date(t.due_date) < new Date();
      }).length;
      const unassignedTasks = tasks.filter(t => !t.assignee_name && t.column_id !== "done").length;
      const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Document calculations
      const totalDocuments = documents.length;
      const pendingDocuments = documents.filter(d => ["pending_review", "in_review"].includes(d.status)).length;
      const approvedDocuments = documents.filter(d => d.status === "approved").length;
      const draftDocuments = documents.filter(d => d.status === "draft").length;

      // Integrity checks
      const checks: IntegrityCheck[] = [];

      // Check: Project completed but has open tasks
      if (project?.status === "completed" && completedTasks < totalTasks) {
        checks.push({
          id: "completed-open-tasks",
          severity: "error",
          module: "tasks",
          title: "Projecto concluído com tarefas abertas",
          description: `${totalTasks - completedTasks} tarefa(s) ainda não estão concluídas.`,
          actionLabel: "Ver Tarefas",
          actionRoute: `/projects/${projectId}`,
        });
      }

      // Check: Budget overrun
      if (hasBudgetOverrun) {
        const excess = Math.round(((projectSpent - projectBudget) / projectBudget) * 100);
        checks.push({
          id: "budget-overrun",
          severity: "error",
          module: "budget",
          title: "Orçamento excedido",
          description: `O gasto actual excede o orçamento em ${excess}%.`,
          actionLabel: "Ver Orçamento",
          actionRoute: "/budget",
        });
      }

      // Check: Pending budget entries
      if (budgetPending > 0) {
        checks.push({
          id: "pending-budget",
          severity: "warning",
          module: "budget",
          title: "Entradas orçamentais pendentes",
          description: `${budgetEntries.filter(e => e.status === "pending").length} entrada(s) aguardam aprovação.`,
          actionLabel: "Ver Orçamento",
          actionRoute: "/budget",
        });
      }

      // Check: Overdue tasks
      if (overdueTasks > 0) {
        const highPriorityOverdue = tasks.filter(t =>
          t.due_date && new Date(t.due_date) < new Date() && t.column_id !== "done" && t.priority === "high"
        ).length;
        checks.push({
          id: "overdue-tasks",
          severity: highPriorityOverdue > 0 ? "error" : "warning",
          module: "tasks",
          title: "Tarefas em atraso",
          description: `${overdueTasks} tarefa(s) com prazo ultrapassado${highPriorityOverdue > 0 ? ` (${highPriorityOverdue} de alta prioridade)` : ""}.`,
          actionLabel: "Ver Tarefas",
          actionRoute: `/projects/${projectId}`,
        });
      }

      // Check: Documents pending review
      if (pendingDocuments > 0) {
        checks.push({
          id: "pending-docs",
          severity: "info",
          module: "documents",
          title: "Documentos aguardam revisão",
          description: `${pendingDocuments} documento(s) pendente(s) de aprovação.`,
          actionLabel: "Ver Documentos",
          actionRoute: "/documents",
        });
      }

      // Check: Draft documents
      if (draftDocuments > 0 && project?.progress && project.progress > 50) {
        checks.push({
          id: "draft-docs-late",
          severity: "warning",
          module: "documents",
          title: "Documentos em rascunho",
          description: `${draftDocuments} documento(s) ainda em rascunho com projecto a ${project.progress}%.`,
          actionLabel: "Ver Documentos",
          actionRoute: "/documents",
        });
      }

      // Check: Unassigned tasks
      if (unassignedTasks > 3) {
        checks.push({
          id: "unassigned-tasks",
          severity: "warning",
          module: "team",
          title: "Tarefas sem responsável",
          description: `${unassignedTasks} tarefa(s) activa(s) sem responsável atribuído.`,
          actionLabel: "Atribuir Tarefas",
          actionRoute: `/projects/${projectId}`,
        });
      }

      // Check: No team members
      if (team.length === 0 && totalTasks > 0) {
        checks.push({
          id: "no-team",
          severity: "warning",
          module: "team",
          title: "Sem equipa definida",
          description: "O projecto tem tarefas mas nenhum membro de equipa.",
          actionLabel: "Gerir Equipa",
          actionRoute: "/team",
        });
      }

      // Check: Budget execution vs progress mismatch
      if (budgetExecutionRate > 0 && project?.progress) {
        const diff = budgetExecutionRate - project.progress;
        if (diff > 30) {
          checks.push({
            id: "budget-progress-mismatch",
            severity: "warning",
            module: "budget",
            title: "Desalinhamento orçamento/progresso",
            description: `Execução orçamental (${budgetExecutionRate}%) muito acima do progresso (${project.progress}%).`,
            actionLabel: "Analisar",
            actionRoute: "/budget",
          });
        }
      }

      // Check: Project deadline approaching with low progress
      if (project?.end_date && project.progress < 70) {
        const daysRemaining = Math.ceil(
          (new Date(project.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysRemaining > 0 && daysRemaining < 14) {
          checks.push({
            id: "deadline-approaching",
            severity: "error",
            module: "tasks",
            title: "Prazo iminente com progresso baixo",
            description: `Faltam ${daysRemaining} dia(s) com apenas ${project.progress}% concluído.`,
          });
        }
      }

      // Calculate integrity score (0-100)
      const errorCount = checks.filter(c => c.severity === "error").length;
      const warningCount = checks.filter(c => c.severity === "warning").length;
      const integrityScore = Math.max(0, 100 - (errorCount * 20) - (warningCount * 10));

      return {
        budgetPlanned,
        budgetActual,
        budgetPending,
        budgetEntriesCount: budgetEntries.length,
        budgetExecutionRate,
        hasBudgetOverrun,
        totalDocuments,
        pendingDocuments,
        approvedDocuments,
        draftDocuments,
        totalTasks,
        completedTasks,
        overdueTasks,
        inProgressTasks,
        taskCompletionRate,
        teamSize: team.length,
        unassignedTasks,
        integrityChecks: checks,
        integrityScore,
      };
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });
}
