import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";

export interface Conversation {
  id: string;
  name: string | null;
  type: string;
  organization_id: string | null;
  project_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  participants: Participant[];
  last_message?: Message | null;
  unread_count: number;
}

export interface Participant {
  id: string;
  conversation_id: string;
  user_id: string;
  user_name: string | null;
  user_initials: string | null;
  last_read_at: string | null;
  joined_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string | null;
  sender_initials: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

// Fetch all conversations for the current user
export function useConversations() {
  const { user } = useAuthContext();
  const { organization } = useOrganization();

  return useQuery({
    queryKey: ["conversations", user?.id, organization?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get conversations
      const { data: conversations, error } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      if (!conversations?.length) return [];

      const convIds = conversations.map((c) => c.id);

      // Fetch participants for these conversations
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("*")
        .in("conversation_id", convIds);

      // Fetch latest message per conversation
      const { data: allMessages } = await supabase
        .from("messages")
        .select("*")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false });

      // Build conversation objects
      const result: Conversation[] = conversations.map((conv) => {
        const convParticipants = (participants || []).filter(
          (p) => p.conversation_id === conv.id
        );
        const convMessages = (allMessages || []).filter(
          (m) => m.conversation_id === conv.id
        );
        const lastMessage = convMessages[0] || null;

        // Count unread messages
        const myParticipation = convParticipants.find(
          (p) => p.user_id === user.id
        );
        const lastReadAt = myParticipation?.last_read_at;
        const unreadCount = lastReadAt
          ? convMessages.filter(
              (m) =>
                new Date(m.created_at) > new Date(lastReadAt) &&
                m.sender_id !== user.id
            ).length
          : convMessages.filter((m) => m.sender_id !== user.id).length;

        return {
          ...conv,
          participants: convParticipants,
          last_message: lastMessage,
          unread_count: unreadCount,
        };
      });

      return result;
    },
    enabled: !!user,
  });
}

// Fetch messages for a specific conversation
export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as Message[];
    },
    enabled: !!conversationId,
  });
}

// Real-time subscription for new messages
export function useRealtimeMessages(conversationId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          queryClient.setQueryData<Message[]>(
            ["messages", conversationId],
            (old) => (old ? [...old, newMessage] : [newMessage])
          );
          // Also refresh conversations to update last_message and unread
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);
}

// Send a message
export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuthContext();

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
    }: {
      conversationId: string;
      content: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const initials = profile?.full_name
        ? profile.full_name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "?";

      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          sender_name: profile?.full_name || "Utilizador",
          sender_initials: initials,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation updated_at
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      return data as Message;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// Create a new conversation
export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuthContext();
  const { organization } = useOrganization();

  return useMutation({
    mutationFn: async ({
      name,
      type,
      participantIds,
      participantNames,
    }: {
      name?: string;
      type: "direct" | "group" | "project";
      participantIds: string[];
      participantNames: { id: string; name: string; initials: string }[];
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Create conversation
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .insert({
          name: name || null,
          type,
          organization_id: organization?.id || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add creator as participant
      const myInitials = profile?.full_name
        ? profile.full_name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "?";

      const participantsToInsert = [
        {
          conversation_id: conv.id,
          user_id: user.id,
          user_name: profile?.full_name || "Utilizador",
          user_initials: myInitials,
        },
        ...participantNames
          .filter((p) => p.id !== user.id)
          .map((p) => ({
            conversation_id: conv.id,
            user_id: p.id,
            user_name: p.name,
            user_initials: p.initials,
          })),
      ];

      const { error: partError } = await supabase
        .from("conversation_participants")
        .insert(participantsToInsert);

      if (partError) throw partError;

      return conv;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// Mark conversation as read
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user) return;

      const { error } = await supabase
        .from("conversation_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// Fetch org members for "new conversation" picker
export function useOrgMembers() {
  const { organization } = useOrganization();

  return useQuery({
    queryKey: ["org-members-for-chat", organization?.id],
    queryFn: async () => {
      if (!organization) return [];

      const { data, error } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", organization.id);

      if (error) throw error;
      if (!data?.length) return [];

      const userIds = data.map((m) => m.user_id);

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      if (profileError) throw profileError;

      return (profiles || []).map((p) => ({
        id: p.user_id,
        name: p.full_name || "Utilizador",
        initials: p.full_name
          ? p.full_name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
          : "?",
      }));
    },
    enabled: !!organization,
  });
}
