import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

export interface LessonLearned {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  lesson_type: string;
  tags: string[] | null;
  author_id: string | null;
  author_name: string | null;
  created_at: string;
  updated_at: string;
  project_name?: string;
}

export function useLessonsLearned() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  const lessonsQuery = useQuery({
    queryKey: ["lessons-learned", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data: projects } = await supabase
        .from("projects")
        .select("id, name")
        .eq("organization_id", orgId);
      
      const projectIds = projects?.map(p => p.id) || [];
      if (projectIds.length === 0) return [];

      const { data, error } = await supabase
        .from("lessons_learned")
        .select("*")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      const projectMap = new Map(projects?.map(p => [p.id, p.name]) || []);
      return (data || []).map(l => ({
        ...l,
        project_name: projectMap.get(l.project_id) || "—",
      })) as LessonLearned[];
    },
    enabled: !!orgId,
  });

  const createLesson = useMutation({
    mutationFn: async (lesson: {
      project_id: string;
      title: string;
      description?: string;
      lesson_type: string;
      tags?: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user!.id)
        .maybeSingle();

      const { error } = await supabase.from("lessons_learned").insert({
        ...lesson,
        author_id: user!.id,
        author_name: profile?.full_name || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons-learned"] });
      toast.success("Lição registada com sucesso");
    },
    onError: () => toast.error("Erro ao registar lição"),
  });

  const updateLesson = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LessonLearned> & { id: string }) => {
      const { error } = await supabase
        .from("lessons_learned")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons-learned"] });
      toast.success("Lição actualizada");
    },
    onError: () => toast.error("Erro ao actualizar lição"),
  });

  const deleteLesson = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lessons_learned").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons-learned"] });
      toast.success("Lição eliminada");
    },
    onError: () => toast.error("Erro ao eliminar lição"),
  });

  return {
    lessons: lessonsQuery.data || [],
    loading: lessonsQuery.isLoading,
    createLesson,
    updateLesson,
    deleteLesson,
  };
}
