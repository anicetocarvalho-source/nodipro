import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DbPortfolio, DbPortfolioInsert, PortfolioWithStats } from "@/types/portfolio";
import { toast } from "sonner";

export function usePortfolios() {
  return useQuery({
    queryKey: ["portfolios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolios")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as DbPortfolio[];
    },
  });
}

export function usePortfoliosWithStats() {
  return useQuery({
    queryKey: ["portfolios", "with-stats"],
    queryFn: async () => {
      // Get portfolios
      const { data: portfolios, error: portfoliosError } = await supabase
        .from("portfolios")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (portfoliosError) throw portfoliosError;

      // Get programs with their project counts
      const { data: programs, error: programsError } = await supabase
        .from("programs")
        .select("id, portfolio_id");
      
      if (programsError) throw programsError;

      // Get projects with program info
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id, program_id, budget, spent, progress, status");
      
      if (projectsError) throw projectsError;

      // Calculate stats for each portfolio
      const portfoliosWithStats: PortfolioWithStats[] = (portfolios as DbPortfolio[]).map(portfolio => {
        const portfolioPrograms = programs?.filter(p => p.portfolio_id === portfolio.id) || [];
        const programIds = portfolioPrograms.map(p => p.id);
        const portfolioProjects = projects?.filter(p => p.program_id && programIds.includes(p.program_id)) || [];

        const totalBudget = portfolioProjects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
        const totalSpent = portfolioProjects.reduce((sum, p) => sum + (Number(p.spent) || 0), 0);
        const avgProgress = portfolioProjects.length > 0
          ? portfolioProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / portfolioProjects.length
          : 0;

        return {
          ...portfolio,
          programs_count: portfolioPrograms.length,
          projects_count: portfolioProjects.length,
          total_budget: totalBudget,
          total_spent: totalSpent,
          average_progress: Math.round(avgProgress),
        };
      });

      return portfoliosWithStats;
    },
  });
}

export function usePortfolio(portfolioId: string | undefined) {
  return useQuery({
    queryKey: ["portfolios", portfolioId],
    queryFn: async () => {
      if (!portfolioId) return null;
      
      const { data, error } = await supabase
        .from("portfolios")
        .select("*")
        .eq("id", portfolioId)
        .maybeSingle();
      
      if (error) throw error;
      return data as DbPortfolio | null;
    },
    enabled: !!portfolioId,
  });
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (portfolio: DbPortfolioInsert) => {
      const { data, error } = await supabase
        .from("portfolios")
        .insert(portfolio)
        .select()
        .single();
      
      if (error) throw error;
      return data as DbPortfolio;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      toast.success("Portfólio criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar portfólio: " + error.message);
    },
  });
}

export function useUpdatePortfolio() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbPortfolio> & { id: string }) => {
      const { data, error } = await supabase
        .from("portfolios")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as DbPortfolio;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      queryClient.invalidateQueries({ queryKey: ["portfolios", data.id] });
      toast.success("Portfólio atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar portfólio: " + error.message);
    },
  });
}

export function useDeletePortfolio() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (portfolioId: string) => {
      const { error } = await supabase
        .from("portfolios")
        .delete()
        .eq("id", portfolioId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      toast.success("Portfólio eliminado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao eliminar portfólio: " + error.message);
    },
  });
}
