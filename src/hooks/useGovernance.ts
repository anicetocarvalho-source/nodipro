import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Sector {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
}

export interface GovernanceStats {
  totalPortfolios: number;
  totalPrograms: number;
  totalProjects: number;
  totalBudget: number;
  totalSpent: number;
  averageProgress: number;
  projectsAtRisk: number;
  projectsCompleted: number;
  projectsOnTrack: number;
  executionRate: number;
}

export interface SectorStats {
  sectorId: string;
  sectorName: string;
  sectorColor: string | null;
  projectCount: number;
  budget: number;
  spent: number;
  progress: number;
  atRisk: number;
}

export interface PortfolioSummary {
  id: string;
  name: string;
  programsCount: number;
  projectsCount: number;
  budget: number;
  spent: number;
  progress: number;
  atRisk: number;
  status: string;
}

export interface TrendData {
  month: string;
  budget: number;
  spent: number;
  progress: number;
}

export function useSectors() {
  return useQuery({
    queryKey: ["sectors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sectors")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Sector[];
    },
  });
}

export function useGovernanceStats(sectorFilter?: string) {
  return useQuery({
    queryKey: ["governance", "stats", sectorFilter],
    queryFn: async () => {
      // Get portfolios
      const { data: portfolios, error: portfoliosError } = await supabase
        .from("portfolios")
        .select("id");
      if (portfoliosError) throw portfoliosError;

      // Get programs
      const { data: programs, error: programsError } = await supabase
        .from("programs")
        .select("id, portfolio_id");
      if (programsError) throw programsError;

      // Get projects with optional sector filter
      let projectsQuery = supabase
        .from("projects")
        .select("id, status, budget, spent, progress, sector_id, program_id");
      
      if (sectorFilter) {
        projectsQuery = projectsQuery.eq("sector_id", sectorFilter);
      }
      
      const { data: projects, error: projectsError } = await projectsQuery;
      if (projectsError) throw projectsError;

      const totalBudget = projects?.reduce((sum, p) => sum + (Number(p.budget) || 0), 0) || 0;
      const totalSpent = projects?.reduce((sum, p) => sum + (Number(p.spent) || 0), 0) || 0;
      const avgProgress = projects?.length 
        ? projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length 
        : 0;
      
      const atRisk = projects?.filter(p => p.status === 'delayed').length || 0;
      const completed = projects?.filter(p => p.status === 'completed').length || 0;
      const onTrack = projects?.filter(p => p.status === 'active').length || 0;
      const executionRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

      return {
        totalPortfolios: portfolios?.length || 0,
        totalPrograms: programs?.length || 0,
        totalProjects: projects?.length || 0,
        totalBudget,
        totalSpent,
        averageProgress: Math.round(avgProgress),
        projectsAtRisk: atRisk,
        projectsCompleted: completed,
        projectsOnTrack: onTrack,
        executionRate: Math.round(executionRate),
      } as GovernanceStats;
    },
  });
}

export function useSectorStats(sectorFilter?: string) {
  return useQuery({
    queryKey: ["governance", "sector-stats", sectorFilter],
    queryFn: async () => {
      // Get sectors
      const { data: sectors, error: sectorsError } = await supabase
        .from("sectors")
        .select("*");
      if (sectorsError) throw sectorsError;

      // Get all projects
      let projectsQuery = supabase
        .from("projects")
        .select("id, status, budget, spent, progress, sector_id");
      
      if (sectorFilter) {
        projectsQuery = projectsQuery.eq("sector_id", sectorFilter);
      }
      
      const { data: projects, error: projectsError } = await projectsQuery;
      if (projectsError) throw projectsError;

      // Calculate stats per sector
      const sectorStats: SectorStats[] = (sectors || []).map(sector => {
        const sectorProjects = projects?.filter(p => p.sector_id === sector.id) || [];
        const budget = sectorProjects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
        const spent = sectorProjects.reduce((sum, p) => sum + (Number(p.spent) || 0), 0);
        const progress = sectorProjects.length 
          ? sectorProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / sectorProjects.length 
          : 0;
        const atRisk = sectorProjects.filter(p => p.status === 'delayed').length;

        return {
          sectorId: sector.id,
          sectorName: sector.name,
          sectorColor: sector.color,
          projectCount: sectorProjects.length,
          budget,
          spent,
          progress: Math.round(progress),
          atRisk,
        };
      }).filter(s => s.projectCount > 0);

      return sectorStats;
    },
  });
}

export function usePortfolioSummaries() {
  return useQuery({
    queryKey: ["governance", "portfolio-summaries"],
    queryFn: async () => {
      // Get portfolios
      const { data: portfolios, error: portfoliosError } = await supabase
        .from("portfolios")
        .select("*")
        .order("name");
      if (portfoliosError) throw portfoliosError;

      // Get programs
      const { data: programs, error: programsError } = await supabase
        .from("programs")
        .select("id, portfolio_id");
      if (programsError) throw programsError;

      // Get projects
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id, status, budget, spent, progress, program_id");
      if (projectsError) throw projectsError;

      // Calculate summaries
      const summaries: PortfolioSummary[] = (portfolios || []).map(portfolio => {
        const portfolioPrograms = programs?.filter(p => p.portfolio_id === portfolio.id) || [];
        const programIds = portfolioPrograms.map(p => p.id);
        const portfolioProjects = projects?.filter(p => p.program_id && programIds.includes(p.program_id)) || [];

        const budget = portfolioProjects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
        const spent = portfolioProjects.reduce((sum, p) => sum + (Number(p.spent) || 0), 0);
        const progress = portfolioProjects.length 
          ? portfolioProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / portfolioProjects.length 
          : 0;
        const atRisk = portfolioProjects.filter(p => p.status === 'delayed').length;

        return {
          id: portfolio.id,
          name: portfolio.name,
          programsCount: portfolioPrograms.length,
          projectsCount: portfolioProjects.length,
          budget,
          spent,
          progress: Math.round(progress),
          atRisk,
          status: portfolio.status,
        };
      });

      return summaries;
    },
  });
}

export function useProjectsByStatus(sectorFilter?: string) {
  return useQuery({
    queryKey: ["governance", "projects-by-status", sectorFilter],
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select("id, status");
      
      if (sectorFilter) {
        query = query.eq("sector_id", sectorFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;

      const statusCounts = {
        active: 0,
        delayed: 0,
        completed: 0,
        on_hold: 0,
      };

      data?.forEach(project => {
        if (project.status in statusCounts) {
          statusCounts[project.status as keyof typeof statusCounts]++;
        }
      });

      return [
        { name: "Em Progresso", value: statusCounts.active, color: "hsl(var(--chart-1))" },
        { name: "Em Risco", value: statusCounts.delayed, color: "hsl(var(--chart-4))" },
        { name: "Concluídos", value: statusCounts.completed, color: "hsl(var(--chart-2))" },
        { name: "Suspensos", value: statusCounts.on_hold, color: "hsl(var(--chart-3))" },
      ].filter(s => s.value > 0);
    },
  });
}
