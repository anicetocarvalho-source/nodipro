import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { usePlatformAdmin } from "@/hooks/usePlatformAdmin";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuthContext();
  const { needsOnboarding, loading: orgLoading } = useOrganization();
  const { isPlatformAdmin, loading: platformLoading } = usePlatformAdmin();
  const location = useLocation();

  if (authLoading || orgLoading || platformLoading) {
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
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Platform admins skip onboarding and go directly to backoffice
  if (isPlatformAdmin) {
    if (location.pathname === "/dashboard" || location.pathname === "/") {
      return <Navigate to="/superadmin" replace />;
    }
    // Allow platform admin to access /superadmin and account pages
    return <>{children}</>;
  }

  // Redirect to onboarding if user hasn't completed it
  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
