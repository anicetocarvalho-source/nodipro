import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DbProgram, DbProgramInsert, ProgramWithStats } from "@/types/portfolio";
import { toast } from "sonner";

export function usePrograms(portfolioId?: string) {
  return useQuery({
    queryKey: ["programs", portfolioId],
    queryFn: async () => {
      let query = supabase
        .from("programs")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (portfolioId) {
        query = query.eq("portfolio_id", portfolioId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as DbProgram[];
    },
  });
}

export function useProgramsWithStats(portfolioId?: string) {
  return useQuery({
    queryKey: ["programs", "with-stats", portfolioId],
    queryFn: async () => {
      // Get programs
      let programsQuery = supabase
        .from("programs")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (portfolioId) {
        programsQuery = programsQuery.eq("portfolio_id", portfolioId);
      }

      const { data: programs, error: programsError } = await programsQuery;
      if (programsError) throw programsError;

      // Get portfolios for names
      const { data: portfolios, error: portfoliosError } = await supabase
        .from("portfolios")
        .select("id, name");
      if (portfoliosError) throw portfoliosError;

      // Get projects
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id, program_id, budget, spent, progress, status");
      if (projectsError) throw projectsError;

      // Calculate stats for each program
      const programsWithStats: ProgramWithStats[] = (programs as DbProgram[]).map(program => {
        const programProjects = projects?.filter(p => p.program_id === program.id) || [];
        const portfolio = portfolios?.find(p => p.id === program.portfolio_id);

        const totalBudget = programProjects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
        const totalSpent = programProjects.reduce((sum, p) => sum + (Number(p.spent) || 0), 0);
        const avgProgress = programProjects.length > 0
          ? programProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / programProjects.length
          : 0;
        const projectsAtRisk = programProjects.filter(p => p.status === 'delayed').length;

        return {
          ...program,
          portfolio_name: portfolio?.name,
          projects_count: programProjects.length,
          total_budget: totalBudget,
          total_spent: totalSpent,
          average_progress: Math.round(avgProgress),
          projects_at_risk: projectsAtRisk,
        };
      });

      return programsWithStats;
    },
  });
}

export function useProgram(programId: string | undefined) {
  return useQuery({
    queryKey: ["programs", programId],
    queryFn: async () => {
      if (!programId) return null;
      
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .eq("id", programId)
        .maybeSingle();
      
      if (error) throw error;
      return data as DbProgram | null;
    },
    enabled: !!programId,
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (program: DbProgramInsert) => {
      const { data, error } = await supabase
        .from("programs")
        .insert(program)
        .select()
        .single();
      
      if (error) throw error;
      return data as DbProgram;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      toast.success("Programa criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar programa: " + error.message);
    },
  });
}

export function useUpdateProgram() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbProgram> & { id: string }) => {
      const { data, error } = await supabase
        .from("programs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as DbProgram;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["programs", data.id] });
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      toast.success("Programa atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar programa: " + error.message);
    },
  });
}

export function useDeleteProgram() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (programId: string) => {
      const { error } = await supabase
        .from("programs")
        .delete()
        .eq("id", programId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      toast.success("Programa eliminado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao eliminar programa: " + error.message);
    },
  });
}

export function useAssignProjectToProgram() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ projectId, programId }: { projectId: string; programId: string | null }) => {
      const { data, error } = await supabase
        .from("projects")
        .update({ program_id: programId })
        .eq("id", projectId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Projecto atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar projecto: " + error.message);
    },
  });
}
