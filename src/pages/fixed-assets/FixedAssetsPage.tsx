// src/pages/fixed-assets/FixedAssetsPage.tsx

import { useState } from "react";
import {
  Search,
  Plus,
  Eye,
  Trash2,
  CheckCircle,
  Heart,
  LayoutGrid,
  List,
} from "lucide-react";
import { useSupabaseQuery } from "../../hooks/useSupabaseData";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { cn, formatCurrency } from "../../lib/utils";
import { supabase } from "../../lib/supabase";
import { addNotification } from "../../lib/notifications";
import type { FixedAsset } from "../../types";

// Recharts
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ==================== TYPES LOCAUX ====================

interface ExtendedFixedAsset extends FixedAsset {
  family?: string | null;
  location?: string | null;
  invoice_number?: string | null;
  service_date?: string;
  account_code?: string | null;
  acquisition_mode?: string;
  residual_value?: number;
  useful_life_years?: number;
}

interface DepreciationEntry {
  id: string;
  asset_id: string;
  period: string;
  amount: number;
  cumulative_depreciation: number;
  net_book_value: number;
  is_processed: boolean;
}

interface AssetMovement {
  id: string;
  asset_id: string;
  type: string;
  from_location: string | null;
  to_location: string | null;
  date: string;
  notes: string | null;
  validated_by: string | null;
}

interface AssetDisposal {
  id: string;
  asset_id: string;
  type: string;
  sale_price: number | null;
  net_book_value: number;
  disposal_date: string;
  capital_gain_loss: number | null;
  status: string;
}

// ==================== COMPOSANT ====================

export function FixedAssetsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<ExtendedFixedAsset | null>(
    null,
  );
  const [editMode, setEditMode] = useState(false);
  const [detailTab, setDetailTab] = useState<
    "info" | "depreciation" | "movements" | "disposal"
  >("info");

  // View mode: list or dashboard
  const [viewMode, setViewMode] = useState<"list" | "dashboard">("list");

  // Liked assets (local state, not persisted)
  const [likedAssets, setLikedAssets] = useState<Set<string>>(new Set());

  // Sous‑données
  const [depreciationSchedule] = useState<DepreciationEntry[]>([]);
  const [movements] = useState<AssetMovement[]>([]);
  const [disposal] = useState<AssetDisposal | null>(null);

  // État du formulaire
  const [formData, setFormData] = useState<Partial<ExtendedFixedAsset>>({
    asset_name: "",
    category: "",
    family: "",
    location: "",
    invoice_number: "",
    acquisition_date: "",
    service_date: "",
    purchase_value: 0,
    currency: "XAF",
    account_code: "",
    acquisition_mode: "Achat",
    residual_value: 0,
    status: "Draft",
  });

  // Chargement des actifs
  const {
    data: assetsRaw = [],
    loading,
    refetch,
  } = useSupabaseQuery<FixedAsset>({
    table: "fixed_assets",
    orderBy: "created_at",
    orderAsc: false,
  });

  // Enrichissement des actifs
  const assets: ExtendedFixedAsset[] = assetsRaw.map((asset) => ({
    ...asset,
    useful_life_years: 10,
    family: (asset as any).family || null,
    location: (asset as any).location || null,
    invoice_number: (asset as any).invoice_number || null,
    service_date: (asset as any).service_date || asset.acquisition_date || "",
    account_code: (asset as any).account_code || null,
    acquisition_mode: (asset as any).acquisition_mode || "Achat",
    residual_value: (asset as any).residual_value || 0,
  }));

  // Statistiques
  const totalPurchase = assets.reduce((s, a) => s + (a.purchase_value || 0), 0);
  const totalDep = assets.reduce((s, a) => {
    const years = a.useful_life_years || 10;
    const annual = (a.purchase_value || 0) / years;
    const age =
      new Date().getFullYear() -
      new Date(a.acquisition_date || "").getFullYear();
    return s + Math.min(annual * age, a.purchase_value || 0);
  }, 0);
  const totalNBV = totalPurchase - totalDep;

  // Données pour les graphiques
  const categoryData = assets.reduce(
    (acc, a) => {
      const cat = a.category || "Non défini";
      acc[cat] = (acc[cat] || 0) + (a.purchase_value || 0);
      return acc;
    },
    {} as Record<string, number>,
  );
  const categoryChartData = Object.entries(categoryData).map(
    ([name, value]) => ({
      name,
      value,
    }),
  );

  const statusData = assets.reduce(
    (acc, a) => {
      const st = a.status || "Draft";
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const statusChartData = Object.entries(statusData).map(([name, value]) => ({
    name: name === "Active" ? "Actif" : name === "Disposed" ? "Cédé" : name,
    value,
  }));

  const valueByCategory = assets.reduce(
    (acc, a) => {
      const cat = a.category || "Non défini";
      acc[cat] = (acc[cat] || 0) + (a.purchase_value || 0);
      return acc;
    },
    {} as Record<string, number>,
  );
  const valueChartData = Object.entries(valueByCategory).map(
    ([name, value]) => ({
      name,
      value,
    }),
  );

  // Couleurs
  const COLORS = [
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#ef4444",
  ];

  // Filtres
  const filtered = assets.filter((a) => {
    const matchSearch =
      (a.asset_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (a.asset_code?.toLowerCase() || "").includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ==================== ACTIONS ====================

  const handleCreate = async () => {
    try {
      const count = assets.length + 1;
      const code = `IMM-${new Date().getFullYear()}-${String(count).padStart(4, "0")}`;

      const payload = {
        asset_code: code,
        asset_name: formData.asset_name || "",
        category: formData.category || "",
        family: formData.family || null,
        location: formData.location || null,
        invoice_number: formData.invoice_number || null,
        acquisition_date: formData.acquisition_date || null,
        service_date: formData.service_date || null,
        purchase_value: formData.purchase_value || 0,
        currency: formData.currency || "XAF",
        account_code: formData.account_code || null,
        acquisition_mode: formData.acquisition_mode || "Achat",
        residual_value: formData.residual_value || 0,
        status: "Draft",
      };

      const { error } = await supabase.from("fixed_assets").insert([payload]);
      if (error) {
        alert("Erreur : " + error.message);
        console.error("Insert error:", error);
      } else {
        void addNotification({
          title: "Immobilisation créée",
          message: `L'actif "${payload.asset_name}" a été ajouté.`,
          type: "asset",
        });
        refetch();
        setShowCreateModal(false);
        setFormData({
          asset_name: "",
          category: "",
          family: "",
          location: "",
          invoice_number: "",
          acquisition_date: "",
          service_date: "",
          purchase_value: 0,
          currency: "XAF",
          account_code: "",
          acquisition_mode: "Achat",
          residual_value: 0,
          status: "Draft",
        });
      }
    } catch (err: any) {
      alert("Erreur inattendue : " + err.message);
      console.error(err);
    }
  };

  const handleUpdate = async () => {
    if (!selectedAsset) return;
    try {
      const payload = {
        asset_name: formData.asset_name || selectedAsset.asset_name,
        category: formData.category || selectedAsset.category,
        family: formData.family || null,
        location: formData.location || null,
        invoice_number: formData.invoice_number || null,
        acquisition_date:
          formData.acquisition_date || selectedAsset.acquisition_date,
        service_date: formData.service_date || null,
        purchase_value: formData.purchase_value || selectedAsset.purchase_value,
        currency: formData.currency || "XAF",
        account_code: formData.account_code || null,
        acquisition_mode: formData.acquisition_mode || "Achat",
        residual_value: formData.residual_value || 0,
      };

      const { error } = await supabase
        .from("fixed_assets")
        .update(payload)
        .eq("id", selectedAsset.id);
      if (error) {
        alert("Erreur : " + error.message);
        console.error("Update error:", error);
      } else {
        void addNotification({
          title: "Immobilisation mise à jour",
          message: `L'actif "${payload.asset_name}" a été mis à jour.`,
          type: "asset",
        });
        refetch();
        setShowDetailModal(false);
        setSelectedAsset(null);
        setEditMode(false);
      }
    } catch (err: any) {
      alert("Erreur inattendue : " + err.message);
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer définitivement cette immobilisation ?")) return;
    const { error } = await supabase.from("fixed_assets").delete().eq("id", id);
    if (error) {
      alert("Erreur : " + error.message);
      console.error("Delete error:", error);
    } else {
      void addNotification({
        title: "Immobilisation supprimée",
        message: "Une immobilisation a été supprimée.",
        type: "asset",
      });
      refetch();
    }
  };

  const handleValidate = async (id: string) => {
    const { error } = await supabase
      .from("fixed_assets")
      .update({ status: "Active" })
      .eq("id", id);
    if (error) {
      alert("Erreur : " + error.message);
      console.error("Validate error:", error);
    } else {
      void addNotification({
        title: "Immobilisation validée",
        message: "L'immobilisation a été validée.",
        type: "asset",
      });
      refetch();
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("fixed_assets")
      .update({ status: newStatus })
      .eq("id", id);
    if (error) {
      alert("Erreur : " + error.message);
      console.error("Status update error:", error);
    } else {
      void addNotification({
        title: "Statut d'immobilisation modifié",
        message: `Le statut de l'immobilisation a été changé en ${newStatus}.`,
        type: "asset",
      });
      refetch();
    }
  };

  const toggleLike = (id: string) => {
    setLikedAssets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const openDetail = async (asset: ExtendedFixedAsset) => {
    setSelectedAsset(asset);
    setFormData(asset);
    setShowDetailModal(true);
    setDetailTab("info");
  };

  if (loading) {
    return <div className="page-container">Chargement...</div>;
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-4">
        <PageHeader
          title="Immobilisations"
          description="Suivez les actifs et les amortissements"
        />
        <div className="flex items-center gap-2">
          {/* Toggle View */}
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === "list"
                ? "bg-primary-600/15 text-primary-300 ring-1 ring-primary-500/25"
                : "text-slate-400 hover:bg-slate-700/40",
            )}
            title="Vue liste"
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("dashboard")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === "dashboard"
                ? "bg-primary-600/15 text-primary-300 ring-1 ring-primary-500/25"
                : "text-slate-400 hover:bg-slate-700/40",
            )}
            title="Tableau de bord"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nouvelle
          </button>
        </div>
      </div>

      {/* Statistiques (always visible) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Valeur d'acquisition",
            value: formatCurrency(totalPurchase),
            color: "text-primary-400",
          },
          {
            label: "Amortissements cumulés",
            value: formatCurrency(totalDep),
            color: "text-warning-500",
          },
          {
            label: "Valeur nette comptable",
            value: formatCurrency(totalNBV),
            color: "text-emerald-400",
          },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={`text-lg font-semibold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtres (only in list view) */}
      {viewMode === "list" && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un actif..."
              className="input-md pl-10"
            />
          </div>
          <div className="flex gap-2">
            {["all", "Draft", "Active", "In_Maintenance", "Disposed"].map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm transition-colors",
                    statusFilter === s
                      ? "bg-primary-600/15 text-primary-300 ring-1 ring-primary-500/25"
                      : "text-slate-400 hover:bg-slate-700/40",
                  )}
                >
                  {s === "all"
                    ? "Tous"
                    : s === "Draft"
                      ? "Brouillon"
                      : s === "Active"
                        ? "Actif"
                        : s === "In_Maintenance"
                          ? "Maintenance"
                          : "Cédé"}
                </button>
              ),
            )}
          </div>
        </div>
      )}

      {/* ==================== VUE LISTE ==================== */}
      {viewMode === "list" && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {[
                    "Code",
                    "Actif",
                    "Catégorie",
                    "Valeur",
                    "Amortissement",
                    "VNC",
                    "Statut",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filtered.map((asset) => {
                  const dep = (asset.purchase_value || 0) * 0.2;
                  const vnc = (asset.purchase_value || 0) - dep;
                  const isLiked = likedAssets.has(asset.id);
                  return (
                    <tr
                      key={asset.id}
                      className="hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">
                        {asset.asset_code}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-100">
                        {asset.asset_name}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {asset.category}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate-200">
                        {formatCurrency(asset.purchase_value || 0)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-warning-400">
                        {formatCurrency(dep)}
                      </td>
                      <td className="px-4 py-3 tabular-nums font-medium text-emerald-400">
                        {formatCurrency(vnc)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              asset.status === "Active"
                                ? "success"
                                : asset.status === "Disposed"
                                  ? "error"
                                  : asset.status === "Draft"
                                    ? "warning"
                                    : "warning"
                            }
                          >
                            {asset.status === "Active"
                              ? "Actif"
                              : asset.status === "Disposed"
                                ? "Cédé"
                                : asset.status === "In_Maintenance"
                                  ? "Maintenance"
                                  : "Brouillon"}
                          </Badge>
                          {/* Status dropdown */}
                          <select
                            value={asset.status || "Draft"}
                            onChange={(e) =>
                              handleStatusChange(asset.id, e.target.value)
                            }
                            className="text-xs bg-slate-700 border border-slate-600 rounded px-1 py-0.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          >
                            <option value="Draft">Brouillon</option>
                            <option value="Active">Actif</option>
                            <option value="In_Maintenance">Maintenance</option>
                            <option value="Disposed">Cédé</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleLike(asset.id)}
                            className={cn(
                              "transition-colors",
                              isLiked
                                ? "text-red-400"
                                : "text-slate-400 hover:text-slate-200",
                            )}
                            title={isLiked ? "Retirer le like" : "Aimer"}
                          >
                            <Heart
                              className="w-4 h-4"
                              fill={isLiked ? "currentColor" : "none"}
                            />
                          </button>
                          <button
                            onClick={() => openDetail(asset)}
                            className="text-slate-400 hover:text-slate-200"
                            title="Voir"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {asset.status === "Draft" && (
                            <>
                              <button
                                onClick={() => handleValidate(asset.id)}
                                className="text-emerald-400 hover:text-emerald-300"
                                title="Valider"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(asset.id)}
                                className="text-red-400 hover:text-red-300"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== VUE TABLEAU DE BORD ==================== */}
      {viewMode === "dashboard" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pie: Répartition par catégorie */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">
              Répartition par catégorie
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(value as number)}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar: Valeur par catégorie */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">
              Valeur d'acquisition par catégorie
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={valueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis
                  stroke="#94a3b8"
                  tickFormatter={(v) => formatCurrency(v)}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value as number)}
                />
                <Bar dataKey="value" fill="#3b82f6">
                  {valueChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie: Statut des actifs */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">
              Répartition par statut
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {statusChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Additional KPI cards */}
          <div className="card p-4 flex flex-col justify-center">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">
              Indicateurs clés
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Total actifs</span>
                <span className="font-semibold text-slate-100">
                  {assets.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Actifs actifs</span>
                <span className="font-semibold text-emerald-400">
                  {assets.filter((a) => a.status === "Active").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Brouillons</span>
                <span className="font-semibold text-warning-400">
                  {assets.filter((a) => a.status === "Draft").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cédés</span>
                <span className="font-semibold text-red-400">
                  {assets.filter((a) => a.status === "Disposed").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">En maintenance</span>
                <span className="font-semibold text-slate-300">
                  {assets.filter((a) => a.status === "In_Maintenance").length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL CRÉATION ==================== */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Nouvelle immobilisation</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreate();
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Désignation *
                  </label>
                  <input
                    type="text"
                    value={formData.asset_name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, asset_name: e.target.value })
                    }
                    className="input-md w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Catégorie *
                  </label>
                  <select
                    value={formData.category || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="input-md w-full"
                    required
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="corporelle">Corporelle</option>
                    <option value="incorporelle">Incorporelle</option>
                    <option value="financiere">Financière</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Famille
                  </label>
                  <input
                    type="text"
                    value={formData.family || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, family: e.target.value })
                    }
                    className="input-md w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Localisation
                  </label>
                  <input
                    type="text"
                    value={formData.location || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="input-md w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    N° facture
                  </label>
                  <input
                    type="text"
                    value={formData.invoice_number || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        invoice_number: e.target.value,
                      })
                    }
                    className="input-md w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Date d'acquisition *
                  </label>
                  <input
                    type="date"
                    value={formData.acquisition_date || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        acquisition_date: e.target.value,
                      })
                    }
                    className="input-md w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Date de mise en service *
                  </label>
                  <input
                    type="date"
                    value={formData.service_date || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, service_date: e.target.value })
                    }
                    className="input-md w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Valeur d'origine *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_value || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchase_value: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="input-md w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Devise
                  </label>
                  <select
                    value={formData.currency || "XAF"}
                    onChange={(e) =>
                      setFormData({ ...formData, currency: e.target.value })
                    }
                    className="input-md w-full"
                  >
                    <option value="XAF">XAF</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Compte comptable
                  </label>
                  <input
                    type="text"
                    value={formData.account_code || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, account_code: e.target.value })
                    }
                    className="input-md w-full"
                    placeholder="ex: 215"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Mode d'acquisition
                  </label>
                  <select
                    value={formData.acquisition_mode || "Achat"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        acquisition_mode: e.target.value,
                      })
                    }
                    className="input-md w-full"
                  >
                    <option value="Achat">Achat</option>
                    <option value="Production">Production</option>
                    <option value="Credit-bail">Crédit-bail</option>
                    <option value="Donation">Donation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Valeur résiduelle
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.residual_value || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        residual_value: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="input-md w-full"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL DÉTAIL ==================== */}
      {showDetailModal && selectedAsset && (
        <div
          className="modal-overlay"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="modal-content max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">
                  {selectedAsset.asset_name}
                </h2>
                <p className="text-sm text-slate-400">
                  {selectedAsset.asset_code}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-2 border-b border-slate-700 mb-4">
              {(["info", "depreciation", "movements", "disposal"] as const).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setDetailTab(tab)}
                    className={cn(
                      "px-4 py-2 text-sm font-medium transition-colors",
                      detailTab === tab
                        ? "text-primary-400 border-b-2 border-primary-400"
                        : "text-slate-400 hover:text-slate-200",
                    )}
                  >
                    {tab === "info"
                      ? "Informations"
                      : tab === "depreciation"
                        ? "Amortissements"
                        : tab === "movements"
                          ? "Mouvements"
                          : "Cession"}
                  </button>
                ),
              )}
            </div>

            {detailTab === "info" && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-400">Catégorie</span>{" "}
                  {selectedAsset.category}
                </div>
                <div>
                  <span className="text-slate-400">Famille</span>{" "}
                  {selectedAsset.family || "—"}
                </div>
                <div>
                  <span className="text-slate-400">Localisation</span>{" "}
                  {selectedAsset.location || "—"}
                </div>
                <div>
                  <span className="text-slate-400">N° facture</span>{" "}
                  {selectedAsset.invoice_number || "—"}
                </div>
                <div>
                  <span className="text-slate-400">Date acquisition</span>{" "}
                  {selectedAsset.acquisition_date}
                </div>
                <div>
                  <span className="text-slate-400">Mise en service</span>{" "}
                  {selectedAsset.service_date || "—"}
                </div>
                <div>
                  <span className="text-slate-400">Valeur d'origine</span>{" "}
                  {formatCurrency(selectedAsset.purchase_value || 0)}
                </div>
                <div>
                  <span className="text-slate-400">Valeur résiduelle</span>{" "}
                  {formatCurrency(selectedAsset.residual_value || 0)}
                </div>
                <div>
                  <span className="text-slate-400">Devise</span>{" "}
                  {selectedAsset.currency || "XAF"}
                </div>
                <div>
                  <span className="text-slate-400">Compte comptable</span>{" "}
                  {selectedAsset.account_code || "—"}
                </div>
                <div>
                  <span className="text-slate-400">Mode acquisition</span>{" "}
                  {selectedAsset.acquisition_mode || "—"}
                </div>
                <div>
                  <span className="text-slate-400">Statut</span>{" "}
                  {selectedAsset.status}
                </div>
                <div className="col-span-2 flex gap-2 mt-2">
                  {selectedAsset.status === "Draft" && (
                    <button
                      onClick={() => handleValidate(selectedAsset.id)}
                      className="btn-primary text-sm"
                    >
                      Valider
                    </button>
                  )}
                  <button
                    onClick={() => setEditMode(true)}
                    className="btn-secondary text-sm"
                  >
                    Modifier
                  </button>
                </div>
                {editMode && (
                  <div className="col-span-2 border-t border-slate-700 pt-4">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleUpdate();
                      }}
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-slate-400">
                            Désignation
                          </label>
                          <input
                            type="text"
                            value={formData.asset_name || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                asset_name: e.target.value,
                              })
                            }
                            className="input-md w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400">
                            Catégorie
                          </label>
                          <select
                            value={formData.category || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                category: e.target.value,
                              })
                            }
                            className="input-md w-full"
                          >
                            <option value="corporelle">Corporelle</option>
                            <option value="incorporelle">Incorporelle</option>
                            <option value="financiere">Financière</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400">
                            Famille
                          </label>
                          <input
                            type="text"
                            value={formData.family || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                family: e.target.value,
                              })
                            }
                            className="input-md w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400">
                            Localisation
                          </label>
                          <input
                            type="text"
                            value={formData.location || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                location: e.target.value,
                              })
                            }
                            className="input-md w-full"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditMode(false)}
                          className="btn-secondary"
                        >
                          Annuler
                        </button>
                        <button type="submit" className="btn-primary">
                          Mettre à jour
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {detailTab === "depreciation" && (
              <div>
                {depreciationSchedule.length === 0 ? (
                  <p className="text-slate-400">
                    Aucun amortissement enregistré.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="px-2 py-1 text-left text-slate-400">
                          Période
                        </th>
                        <th className="px-2 py-1 text-right text-slate-400">
                          Montant
                        </th>
                        <th className="px-2 py-1 text-right text-slate-400">
                          Cumulé
                        </th>
                        <th className="px-2 py-1 text-right text-slate-400">
                          VNC
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {depreciationSchedule.map((d) => (
                        <tr key={d.id} className="border-b border-slate-700/50">
                          <td className="px-2 py-1">{d.period}</td>
                          <td className="px-2 py-1 text-right">
                            {formatCurrency(d.amount)}
                          </td>
                          <td className="px-2 py-1 text-right">
                            {formatCurrency(d.cumulative_depreciation)}
                          </td>
                          <td className="px-2 py-1 text-right">
                            {formatCurrency(d.net_book_value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {detailTab === "movements" && (
              <div>
                {movements.length === 0 ? (
                  <p className="text-slate-400">Aucun mouvement.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="px-2 py-1 text-left text-slate-400">
                          Date
                        </th>
                        <th className="px-2 py-1 text-left text-slate-400">
                          Type
                        </th>
                        <th className="px-2 py-1 text-left text-slate-400">
                          De
                        </th>
                        <th className="px-2 py-1 text-left text-slate-400">
                          Vers
                        </th>
                        <th className="px-2 py-1 text-left text-slate-400">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {movements.map((m) => (
                        <tr key={m.id} className="border-b border-slate-700/50">
                          <td className="px-2 py-1">{m.date}</td>
                          <td className="px-2 py-1">{m.type}</td>
                          <td className="px-2 py-1">
                            {m.from_location || "—"}
                          </td>
                          <td className="px-2 py-1">{m.to_location || "—"}</td>
                          <td className="px-2 py-1">{m.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {detailTab === "disposal" && (
              <div>
                {disposal ? (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-400">Type</span>{" "}
                      {disposal.type}
                    </div>
                    <div>
                      <span className="text-slate-400">Date de sortie</span>{" "}
                      {disposal.disposal_date}
                    </div>
                    <div>
                      <span className="text-slate-400">Prix de vente</span>{" "}
                      {disposal.sale_price
                        ? formatCurrency(disposal.sale_price)
                        : "—"}
                    </div>
                    <div>
                      <span className="text-slate-400">VNC à la sortie</span>{" "}
                      {formatCurrency(disposal.net_book_value)}
                    </div>
                    <div>
                      <span className="text-slate-400">Plus/moins-value</span>{" "}
                      {disposal.capital_gain_loss
                        ? formatCurrency(disposal.capital_gain_loss)
                        : "—"}
                    </div>
                    <div>
                      <span className="text-slate-400">Statut</span>{" "}
                      {disposal.status}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400">Aucune cession enregistrée.</p>
                )}
              </div>
            )}

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn-secondary"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
