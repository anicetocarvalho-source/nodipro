import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "@/hooks/use-toast";

export interface TimeEntry {
  id: string;
  user_id: string;
  organization_id: string;
  project_id: string | null;
  task_id: string | null;
  entry_date: string;
  hours: number;
  description: string | null;
  billable: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCapacity {
  id: string;
  user_id: string;
  organization_id: string;
  weekly_hours: number;
  effective_from: string;
  effective_to: string | null;
  notes: string | null;
}

export function useMyTimeEntries(weekStart?: string, weekEnd?: string) {
  const { user } = useAuthContext();
  return useQuery({
    queryKey: ["time_entries", "me", weekStart, weekEnd],
    enabled: !!user,
    queryFn: async (): Promise<TimeEntry[]> => {
      let q = supabase
        .from("time_entries")
        .select("*")
        .eq("user_id", user!.id)
        .order("entry_date", { ascending: false });
      if (weekStart) q = q.gte("entry_date", weekStart);
      if (weekEnd) q = q.lte("entry_date", weekEnd);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as TimeEntry[];
    },
  });
}

export function useOrgTimeEntries(from?: string, to?: string) {
  const { organization } = useOrganization();
  return useQuery({
    queryKey: ["time_entries", "org", organization?.id, from, to],
    enabled: !!organization,
    queryFn: async (): Promise<TimeEntry[]> => {
      let q = supabase
        .from("time_entries")
        .select("*")
        .eq("organization_id", organization!.id)
        .order("entry_date", { ascending: false });
      if (from) q = q.gte("entry_date", from);
      if (to) q = q.lte("entry_date", to);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as TimeEntry[];
    },
  });
}

export function useCreateTimeEntry() {
  const qc = useQueryClient();
  const { user } = useAuthContext();
  const { organization } = useOrganization();
  return useMutation({
    mutationFn: async (entry: {
      project_id?: string | null;
      task_id?: string | null;
      entry_date: string;
      hours: number;
      description?: string;
      billable?: boolean;
    }) => {
      if (!user || !organization) throw new Error("Sem sessão");
      const { data, error } = await supabase
        .from("time_entries")
        .insert({
          user_id: user.id,
          organization_id: organization.id,
          ...entry,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Horas registadas" });
      qc.invalidateQueries({ queryKey: ["time_entries"] });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("time_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Registo eliminado" });
      qc.invalidateQueries({ queryKey: ["time_entries"] });
    },
  });
}

export function useUserCapacity() {
  const { user } = useAuthContext();
  const { organization } = useOrganization();
  return useQuery({
    queryKey: ["user_capacity", user?.id, organization?.id],
    enabled: !!user && !!organization,
    queryFn: async (): Promise<UserCapacity | null> => {
      const { data, error } = await supabase
        .from("user_capacity")
        .select("*")
        .eq("user_id", user!.id)
        .eq("organization_id", organization!.id)
        .order("effective_from", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as UserCapacity | null;
    },
  });
}

export function useUpsertCapacity() {
  const qc = useQueryClient();
  const { user } = useAuthContext();
  const { organization } = useOrganization();
  return useMutation({
    mutationFn: async (weekly_hours: number) => {
      if (!user || !organization) throw new Error("Sem sessão");
      const { data, error } = await supabase
        .from("user_capacity")
        .upsert({
          user_id: user.id,
          organization_id: organization.id,
          weekly_hours,
          effective_from: new Date().toISOString().slice(0, 10),
        }, { onConflict: "user_id,organization_id,effective_from" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Capacidade atualizada" });
      qc.invalidateQueries({ queryKey: ["user_capacity"] });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}
