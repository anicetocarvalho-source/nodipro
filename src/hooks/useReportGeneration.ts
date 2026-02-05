import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  ReportType,
  ReportData,
  generateProjectReport,
  generatePortfolioReport,
  generateTeamReport,
  generateFinancialReport,
  generateRiskReport,
  generateKPIReport,
  generatePerformanceReport,
} from "@/lib/reportGenerators";

export type { ReportType, ReportData };
export type { ReportMetric, ReportTable } from "@/lib/reportGenerators";

export interface ReportConfig {
  type: ReportType;
  projectId?: string;
  format: "pdf" | "excel";
}

export function useReportGeneration() {
  const { organization } = useOrganization();
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const generateReport = async (config: ReportConfig) => {
    if (!organization) return null;

    setIsGenerating(true);
    try {
      const orgId = organization.id;

      // Fetch all data in parallel
      const [projectsRes, tasksRes, teamRes, budgetRes, portfoliosRes, programsRes] = await Promise.all([
        supabase
          .from("projects")
          .select("*, provinces:province_id(id, name), sectors:sector_id(id, name, color), funders:funder_id(id, name, acronym)")
          .eq("organization_id", orgId),
        supabase.from("tasks").select("*"),
        supabase.from("team_members").select("*"),
        supabase.from("budget_entries").select("*, cost_categories:category_id(id, name, code)"),
        supabase.from("portfolios").select("*").eq("organization_id", orgId),
        supabase.from("programs").select("*"),
      ]);

      const allProjects = projectsRes.data || [];
      const projectIds = allProjects.map(p => p.id);

      // Filter to org projects
      const allTasks = (tasksRes.data || []).filter(t => projectIds.includes(t.project_id));
      const allTeam = (teamRes.data || []).filter(t => projectIds.includes(t.project_id));
      const allBudget = (budgetRes.data || []).filter(b => projectIds.includes(b.project_id));
      const portfolios = portfoliosRes.data || [];
      const programs = programsRes.data || [];

      let data: ReportData;

      switch (config.type) {
        case "project":
          data = generateProjectReport(allProjects, allTasks, allTeam, allBudget, config.projectId, organization.name);
          break;
        case "portfolio":
          data = generatePortfolioReport(allProjects, portfolios, programs, allTasks, allBudget, organization.name);
          break;
        case "team":
          data = generateTeamReport(allProjects, allTasks, allTeam, organization.name);
          break;
        case "financial":
          data = generateFinancialReport(allProjects, allBudget, organization.name);
          break;
        case "risk":
          data = generateRiskReport(allProjects, allTasks, allBudget, organization.name);
          break;
        case "kpi":
          data = generateKPIReport(allProjects, allTasks, allBudget, allTeam, organization.name);
          break;
        case "performance":
          data = generatePerformanceReport(allProjects, allTasks, allBudget, organization.name);
          break;
        default:
          throw new Error("Tipo de relatório desconhecido");
      }

      setReportData(data);
      return data;
    } catch (error) {
      console.error("Error generating report:", error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateReport, isGenerating, reportData, setReportData };
}
