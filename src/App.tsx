import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleProtectedRoute } from "@/components/auth/RoleProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { AccountLayout } from "@/components/layout/AccountLayout";
import { Loader2 } from "lucide-react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy-loaded pages
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const ProgramDetail = lazy(() => import("./pages/ProgramDetail"));
const Methodologies = lazy(() => import("./pages/Methodologies"));
const KPI = lazy(() => import("./pages/KPI"));
const Risks = lazy(() => import("./pages/Risks"));
const Team = lazy(() => import("./pages/Team"));
const Documents = lazy(() => import("./pages/Documents"));
const Communication = lazy(() => import("./pages/Communication"));
const Budget = lazy(() => import("./pages/BudgetNew"));
const Reports = lazy(() => import("./pages/Reports"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const Settings = lazy(() => import("./pages/Settings"));
const Help = lazy(() => import("./pages/Help"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Governance = lazy(() => import("./pages/Governance"));
const Sprints = lazy(() => import("./pages/Sprints"));
const LogFrame = lazy(() => import("./pages/LogFrame"));
const EVM = lazy(() => import("./pages/EVM"));
const Procurement = lazy(() => import("./pages/Procurement"));
const Stakeholders = lazy(() => import("./pages/Stakeholders"));
const ChangeRequests = lazy(() => import("./pages/ChangeRequests"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Wrapper component for protected pages with AppLayout
const ProtectedPageWrapper = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </AppLayout>
  </ProtectedRoute>
);

// Wrapper for role-protected pages (manager or above)
const ManagerPageWrapper = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>
      <RoleProtectedRoute requiredRole="manager">
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </RoleProtectedRoute>
    </AppLayout>
  </ProtectedRoute>
);

// Wrapper for admin-only pages
const AdminPageWrapper = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>
      <RoleProtectedRoute requiredRole="admin">
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </RoleProtectedRoute>
    </AppLayout>
  </ProtectedRoute>
);

// Wrapper for account pages (profile, settings, subscription)
const AccountPageWrapper = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AccountLayout>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </AccountLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <OrganizationProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<Suspense fallback={<PageLoader />}><ResetPassword /></Suspense>} />
              <Route path="/onboarding" element={<Suspense fallback={<PageLoader />}><Onboarding /></Suspense>} />
              <Route path="/subscription" element={<AccountPageWrapper><Subscription /></AccountPageWrapper>} />
              <Route path="/governance" element={<ManagerPageWrapper><Governance /></ManagerPageWrapper>} />
              <Route path="/dashboard" element={<ProtectedPageWrapper><Dashboard /></ProtectedPageWrapper>} />
              <Route path="/projects" element={<ProtectedPageWrapper><Projects /></ProtectedPageWrapper>} />
              <Route path="/projects/:id" element={<ProtectedPageWrapper><ProjectDetail /></ProtectedPageWrapper>} />
              <Route path="/sprints" element={<ProtectedPageWrapper><Sprints /></ProtectedPageWrapper>} />
              <Route path="/logframe" element={<ProtectedPageWrapper><LogFrame /></ProtectedPageWrapper>} />
              <Route path="/evm" element={<ManagerPageWrapper><EVM /></ManagerPageWrapper>} />
              <Route path="/procurement" element={<ManagerPageWrapper><Procurement /></ManagerPageWrapper>} />
              <Route path="/stakeholders" element={<ProtectedPageWrapper><Stakeholders /></ProtectedPageWrapper>} />
              <Route path="/change-requests" element={<ManagerPageWrapper><ChangeRequests /></ManagerPageWrapper>} />
              <Route path="/portfolio" element={<ManagerPageWrapper><Portfolio /></ManagerPageWrapper>} />
              <Route path="/programs/:id" element={<ManagerPageWrapper><ProgramDetail /></ManagerPageWrapper>} />
              <Route path="/methodologies" element={<ManagerPageWrapper><Methodologies /></ManagerPageWrapper>} />
              <Route path="/kpi" element={<ProtectedPageWrapper><KPI /></ProtectedPageWrapper>} />
              <Route path="/risks" element={<ManagerPageWrapper><Risks /></ManagerPageWrapper>} />
              <Route path="/team" element={<ProtectedPageWrapper><Team /></ProtectedPageWrapper>} />
              <Route path="/documents" element={<ProtectedPageWrapper><Documents /></ProtectedPageWrapper>} />
              <Route path="/communication" element={<ProtectedPageWrapper><Communication /></ProtectedPageWrapper>} />
              <Route path="/budget" element={<ManagerPageWrapper><Budget /></ManagerPageWrapper>} />
              <Route path="/reports" element={<ManagerPageWrapper><Reports /></ManagerPageWrapper>} />
              <Route path="/profile" element={<AccountPageWrapper><Profile /></AccountPageWrapper>} />
              <Route path="/admin" element={<AdminPageWrapper><Admin /></AdminPageWrapper>} />
              <Route path="/superadmin" element={<ProtectedPageWrapper><SuperAdmin /></ProtectedPageWrapper>} />
              <Route path="/settings" element={<AccountPageWrapper><Settings /></AccountPageWrapper>} />
              <Route path="/help" element={<ProtectedPageWrapper><Help /></ProtectedPageWrapper>} />
              <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
            </Routes>
          </OrganizationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
