import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useAuthActions(onSignOut: () => void) {
  const { toast } = useToast();

  const signIn = useCallback(async (email: string, password: string) => {
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
  }, [toast]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { full_name: fullName },
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
  }, [toast]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    onSignOut();
    toast({
      title: "Sessão terminada",
      description: "Até breve!",
    });
  }, [onSignOut, toast]);

  return { signIn, signUp, signOut };
}
