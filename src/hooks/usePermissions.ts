import { useAuthContext } from "@/contexts/AuthContext";
import { AppRole } from "@/hooks/useAuth";

interface Permissions {
  // Navigation permissions
  canAccessAdmin: boolean;
  canAccessReports: boolean;
  canAccessBudget: boolean;
  canAccessTeam: boolean;
  
  // Project permissions
  canCreateProject: boolean;
  canEditProject: boolean;
  canDeleteProject: boolean;
  
  // Task permissions
  canCreateTask: boolean;
  canEditTask: boolean;
  canDeleteTask: boolean;
  canAssignTasks: boolean;
  
  // Team permissions
  canManageTeam: boolean;
  canInviteMembers: boolean;
  
  // Budget permissions
  canViewBudget: boolean;
  canEditBudget: boolean;
  
  // Document permissions
  canUploadDocuments: boolean;
  canDeleteDocuments: boolean;
  
  // Risk permissions
  canManageRisks: boolean;
  
  // Role info
  isAdmin: boolean;
  isManager: boolean;
  isMember: boolean;
}

const roleHierarchy: Record<AppRole, number> = {
  admin: 3,
  manager: 2,
  member: 1,
};

export function usePermissions(): Permissions {
  const { role } = useAuthContext();
  
  const currentRole = role as AppRole | null;
  const roleLevel = currentRole ? roleHierarchy[currentRole] : 0;
  
  const isAdmin = currentRole === "admin";
  const isManager = currentRole === "manager";
  const isMember = currentRole === "member";
  const isManagerOrAbove = roleLevel >= roleHierarchy.manager;
  
  return {
    // Navigation permissions
    canAccessAdmin: isAdmin,
    canAccessReports: isManagerOrAbove,
    canAccessBudget: isManagerOrAbove,
    canAccessTeam: true, // All can view team
    
    // Project permissions
    canCreateProject: isManagerOrAbove,
    canEditProject: isManagerOrAbove,
    canDeleteProject: isAdmin,
    
    // Task permissions
    canCreateTask: true, // All authenticated users can create tasks
    canEditTask: true, // All can edit tasks assigned to them
    canDeleteTask: isManagerOrAbove,
    canAssignTasks: isManagerOrAbove,
    
    // Team permissions
    canManageTeam: isAdmin,
    canInviteMembers: isAdmin,
    
    // Budget permissions
    canViewBudget: isManagerOrAbove,
    canEditBudget: isAdmin,
    
    // Document permissions
    canUploadDocuments: true,
    canDeleteDocuments: isManagerOrAbove,
    
    // Risk permissions
    canManageRisks: isManagerOrAbove,
    
    // Role info
    isAdmin,
    isManager,
    isMember,
  };
}

// Helper function to check if user has minimum required role
export function hasMinimumRole(userRole: AppRole | null, requiredRole: AppRole): boolean {
  if (!userRole) return false;
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
