import { User, Session } from "@supabase/supabase-js";

// Granular application roles
export type AppRole = "admin" | "portfolio_manager" | "project_manager" | "manager" | "member" | "observer";

export const roleLabels: Record<AppRole, string> = {
  admin: "Administrador",
  portfolio_manager: "Gestor de Portfólio",
  project_manager: "Gestor de Projecto",
  manager: "Gestor",
  member: "Membro",
  observer: "Observador",
};

export const roleHierarchy: Record<AppRole, number> = {
  admin: 6,
  portfolio_manager: 5,
  manager: 4,
  project_manager: 3,
  member: 2,
  observer: 1,
};

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPermissions {
  [key: string]: boolean;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  permissions: UserPermissions;
  permissionsLoading: boolean;
  loading: boolean;
  isPlatformAdmin: boolean;
}

export interface UseAuthReturn extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}
