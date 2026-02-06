import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Profile, AppRole, UserPermissions } from "@/types/auth";

export function useAuthFetch() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions>({});
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  // Refs to prevent duplicate/race-condition fetches
  const fetchingRef = useRef(false);
  const fetchedUserIdRef = useRef<string | null>(null);

  const fetchUserData = useCallback(async (userId: string) => {
    if (fetchingRef.current || fetchedUserIdRef.current === userId) {
      return;
    }

    fetchingRef.current = true;
    setPermissionsLoading(true);

    try {
      const [profileResult, roleResult, permissionsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .single(),
        supabase.rpc("get_user_role", { _user_id: userId }),
        supabase.rpc("get_user_permissions", { _user_id: userId }),
      ]);

      if (profileResult.data) {
        setProfile(profileResult.data);
      }

      if (roleResult.data) {
        setRole(roleResult.data as AppRole);
      }

      if (permissionsResult.data) {
        const perms: UserPermissions = {};
        permissionsResult.data.forEach((p: { permission_name: string; granted: boolean }) => {
          perms[p.permission_name] = p.granted;
        });
        setPermissions(perms);
      }

      fetchedUserIdRef.current = userId;
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      fetchingRef.current = false;
      setPermissionsLoading(false);
    }
  }, []);

  const resetUserData = useCallback(() => {
    setProfile(null);
    setRole(null);
    setPermissions({});
    setPermissionsLoading(true);
    fetchingRef.current = false;
    fetchedUserIdRef.current = null;
  }, []);

  return {
    profile,
    role,
    permissions,
    permissionsLoading,
    fetchUserData,
    resetUserData,
  };
}
