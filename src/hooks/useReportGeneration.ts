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
  generateDisbursementReport,
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
      // First fetch org projects to get their IDs for filtering related data
      const projectsRes = await supabase
        .from("projects")
        .select("*, provinces:province_id(id, name), sectors:sector_id(id, name, color), funders:funder_id(id, name, acronym)")
        .eq("organization_id", orgId);

      const allProjects = projectsRes.data || [];
      const projectIds = allProjects.map(p => p.id);

      // Now fetch related data filtered by project IDs
      const [tasksRes, teamRes, budgetRes, portfoliosRes, programsRes, docsRes, tranchesRes, beneficiariesRes, lessonsRes, fundingRes] = await Promise.all([
        projectIds.length > 0
          ? supabase.from("tasks").select("*").in("project_id", projectIds)
          : Promise.resolve({ data: [], error: null }),
        projectIds.length > 0
          ? supabase.from("team_members").select("*").in("project_id", projectIds)
          : Promise.resolve({ data: [], error: null }),
        projectIds.length > 0
          ? supabase.from("budget_entries").select("*, cost_categories:category_id(id, name, code)").in("project_id", projectIds)
          : Promise.resolve({ data: [], error: null }),
        supabase.from("portfolios").select("*").eq("organization_id", orgId),
        supabase.from("programs").select("*"),
        projectIds.length > 0
          ? supabase.from("documents").select("id, title, status, project_id, phase_name, document_type, created_at").in("project_id", projectIds)
          : Promise.resolve({ data: [], error: null }),
        projectIds.length > 0
          ? supabase.from("disbursement_tranches").select("*").in("project_id", projectIds)
          : Promise.resolve({ data: [], error: null }),
        projectIds.length > 0
          ? supabase.from("beneficiaries").select("*").in("project_id", projectIds)
          : Promise.resolve({ data: [], error: null }),
        projectIds.length > 0
          ? supabase.from("lessons_learned").select("*").in("project_id", projectIds)
          : Promise.resolve({ data: [], error: null }),
        supabase.from("funding_agreements").select("*").eq("organization_id", orgId),
      ]);

      // Data is already filtered by project IDs
      const allTasks = tasksRes.data || [];
      const allTeam = teamRes.data || [];
      const allBudget = budgetRes.data || [];
      const allDocs = docsRes.data || [];
      const allTranches = tranchesRes.data || [];
      const allBeneficiaries = beneficiariesRes.data || [];
      const allLessons = lessonsRes.data || [];
      const allFunding = fundingRes.data || [];
      const portfolios = portfoliosRes.data || [];
      const programs = programsRes.data || [];

      let data: ReportData;

      switch (config.type) {
        case "project":
          data = generateProjectReport(allProjects, allTasks, allTeam, allBudget, config.projectId, organization.name, allDocs);
          break;
        case "portfolio":
          data = generatePortfolioReport(allProjects, portfolios, programs, allTasks, allBudget, organization.name, allDocs);
          break;
        case "team":
          data = generateTeamReport(allProjects, allTasks, allTeam, organization.name);
          break;
        case "financial":
          data = generateFinancialReport(allProjects, allBudget, organization.name, allFunding);
          break;
        case "risk":
          data = generateRiskReport(allProjects, allTasks, allBudget, organization.name, allDocs);
          break;
        case "kpi":
          data = generateKPIReport(allProjects, allTasks, allBudget, allTeam, organization.name, allDocs, allBeneficiaries);
          break;
        case "performance":
          data = generatePerformanceReport(allProjects, allTasks, allBudget, organization.name);
          break;
        case "disbursement":
          data = generateDisbursementReport(allProjects, allTranches, organization.name);
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
