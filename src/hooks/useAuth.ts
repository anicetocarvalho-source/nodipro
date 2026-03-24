import { useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuthFetch } from "@/hooks/auth/useAuthFetch";
import { useAuthActions } from "@/hooks/auth/useAuthActions";
import type { UseAuthReturn } from "@/types/auth";

// Re-export types for backward compatibility
export type { AppRole, Profile, UserPermissions, UseAuthReturn } from "@/types/auth";
export { roleLabels, roleHierarchy } from "@/types/auth";

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  const {
    profile,
    role,
    permissions,
    permissionsLoading,
    fetchUserData,
    resetUserData,
  } = useAuthFetch();

  const handleSignOut = useCallback(() => {
    setUser(null);
    setSession(null);
    setIsPlatformAdmin(false);
    resetUserData();
  }, [resetUserData]);

  const { signIn, signUp, signOut } = useAuthActions(handleSignOut);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (event === "SIGNED_OUT") {
          setIsPlatformAdmin(false);
          resetUserData();
          return;
        }

        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
            supabase.rpc('is_platform_admin', { _user_id: session.user.id })
              .then(({ data }) => setIsPlatformAdmin(!!data));
          }, 0);
        } else {
          setIsPlatformAdmin(false);
          resetUserData();
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserData(session.user.id);
        supabase.rpc('is_platform_admin', { _user_id: session.user.id })
          .then(({ data }) => setIsPlatformAdmin(!!data));
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData, resetUserData]);

  return {
    user,
    session,
    profile,
    role,
    permissions,
    permissionsLoading,
    loading,
    isPlatformAdmin,
    signIn,
    signUp,
    signOut,
  };
}
