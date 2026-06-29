import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { StatCard } from "../components/ui/StatCard";
import { QuickActions } from "../components/dashboard/QuickActions";
import {
  RevenueChart,
  CategoryChart,
  FindingsTrendChart,
} from "../components/dashboard/DashboardCharts";
import { useSupabaseQuery } from "../hooks/useSupabaseData";
import {
  buildEngagementProgressChart,
  buildReviewNotesStatusChart,
  buildRiskDistributionChart,
} from "../lib/db-mappers";
import { formatCurrency } from "../lib/utils";
import type {
  Engagement,
  Finding,
  ReviewNote,
  Client,
  FixedAsset,
  LeaveRequest,
} from "../types";

// Types pour les tables supplémentaires
interface StockItem {
  remaining_value: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

const miniCharts: Record<string, number[]> = {
  "active-engagements": [3, 4, 3, 5, 4, 3, 4, 5, 4, 4],
  "open-review-notes": [12, 10, 15, 8, 11, 9, 10, 15, 12, 15],
  "open-findings": [5, 8, 6, 10, 7, 12, 8, 10, 7, 10],
  "active-clients": [3, 4, 4, 5, 4, 4, 5, 4, 4, 4],
  "inventory-value": [65, 70, 68, 75, 80, 82, 85, 88, 92, 95],
  "asset-value": [90, 88, 92, 95, 93, 97, 95, 98, 96, 100],
  "employees-on-leave": [1, 0, 2, 1, 0, 1, 2, 1, 1, 1],
};

const kpiIcons: Record<string, string> = {
  "active-engagements": "bar-chart",
  "open-review-notes": "alert-triangle",
  "open-findings": "search",
  "active-clients": "dollar-sign",
  "inventory-value": "dollar-sign",
  "asset-value": "dollar-sign",
  "employees-on-leave": "users",
};

export function DashboardPage() {
  const navigate = useNavigate();

  // ✅ Tables corrigées
  const { data: engagements, loading: loadingEngagements } =
    useSupabaseQuery<Engagement>({
      table: "weekly_missions",
      orderBy: "created_at",
      orderAsc: false,
    });

  const { data: reviewNotes } = useSupabaseQuery<ReviewNote>({
    table: "review_notes",
    orderBy: "created_at",
    orderAsc: false,
  });

  const { data: findings } = useSupabaseQuery<Finding>({
    table: "findings",
    orderBy: "created_at",
    orderAsc: false,
  });

  const { data: clients } = useSupabaseQuery<Client>({
    table: "clients",
    orderBy: "created_at",
    orderAsc: false,
  });

  const { data: stock } = useSupabaseQuery<StockItem>({
    table: "stock_items",
    orderBy: "item_name",
  });

  const { data: assets } = useSupabaseQuery<FixedAsset>({
    table: "fixed_assets",
    orderBy: "created_at",
    orderAsc: false,
  });

  const { data: leave } = useSupabaseQuery<LeaveRequest>({
    table: "leave_requests",
    orderBy: "created_at",
    orderAsc: false,
  });

  const { data: notifications } = useSupabaseQuery<Notification>({
    table: "notifications",
    orderBy: "created_at",
    orderAsc: false,
  });

  // ---- KPI ----
  const activeEngagements = engagements.filter((e) =>
    ["planning", "in_progress", "review"].includes(e.status),
  ).length;

  const openReviewNotes = reviewNotes.filter((n) => n.status === "open").length;

  const openFindings = findings.filter(
    (f) => f.status === "open" || f.status === "in_progress",
  ).length;

  const activeClients = clients.filter((c) => c.status === "active").length;

  const inventoryValue = stock.reduce(
    (s, i) => s + (i.remaining_value || 0),
    0,
  );

  const assetValue = assets
    .filter((a) => a.status === "active")
    .reduce((s, a) => s + (a.net_book_value || 0), 0);

  const employeesOnLeave = leave.filter((l) => l.status === "approved").length;

  const kpiData = useMemo(
    () => [
      {
        id: "active-engagements",
        label: "Missions actives",
        value: activeEngagements,
        change: 12,
        changeLabel: "vs mois dernier",
        trend: "up" as const,
        color: "primary" as const,
      },
      {
        id: "open-review-notes",
        label: "Notes de revue ouvertes",
        value: openReviewNotes,
        change: -5,
        changeLabel: "vs semaine dernière",
        trend: "down" as const,
        color: "warning" as const,
      },
      {
        id: "open-findings",
        label: "Constats ouverts",
        value: openFindings,
        change: 8,
        changeLabel: "nouveaux cette semaine",
        trend: "up" as const,
        color: "error" as const,
      },
      {
        id: "active-clients",
        label: "Clients actifs",
        value: activeClients,
        change: 0,
        changeLabel: "Stable",
        trend: "flat" as const,
        color: "royal" as const,
      },
      {
        id: "inventory-value",
        label: "Valeur des stocks",
        value: formatCurrency(inventoryValue),
        change: 5.2,
        changeLabel: "vs mois dernier",
        trend: "up" as const,
        color: "emerald" as const,
      },
      {
        id: "asset-value",
        label: "Valeur des immobilisations",
        value: formatCurrency(assetValue),
        change: -2.1,
        changeLabel: "amortissement",
        trend: "down" as const,
        color: "cyan" as const,
      },
      {
        id: "employees-on-leave",
        label: "Employés en congé",
        value: employeesOnLeave,
        change: 0,
        changeLabel: "Stable",
        trend: "flat" as const,
        color: "primary" as const,
      },
    ],
    [
      activeEngagements,
      openReviewNotes,
      openFindings,
      activeClients,
      inventoryValue,
      assetValue,
      employeesOnLeave,
    ],
  );

  // ---- Graphiques ----
  const engagementChart = useMemo(
    () => buildEngagementProgressChart(engagements),
    [engagements],
  );

  const reviewNotesChart = useMemo(
    () => buildReviewNotesStatusChart(reviewNotes),
    [reviewNotes],
  );

  const riskChart = useMemo(
    () => buildRiskDistributionChart(findings),
    [findings],
  );

  // ---- Activités récentes (affichage manuel) ----
  const recentActivities = useMemo(() => {
    if (!notifications || notifications.length === 0) return [];
    return notifications.slice(0, 5).map((n) => ({
      id: n.id,
      title: n.title || "Activité",
      message: n.message || "",
      date: n.created_at,
    }));
  }, [notifications]);

  // ---- Rendu ----
  if (loadingEngagements) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-50 tracking-tight">
          Tableau de bord
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Vue d'ensemble de l'activité ORION
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 mb-8">
        {kpiData.map((kpi) => (
          <StatCard
            key={kpi.id}
            {...kpi}
            icon={kpiIcons[kpi.id] || "bar-chart"}
            miniChart={miniCharts[kpi.id]}
          />
        ))}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="lg:col-span-2">
          <RevenueChart data={engagementChart} />
        </div>
        <FindingsTrendChart data={riskChart} />
      </div>

      {/* Bas de page */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CategoryChart data={reviewNotesChart} />
        <QuickActions className="lg:col-span-1" />
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-200">
              Activités récentes
            </h3>
            <button
              onClick={() => navigate("/notifications")}
              className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
            >
              Voir tout
            </button>
          </div>
          {recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-primary-400 shrink-0" />
                  <div>
                    <p className="text-slate-300">{act.title}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {act.message}
                    </p>
                    <p className="text-2xs text-slate-500">
                      {new Date(act.date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-8 text-center">
              Aucune activité récente
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
