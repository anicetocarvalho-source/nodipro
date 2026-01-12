import { useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type AppRole = "admin" | "manager" | "member";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch role using the database function
      const { data: roleData } = await supabase.rpc("get_user_role", {
        _user_id: userId,
      });

      if (roleData) {
        setRole(roleData as AppRole);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer Supabase calls with setTimeout to prevent deadlocks
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
        }

        if (event === "SIGNED_OUT") {
          setProfile(null);
          setRole(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        let message = "Erro ao iniciar sessão";
        if (error.message.includes("Invalid login credentials")) {
          message = "Email ou palavra-passe incorretos";
        } else if (error.message.includes("Email not confirmed")) {
          message = "Por favor confirme o seu email antes de iniciar sessão";
        }
        toast({
          variant: "destructive",
          title: "Erro de autenticação",
          description: message,
        });
        return { error };
      }

      toast({
        title: "Bem-vindo!",
        description: "Sessão iniciada com sucesso",
      });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        let message = "Erro ao criar conta";
        if (error.message.includes("User already registered")) {
          message = "Este email já está registado";
        } else if (error.message.includes("Password should be at least")) {
          message = "A palavra-passe deve ter pelo menos 6 caracteres";
        } else if (error.message.includes("Unable to validate email")) {
          message = "Email inválido";
        }
        toast({
          variant: "destructive",
          title: "Erro de registo",
          description: message,
        });
        return { error };
      }

      toast({
        title: "Conta criada!",
        description: "A sua conta foi criada com sucesso",
      });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    toast({
      title: "Sessão terminada",
      description: "Até breve!",
    });
  };

  return {
    user,
    session,
    profile,
    role,
    loading,
    signIn,
    signUp,
    signOut,
  };
}
