import { useEffect, useRef, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { IntegrityCheck } from "@/hooks/useProjectIntegrity";

export interface IntegrityNotification {
  id: string;
  check: IntegrityCheck;
  projectId: string;
  projectName: string;
  timestamp: Date;
  isRead: boolean;
}

const severityLabels = {
  error: "Crítico",
  warning: "Aviso",
  info: "Info",
};

const severityEmoji = {
  error: "🔴",
  warning: "🟡",
  info: "🔵",
};

export function useIntegrityNotifications() {
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<IntegrityNotification[]>([]);
  const previousChecksRef = useRef<Map<string, Set<string>>>(new Map());
  const projectNamesRef = useRef<Map<string, string>>(new Map());

  // Evaluate integrity for a single project and detect new alerts
  const evaluateProject = useCallback(async (projectId: string) => {
    try {
      const [projectRes, tasksRes, budgetRes, docsRes, teamRes] = await Promise.all([
        supabase.from("projects").select("name, budget, spent, status, progress, end_date").eq("id", projectId).single(),
        supabase.from("tasks").select("id, column_id, due_date, assignee_name, priority").eq("project_id", projectId),
        supabase.from("budget_entries").select("id, planned_amount, actual_amount, status").eq("project_id", projectId),
        supabase.from("documents").select("id, status").eq("project_id", projectId),
        supabase.from("team_members").select("id").eq("project_id", projectId),
      ]);

      const project = projectRes.data;
      if (!project) return;

      projectNamesRef.current.set(projectId, project.name);

      const tasks = tasksRes.data || [];
      const budgetEntries = budgetRes.data || [];
      const documents = docsRes.data || [];
      const team = teamRes.data || [];

      // Run same checks as useProjectIntegrity
      const checks: IntegrityCheck[] = [];

      // Budget calculations
      const budgetPlanned = budgetEntries.reduce((s, e) => s + (Number(e.planned_amount) || 0), 0);
      const budgetActual = budgetEntries.reduce((s, e) => s + (Number(e.actual_amount) || 0), 0);
      const budgetExecutionRate = budgetPlanned > 0 ? Math.round((budgetActual / budgetPlanned) * 100) : 0;
      const projectBudget = Number(project.budget) || 0;
      const projectSpent = Number(project.spent) || 0;
      const hasBudgetOverrun = projectBudget > 0 && projectSpent > projectBudget;

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.column_id === "done").length;
      const overdueTasks = tasks.filter(t => {
        if (!t.due_date || t.column_id === "done") return false;
        return new Date(t.due_date) < new Date();
      }).length;
      const unassignedTasks = tasks.filter(t => !t.assignee_name && t.column_id !== "done").length;
      const pendingDocuments = documents.filter(d => ["pending_review", "in_review"].includes(d.status)).length;
      const draftDocuments = documents.filter(d => d.status === "draft").length;
      const budgetPendingEntries = budgetEntries.filter(e => e.status === "pending").length;

      if (project.status === "completed" && completedTasks < totalTasks) {
        checks.push({ id: "completed-open-tasks", severity: "error", module: "tasks", title: "Projecto concluído com tarefas abertas", description: `${totalTasks - completedTasks} tarefa(s) abertas.` });
      }
      if (hasBudgetOverrun) {
        const excess = Math.round(((projectSpent - projectBudget) / projectBudget) * 100);
        checks.push({ id: "budget-overrun", severity: "error", module: "budget", title: "Orçamento excedido", description: `Gasto excede orçamento em ${excess}%.`, actionRoute: "/budget" });
      }
      if (budgetPendingEntries > 0) {
        checks.push({ id: "pending-budget", severity: "warning", module: "budget", title: "Entradas orçamentais pendentes", description: `${budgetPendingEntries} entrada(s) por aprovar.`, actionRoute: "/budget" });
      }
      if (overdueTasks > 0) {
        const highPriority = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.column_id !== "done" && t.priority === "high").length;
        checks.push({ id: "overdue-tasks", severity: highPriority > 0 ? "error" : "warning", module: "tasks", title: "Tarefas em atraso", description: `${overdueTasks} tarefa(s) com prazo ultrapassado.`, actionRoute: `/projects/${projectId}` });
      }
      if (pendingDocuments > 0) {
        checks.push({ id: "pending-docs", severity: "info", module: "documents", title: "Documentos aguardam revisão", description: `${pendingDocuments} documento(s) pendente(s).`, actionRoute: "/documents" });
      }
      if (draftDocuments > 0 && project.progress > 50) {
        checks.push({ id: "draft-docs-late", severity: "warning", module: "documents", title: "Documentos em rascunho", description: `${draftDocuments} doc(s) em rascunho a ${project.progress}%.`, actionRoute: "/documents" });
      }
      if (unassignedTasks > 3) {
        checks.push({ id: "unassigned-tasks", severity: "warning", module: "team", title: "Tarefas sem responsável", description: `${unassignedTasks} tarefa(s) sem responsável.`, actionRoute: `/projects/${projectId}` });
      }
      if (team.length === 0 && totalTasks > 0) {
        checks.push({ id: "no-team", severity: "warning", module: "team", title: "Sem equipa definida", description: "Tarefas existentes mas sem equipa.", actionRoute: "/team" });
      }
      if (budgetExecutionRate > 0 && project.progress) {
        const diff = budgetExecutionRate - project.progress;
        if (diff > 30) {
          checks.push({ id: "budget-progress-mismatch", severity: "warning", module: "budget", title: "Desalinhamento orçamento/progresso", description: `Execução (${budgetExecutionRate}%) vs progresso (${project.progress}%).`, actionRoute: "/budget" });
        }
      }
      if (project.end_date && project.progress < 70) {
        const daysRemaining = Math.ceil((new Date(project.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysRemaining > 0 && daysRemaining < 14) {
          checks.push({ id: "deadline-approaching", severity: "error", module: "tasks", title: "Prazo iminente", description: `${daysRemaining} dia(s) restante(s) com ${project.progress}% concluído.` });
        }
      }

      // Detect NEW checks compared to previous state
      const prevCheckIds = previousChecksRef.current.get(projectId) || new Set();
      const currentCheckIds = new Set(checks.map(c => c.id));
      const newCheckIds = [...currentCheckIds].filter(id => !prevCheckIds.has(id));

      // Only notify on genuinely new alerts (not on first load)
      if (prevCheckIds.size > 0 && newCheckIds.length > 0) {
        const newChecks = checks.filter(c => newCheckIds.includes(c.id));

        const newNotifications: IntegrityNotification[] = newChecks.map(check => ({
          id: `${projectId}-${check.id}-${Date.now()}`,
          check,
          projectId,
          projectName: project.name,
          timestamp: new Date(),
          isRead: false,
        }));

        setNotifications(prev => [...newNotifications, ...prev].slice(0, 50));

        // Show toast for critical/warning alerts
        newChecks
          .filter(c => c.severity === "error" || c.severity === "warning")
          .forEach(check => {
            toast[check.severity === "error" ? "error" : "warning"](
              `${severityEmoji[check.severity]} ${project.name}`,
              { description: check.title }
            );
          });
      }

      previousChecksRef.current.set(projectId, currentCheckIds);

      // Invalidate integrity query so the panel updates too
      queryClient.invalidateQueries({ queryKey: ["project-integrity", projectId] });
    } catch (err) {
      console.error("Error evaluating integrity for project", projectId, err);
    }
  }, [queryClient]);

  // Initial load: get all projects and evaluate them (sets baseline, no toasts)
  useEffect(() => {
    const loadInitial = async () => {
      const { data: projects } = await supabase
        .from("projects")
        .select("id, name")
        .in("status", ["active", "delayed"]);

      if (projects) {
        for (const p of projects) {
          projectNamesRef.current.set(p.id, p.name);
        }
        // Evaluate all to set baseline
        await Promise.all(projects.map(p => evaluateProject(p.id)));
      }
    };

    loadInitial();
  }, [evaluateProject]);

  // Subscribe to realtime changes on relevant tables
  useEffect(() => {
    const channel = supabase
      .channel("integrity-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          const projectId = (payload.new as any)?.project_id || (payload.old as any)?.project_id;
          if (projectId) evaluateProject(projectId);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "budget_entries" },
        (payload) => {
          const projectId = (payload.new as any)?.project_id || (payload.old as any)?.project_id;
          if (projectId) evaluateProject(projectId);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documents" },
        (payload) => {
          const projectId = (payload.new as any)?.project_id || (payload.old as any)?.project_id;
          if (projectId) evaluateProject(projectId);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        (payload) => {
          const projectId = (payload.new as any)?.id || (payload.old as any)?.id;
          if (projectId) evaluateProject(projectId);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_members" },
        (payload) => {
          const projectId = (payload.new as any)?.project_id || (payload.old as any)?.project_id;
          if (projectId) evaluateProject(projectId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [evaluateProject]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}
