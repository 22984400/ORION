import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Calendar,
  User,
  Users,
  UserPlus,
} from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { cn, formatShortDate } from "../../lib/utils";
import { supabase } from "../../lib/supabase";
import { MISSION_STATUS_CONFIG, URGENCY_CONFIG } from "../../lib/constants";
import type { WeeklyMission, Client, Profile } from "../../types";

export function EngagementsPage() {
  const [missions, setMissions] = useState<WeeklyMission[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingMission, setEditingMission] = useState<WeeklyMission | null>(
    null,
  );
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    client_id: "",
    subject: "",
    objective: "",
    urgency_level: "medium" as string,
    responsible_id: "",
    status: "open" as string,
    comments: "",
    progress: 0,
  });

  // États pour les modals d’ajout rapide
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddResponsible, setShowAddResponsible] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    name: "",
    email: "",
    contact_person: "",
  });
  const [newResponsibleForm, setNewResponsibleForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });

  // Charger toutes les données
  const fetchData = async () => {
    setLoading(true);
    try {
      // Missions
      const { data: missionsData, error: missionsError } = await supabase
        .from("weekly_missions")
        .select("*")
        .order("date", { ascending: false });
      if (missionsError) throw missionsError;
      setMissions(missionsData || []);

      // Clients
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");
      if (clientsError) throw clientsError;
      setClients(clientsData || []);

      // Responsables (profiles)
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name");
      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);
    } catch (err: any) {
      console.error("Erreur chargement :", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtrage
  const filtered = missions.filter((m) => {
    const matchSearch =
      m.subject.toLowerCase().includes(search.toLowerCase()) ||
      (m.client_id
        ? clients
            .find((c) => c.id === m.client_id)
            ?.name?.toLowerCase()
            .includes(search.toLowerCase())
        : false);
    const matchStatus = statusFilter === "all" || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Sauvegarder la mission
  const handleSave = async () => {
    const payload = {
      date: form.date,
      client_id: form.client_id || null,
      subject: form.subject,
      objective: form.objective,
      urgency_level: form.urgency_level,
      responsible_id: form.responsible_id || null,
      status: form.status,
      comments: form.comments,
      progress: form.progress,
    };
    if (editingMission) {
      await supabase
        .from("weekly_missions")
        .update(payload)
        .eq("id", editingMission.id);
    } else {
      await supabase.from("weekly_missions").insert([payload]);
    }
    fetchData();
    setShowModal(false);
    setEditingMission(null);
  };

  // Supprimer
  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette mission ?")) return;
    await supabase.from("weekly_missions").delete().eq("id", id);
    fetchData();
  };

  // Ouvrir le formulaire d’édition
  const openEdit = (m: WeeklyMission) => {
    setEditingMission(m);
    setForm({
      date: m.date,
      client_id: m.client_id || "",
      subject: m.subject,
      objective: m.objective || "",
      urgency_level: m.urgency_level || "medium",
      responsible_id: m.responsible_id || "",
      status: m.status,
      comments: m.comments || "",
      progress: m.progress,
    });
    setShowModal(true);
  };

  // Ajout rapide d’un client
  const handleAddClient = async () => {
    const { data, error } = await supabase
      .from("clients")
      .insert([
        {
          name: newClientForm.name,
          email: newClientForm.email,
          contact_person: newClientForm.contact_person,
          status: "active",
        },
      ])
      .select()
      .single();
    if (!error && data) {
      setClients([...clients, data]);
      setShowAddClient(false);
      setNewClientForm({ name: "", email: "", contact_person: "" });
    } else {
      alert("Erreur lors de l’ajout du client");
    }
  };

  // Ajout rapide d’un responsable (seulement dans profiles, sans auth)
  const handleAddResponsible = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .insert([
        {
          first_name: newResponsibleForm.first_name,
          last_name: newResponsibleForm.last_name,
          email: newResponsibleForm.email,
        },
      ])
      .select()
      .single();
    if (!error && data) {
      setProfiles([...profiles, data]);
      setShowAddResponsible(false);
      setNewResponsibleForm({ first_name: "", last_name: "", email: "" });
    } else {
      alert("Erreur lors de l’ajout du responsable");
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Missions de la semaine"
        description="Planifiez et suivez vos missions hebdomadaires"
        actions={
          <button
            onClick={() => {
              setEditingMission(null);
              setForm({
                date: new Date().toISOString().slice(0, 10),
                client_id: "",
                subject: "",
                objective: "",
                urgency_level: "medium",
                responsible_id: "",
                status: "open",
                comments: "",
                progress: 0,
              });
              setShowModal(true);
            }}
            className="btn-primary btn-md"
          >
            <Plus className="w-4 h-4" />
            Nouvelle mission
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher des missions..."
            className="input-md pl-10"
          />
        </div>
        <div className="flex gap-2">
          {["all", "open", "closed", "postponed"].map((s) => (
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
              {s === "all" ? "Tous" : (MISSION_STATUS_CONFIG[s]?.label ?? s)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((mission) => {
            const statusCfg = MISSION_STATUS_CONFIG[mission.status] ?? {
              label: mission.status,
              color: "",
            };
            const urgencyCfg = URGENCY_CONFIG[
              mission.urgency_level ?? "low"
            ] ?? { label: mission.urgency_level, color: "" };
            const clientName =
              clients.find((c) => c.id === mission.client_id)?.name ||
              "Client inconnu";
            const responsibleProfile = profiles.find(
              (p) => p.id === mission.responsible_id,
            );
            const responsibleName =
              responsibleProfile?.full_name || "Non assigné";
            return (
              <div key={mission.id} className="card-hover p-5 group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">
                      {formatShortDate(mission.date)}
                    </span>
                  </div>
                  <Badge
                    variant={
                      mission.status === "open"
                        ? "info"
                        : mission.status === "closed"
                          ? "success"
                          : "warning"
                    }
                  >
                    {statusCfg.label}
                  </Badge>
                </div>
                <h3 className="text-sm font-medium text-slate-100 mb-1">
                  {mission.subject}
                </h3>
                {mission.objective && (
                  <p className="text-xs text-slate-400 mb-3">
                    {mission.objective}
                  </p>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <Badge
                    variant={
                      mission.urgency_level === "critical"
                        ? "error"
                        : mission.urgency_level === "high"
                          ? "warning"
                          : mission.urgency_level === "medium"
                            ? "info"
                            : "neutral"
                    }
                  >
                    {urgencyCfg.label}
                  </Badge>
                  <span className="text-xs text-slate-400">{clientName}</span>
                </div>
                <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {responsibleName}
                </p>
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Progression</span>
                    <span>{mission.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${mission.progress}%` }}
                    />
                  </div>
                </div>
                {mission.comments && (
                  <p className="text-xs text-slate-500 italic truncate">
                    {mission.comments}
                  </p>
                )}
                <div className="flex gap-1 mt-3 pt-3 border-t border-slate-700/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(mission)}
                    className="btn-ghost btn-sm gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(mission.id)}
                    className="btn-ghost btn-sm gap-1 text-slate-400 hover:text-error-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="card p-8 text-center">
          <p className="text-sm text-slate-400">Aucune mission trouvée</p>
        </div>
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
              {editingMission ? "Modifier la mission" : "Nouvelle mission"}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, date: e.target.value }))
                  }
                  className="input-md"
                />
              </div>

              {/* Combobox Client */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Client
                </label>
                <div className="flex gap-2">
                  <select
                    value={form.client_id}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, client_id: e.target.value }))
                    }
                    className="input-md flex-1"
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddClient(true)}
                    className="btn-secondary btn-md px-2"
                    title="Ajouter un client"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Sujet
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, subject: e.target.value }))
                  }
                  className="input-md"
                  placeholder="Ex: Audit des comptes 2025"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Objectif
                </label>
                <input
                  type="text"
                  value={form.objective}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, objective: e.target.value }))
                  }
                  className="input-md"
                />
              </div>

              {/* Combobox Responsable */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Responsable
                </label>
                <div className="flex gap-2">
                  <select
                    value={form.responsible_id}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, responsible_id: e.target.value }))
                    }
                    className="input-md flex-1"
                  >
                    <option value="">Sélectionner un responsable</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddResponsible(true)}
                    className="btn-secondary btn-md px-2"
                    title="Ajouter un responsable"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Progression ({form.progress}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={form.progress}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, progress: Number(e.target.value) }))
                  }
                  className="w-full"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} className="btn-primary btn-md">
                  {editingMission ? "Mettre à jour" : "Créer"}
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

      {/* Modal ajout rapide client */}
      {showAddClient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowAddClient(false)}
        >
          <div
            className="card p-6 w-full max-w-sm animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-50 mb-4">
              Ajouter un client
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Nom</label>
                <input
                  type="text"
                  value={newClientForm.name}
                  onChange={(e) =>
                    setNewClientForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="input-md"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Email
                </label>
                <input
                  type="email"
                  value={newClientForm.email}
                  onChange={(e) =>
                    setNewClientForm((p) => ({ ...p, email: e.target.value }))
                  }
                  className="input-md"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Personne de contact
                </label>
                <input
                  type="text"
                  value={newClientForm.contact_person}
                  onChange={(e) =>
                    setNewClientForm((p) => ({
                      ...p,
                      contact_person: e.target.value,
                    }))
                  }
                  className="input-md"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddClient}
                  className="btn-primary btn-md"
                >
                  Ajouter
                </button>
                <button
                  onClick={() => setShowAddClient(false)}
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
      {showAddResponsible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowAddResponsible(false)}
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
                  Prénom
                </label>
                <input
                  type="text"
                  value={newResponsibleForm.first_name}
                  onChange={(e) =>
                    setNewResponsibleForm((p) => ({
                      ...p,
                      first_name: e.target.value,
                    }))
                  }
                  className="input-md"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Nom</label>
                <input
                  type="text"
                  value={newResponsibleForm.last_name}
                  onChange={(e) =>
                    setNewResponsibleForm((p) => ({
                      ...p,
                      last_name: e.target.value,
                    }))
                  }
                  className="input-md"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Email
                </label>
                <input
                  type="email"
                  value={newResponsibleForm.email}
                  onChange={(e) =>
                    setNewResponsibleForm((p) => ({
                      ...p,
                      email: e.target.value,
                    }))
                  }
                  className="input-md"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddResponsible}
                  className="btn-primary btn-md"
                >
                  Ajouter
                </button>
                <button
                  onClick={() => setShowAddResponsible(false)}
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
