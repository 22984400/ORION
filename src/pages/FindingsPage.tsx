import { useState, useEffect, useMemo } from "react";
import { Plus, Edit, Trash2, UserPlus } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { DataTable } from "../components/ui/DataTable";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { useSupabaseQuery } from "../hooks/useSupabaseData";
import { mapFindingRow } from "../lib/db-mappers";
import { RISK_LABELS } from "../lib/constants";
import { cn, formatDate } from "../lib/utils";
import { supabase } from "../lib/supabase";
import type { Finding, ColumnDef } from "../types";

export function FindingsPage() {
  const [filter, setFilter] = useState("all");
  const {
    data: rawData,
    loading,
    error,
    refetch,
  } = useSupabaseQuery<Record<string, unknown>>({
    table: "findings",
    orderBy: "created_at",
    orderAsc: false,
  });

  // États pour le modal
  const [showModal, setShowModal] = useState(false);
  const [editingFinding, setEditingFinding] = useState<Finding | null>(null);
  const [form, setForm] = useState({
    finding: "",
    risk_level: "medium",
    status: "open",
    recommendation: "",
    responsible_person: "",
    target_date: "",
  });

  // États pour les profils (responsables)
  const [profiles, setProfiles] = useState<{ id: string; full_name: string }[]>(
    [],
  );
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ full_name: "" });

  // Charger les profils
  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name");
      if (!error) setProfiles(data || []);
    };
    fetchProfiles();
  }, []);

  // Ajout rapide d'un responsable
  const handleAddUser = async () => {
    if (!newUserForm.full_name.trim()) return alert("Veuillez saisir un nom");
    const { data, error } = await supabase
      .from("profiles")
      .insert([{ full_name: newUserForm.full_name.trim() }])
      .select()
      .single();
    if (error) {
      alert("Erreur lors de l’ajout");
      return;
    }
    setProfiles((prev) => [...prev, data]);
    setForm((p) => ({ ...p, responsible_person: data.full_name }));
    setShowAddUser(false);
    setNewUserForm({ full_name: "" });
  };

  const data = useMemo(() => rawData.map(mapFindingRow), [rawData]);
  const filtered =
    filter === "all"
      ? data
      : data.filter((f) => f.status === filter || f.risk_level === filter);
  const riskSummary = {
    critical: data.filter((f) => f.risk_level === "critical").length,
    high: data.filter((f) => f.risk_level === "high").length,
    medium: data.filter((f) => f.risk_level === "medium").length,
    low: data.filter((f) => f.risk_level === "low").length,
  };

  // Sauvegarder (création ou mise à jour)
  const handleSave = async () => {
    try {
      if (!form.finding.trim()) {
        alert("Veuillez saisir un constat");
        return;
      }

      const payload = {
        finding: form.finding,
        risk_level: form.risk_level,
        status: form.status,
        recommendation: form.recommendation || null,
        responsible_person: form.responsible_person || null,
        target_date: form.target_date || null,
        engagement_id: null,
        management_response: null,
        created_by: null,
      };

      let result;
      if (editingFinding) {
        result = await supabase
          .from("findings")
          .update(payload)
          .eq("id", editingFinding.id);
      } else {
        result = await supabase.from("findings").insert([payload]);
      }

      if (result.error) throw result.error;

      if (editingFinding) {
        void addNotification({
          title: "Constat mis à jour",
          message: `Le constat a été mis à jour.`,
          type: "finding",
        });
      } else {
        void addNotification({
          title: "Nouveau constat",
          message: `Un nouveau constat a été créé.`,
          type: "finding",
        });
      }

      await refetch();
      setShowModal(false);
      setEditingFinding(null);
    } catch (err: any) {
      console.error("Erreur lors de la sauvegarde :", err);
      alert("Erreur : " + (err.message || "Inconnue"));
    }
  };

  // Supprimer
  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce constat ?")) return;
    try {
      const { error } = await supabase.from("findings").delete().eq("id", id);
      if (error) throw error;
      void addNotification({
        title: "Constat supprimé",
        message: "Un constat a été supprimé.",
        type: "finding",
      });
      await refetch();
    } catch (err: any) {
      alert("Erreur lors de la suppression : " + err.message);
    }
  };

  // Ouvrir le formulaire d’édition
  const openEdit = (finding: Finding) => {
    setEditingFinding(finding);
    setForm({
      finding: finding.finding,
      risk_level: finding.risk_level,
      status: finding.status,
      recommendation: finding.recommendation || "",
      responsible_person: finding.responsible_person || "",
      target_date: finding.target_date || "",
    });
    setShowModal(true);
  };

  // Ouvrir le formulaire de création
  const openCreate = () => {
    setEditingFinding(null);
    setForm({
      finding: "",
      risk_level: "medium",
      status: "open",
      recommendation: "",
      responsible_person: "",
      target_date: "",
    });
    setShowModal(true);
  };

  // Colonnes avec actions Modifier / Supprimer
  const columns: ColumnDef<Finding>[] = [
    {
      key: "finding",
      label: "Constat",
      sortable: true,
      render: (value) => (
        <span className="font-medium text-slate-100 max-w-xs truncate block">
          {String(value)}
        </span>
      ),
    },
    {
      key: "risk_level",
      label: "Niveau de risque",
      sortable: true,
      render: (value) => {
        const v = String(value);
        return (
          <Badge
            variant={
              v === "critical"
                ? "error"
                : v === "high"
                  ? "warning"
                  : v === "medium"
                    ? "info"
                    : "neutral"
            }
          >
            {RISK_LABELS[v] ?? v}
          </Badge>
        );
      },
    },
    {
      key: "status",
      label: "Statut",
      sortable: true,
      render: (value) => {
        const v = String(value);
        return (
          <Badge
            variant={
              v === "open"
                ? "error"
                : v === "in_progress"
                  ? "warning"
                  : v === "resolved"
                    ? "success"
                    : "neutral"
            }
          >
            {v === "open"
              ? "Ouvert"
              : v === "in_progress"
                ? "En cours"
                : "Résolu"}
          </Badge>
        );
      },
    },
    {
      key: "recommendation",
      label: "Recommandation",
      sortable: false,
      render: (value) => (
        <span className="text-slate-400 text-xs truncate max-w-xs block">
          {String(value ?? "-")}
        </span>
      ),
    },
    { key: "responsible_person", label: "Responsable", sortable: true },
    {
      key: "target_date",
      label: "Date cible",
      sortable: true,
      render: (value) => (
        <span className="text-slate-400">
          {value ? formatDate(String(value)) : "-"}
        </span>
      ),
    },
    {
      key: "id",
      label: "Actions",
      sortable: false,
      render: (value, row) => (
        <div className="flex gap-1">
          <button
            onClick={() => openEdit(row)}
            className="p-1.5 rounded hover:bg-slate-700/50 text-slate-400 hover:text-slate-200"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 rounded hover:bg-slate-700/50 text-slate-400 hover:text-error-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Constats"
        description="Gérez les constats d'audit et les recommandations"
        actions={
          <button onClick={openCreate} className="btn-primary btn-md">
            <Plus className="w-4 h-4" />
            Signaler un constat
          </button>
        }
      />

      {error && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-error-500/10 text-error-500 text-sm border border-error-500/25">
          Erreur de chargement : {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Critique",
            value: riskSummary.critical,
            color: "text-error-500",
          },
          {
            label: "Élevé",
            value: riskSummary.high,
            color: "text-warning-500",
          },
          { label: "Moyen", value: riskSummary.medium, color: "text-info-500" },
          { label: "Faible", value: riskSummary.low, color: "text-slate-400" },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={`text-lg font-semibold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {["all", "open", "in_progress", "resolved", "critical", "high"].map(
          (f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap",
                filter === f
                  ? "bg-primary-600/15 text-primary-300 ring-1 ring-primary-500/25"
                  : "text-slate-400 hover:bg-slate-700/40",
              )}
            >
              {f === "all"
                ? "Tous"
                : f === "open"
                  ? "Ouverts"
                  : f === "in_progress"
                    ? "En cours"
                    : f === "resolved"
                      ? "Résolus"
                      : (RISK_LABELS[f] ?? f)}
            </button>
          ),
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Aucun constat"
          description="Les constats d'audit apparaîtront ici."
        />
      ) : (
        <DataTable data={filtered} columns={columns} />
      )}

      {/* Modal d’ajout / modification */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            className="card p-6 w-full max-w-lg animate-scale-in max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-50 mb-4">
              {editingFinding ? "Modifier le constat" : "Nouveau constat"}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Constat
                </label>
                <textarea
                  value={form.finding}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, finding: e.target.value }))
                  }
                  className="input-md min-h-[80px]"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Niveau de risque
                </label>
                <select
                  value={form.risk_level}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, risk_level: e.target.value }))
                  }
                  className="input-md"
                >
                  <option value="low">Faible</option>
                  <option value="medium">Moyen</option>
                  <option value="high">Élevé</option>
                  <option value="critical">Critique</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Statut
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, status: e.target.value }))
                  }
                  className="input-md"
                >
                  <option value="open">Ouvert</option>
                  <option value="in_progress">En cours</option>
                  <option value="resolved">Résolu</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Recommandation
                </label>
                <input
                  type="text"
                  value={form.recommendation}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, recommendation: e.target.value }))
                  }
                  className="input-md"
                />
              </div>

              {/* Responsable avec dropdown + ajout rapide */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Responsable
                </label>
                <div className="flex gap-2">
                  <select
                    value={
                      profiles.find(
                        (p) => p.full_name === form.responsible_person,
                      )?.id || ""
                    }
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const profile = profiles.find((p) => p.id === selectedId);
                      setForm((p) => ({
                        ...p,
                        responsible_person: profile ? profile.full_name : "",
                      }));
                    }}
                    className="input-md flex-1"
                  >
                    <option value="">Non assigné</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddUser(true)}
                    className="btn-secondary btn-md px-2"
                    title="Ajouter un responsable"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Date cible
                </label>
                <input
                  type="date"
                  value={form.target_date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, target_date: e.target.value }))
                  }
                  className="input-md"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} className="btn-primary btn-md">
                  {editingFinding ? "Mettre à jour" : "Créer"}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="btn-secondary btn-md"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal ajout rapide responsable */}
      {showAddUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowAddUser(false)}
        >
          <div
            className="card p-6 w-full max-w-sm animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-50 mb-4">
              Ajouter un responsable
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={newUserForm.full_name}
                  onChange={(e) =>
                    setNewUserForm((p) => ({
                      ...p,
                      full_name: e.target.value,
                    }))
                  }
                  className="input-md"
                  placeholder="Ex: Jean Dupont"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleAddUser} className="btn-primary btn-md">
                  Ajouter
                </button>
                <button
                  onClick={() => setShowAddUser(false)}
                  className="btn-secondary btn-md"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
