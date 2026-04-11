import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface DbNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  module: string | null;
  project_id: string | null;
  action_url: string | null;
  is_read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as DbNotification[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as DbNotification;
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
          if (newNotif.type === "error") {
            toast.error(newNotif.title, { description: newNotif.message });
          } else if (newNotif.type === "warning") {
            toast.warning(newNotif.title, { description: newNotif.message });
          } else {
            toast.info(newNotif.title, { description: newNotif.message });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  const markAsRead = useCallback(async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
  }, [user?.id, queryClient]);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
  }, [user?.id, queryClient]);

  const clearAll = useCallback(async () => {
    if (!user?.id) return;
    await supabase.from("notifications").delete().eq("user_id", user.id);
    queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
  }, [user?.id, queryClient]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, clearAll };
}
