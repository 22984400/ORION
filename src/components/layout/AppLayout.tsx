// src/components/layout/AppLayout.tsx
import { useState } from "react";
import { cn } from "../../lib/utils";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { DatabaseBanner } from "../ui/DatabaseBanner";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <TopBar onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <main
        className={cn(
          "pt-14 transition-all duration-300 min-h-screen",
          sidebarCollapsed ? "ml-[72px]" : "ml-[260px]",
        )}
      >
        <DatabaseBanner />
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
