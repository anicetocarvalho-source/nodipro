import { ProjectStatus } from "@/types/database";

// Status configuration
export const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  active: { label: "Activo", className: "bg-success/10 text-success" },
  delayed: { label: "Atrasado", className: "bg-destructive/10 text-destructive" },
  completed: { label: "Concluído", className: "bg-primary/10 text-primary" },
  on_hold: { label: "Pausado", className: "bg-warning/10 text-warning" },
};

// Risk levels
export type RiskLevel = "low" | "medium" | "high" | "critical";

export const riskConfig: Record<RiskLevel, { label: string; className: string }> = {
  low: { label: "Baixo", className: "bg-success/10 text-success" },
  medium: { label: "Médio", className: "bg-warning/10 text-warning" },
  high: { label: "Alto", className: "bg-destructive/10 text-destructive" },
  critical: { label: "Crítico", className: "bg-destructive text-destructive-foreground" },
};

export const getRiskLevel = (progress: number, endDate: string | null): RiskLevel => {
  if (!endDate) return "low";
  const now = new Date();
  const deadline = new Date(endDate);
  const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (progress >= 90) return "low";
  if (daysRemaining < 0) return "critical";
  if (daysRemaining < 7 && progress < 80) return "high";
  if (daysRemaining < 30 && progress < 60) return "medium";
  return "low";
};

export const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "-";
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const date = new Date(dateStr);
  return `${date.getDate().toString().padStart(2, "0")} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

export const formatCurrency = (value: number | null): string => {
  if (value === null) return "-";
  return (
    new Intl.NumberFormat("pt-AO", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + " AOA"
  );
};
