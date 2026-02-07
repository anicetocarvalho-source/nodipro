import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DbRetrospective, DbRetroItem, DbRetroFeedback, DbRetroAction } from "@/types/database";
import { toast } from "sonner";

export function useRetrospective(sprintId: string | undefined) {
  return useQuery({
    queryKey: ["retrospective", sprintId],
    queryFn: async () => {
      if (!sprintId) return null;
      const { data, error } = await supabase
        .from("sprint_retrospectives")
        .select("*")
        .eq("sprint_id", sprintId)
        .maybeSingle();
      if (error) throw error;
      return data as DbRetrospective | null;
    },
    enabled: !!sprintId,
  });
}

export function useRetroItems(retroId: string | undefined) {
  return useQuery({
    queryKey: ["retro-items", retroId],
    queryFn: async () => {
      if (!retroId) return [];
      const { data, error } = await supabase
        .from("retrospective_items")
        .select("*")
        .eq("retrospective_id", retroId)
        .order("votes_count", { ascending: false });
      if (error) throw error;
      return data as DbRetroItem[];
    },
    enabled: !!retroId,
  });
}

export function useRetroFeedback(retroId: string | undefined) {
  return useQuery({
    queryKey: ["retro-feedback", retroId],
    queryFn: async () => {
      if (!retroId) return [];
      const { data, error } = await supabase
        .from("retrospective_feedback")
        .select("*")
        .eq("retrospective_id", retroId);
      if (error) throw error;
      return data as DbRetroFeedback[];
    },
    enabled: !!retroId,
  });
}

export function useRetroActions(retroId: string | undefined) {
  return useQuery({
    queryKey: ["retro-actions", retroId],
    queryFn: async () => {
      if (!retroId) return [];
      const { data, error } = await supabase
        .from("retrospective_actions")
        .select("*")
        .eq("retrospective_id", retroId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as DbRetroAction[];
    },
    enabled: !!retroId,
  });
}

export function useCreateRetrospective() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (retro: { sprint_id: string; project_id: string; facilitator_id?: string; facilitator_name?: string }) => {
      const { data, error } = await supabase
        .from("sprint_retrospectives")
        .insert(retro)
        .select()
        .single();
      if (error) throw error;
      return data as DbRetrospective;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["retrospective", data.sprint_id] });
      toast.success("Retrospetiva criada!");
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}

export function useAddRetroItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: { retrospective_id: string; category: string; content: string; author_id?: string; author_name?: string }) => {
      const { data, error } = await supabase
        .from("retrospective_items")
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data as DbRetroItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["retro-items", data.retrospective_id] });
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}

export function useVoteRetroItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, userId, retroId }: { itemId: string; userId: string; retroId: string }) => {
      // Try insert, if conflict then delete (toggle)
      const { error: insertError } = await supabase
        .from("retrospective_votes")
        .insert({ item_id: itemId, user_id: userId });

      if (insertError) {
        // Conflict = already voted, remove vote
        await supabase
          .from("retrospective_votes")
          .delete()
          .eq("item_id", itemId)
          .eq("user_id", userId);

        // Decrement vote count - fetch current then update
        const { data: currentItem } = await supabase
          .from("retrospective_items")
          .select("votes_count")
          .eq("id", itemId)
          .single();
        if (currentItem) {
          await supabase.from("retrospective_items").update({ votes_count: Math.max(0, (currentItem.votes_count || 0) - 1) }).eq("id", itemId);
        }
      } else {
        // Increment vote count
        const { data: currentItem } = await supabase
          .from("retrospective_items")
          .select("votes_count")
          .eq("id", itemId)
          .single();
        if (currentItem) {
          await supabase.from("retrospective_items").update({ votes_count: (currentItem.votes_count || 0) + 1 }).eq("id", itemId);
        }
      }
      return retroId;
    },
    onSuccess: (retroId) => {
      queryClient.invalidateQueries({ queryKey: ["retro-items", retroId] });
    },
  });
}

export function useSubmitRetroFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (feedback: { retrospective_id: string; user_id: string; user_name?: string; satisfaction_rating?: number; velocity_rating?: number; notes?: string }) => {
      const { data, error } = await supabase
        .from("retrospective_feedback")
        .upsert(feedback, { onConflict: "retrospective_id,user_id" })
        .select()
        .single();
      if (error) throw error;
      return data as DbRetroFeedback;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["retro-feedback", data.retrospective_id] });
      toast.success("Feedback submetido!");
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}

export function useAddRetroAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (action: { retrospective_id: string; description: string; assignee_id?: string; assignee_name?: string; due_date?: string }) => {
      const { data, error } = await supabase
        .from("retrospective_actions")
        .insert(action)
        .select()
        .single();
      if (error) throw error;
      return data as DbRetroAction;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["retro-actions", data.retrospective_id] });
      toast.success("Acção adicionada!");
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateRetroAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, retroId, ...updates }: { id: string; retroId: string; status?: string }) => {
      const { error } = await supabase
        .from("retrospective_actions")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
      return retroId;
    },
    onSuccess: (retroId) => {
      queryClient.invalidateQueries({ queryKey: ["retro-actions", retroId] });
    },
  });
}

export function useCompleteRetrospective() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, sprintId, summary }: { id: string; sprintId: string; summary?: string }) => {
      const { error } = await supabase
        .from("sprint_retrospectives")
        .update({ status: "completed", summary, completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      return sprintId;
    },
    onSuccess: (sprintId) => {
      queryClient.invalidateQueries({ queryKey: ["retrospective", sprintId] });
      toast.success("Retrospetiva concluída!");
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}
