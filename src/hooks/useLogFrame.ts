import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LogFrameLevel, LogFrameIndicator, LogFrameLevelType } from "@/types/logframe";
import { toast } from "sonner";

export function useLogFrameLevels(projectId: string | undefined) {
  return useQuery({
    queryKey: ["logframe-levels", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("logframe_levels")
        .select("*")
        .eq("project_id", projectId)
        .order("position");
      if (error) throw error;
      return data as LogFrameLevel[];
    },
    enabled: !!projectId,
  });
}

export function useLogFrameIndicators(projectId: string | undefined) {
  return useQuery({
    queryKey: ["logframe-indicators", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("logframe_indicators")
        .select("*, logframe_levels!inner(project_id)")
        .eq("logframe_levels.project_id", projectId);
      if (error) throw error;
      return (data || []).map((d: any) => {
        const { logframe_levels, ...indicator } = d;
        return indicator;
      }) as LogFrameIndicator[];
    },
    enabled: !!projectId,
  });
}

export function useCreateLogFrameLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (level: { project_id: string; parent_id?: string | null; level_type: LogFrameLevelType; narrative: string; means_of_verification?: string; assumptions?: string; position?: number }) => {
      const { data, error } = await supabase.from("logframe_levels").insert(level).select().single();
      if (error) throw error;
      return data as LogFrameLevel;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["logframe-levels", data.project_id] });
      toast.success("Nível adicionado ao Quadro Lógico");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateLogFrameLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LogFrameLevel> & { id: string; project_id: string }) => {
      const { data, error } = await supabase.from("logframe_levels").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data as LogFrameLevel;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["logframe-levels", data.project_id] });
      toast.success("Nível atualizado");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteLogFrameLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from("logframe_levels").delete().eq("id", id);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      qc.invalidateQueries({ queryKey: ["logframe-levels", projectId] });
      toast.success("Nível removido");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useCreateLogFrameIndicator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, ...indicator }: Omit<LogFrameIndicator, 'id' | 'created_at' | 'updated_at'> & { projectId: string }) => {
      const { data, error } = await supabase.from("logframe_indicators").insert(indicator).select().single();
      if (error) throw error;
      return { ...data, projectId } as LogFrameIndicator & { projectId: string };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["logframe-indicators", data.projectId] });
      toast.success("Indicador adicionado");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateLogFrameIndicator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projectId, ...updates }: Partial<LogFrameIndicator> & { id: string; projectId: string }) => {
      const { data, error } = await supabase.from("logframe_indicators").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return { ...data, projectId };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["logframe-indicators", data.projectId] });
      toast.success("Indicador atualizado");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteLogFrameIndicator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from("logframe_indicators").delete().eq("id", id);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      qc.invalidateQueries({ queryKey: ["logframe-indicators", projectId] });
      toast.success("Indicador removido");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

// Utility: build tree from flat list
export function buildLogFrameTree(levels: LogFrameLevel[], indicators: LogFrameIndicator[]): LogFrameLevel[] {
  const indicatorsByLevel = new Map<string, LogFrameIndicator[]>();
  indicators.forEach(ind => {
    const list = indicatorsByLevel.get(ind.level_id) || [];
    list.push(ind);
    indicatorsByLevel.set(ind.level_id, list);
  });

  const levelMap = new Map<string, LogFrameLevel>();
  levels.forEach(l => levelMap.set(l.id, { ...l, children: [], indicators: indicatorsByLevel.get(l.id) || [] }));

  const roots: LogFrameLevel[] = [];
  levelMap.forEach(level => {
    if (level.parent_id && levelMap.has(level.parent_id)) {
      levelMap.get(level.parent_id)!.children!.push(level);
    } else {
      roots.push(level);
    }
  });

  return roots;
}
