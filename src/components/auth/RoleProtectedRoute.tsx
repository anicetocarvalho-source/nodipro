import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { AppRole } from "@/hooks/useAuth";
import { hasMinimumRole } from "@/hooks/usePermissions";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: AppRole;
  fallbackPath?: string;
}

export function RoleProtectedRoute({ 
  children, 
  requiredRole, 
  fallbackPath = "/projects" 
}: RoleProtectedRouteProps) {
  const { user, role, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const hasAccess = hasMinimumRole(role as AppRole | null, requiredRole);

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="h-10 w-10 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Acesso Restrito</h1>
          <p className="text-muted-foreground max-w-md">
            Não tem permissões para aceder a esta página. 
            Esta funcionalidade está disponível apenas para utilizadores com role de{" "}
            <span className="font-semibold text-foreground">
              {requiredRole === "admin" ? "Administrador" : "Gestor"}
            </span>{" "}
            ou superior.
          </p>
        </div>
        <Button onClick={() => window.history.back()} variant="outline">
          Voltar
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
