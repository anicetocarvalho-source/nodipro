import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Sector {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
}

export interface SDG {
  id: string;
  number: number;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
}

export interface Province {
  id: string;
  name: string;
  code: string | null;
  region: string | null;
}

export interface Funder {
  id: string;
  name: string;
  acronym: string | null;
  type: string | null;
  country: string | null;
  logo_url: string | null;
}

export interface GovernanceFilters {
  sectorId?: string;
  sdgId?: string;
  provinceId?: string;
  funderId?: string;
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

export function useSDGs() {
  return useQuery({
    queryKey: ["sdgs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sdgs")
        .select("*")
        .order("number");
      
      if (error) throw error;
      return data as SDG[];
    },
  });
}

export function useProvinces() {
  return useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provinces")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Province[];
    },
  });
}

export function useFunders() {
  return useQuery({
    queryKey: ["funders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funders")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Funder[];
    },
  });
}

export function useGovernanceStats(filters?: GovernanceFilters) {
  return useQuery({
    queryKey: ["governance", "stats", filters],
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

      // Get project IDs that match SDG filter
      let projectIdsFromSDG: string[] | null = null;
      if (filters?.sdgId) {
        const { data: projectSdgs, error: sdgError } = await supabase
          .from("project_sdgs")
          .select("project_id")
          .eq("sdg_id", filters.sdgId);
        if (sdgError) throw sdgError;
        projectIdsFromSDG = projectSdgs?.map(ps => ps.project_id) || [];
      }

      // Get projects with filters
      let projectsQuery = supabase
        .from("projects")
        .select("id, status, budget, spent, progress, sector_id, program_id, province_id, funder_id");
      
      if (filters?.sectorId) {
        projectsQuery = projectsQuery.eq("sector_id", filters.sectorId);
      }
      if (filters?.provinceId) {
        projectsQuery = projectsQuery.eq("province_id", filters.provinceId);
      }
      if (filters?.funderId) {
        projectsQuery = projectsQuery.eq("funder_id", filters.funderId);
      }
      
      const { data: projects, error: projectsError } = await projectsQuery;
      if (projectsError) throw projectsError;

      // Apply SDG filter if set
      let filteredProjects = projects || [];
      if (projectIdsFromSDG !== null) {
        filteredProjects = filteredProjects.filter(p => projectIdsFromSDG!.includes(p.id));
      }

      const totalBudget = filteredProjects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
      const totalSpent = filteredProjects.reduce((sum, p) => sum + (Number(p.spent) || 0), 0);
      const avgProgress = filteredProjects.length 
        ? filteredProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / filteredProjects.length 
        : 0;
      
      const atRisk = filteredProjects.filter(p => p.status === 'delayed').length;
      const completed = filteredProjects.filter(p => p.status === 'completed').length;
      const onTrack = filteredProjects.filter(p => p.status === 'active').length;
      const executionRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

      return {
        totalPortfolios: portfolios?.length || 0,
        totalPrograms: programs?.length || 0,
        totalProjects: filteredProjects.length,
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

export function useSectorStats(filters?: GovernanceFilters) {
  return useQuery({
    queryKey: ["governance", "sector-stats", filters],
    queryFn: async () => {
      // Get sectors
      const { data: sectors, error: sectorsError } = await supabase
        .from("sectors")
        .select("*");
      if (sectorsError) throw sectorsError;

      // Get project IDs that match SDG filter
      let projectIdsFromSDG: string[] | null = null;
      if (filters?.sdgId) {
        const { data: projectSdgs, error: sdgError } = await supabase
          .from("project_sdgs")
          .select("project_id")
          .eq("sdg_id", filters.sdgId);
        if (sdgError) throw sdgError;
        projectIdsFromSDG = projectSdgs?.map(ps => ps.project_id) || [];
      }

      // Get all projects with filters
      let projectsQuery = supabase
        .from("projects")
        .select("id, status, budget, spent, progress, sector_id, province_id, funder_id");
      
      if (filters?.sectorId) {
        projectsQuery = projectsQuery.eq("sector_id", filters.sectorId);
      }
      if (filters?.provinceId) {
        projectsQuery = projectsQuery.eq("province_id", filters.provinceId);
      }
      if (filters?.funderId) {
        projectsQuery = projectsQuery.eq("funder_id", filters.funderId);
      }
      
      const { data: projects, error: projectsError } = await projectsQuery;
      if (projectsError) throw projectsError;

      // Apply SDG filter
      let filteredProjects = projects || [];
      if (projectIdsFromSDG !== null) {
        filteredProjects = filteredProjects.filter(p => projectIdsFromSDG!.includes(p.id));
      }

      // Calculate stats per sector
      const sectorStats: SectorStats[] = (sectors || []).map(sector => {
        const sectorProjects = filteredProjects.filter(p => p.sector_id === sector.id);
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

export function useProjectsByStatus(filters?: GovernanceFilters) {
  return useQuery({
    queryKey: ["governance", "projects-by-status", filters],
    queryFn: async () => {
      // Get project IDs that match SDG filter
      let projectIdsFromSDG: string[] | null = null;
      if (filters?.sdgId) {
        const { data: projectSdgs, error: sdgError } = await supabase
          .from("project_sdgs")
          .select("project_id")
          .eq("sdg_id", filters.sdgId);
        if (sdgError) throw sdgError;
        projectIdsFromSDG = projectSdgs?.map(ps => ps.project_id) || [];
      }

      let query = supabase
        .from("projects")
        .select("id, status, sector_id, province_id, funder_id");
      
      if (filters?.sectorId) {
        query = query.eq("sector_id", filters.sectorId);
      }
      if (filters?.provinceId) {
        query = query.eq("province_id", filters.provinceId);
      }
      if (filters?.funderId) {
        query = query.eq("funder_id", filters.funderId);
      }
      
      const { data, error } = await query;
      if (error) throw error;

      // Apply SDG filter
      let filteredData = data || [];
      if (projectIdsFromSDG !== null) {
        filteredData = filteredData.filter(p => projectIdsFromSDG!.includes(p.id));
      }

      const statusCounts = {
        active: 0,
        delayed: 0,
        completed: 0,
        on_hold: 0,
      };

      filteredData.forEach(project => {
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
