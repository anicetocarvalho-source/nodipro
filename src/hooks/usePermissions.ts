import { useCallback } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { AppRole, roleHierarchy } from "@/hooks/useAuth";

// Define all available permissions
export type PermissionName =
  | "project.view" | "project.create" | "project.edit" | "project.delete" | "project.archive"
  | "portfolio.view" | "portfolio.manage" | "portfolio.reports" | "portfolio.create" | "portfolio.edit" | "portfolio.delete"
  | "program.create" | "program.edit" | "program.delete"
  | "task.view" | "task.create" | "task.edit" | "task.delete" | "task.assign"
  | "document.view" | "document.upload" | "document.delete" | "document.approve"
  | "budget.view" | "budget.edit" | "budget.approve"
  | "team.view" | "team.manage" | "team.invite"
  | "report.view" | "report.create" | "report.export"
  | "admin.access" | "admin.users" | "admin.roles" | "admin.audit" | "admin.settings";

export interface Permission {
  id: string;
  name: PermissionName;
  description: string;
  category: string;
}

export interface UserPermissions {
  [key: string]: boolean;
}

interface Permissions {
  // Navigation permissions
  canAccessAdmin: boolean;
  canAccessReports: boolean;
  canAccessBudget: boolean;
  canAccessTeam: boolean;
  canAccessPortfolio: boolean;
  
  // Project permissions
  canViewProjects: boolean;
  canCreateProject: boolean;
  canEditProject: boolean;
  canDeleteProject: boolean;
  canArchiveProject: boolean;
  
  // Task permissions
  canViewTasks: boolean;
  canCreateTask: boolean;
  canEditTask: boolean;
  canDeleteTask: boolean;
  canAssignTasks: boolean;
  
  // Team permissions
  canViewTeam: boolean;
  canManageTeam: boolean;
  canInviteMembers: boolean;
  
  // Budget permissions
  canViewBudget: boolean;
  canEditBudget: boolean;
  canApproveBudget: boolean;
  
  // Document permissions
  canViewDocuments: boolean;
  canUploadDocuments: boolean;
  canDeleteDocuments: boolean;
  canApproveDocuments: boolean;
  
  // Risk permissions
  canManageRisks: boolean;
  canAccessMethodologies: boolean;
  
  // Report permissions
  canViewReports: boolean;
  canCreateReports: boolean;
  canExportReports: boolean;
  
  // Role info
  isAdmin: boolean;
  isPortfolioManager: boolean;
  isProjectManager: boolean;
  isManager: boolean;
  isMember: boolean;
  isObserver: boolean;
  
  // User permissions from DB
  userPermissions: UserPermissions;
  loading: boolean;
  
  // Check specific permission
  hasPermission: (permission: PermissionName, projectId?: string) => boolean;
}

export function usePermissions(): Permissions {
  // Get permissions directly from AuthContext (already fetched and cached)
  const { role, permissions: userPermissions, permissionsLoading } = useAuthContext();
  
  const currentRole = role as AppRole | null;
  const roleLevel = currentRole ? roleHierarchy[currentRole] : 0;
  
  const isAdmin = currentRole === "admin";
  const isPortfolioManager = currentRole === "portfolio_manager";
  const isProjectManager = currentRole === "project_manager";
  const isManager = currentRole === "manager";
  const isMember = currentRole === "member";
  const isObserver = currentRole === "observer";
  
  const isManagerLevel = roleLevel >= roleHierarchy.project_manager;
  const isPortfolioLevel = roleLevel >= roleHierarchy.portfolio_manager;

  // Check if user has a specific permission
  const hasPermission = useCallback((permission: PermissionName, projectId?: string): boolean => {
    // Admin has all permissions
    if (isAdmin) return true;
    
    // Check user permissions from DB (already cached in AuthContext)
    return userPermissions[permission] === true;
  }, [isAdmin, userPermissions]);
  
  return {
    // Navigation permissions
    canAccessAdmin: isAdmin || hasPermission("admin.access"),
    canAccessReports: isPortfolioLevel || hasPermission("report.view"),
    canAccessBudget: isManagerLevel || hasPermission("budget.view"),
    canAccessTeam: true, // All can view team
    canAccessPortfolio: isPortfolioLevel || hasPermission("portfolio.view"),
    
    // Project permissions
    canViewProjects: hasPermission("project.view"),
    canCreateProject: isPortfolioLevel || hasPermission("project.create"),
    canEditProject: isManagerLevel || hasPermission("project.edit"),
    canDeleteProject: isAdmin || hasPermission("project.delete"),
    canArchiveProject: isPortfolioLevel || hasPermission("project.archive"),
    
    // Task permissions
    canViewTasks: hasPermission("task.view"),
    canCreateTask: true, // All authenticated users can create tasks
    canEditTask: true, // All can edit tasks assigned to them
    canDeleteTask: isManagerLevel || hasPermission("task.delete"),
    canAssignTasks: isManagerLevel || hasPermission("task.assign"),
    
    // Team permissions
    canViewTeam: true,
    canManageTeam: isAdmin || hasPermission("team.manage"),
    canInviteMembers: isAdmin || hasPermission("team.invite"),
    
    // Budget permissions
    canViewBudget: isManagerLevel || hasPermission("budget.view"),
    canEditBudget: isAdmin || isPortfolioManager || hasPermission("budget.edit"),
    canApproveBudget: isAdmin || hasPermission("budget.approve"),
    
    // Document permissions
    canViewDocuments: hasPermission("document.view"),
    canUploadDocuments: hasPermission("document.upload"),
    canDeleteDocuments: isManagerLevel || hasPermission("document.delete"),
    canApproveDocuments: isPortfolioLevel || hasPermission("document.approve"),
    
  // Risk permissions
  canManageRisks: isManagerLevel,
    
    // Report permissions
    canViewReports: isPortfolioLevel || hasPermission("report.view"),
    canCreateReports: isPortfolioLevel || hasPermission("report.create"),
    canExportReports: isPortfolioLevel || hasPermission("report.export"),
    
    // Methodologies access
    canAccessMethodologies: isManagerLevel || hasPermission("project.create"),
    
    // Role info
    isAdmin,
    isPortfolioManager,
    isProjectManager,
    isManager,
    isMember,
    isObserver,
    
    // User permissions from DB
    userPermissions,
    loading: permissionsLoading,
    
    // Check specific permission
    hasPermission,
  };
}

// Helper function to check if user has minimum required role
export function hasMinimumRole(userRole: AppRole | null, requiredRole: AppRole): boolean {
  if (!userRole) return false;
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
