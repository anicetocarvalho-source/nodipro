import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useUserSettings() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["user_settings", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const saveSettings = useMutation({
    mutationFn: async (preferences: Record<string, unknown>) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data: existing } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_settings")
          .update({ preferences: preferences as any })
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_settings")
          .insert([{ user_id: user.id, preferences: preferences as any }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_settings"] });
      toast.success("Configurações guardadas");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { settings, isLoading, saveSettings, preferences: (settings?.preferences as Record<string, unknown>) || {} };
}
