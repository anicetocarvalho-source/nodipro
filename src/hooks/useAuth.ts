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
    resetUserData();
  }, [resetUserData]);

  const { signIn, signUp, signOut } = useAuthActions(handleSignOut);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (event === "SIGNED_OUT") {
          resetUserData();
          return;
        }

        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          resetUserData();
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserData(session.user.id);
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
    signIn,
    signUp,
    signOut,
  };
}
