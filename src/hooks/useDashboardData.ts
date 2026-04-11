import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

export interface DashboardStats {
  activeProjects: number;
  completedProjects: number;
  delayedProjects: number;
  onHoldProjects: number;
  totalBudget: number;
  totalSpent: number;
  executionRate: number;
  sdgsImpacted: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  totalBeneficiaries: number;
  directBeneficiaries: number;
  indirectBeneficiaries: number;
  disbursementRate: number;
  totalDisbursed: number;
  totalFundingValue: number;
}

export interface ProjectWithDetails {
  id: string;
  name: string;
  status: string;
  progress: number;
  budget: number | null;
  spent: number | null;
  start_date: string | null;
  end_date: string | null;
  province?: { id: string; name: string } | null;
  sector?: { id: string; name: string; color: string | null } | null;
  funder?: { id: string; name: string; acronym: string | null } | null;
}

export interface SDGProgress {
  id: string;
  number: number;
  name: string;
  color: string | null;
  projectCount: number;
}

export interface BudgetByProvince {
  province: string;
  allocated: number;
  executed: number;
}

export interface BudgetByCategory {
  category: string;
  planned: number;
  actual: number;
}

export interface FunderData {
  id: string;
  name: string;
  acronym: string | null;
  totalAmount: number;
  projectCount: number;
}

export interface UpcomingDeadline {
  id: string;
  title: string;
  dueDate: string;
  projectName: string;
  priority: string;
}

export function useDashboardData() {
  const { organization } = useOrganization();
  const organizationId = organization?.id;

  // Fetch projects with relations
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ["dashboard-projects", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          id,
          name,
          status,
          progress,
          budget,
          spent,
          start_date,
          end_date,
          province_id,
          sector_id,
          funder_id,
          provinces:province_id (id, name),
          sectors:sector_id (id, name, color),
          funders:funder_id (id, name, acronym)
        `)
        .eq("organization_id", organizationId || "");

      if (error) throw error;
      return data as ProjectWithDetails[];
    },
    enabled: !!organizationId,
  });

  // Fetch tasks for all projects
  const projectIds = projects.map((p) => p.id);
  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ["dashboard-tasks", projectIds],
    queryFn: async () => {
      if (projectIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, column_id, due_date, priority, project_id")
        .in("project_id", projectIds);

      if (error) throw error;
      return data;
    },
    enabled: projectIds.length > 0,
  });

  // Fetch project SDGs
  const { data: projectSdgs = [], isLoading: loadingSdgs } = useQuery({
    queryKey: ["dashboard-sdgs", projectIds],
    queryFn: async () => {
      if (projectIds.length === 0) return [];

      const { data, error } = await supabase
        .from("project_sdgs")
        .select(`
          id,
          project_id,
          sdgs:sdg_id (id, number, name, color)
        `)
        .in("project_id", projectIds);

      if (error) throw error;
      return data;
    },
    enabled: projectIds.length > 0,
  });

  // Fetch all SDGs for reference
  const { data: allSdgs = [] } = useQuery({
    queryKey: ["all-sdgs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sdgs")
        .select("id, number, name, color")
        .order("number");

      if (error) throw error;
      return data;
    },
  });

  // Fetch budget entries
  const { data: budgetEntries = [], isLoading: loadingBudget } = useQuery({
    queryKey: ["dashboard-budget", projectIds],
    queryFn: async () => {
      if (projectIds.length === 0) return [];

      const { data, error } = await supabase
        .from("budget_entries")
        .select("id, project_id, planned_amount, actual_amount, category_id, status")
        .in("project_id", projectIds);

      if (error) throw error;
      return data;
    },
    enabled: projectIds.length > 0,
  });

  // Fetch provinces for budget breakdown
  const { data: provinces = [] } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provinces")
        .select("id, name");

      if (error) throw error;
      return data;
    },
  });

  // Fetch funders
  const { data: funders = [] } = useQuery({
    queryKey: ["funders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funders")
        .select("id, name, acronym, type");

      if (error) throw error;
      return data;
    },
  });

  // Calculate stats
  const stats: DashboardStats = {
    activeProjects: projects.filter((p) => p.status === "active").length,
    completedProjects: projects.filter((p) => p.status === "completed").length,
    delayedProjects: projects.filter((p) => p.status === "delayed").length,
    onHoldProjects: projects.filter((p) => p.status === "on_hold").length,
    totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
    totalSpent: projects.reduce((sum, p) => sum + (p.spent || 0), 0),
    executionRate: 0,
    sdgsImpacted: new Set(projectSdgs.map((ps) => (ps.sdgs as any)?.id)).size,
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t) => t.column_id === "done").length,
    inProgressTasks: tasks.filter((t) => t.column_id === "in_progress").length,
    overdueTasks: tasks.filter((t) => {
      if (!t.due_date) return false;
      return new Date(t.due_date) < new Date() && t.column_id !== "done";
    }).length,
  };

  stats.executionRate = stats.totalBudget > 0 
    ? Math.round((stats.totalSpent / stats.totalBudget) * 100) 
    : 0;

  // Calculate SDG progress
  const sdgProgress: SDGProgress[] = allSdgs.map((sdg) => {
    const projectCount = projectSdgs.filter(
      (ps) => (ps.sdgs as any)?.id === sdg.id
    ).length;
    return {
      id: sdg.id,
      number: sdg.number,
      name: sdg.name,
      color: sdg.color,
      projectCount,
    };
  }).filter((s) => s.projectCount > 0);

  // Calculate budget by province
  const budgetByProvince: BudgetByProvince[] = provinces
    .map((province) => {
      const provinceProjects = projects.filter(
        (p) => (p.province as any)?.id === province.id
      );
      return {
        province: province.name,
        allocated: provinceProjects.reduce((sum, p) => sum + (p.budget || 0), 0),
        executed: provinceProjects.reduce((sum, p) => sum + (p.spent || 0), 0),
      };
    })
    .filter((b) => b.allocated > 0)
    .sort((a, b) => b.allocated - a.allocated)
    .slice(0, 5);

  // Calculate funder data
  const funderData: FunderData[] = funders
    .map((funder) => {
      const funderProjects = projects.filter(
        (p) => (p.funder as any)?.id === funder.id
      );
      return {
        id: funder.id,
        name: funder.name,
        acronym: funder.acronym,
        totalAmount: funderProjects.reduce((sum, p) => sum + (p.budget || 0), 0),
        projectCount: funderProjects.length,
      };
    })
    .filter((f) => f.projectCount > 0)
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // Get upcoming deadlines
  const today = new Date();
  const upcomingDeadlines: UpcomingDeadline[] = tasks
    .filter((t) => {
      if (!t.due_date || t.column_id === "done") return false;
      const dueDate = new Date(t.due_date);
      return dueDate >= today;
    })
    .map((t) => {
      const project = projects.find((p) => p.id === t.project_id);
      return {
        id: t.id,
        title: t.title,
        dueDate: t.due_date!,
        projectName: project?.name || "Projecto",
        priority: t.priority,
      };
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  // Projects by status for charts
  const projectsByStatus = [
    { status: "Activo", count: stats.activeProjects, color: "hsl(var(--success))" },
    { status: "Em Atraso", count: stats.delayedProjects, color: "hsl(var(--warning))" },
    { status: "Concluído", count: stats.completedProjects, color: "hsl(var(--info))" },
    { status: "Em Espera", count: stats.onHoldProjects, color: "hsl(var(--muted))" },
  ].filter((s) => s.count > 0);

  const isLoading = loadingProjects || loadingTasks || loadingSdgs || loadingBudget;

  return {
    stats,
    projects,
    tasks,
    sdgProgress,
    budgetByProvince,
    funderData,
    upcomingDeadlines,
    projectsByStatus,
    budgetEntries,
    isLoading,
  };
}
