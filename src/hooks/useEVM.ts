import { useMemo } from "react";
import { useProjects } from "@/hooks/useProjects";
import { DbProject } from "@/types/database";

export interface EVMMetrics {
  projectId: string;
  projectName: string;
  // Base
  BAC: number;     // Budget at Completion
  PV: number;      // Planned Value
  EV: number;      // Earned Value
  AC: number;      // Actual Cost
  // Performance indices
  CPI: number;     // Cost Performance Index
  SPI: number;     // Schedule Performance Index
  // Forecasts
  EAC: number;     // Estimate at Completion
  ETC: number;     // Estimate to Complete
  VAC: number;     // Variance at Completion
  // Variances
  CV: number;      // Cost Variance
  SV: number;      // Schedule Variance
  // Percentages
  percentComplete: number;
  percentSchedule: number;
  // Health
  costHealth: 'good' | 'warning' | 'critical';
  scheduleHealth: 'good' | 'warning' | 'critical';
  overallHealth: 'good' | 'warning' | 'critical';
}

function getHealth(index: number): 'good' | 'warning' | 'critical' {
  if (index >= 0.95) return 'good';
  if (index >= 0.8) return 'warning';
  return 'critical';
}

function calcSchedulePercent(project: DbProject): number {
  if (!project.start_date || !project.end_date) return 0;
  const start = new Date(project.start_date).getTime();
  const end = new Date(project.end_date).getTime();
  const now = Date.now();
  const total = end - start;
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, ((now - start) / total) * 100));
}

export function calcEVM(project: DbProject): EVMMetrics | null {
  const BAC = Number(project.budget) || 0;
  if (BAC <= 0) return null;

  const AC = Number(project.spent) || 0;
  const percentComplete = project.progress || 0;
  const percentSchedule = calcSchedulePercent(project);

  // Core EVM
  const EV = BAC * (percentComplete / 100);
  const PV = BAC * (percentSchedule / 100);

  // Indices (guard against division by zero)
  const CPI = AC > 0 ? EV / AC : (EV > 0 ? 999 : 1);
  const SPI = PV > 0 ? EV / PV : (EV > 0 ? 999 : 1);

  // Variances
  const CV = EV - AC;
  const SV = EV - PV;

  // Forecasts
  const EAC = CPI > 0 ? BAC / CPI : BAC;
  const ETC = Math.max(0, EAC - AC);
  const VAC = BAC - EAC;

  const costHealth = getHealth(CPI);
  const scheduleHealth = getHealth(SPI);
  const overallHealth = costHealth === 'critical' || scheduleHealth === 'critical'
    ? 'critical'
    : costHealth === 'warning' || scheduleHealth === 'warning'
      ? 'warning'
      : 'good';

  return {
    projectId: project.id,
    projectName: project.name,
    BAC, PV, EV, AC,
    CPI, SPI, EAC, ETC, VAC, CV, SV,
    percentComplete, percentSchedule,
    costHealth, scheduleHealth, overallHealth,
  };
}

export function useEVMData() {
  const { data: projects, isLoading } = useProjects();

  const evmData = useMemo(() => {
    if (!projects) return [];
    return projects
      .filter(p => p.status !== 'completed' && (Number(p.budget) || 0) > 0)
      .map(calcEVM)
      .filter(Boolean) as EVMMetrics[];
  }, [projects]);

  const portfolio = useMemo(() => {
    if (evmData.length === 0) return null;
    const totalBAC = evmData.reduce((s, e) => s + e.BAC, 0);
    const totalEV = evmData.reduce((s, e) => s + e.EV, 0);
    const totalAC = evmData.reduce((s, e) => s + e.AC, 0);
    const totalPV = evmData.reduce((s, e) => s + e.PV, 0);
    const CPI = totalAC > 0 ? totalEV / totalAC : 1;
    const SPI = totalPV > 0 ? totalEV / totalPV : 1;
    const EAC = CPI > 0 ? totalBAC / CPI : totalBAC;
    return {
      totalBAC, totalEV, totalAC, totalPV,
      CPI, SPI, EAC,
      CV: totalEV - totalAC,
      SV: totalEV - totalPV,
      VAC: totalBAC - EAC,
      costHealth: getHealth(CPI),
      scheduleHealth: getHealth(SPI),
    };
  }, [evmData]);

  return { evmData, portfolio, isLoading };
}
