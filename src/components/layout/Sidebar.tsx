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
  Wallet,
  Hexagon,
  BookOpen,
  Receipt,
  Truck,
  ClipboardList,
  FolderOpen, // ✅ ajout pour Ressources internes
} from "lucide-react";
import { cn } from "../../lib/utils";
import { NAV_ITEMS } from "../../lib/constants";
import { useTranslation } from "react-i18next";
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
  Truck,
  Wallet,
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
  const { t } = useTranslation();

  const sectionLabels: Record<string, string> = {
    principal: t("navigation.principal"),
    cabinet: t("navigation.cabinet"),
    missions: t("navigation.missions"),
    opérations: t("navigation.operations"),
    operations: t("navigation.operations"),
    personnel: t("navigation.personnel"),
    administration: t("navigation.administration"),
  };

  const itemLabels: Record<string, string> = {
    dashboard: t("navigation.dashboard"),
    "note-de-frais": t("navigation.expenses"),
    resources: t("navigation.resources"),
    stock: t("navigation.stock"),
    "fixed-assets": t("navigation.assets"),
    manuel: t("navigation.manuel"),
    "working-papers": t("navigation.needs"),
    factures: t("navigation.invoices"),
    "missions-cac": t("navigation.cac"),
    clients: t("navigation.clients"),
    engagements: t("navigation.missions"),
    "review-notes": t("navigation.review_notes"),
    findings: t("navigation.findings"),
    "cac-suivi": t("navigation.cac_followup"),
    leave: t("navigation.leaves"),
    collaborateurs: t("navigation.collaborators"),
    team: t("navigation.team"),
    reports: t("navigation.reports"),
    notifications: t("navigation.notifications"),
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-app-secondary border-r border-app transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
      role="navigation"
      aria-label="Navigation principale"
    >
      <div className="flex items-center h-14 px-4 border-b border-app">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
            <Hexagon className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-base font-semibold text-app-primary tracking-tight">
                {t("app.title")}
              </h1>
              <p className="text-2xs text-app-tertiary -mt-0.5">
                {t("app.subtitle")}
              </p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        {NAV_ITEMS.map((section, si) => (
          <div key={section.section} className={cn(si > 0 && "mt-6")}>
            {!collapsed && (
              <p className="px-3 mb-2 text-2xs font-medium text-app-tertiary uppercase tracking-widest">
                {sectionLabels[section.section.toLowerCase()] ??
                  section.section}
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
                          ? "bg-primary-600/15 text-primary-600 dark:text-primary-300"
                          : "text-app-secondary hover:bg-app-tertiary hover:text-app-primary",
                      )}
                      aria-current={isActive ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                    >
                      {isNotifications ? (
                        <NotificationBadge
                          iconClassName={cn(
                            "w-5 h-5 shrink-0 transition-colors",
                            isActive
                              ? "text-primary-500 dark:text-primary-400"
                              : "text-app-secondary group-hover:text-app-primary",
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
                                    ? "text-primary-500 dark:text-primary-400"
                                    : "text-app-secondary group-hover:text-app-primary",
                                )}
                              />
                            )
                          );
                        })()
                      )}
                      {!collapsed && (
                        <span className="truncate">
                          {itemLabels[item.id] ?? item.label}
                        </span>
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

      <div className="p-3 border-t border-app">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-700/40 hover:text-slate-200 transition-colors"
          aria-label={
            collapsed ? t("navigation.expand") : t("navigation.reduce")
          }
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
          {!collapsed && (
            <span className="text-xs">{t("navigation.reduce")}</span>
          )}
        </button>
      </div>
    </aside>
  );
}
