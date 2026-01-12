import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Portfolio from "./pages/Portfolio";
import KPI from "./pages/KPI";
import Risks from "./pages/Risks";
import Team from "./pages/Team";
import Documents from "./pages/Documents";
import Communication from "./pages/Communication";
import Budget from "./pages/Budget";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrapper component for protected pages with AppLayout
const ProtectedPageWrapper = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>{children}</AppLayout>
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
            <Route path="/projects" element={<ProtectedPageWrapper><Projects /></ProtectedPageWrapper>} />
            <Route path="/projects/:id" element={<ProtectedPageWrapper><ProjectDetail /></ProtectedPageWrapper>} />
            <Route path="/portfolio" element={<ProtectedPageWrapper><Portfolio /></ProtectedPageWrapper>} />
            <Route path="/kpi" element={<ProtectedPageWrapper><KPI /></ProtectedPageWrapper>} />
            <Route path="/risks" element={<ProtectedPageWrapper><Risks /></ProtectedPageWrapper>} />
            <Route path="/team" element={<ProtectedPageWrapper><Team /></ProtectedPageWrapper>} />
            <Route path="/documents" element={<ProtectedPageWrapper><Documents /></ProtectedPageWrapper>} />
            <Route path="/communication" element={<ProtectedPageWrapper><Communication /></ProtectedPageWrapper>} />
            <Route path="/budget" element={<ProtectedPageWrapper><Budget /></ProtectedPageWrapper>} />
            <Route path="/reports" element={<ProtectedPageWrapper><Reports /></ProtectedPageWrapper>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
