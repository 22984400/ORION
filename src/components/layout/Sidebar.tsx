// src/components/layout/Sidebar.tsx

import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Target,
  ClipboardCheck,
  Search,
  FileText,
  Package,
  Landmark,
  CalendarDays,
  Users,
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  Hexagon,
  BookOpen,
  Receipt,
  ClipboardList,
  FolderOpen, // ✅ ajout pour Ressources internes
} from "lucide-react";
import { cn } from "../../lib/utils";
import { NAV_ITEMS } from "../../lib/constants";
import { NotificationBadge } from "../ui/NotificationBadge";

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  LayoutDashboard,
  Building2,
  Target,
  ClipboardCheck,
  Search,
  FileText,
  Package,
  Landmark,
  CalendarDays,
  Users,
  BarChart3,
  Bell,
  BookOpen,
  Receipt,
  ClipboardList,
  FolderOpen, // ✅ ajout dans le map
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-slate-900 border-r border-slate-700/50 transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
      role="navigation"
      aria-label="Navigation principale"
    >
      <div className="flex items-center h-14 px-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
            <Hexagon className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-base font-semibold text-slate-50 tracking-tight">
                ORION
              </h1>
              <p className="text-2xs text-slate-500 -mt-0.5">
                Gestion d'entreprise
              </p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        {NAV_ITEMS.map((section, si) => (
          <div key={section.section} className={cn(si > 0 && "mt-6")}>
            {!collapsed && (
              <p className="px-3 mb-2 text-2xs font-medium text-slate-500 uppercase tracking-widest">
                {section.section}
              </p>
            )}
            <ul className="space-y-1" role="list">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                const isNotifications = item.id === "notifications";

                return (
                  <li key={item.id}>
                    <button
                      onClick={() => navigate(item.path)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150 group",
                        isActive
                          ? "bg-primary-600/15 text-primary-300"
                          : "text-slate-400 hover:bg-slate-700/40 hover:text-slate-200",
                      )}
                      aria-current={isActive ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                    >
                      {isNotifications ? (
                        <NotificationBadge
                          iconClassName={cn(
                            "w-5 h-5 shrink-0 transition-colors",
                            isActive
                              ? "text-primary-400"
                              : "text-slate-400 group-hover:text-slate-200",
                          )}
                        />
                      ) : (
                        (() => {
                          const Icon = iconMap[item.icon];
                          return (
                            Icon && (
                              <Icon
                                className={cn(
                                  "w-5 h-5 shrink-0 transition-colors",
                                  isActive
                                    ? "text-primary-400"
                                    : "text-slate-400 group-hover:text-slate-200",
                                )}
                              />
                            )
                          );
                        })()
                      )}
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                      {isActive && !collapsed && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-700/50">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-700/40 hover:text-slate-200 transition-colors"
          aria-label={collapsed ? "Étendre la sidebar" : "Réduire la sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
          {!collapsed && <span className="text-xs">Réduire</span>}
        </button>
      </div>
    </aside>
  );
}
