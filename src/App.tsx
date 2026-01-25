import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleProtectedRoute } from "@/components/auth/RoleProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Portfolio from "./pages/Portfolio";
import ProgramDetail from "./pages/ProgramDetail";
import Methodologies from "./pages/Methodologies";
import KPI from "./pages/KPI";
import Risks from "./pages/Risks";
import Team from "./pages/Team";
import Documents from "./pages/Documents";
import Communication from "./pages/Communication";
import Budget from "./pages/BudgetNew";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import Governance from "./pages/Governance";

const queryClient = new QueryClient();

// Wrapper component for protected pages with AppLayout
const ProtectedPageWrapper = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

// Wrapper for role-protected pages (manager or above)
const ManagerPageWrapper = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>
      <RoleProtectedRoute requiredRole="manager">{children}</RoleProtectedRoute>
    </AppLayout>
  </ProtectedRoute>
);

// Wrapper for admin-only pages
const AdminPageWrapper = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>
      <RoleProtectedRoute requiredRole="admin">{children}</RoleProtectedRoute>
    </AppLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/governance" element={<ManagerPageWrapper><Governance /></ManagerPageWrapper>} />
            <Route path="/projects" element={<ProtectedPageWrapper><Projects /></ProtectedPageWrapper>} />
            <Route path="/projects/:id" element={<ProtectedPageWrapper><ProjectDetail /></ProtectedPageWrapper>} />
            <Route path="/portfolio" element={<ProtectedPageWrapper><Portfolio /></ProtectedPageWrapper>} />
            <Route path="/programs/:id" element={<ProtectedPageWrapper><ProgramDetail /></ProtectedPageWrapper>} />
            <Route path="/methodologies" element={<ProtectedPageWrapper><Methodologies /></ProtectedPageWrapper>} />
            <Route path="/kpi" element={<ProtectedPageWrapper><KPI /></ProtectedPageWrapper>} />
            <Route path="/risks" element={<ManagerPageWrapper><Risks /></ManagerPageWrapper>} />
            <Route path="/team" element={<ProtectedPageWrapper><Team /></ProtectedPageWrapper>} />
            <Route path="/documents" element={<ProtectedPageWrapper><Documents /></ProtectedPageWrapper>} />
            <Route path="/communication" element={<ProtectedPageWrapper><Communication /></ProtectedPageWrapper>} />
            <Route path="/budget" element={<ManagerPageWrapper><Budget /></ManagerPageWrapper>} />
            <Route path="/reports" element={<ManagerPageWrapper><Reports /></ManagerPageWrapper>} />
            <Route path="/profile" element={<ProtectedPageWrapper><Profile /></ProtectedPageWrapper>} />
            <Route path="/admin" element={<AdminPageWrapper><Admin /></AdminPageWrapper>} />
            <Route path="/settings" element={<ProtectedPageWrapper><Settings /></ProtectedPageWrapper>} />
            <Route path="/help" element={<ProtectedPageWrapper><Help /></ProtectedPageWrapper>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
