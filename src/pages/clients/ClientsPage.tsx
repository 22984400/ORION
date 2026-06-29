import { useState, useEffect } from "react";
import { Plus, Eye, Trash2, Search } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { cn, formatDate } from "../../lib/utils";
import { supabase } from "../../lib/supabase";
import type { Client } from "../../types";

export function ClientsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showDetail, setShowDetail] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [form, setForm] = useState({
    name: "",
    industry: "",
    contact_person: "",
    email: "",
    phone: "",
    tax_number: "",
    fiscal_year_end: "",
    status: "active" as string,
  });

  // Charger les clients depuis Supabase
  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setClients(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filtered = clients.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email?.toLowerCase() ?? "").includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAdd = async () => {
    const { data, error } = await supabase
      .from("clients")
      .insert([
        {
          name: form.name || "Nouveau client",
          industry: form.industry || null,
          contact_person: form.contact_person || null,
          email: form.email || null,
          phone: form.phone || null,
          tax_number: form.tax_number || null,
          fiscal_year_end: form.fiscal_year_end || null,
          status: form.status,
        },
      ])
      .select()
      .single();

    if (!error && data) {
      fetchClients();
      setShowAdd(false);
      setForm({
        name: "",
        industry: "",
        contact_person: "",
        email: "",
        phone: "",
        tax_number: "",
        fiscal_year_end: "",
        status: "active",
      });
    } else {
      setError(error?.message || "Erreur lors de l’ajout");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce client ?")) return;
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (!error) fetchClients();
    else setError(error.message);
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Clients"
        description="Gérez vos relations clients et leurs informations"
        actions={
          <button
            onClick={() => setShowAdd(true)}
            className="btn-primary btn-md"
          >
            <Plus className="w-4 h-4" />
            Ajouter un client
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
            placeholder="Rechercher des clients..."
            className="input-md pl-10"
          />
        </div>
        <div className="flex gap-2">
          {["all", "active", "inactive"].map((s) => (
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
              {s === "all" ? "Tous" : s === "active" ? "Actif" : "Inactif"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-error-500/10 text-error-500 text-sm border border-error-500/25">
          Erreur de chargement : {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Aucun client"
          description="Ajoutez votre premier client pour commencer."
          action={{
            label: "Ajouter un client",
            onClick: () => setShowAdd(true),
          }}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {[
                    "Nom du client",
                    "Secteur",
                    "Personne de contact",
                    "Email",
                    "Numéro fiscal",
                    "Clôture fiscale",
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
                {filtered.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-100">
                      {client.name}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {client.industry || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {client.contact_person || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {client.email || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                      {client.tax_number || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {client.fiscal_year_end
                        ? formatDate(client.fiscal_year_end)
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          client.status === "active" ? "success" : "neutral"
                        }
                      >
                        {client.status === "active" ? "Actif" : "Inactif"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedClient(client);
                            setShowDetail(true);
                          }}
                          className="p-1.5 rounded hover:bg-slate-700/50 text-slate-400 hover:text-slate-200"
                          aria-label="Voir"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="p-1.5 rounded hover:bg-slate-700/50 text-slate-400 hover:text-error-400"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Détail */}
      {showDetail && selectedClient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowDetail(false)}
        >
          <div
            className="card p-6 w-full max-w-lg animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-50">
                {selectedClient.name}
              </h2>
              <button
                onClick={() => setShowDetail(false)}
                className="p-1 rounded hover:bg-slate-700/50 text-slate-400"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: "Secteur", value: selectedClient.industry },
                {
                  label: "Personne de contact",
                  value: selectedClient.contact_person,
                },
                { label: "Email", value: selectedClient.email },
                { label: "Téléphone", value: selectedClient.phone },
                { label: "Numéro fiscal", value: selectedClient.tax_number },
                {
                  label: "Fin d'exercice fiscal",
                  value: selectedClient.fiscal_year_end
                    ? formatDate(selectedClient.fiscal_year_end)
                    : null,
                },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-slate-400">{item.label}</p>
                  <p className="text-sm text-slate-200">
                    {item.value || "N/A"}
                  </p>
                </div>
              ))}
              <div>
                <p className="text-xs text-slate-400">Statut</p>
                <Badge
                  variant={
                    selectedClient.status === "active" ? "success" : "neutral"
                  }
                >
                  {selectedClient.status === "active" ? "Actif" : "Inactif"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajout */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="card p-6 w-full max-w-lg animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-50 mb-4">
              Ajouter un client
            </h2>
            <div className="space-y-3">
              {[
                { label: "Nom", key: "name", type: "text" },
                { label: "Secteur", key: "industry", type: "text" },
                {
                  label: "Personne de contact",
                  key: "contact_person",
                  type: "text",
                },
                { label: "Email", key: "email", type: "email" },
                { label: "Téléphone", key: "phone", type: "text" },
                { label: "Numéro fiscal", key: "tax_number", type: "text" },
                {
                  label: "Clôture fiscale",
                  key: "fiscal_year_end",
                  type: "date",
                },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-xs text-slate-400 mb-1 block">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={(form as any)[field.key]}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    className="input-md"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={handleAdd} className="btn-primary btn-md">
                  Créer
                </button>
                <button
                  onClick={() => setShowAdd(false)}
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
