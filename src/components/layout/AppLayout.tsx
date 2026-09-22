// src/components/layout/AppLayout.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { DatabaseBanner } from "../ui/DatabaseBanner";
import { useAuth } from "../../contexts/AuthContext";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isDemo, exitDemo } = useAuth(); // ⭐ from useAuth now
  const navigate = useNavigate();

  const handleExitDemo = () => {
    exitDemo();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-app">
      {/* Bandeau Mode Démo (fixe en haut) */}
      {isDemo && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black text-center py-2 text-sm font-medium flex items-center justify-center gap-3">
          <span>🎭 MODE DÉMO — Données fictives</span>
          <button
            onClick={handleExitDemo}
            className="ml-2 px-3 py-0.5 bg-black/20 hover:bg-black/30 rounded text-xs transition-colors"
          >
            Quitter
          </button>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* TopBar */}
      <TopBar onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Contenu principal */}
      <main
        className={cn(
          "transition-all duration-300 min-h-screen",
          isDemo ? "pt-24" : "pt-14",
          sidebarCollapsed ? "ml-[72px]" : "ml-[260px]",
        )}
      >
        <DatabaseBanner />
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
