import { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { Breadcrumbs } from "./Breadcrumbs";
import { ChatbotWidget } from "@/components/chatbot/ChatbotWidget";
import { TrialExpiredBanner } from "@/components/subscription/TrialExpiredBanner";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 z-50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <AppSidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <TopBar onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <TrialExpiredBanner />
        <main className="flex-1 p-4 lg:p-6">
          <Breadcrumbs />
          {children}
        </main>
      </div>

      <ChatbotWidget />
    </div>
  );
}
