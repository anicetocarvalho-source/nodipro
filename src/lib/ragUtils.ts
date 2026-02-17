/**
 * RAG (Red-Amber-Green) status calculation for projects
 * Based on schedule, budget, and progress dimensions
 */

export type RAGStatus = "green" | "amber" | "red";

export interface RAGAssessment {
  overall: RAGStatus;
  schedule: RAGStatus;
  budget: RAGStatus;
  scope: RAGStatus;
  label: string;
  tooltip: string;
}

const ragColors: Record<RAGStatus, { bg: string; text: string; dot: string; label: string }> = {
  green: { bg: "bg-success/15", text: "text-success", dot: "bg-success", label: "Verde" },
  amber: { bg: "bg-warning/15", text: "text-warning", dot: "bg-warning", label: "Âmbar" },
  red: { bg: "bg-destructive/15", text: "text-destructive", dot: "bg-destructive", label: "Vermelho" },
};

export const getRagColors = (status: RAGStatus) => ragColors[status];

export function calculateRAG(project: {
  progress: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  spent: number | null;
}): RAGAssessment {
  const schedule = calculateScheduleRAG(project);
  const budget = calculateBudgetRAG(project);
  const scope = calculateScopeRAG(project);

  // Overall = worst of the three
  const overall = [schedule, budget, scope].includes("red")
    ? "red"
    : [schedule, budget, scope].includes("amber")
    ? "amber"
    : "green";

  const labels: Record<RAGStatus, string> = {
    green: "No Prazo",
    amber: "Atenção",
    red: "Crítico",
  };

  const issues: string[] = [];
  if (schedule === "red") issues.push("Cronograma crítico");
  else if (schedule === "amber") issues.push("Cronograma em risco");
  if (budget === "red") issues.push("Orçamento excedido");
  else if (budget === "amber") issues.push("Orçamento em risco");
  if (scope === "red") issues.push("Progresso muito baixo");
  else if (scope === "amber") issues.push("Progresso abaixo do esperado");

  return {
    overall,
    schedule,
    budget,
    scope,
    label: labels[overall],
    tooltip: issues.length > 0 ? issues.join(" • ") : "Todos os indicadores positivos",
  };
}

function calculateScheduleRAG(project: {
  progress: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
}): RAGStatus {
  if (project.status === "completed") return "green";
  if (project.status === "delayed") return "red";
  if (!project.end_date || !project.start_date) return "green";

  const now = new Date();
  const end = new Date(project.end_date);
  const start = new Date(project.start_date);
  const totalDays = Math.max((end.getTime() - start.getTime()) / 86400000, 1);
  const elapsed = (now.getTime() - start.getTime()) / 86400000;
  const expectedProgress = Math.min(Math.max((elapsed / totalDays) * 100, 0), 100);
  const deviation = project.progress - expectedProgress;

  if (now > end && project.progress < 100) return "red";
  if (deviation < -25) return "red";
  if (deviation < -10) return "amber";
  return "green";
}

function calculateBudgetRAG(project: {
  budget: number | null;
  spent: number | null;
}): RAGStatus {
  if (!project.budget || project.budget <= 0) return "green";
  const spent = project.spent || 0;
  const ratio = (spent / project.budget) * 100;

  if (ratio > 100) return "red";
  if (ratio > 85) return "amber";
  return "green";
}

function calculateScopeRAG(project: {
  progress: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
}): RAGStatus {
  if (project.status === "completed") return "green";
  if (!project.start_date || !project.end_date) return "green";

  const now = new Date();
  const end = new Date(project.end_date);
  const start = new Date(project.start_date);
  const totalDays = Math.max((end.getTime() - start.getTime()) / 86400000, 1);
  const elapsed = (now.getTime() - start.getTime()) / 86400000;
  const timePercent = Math.min((elapsed / totalDays) * 100, 100);

  // If 80% of time elapsed but < 40% progress → red
  if (timePercent > 80 && project.progress < 40) return "red";
  // If 50% of time elapsed but < 20% progress → amber
  if (timePercent > 50 && project.progress < 20) return "amber";
  return "green";
}
