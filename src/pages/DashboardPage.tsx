// src/pages/DashboardPage.tsx
import { useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { StatCard } from "../components/ui/StatCard";
import { QuickActions } from "../components/dashboard/QuickActions";
import {
  RevenueChart,
  CategoryChart,
  FindingsTrendChart,
} from "../components/dashboard/DashboardCharts";
import { TopClientsTable } from "../components/dashboard/TopClientsTable";
import { useSupabaseQuery } from "../hooks/useSupabaseData";
import {
  buildReviewNotesStatusChart,
  buildRiskDistributionChart,
} from "../lib/db-mappers";
import { abbreviateNumber } from "../lib/utils";
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
  "open-expenses": [2, 3, 4, 3, 5, 4, 3, 4, 3, 5],
};

const kpiIcons: Record<string, string> = {
  "active-engagements": "bar-chart",
  "open-review-notes": "alert-triangle",
  "open-findings": "search",
  "active-clients": "briefcase",
  "inventory-value": "package",
  "asset-value": "landmark",
  "employees-on-leave": "users",
  "open-expenses": "receipt",
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case "new-engagement":
        navigate("/engagements");
        break;
      case "new-finding":
        navigate("/findings");
        break;
      case "stock-in":
        navigate("/stock");
        break;
      case "request-leave":
        navigate("/leave");
        break;
      case "upload-paper":
        navigate("/upload");
        break;
      case "new-expense":
        navigate("/note-de-frais");
        break;
      case "new-collaborateur":
        navigate("/collaborateurs");
        break;
      case "new-invoice":
        navigate("/factures");
        break;
      default:
        console.warn("Action non reconnue :", actionId);
    }
  };

  // ----- Requêtes Supabase -----
  const {
    data: engagements,
    loading: engLoading,
    error: engError,
  } = useSupabaseQuery<Engagement>({
    table: "weekly_missions",
    orderBy: "created_at",
    orderAsc: false,
  });

  const {
    data: reviewNotes,
    loading: rnLoading,
    error: rnError,
  } = useSupabaseQuery<ReviewNote>({
    table: "review_notes",
    orderBy: "created_at",
    orderAsc: false,
  });

  const {
    data: findings,
    loading: fndLoading,
    error: fndError,
  } = useSupabaseQuery<Finding>({
    table: "findings",
    orderBy: "created_at",
    orderAsc: false,
  });

  const {
    data: clients,
    loading: clLoading,
    error: clError,
  } = useSupabaseQuery<Client>({
    table: "clients",
    orderBy: "created_at",
    orderAsc: false,
  });

  const {
    data: stock,
    loading: stLoading,
    error: stError,
  } = useSupabaseQuery<StockItem>({
    table: "stock_items",
    orderBy: "item_name",
  });

  const {
    data: assets,
    loading: asLoading,
    error: asError,
  } = useSupabaseQuery<FixedAsset>({
    table: "fixed_assets",
    orderBy: "created_at",
    orderAsc: false,
  });

  const {
    data: leave,
    loading: lvLoading,
    error: lvError,
  } = useSupabaseQuery<LeaveRequest>({
    table: "leave_requests",
    orderBy: "created_at",
    orderAsc: false,
  });

  const {
    data: notifications,
    loading: ntLoading,
    error: ntError,
  } = useSupabaseQuery<Notification>({
    table: "notifications",
    orderBy: "created_at",
    orderAsc: false,
  });

  const { data: expenseReports } = useSupabaseQuery<any>({
    table: "expense_reports",
    orderBy: "created_at",
    orderAsc: false,
  });

  const {
    data: invoices,
    loading: invLoading,
    error: _invError,
  } = useSupabaseQuery<any>({
    table: "invoices",
    select:
      "id, client_id, client_details_snapshot, total_general, date_emission, status, archived",
    orderBy: "date_emission",
    orderAsc: false,
  });

  // Debug logs (conservés)
  console.log("Dashboard hooks:", {
    engagements: {
      loading: engLoading,
      error: engError,
      count: engagements.length,
    },
    reviewNotes: {
      loading: rnLoading,
      error: rnError,
      count: reviewNotes.length,
    },
    findings: { loading: fndLoading, error: fndError, count: findings.length },
    clients: { loading: clLoading, error: clError, count: clients.length },
    stock: { loading: stLoading, error: stError, count: stock.length },
    assets: { loading: asLoading, error: asError, count: assets.length },
    leave: { loading: lvLoading, error: lvError, count: leave.length },
    notifications: {
      loading: ntLoading,
      error: ntError,
      count: (notifications || []).length,
    },
  });

  // Test direct Supabase
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await supabase.from("clients").select("*");
        console.log("direct supabase fetch (clients):", res);
      } catch (e) {
        console.error("direct supabase fetch error", e);
      }
    };
    fetchClients();
  }, []);

  // ---- Calculs KPI ----
  // 🔥 Correction : on considère comme actives toutes les missions dont le statut n'est pas un statut final
  // Liste des statuts finaux à adapter selon votre base (ex: "Terminé", "Annulé", "Clôturé", "Archivé")
  const finalStatuses = ["Terminé", "Annulé", "Clôturé", "Archivé"];
  const activeEngagements = engagements.filter(
    (e) => !finalStatuses.includes(e.status),
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

  // ============================================================
  // 🔥 CALCUL DE LA VALEUR DES IMMOBILISATIONS (VNC)
  // ============================================================
  console.log("🔍 Données brutes des immobilisations :", assets);

  const computedVNC = assets
    .filter((a) => (a.status as string) === "Active")
    .reduce((sum, a) => {
      const purchase = a.purchase_value || 0;
      if (purchase === 0) return sum;

      const years = a.useful_life_years || 10;
      const annualDep = purchase / years;

      let age = 0;
      if (a.acquisition_date) {
        const acquisitionDate = new Date(a.acquisition_date);
        const now = new Date();
        age = Number(
          Math.max(0, now.getFullYear() - acquisitionDate.getFullYear()),
        );
      }

      const accumulated = Math.min(annualDep * age, purchase);
      const netBook = purchase - accumulated;

      console.log(
        `📊 ${a.asset_name}: achat=${purchase}, âge=${age} ans, VNC=${netBook}`,
      );
      return sum + netBook;
    }, 0);

  const fallbackValue = assets
    .filter((a) => (a.status as string) === "Active")
    .reduce((sum, a) => sum + (a.purchase_value || 0), 0);

  const assetValue = computedVNC > 0 ? computedVNC : fallbackValue;

  console.log("✅ Valeur nette comptable calculée :", computedVNC);
  console.log("✅ Valeur affichée (fallback si 0) :", assetValue);

  const openExpenseReports = expenseReports.filter(
    (r) => r.status === "soumis" || r.status === "brouillon",
  ).length;

  // ---- KPI Data ----
  const kpiData = useMemo(
    () => [
      {
        id: "active-engagements",
        label: t("dashboard.activeEngagements"),
        value: activeEngagements,
        change: 12,
        changeLabel: "vs mois dernier",
        trend: "up" as const,
        color: "primary" as const,
      },
      {
        id: "open-review-notes",
        label: t("dashboard.openReviewNotes"),
        value: openReviewNotes,
        change: -5,
        changeLabel: "vs semaine dernière",
        trend: "down" as const,
        color: "warning" as const,
      },
      {
        id: "open-findings",
        label: t("dashboard.openFindings"),
        value: openFindings,
        change: 8,
        changeLabel: "nouveaux cette semaine",
        trend: "up" as const,
        color: "error" as const,
      },
      {
        id: "active-clients",
        label: t("dashboard.activeClients"),
        value: activeClients,
        change: 0,
        changeLabel: "Stable",
        trend: "flat" as const,
        color: "royal" as const,
      },
      {
        id: "inventory-value",
        label: t("dashboard.inventoryValue"),
        value: abbreviateNumber(inventoryValue),
        change: 5.2,
        changeLabel: "vs mois dernier",
        trend: "up" as const,
        color: "emerald" as const,
      },
      {
        id: "asset-value",
        label: t("dashboard.assetValue"),
        value: abbreviateNumber(assetValue),
        change: -2.1,
        changeLabel: "amortissement",
        trend: "down" as const,
        color: "cyan" as const,
      },
      {
        id: "open-expenses",
        label: t("dashboard.openExpenses"),
        value: openExpenseReports,
        change: 10,
        changeLabel: "vs mois dernier",
        trend: "up" as const,
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
      openExpenseReports,
    ],
  );

  // ---- Graphiques ----
  // ✅ Graphique des missions : utilisation directe de client_name ou subject
  const engagementChart = useMemo(() => {
    if (!engagements || engagements.length === 0) return [];

    return engagements
      .map((m) => ({
        name: String(m.client_name || m.subject || "Sans nom"),
        value: m.progress || 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [engagements]);

  const reviewNotesChart = useMemo(
    () => buildReviewNotesStatusChart(reviewNotes),
    [reviewNotes],
  );
  const riskChart = useMemo(
    () => buildRiskDistributionChart(findings),
    [findings],
  );

  const topClients = useMemo(() => {
    if (!invoices || invoices.length === 0) return [];

    const clientsMap = new Map<
      string,
      {
        clientName: string;
        totalRevenue: number;
        invoiceCount: number;
        averageInvoice: number;
        lastInvoice: string;
      }
    >();

    invoices
      .filter((inv: any) => !inv.archived && inv.status !== "cancelled")
      .forEach((inv: any) => {
        const clientId =
          inv.client_id ?? inv.client_details_snapshot?.id ?? "unknown";
        const clientName =
          inv.client_details_snapshot?.name ||
          inv.client_details_snapshot?.company ||
          inv.client_name ||
          "Client inconnu";
        const revenue = Number(inv.total_general || 0);
        const invoiceDate = inv.date_emission || "";

        const existing = clientsMap.get(clientId);
        if (existing) {
          existing.totalRevenue += revenue;
          existing.invoiceCount += 1;
          existing.averageInvoice =
            existing.totalRevenue / existing.invoiceCount;
          if (
            invoiceDate &&
            new Date(invoiceDate) > new Date(existing.lastInvoice)
          ) {
            existing.lastInvoice = invoiceDate;
          }
        } else {
          clientsMap.set(clientId, {
            clientName,
            totalRevenue: revenue,
            invoiceCount: 1,
            averageInvoice: revenue,
            lastInvoice: invoiceDate,
          });
        }
      });

    return Array.from(clientsMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5)
      .map((row) => ({
        clientName: row.clientName,
        totalRevenue: row.totalRevenue,
        invoiceCount: row.invoiceCount,
        averageInvoice: row.averageInvoice,
        lastInvoice: row.lastInvoice,
      }));
  }, [invoices]);

  // ---- Activités récentes ----
  const recentActivities = useMemo(() => {
    if (!notifications || notifications.length === 0) return [];
    return notifications.slice(0, 5).map((n) => ({
      id: n.id,
      title: n.title || "Activité",
      message: n.message || "",
      date: n.created_at,
    }));
  }, [notifications]);

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-50 tracking-tight">
          {t("navigation.dashboard")}
        </h1>
        <p className="text-sm text-slate-400 mt-1">{t("dashboard.welcome")}</p>
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-8">
        <CategoryChart data={reviewNotesChart} />
        <TopClientsTable data={topClients} loading={invLoading} />
        <QuickActions onAction={handleQuickAction} className="" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-200">
              {t("dashboard.recentActivities")}
            </h3>
            <button
              onClick={() => navigate("/notifications")}
              className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
            >
              {t("common.viewAll")}
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
              {t("dashboard.noRecentActivities")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
