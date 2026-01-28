import { useAuthContext } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { PublicEntityDashboard } from "@/components/dashboard/PublicEntityDashboard";
import { PrivateEntityDashboard } from "@/components/dashboard/PrivateEntityDashboard";
import { NGOEntityDashboard } from "@/components/dashboard/NGOEntityDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { profile } = useAuthContext();
  const { entityType, loading } = useOrganization();
  
  const firstName = profile?.full_name?.split(" ")[0] || "Utilizador";

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Skeleton className="xl:col-span-2 h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  // Render dashboard based on entity type
  switch (entityType) {
    case "public":
      return <PublicEntityDashboard userName={firstName} />;
    case "private":
      return <PrivateEntityDashboard userName={firstName} />;
    case "ngo":
      return <NGOEntityDashboard userName={firstName} />;
    default:
      // Default to public dashboard if no entity type is set
      return <PublicEntityDashboard userName={firstName} />;
  }
}
