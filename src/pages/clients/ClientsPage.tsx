// src/pages/clients/ClientsPage.tsx
import { useEffect, useState } from "react";
import { Plus, Search, Edit2, Trash2, X, Check } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCountry } from "../../contexts/CountryContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { addNotification } from "../../lib/notifications";

// Type Client complet
type Client = {
  id: string;
  client_code: string;
  name: string;
  country: string;
  address_bp: string;
  nui: string;
  rccm: string;
  contract_ref: string;
  manager_name: string;
  email: string;
  phone: string;
  city: string;
  rue?: string;
  forme_juridique?: string;
  obligation_300_salaries?: boolean;
  obligation_consolidee?: boolean;
  obligation_ca_18000ke?: boolean;
  statut_fiscal?: string;
  regime_fiscal?: string;
  nb_salaries?: number;
  decalage_paie?: boolean;
  jour_versement_salaires?: string;
  date_paye?: string;
  option_versement_mensuel?: boolean;
  entreprise_travail_temporaire?: boolean;
  rattachement_decalage_paie?: boolean;
  vrp_mono_carte?: boolean;
  vrp_multi_carte?: boolean;
  prevoyance_cadres_obligatoire?: boolean;
  prevoyance_cadres_non_cadres?: boolean;
  retraite_complementaire_non_cadre?: boolean;
  retraite_complementaire_cadre?: boolean;
  mutuelle?: boolean;
  retraite_capitalisation?: boolean;
  versement_1_pourcent_cdd?: boolean;
  soumis_cotisations_tns?: boolean;
  status?: string;
};

type ModalState = { open: boolean; client: Partial<Client> | null };

export default function ClientsPage() {
  const { selectedCountry } = useCountry();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<ModalState>({ open: false, client: null });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "general" | "juridiques" | "fiscales" | "sociales"
  >("general");

  // ✅ No more withTimeout – direct calls

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("country", selectedCountry.code)
        .order("client_code");
      if (error) {
        setError(`Erreur lors du chargement: ${error.message}`);
        setClients([]);
      } else {
        setClients(data || []);
      }
    } catch (err) {
      setError(`Erreur inattendue: ${err}`);
      setClients([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [selectedCountry.code]);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.client_code.toLowerCase().includes(search.toLowerCase()) ||
      (c.manager_name &&
        c.manager_name.toLowerCase().includes(search.toLowerCase())),
  );

  const openAdd = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("client_code")
        .eq("country", selectedCountry.code)
        .order("client_code", { ascending: false })
        .limit(1);

      if (error) console.error("Erreur lors du calcul du code client :", error);

      let nextNum = 1;
      if (data && data.length > 0) {
        const lastCode = data[0].client_code;
        const match = lastCode.match(/\d+$/);
        if (match) nextNum = parseInt(match[0]) + 1;
      }

      const prefix = selectedCountry.clientPrefix || "C";
      const nextCode = `${prefix}${String(nextNum).padStart(5, "0")}`;
      const currentYear = new Date().getFullYear();
      const contractRef = `CONTRAT/${currentYear}/${nextCode}`;

      setModal({
        open: true,
        client: {
          client_code: nextCode,
          country: selectedCountry.code,
          contract_ref: contractRef,
          manager_name: "",
          email: "",
          phone: "",
          city: "",
          rue: "",
          forme_juridique: "",
          obligation_300_salaries: false,
          obligation_consolidee: false,
          obligation_ca_18000ke: false,
          statut_fiscal: "",
          regime_fiscal: "",
          nb_salaries: 0,
          decalage_paie: false,
          jour_versement_salaires: "",
          date_paye: "",
          option_versement_mensuel: false,
          entreprise_travail_temporaire: false,
          rattachement_decalage_paie: false,
          vrp_mono_carte: false,
          vrp_multi_carte: false,
          prevoyance_cadres_obligatoire: false,
          prevoyance_cadres_non_cadres: false,
          retraite_complementaire_non_cadre: false,
          retraite_complementaire_cadre: false,
          mutuelle: false,
          retraite_capitalisation: false,
          versement_1_pourcent_cdd: false,
          soumis_cotisations_tns: false,
          status: "active",
        },
      });
      setActiveTab("general");
    } catch (err) {
      console.error("Erreur lors de l'ouverture du modal client :", err);
      setError("Impossible d'initialiser le nouveau client. Réessayez.");
    }
  };

  const openEdit = (client: Client) => {
    setModal({ open: true, client: { ...client } });
    setActiveTab("general");
  };

  const handleDelete = async (clientId: string, clientName: string) => {
    if (
      !confirm(
        `Supprimer définitivement le client "${clientName}" ? Cette action est irréversible.`,
      )
    )
      return;
    setLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientId);
      if (deleteError) {
        setError(`Erreur lors de la suppression : ${deleteError.message}`);
      } else {
        await load();
        void addNotification({
          title: "Client supprimé",
          message: `Le client "${clientName}" a été supprimé.`,
          type: "client",
        });
      }
    } catch (err) {
      console.error("Erreur lors de la suppression du client :", err);
      setError("Impossible de supprimer le client. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!modal.client?.name?.trim()) {
      setError("Le nom est requis");
      return;
    }
    setSaving(true);
    setError("");

    // Convert empty string to null for date field
    const datePaye = modal.client.date_paye || null;

    const payload = {
      client_code: modal.client.client_code || "",
      name: modal.client.name || "",
      country: modal.client.country || selectedCountry.code,
      address_bp: modal.client.address_bp || "",
      nui: modal.client.nui || "",
      rccm: modal.client.rccm || "",
      contract_ref: modal.client.contract_ref || "",
      manager_name: modal.client.manager_name || "",
      email: modal.client.email || "",
      phone: modal.client.phone || "",
      city: modal.client.city || "",
      rue: modal.client.rue || "",
      forme_juridique: modal.client.forme_juridique || "",
      obligation_300_salaries: modal.client.obligation_300_salaries || false,
      obligation_consolidee: modal.client.obligation_consolidee || false,
      obligation_ca_18000ke: modal.client.obligation_ca_18000ke || false,
      statut_fiscal: modal.client.statut_fiscal || "",
      regime_fiscal: modal.client.regime_fiscal || "",
      nb_salaries: modal.client.nb_salaries || 0,
      decalage_paie: modal.client.decalage_paie || false,
      jour_versement_salaires: modal.client.jour_versement_salaires || "",
      date_paye: datePaye,
      option_versement_mensuel: modal.client.option_versement_mensuel || false,
      entreprise_travail_temporaire:
        modal.client.entreprise_travail_temporaire || false,
      rattachement_decalage_paie:
        modal.client.rattachement_decalage_paie || false,
      vrp_mono_carte: modal.client.vrp_mono_carte || false,
      vrp_multi_carte: modal.client.vrp_multi_carte || false,
      prevoyance_cadres_obligatoire:
        modal.client.prevoyance_cadres_obligatoire || false,
      prevoyance_cadres_non_cadres:
        modal.client.prevoyance_cadres_non_cadres || false,
      retraite_complementaire_non_cadre:
        modal.client.retraite_complementaire_non_cadre || false,
      retraite_complementaire_cadre:
        modal.client.retraite_complementaire_cadre || false,
      mutuelle: modal.client.mutuelle || false,
      retraite_capitalisation: modal.client.retraite_capitalisation || false,
      versement_1_pourcent_cdd: modal.client.versement_1_pourcent_cdd || false,
      soumis_cotisations_tns: modal.client.soumis_cotisations_tns || false,
      status: modal.client.status || "active",
    };

    let isUpdate = !!modal.client.id;
    let clientName = modal.client.name || "";

    try {
      if (isUpdate && modal.client.id) {
        const { error: updateError } = await supabase
          .from("clients")
          .update(payload)
          .eq("id", modal.client.id);
        if (updateError) {
          setError(`Erreur lors de la mise à jour : ${updateError.message}`);
          return;
        }
        void addNotification({
          title: "Client modifié",
          message: `Le client "${clientName}" a été mis à jour.`,
          type: "client",
        });
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("clients")
          .insert(payload)
          .select("name")
          .single();
        if (insertError) {
          setError(`Erreur lors de l'enregistrement : ${insertError.message}`);
          return;
        }
        if (inserted) {
          clientName = (inserted as any).name || clientName;
        }
        void addNotification({
          title: "Nouveau client",
          message: `Le client "${clientName}" a été ajouté.`,
          type: "client",
        });
      }
      setModal({ open: false, client: null });
      await load();
    } catch (err) {
      console.error("Erreur lors de l'enregistrement du client :", err);
      setError("Impossible d'enregistrer le client. Réessayez.");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof Client, value: any) => {
    setModal((m) => ({ ...m, client: { ...m.client, [field]: value } }));
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Clients"
        description={`${selectedCountry.flag} ${selectedCountry.name} – Gestion des clients`}
        actions={
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-xl text-sm font-medium hover:bg-[#2a4f7f] transition-all shadow-sm"
          >
            <Plus size={16} />
            Nouveau client
          </button>
        }
      />

      {/* Barre de recherche */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, code client ou gérant..."
            className="auth-input w-full pl-10 pr-4 py-2.5"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-12 bg-slate-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Aucun client"
            description="Ajoutez votre premier client pour commencer."
            action={{
              label: "Ajouter un client",
              onClick: openAdd,
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-6 py-3 font-medium">Code</th>
                  <th className="text-left px-4 py-3 font-medium">Nom</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">
                    Gérant
                  </th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                    Ville
                  </th>
                  <th className="text-left px-4 py-3 font-medium hidden xl:table-cell">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 font-medium hidden 2xl:table-cell">
                    Téléphone
                  </th>
                  <th className="text-right px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-3 font-mono text-xs text-slate-600">
                      {client.client_code}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {client.name}
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">
                      {client.manager_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                      {client.city || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden xl:table-cell">
                      {client.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden 2xl:table-cell">
                      {client.phone || "—"}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(client)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Modifier"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id, client.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal d’ajout / modification */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">
                {modal.client?.id ? "Modifier le client" : "Nouveau client"}
              </h2>
              <button
                onClick={() => setModal({ open: false, client: null })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-100 px-6">
              <div className="flex gap-6">
                {["general", "juridiques", "fiscales", "sociales"].map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() =>
                        setActiveTab(
                          tab as
                            | "general"
                            | "juridiques"
                            | "fiscales"
                            | "sociales",
                        )
                      }
                      className={`py-2 text-sm font-medium transition-all ${
                        activeTab === tab
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {tab === "general"
                        ? "Général"
                        : tab === "juridiques"
                          ? "Juridiques"
                          : tab === "fiscales"
                            ? "Fiscales"
                            : "Sociales & TNS"}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Tab Général */}
              {activeTab === "general" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Code client
                      </label>
                      <input
                        value={modal.client?.client_code || ""}
                        readOnly
                        className="auth-input w-full px-3 py-2 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Pays
                      </label>
                      <input
                        value={selectedCountry.name}
                        readOnly
                        className="auth-input w-full px-3 py-2 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Nom / Raison sociale{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={modal.client?.name || ""}
                      onChange={(e) => updateField("name", e.target.value)}
                      className="auth-input w-full px-3 py-2 text-sm"
                      placeholder="ACME SARL"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Nom du gérant / président
                    </label>
                    <input
                      value={modal.client?.manager_name || ""}
                      onChange={(e) =>
                        updateField("manager_name", e.target.value)
                      }
                      className="auth-input w-full px-3 py-2 text-sm"
                      placeholder="Mr. TCHÉBÉ Trésor"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Mail
                      </label>
                      <input
                        value={modal.client?.email || ""}
                        onChange={(e) => updateField("email", e.target.value)}
                        type="email"
                        className="auth-input w-full px-3 py-2 text-sm"
                        placeholder="contact@exemple.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Téléphone
                      </label>
                      <input
                        value={modal.client?.phone || ""}
                        onChange={(e) => updateField("phone", e.target.value)}
                        className="auth-input w-full px-3 py-2 text-sm"
                        placeholder="+237 6XX XXX XXX"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Ville
                      </label>
                      <input
                        value={modal.client?.city || ""}
                        onChange={(e) => updateField("city", e.target.value)}
                        className="auth-input w-full px-3 py-2 text-sm"
                        placeholder="Douala"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Rue
                      </label>
                      <input
                        value={modal.client?.rue || ""}
                        onChange={(e) => updateField("rue", e.target.value)}
                        className="auth-input w-full px-3 py-2 text-sm"
                        placeholder="12 Avenue Manga"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Adresse / BP
                    </label>
                    <input
                      value={modal.client?.address_bp || ""}
                      onChange={(e) =>
                        updateField("address_bp", e.target.value)
                      }
                      className="auth-input w-full px-3 py-2 text-sm"
                      placeholder="BP 1234"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        NUI
                      </label>
                      <input
                        value={modal.client?.nui || ""}
                        onChange={(e) => updateField("nui", e.target.value)}
                        className="auth-input w-full px-3 py-2 text-sm"
                        placeholder="M0000XXXXXXX"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        RCCM
                      </label>
                      <input
                        value={modal.client?.rccm || ""}
                        onChange={(e) => updateField("rccm", e.target.value)}
                        className="auth-input w-full px-3 py-2 text-sm"
                        placeholder="RC/DLA/XXXX/B/XXX"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Réf. contrat
                    </label>
                    <input
                      value={modal.client?.contract_ref || ""}
                      readOnly
                      className="auth-input w-full px-3 py-2 text-sm bg-slate-100 text-slate-600 cursor-not-allowed"
                      placeholder="Généré automatiquement"
                    />
                  </div>
                </>
              )}

              {/* Tab Juridiques */}
              {activeTab === "juridiques" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Forme juridique
                      </label>
                      <input
                        value={modal.client?.forme_juridique || ""}
                        onChange={(e) =>
                          updateField("forme_juridique", e.target.value)
                        }
                        className="auth-input w-full px-3 py-2 text-sm"
                        placeholder="SARL, SA, EURL..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Statut
                      </label>
                      <input
                        value={modal.client?.status || ""}
                        onChange={(e) => updateField("status", e.target.value)}
                        className="auth-input w-full px-3 py-2 text-sm"
                        placeholder="Active / Inactive"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Date de création
                      </label>
                      <input
                        type="date"
                        value={modal.client?.date_paye || ""}
                        onChange={(e) =>
                          updateField("date_paye", e.target.value)
                        }
                        className="auth-input w-full px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Numéro de contrat
                      </label>
                      <input
                        value={modal.client?.contract_ref || ""}
                        readOnly
                        className="auth-input w-full px-3 py-2 text-sm bg-slate-100 text-slate-600 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Tab Fiscales */}
              {activeTab === "fiscales" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Statut fiscal
                      </label>
                      <input
                        value={modal.client?.statut_fiscal || ""}
                        onChange={(e) =>
                          updateField("statut_fiscal", e.target.value)
                        }
                        className="auth-input w-full px-3 py-2 text-sm"
                        placeholder="Régime normal, réel..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Régime fiscal
                      </label>
                      <input
                        value={modal.client?.regime_fiscal || ""}
                        onChange={(e) =>
                          updateField("regime_fiscal", e.target.value)
                        }
                        className="auth-input w-full px-3 py-2 text-sm"
                        placeholder="IR, IS, TVA..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={!!modal.client?.obligation_ca_18000ke}
                        onChange={(e) =>
                          updateField("obligation_ca_18000ke", e.target.checked)
                        }
                        className="form-checkbox h-4 w-4 text-blue-600"
                      />
                      Obligation CA 18 000 KE
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={!!modal.client?.obligation_consolidee}
                        onChange={(e) =>
                          updateField("obligation_consolidee", e.target.checked)
                        }
                        className="form-checkbox h-4 w-4 text-blue-600"
                      />
                      Obligation consolidée
                    </label>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!modal.client?.obligation_300_salaries}
                      onChange={(e) =>
                        updateField("obligation_300_salaries", e.target.checked)
                      }
                      className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    Obligation 300 salariés
                  </label>
                </>
              )}

              {/* Tab Sociales & TNS */}
              {activeTab === "sociales" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Nombre de salariés
                      </label>
                      <input
                        type="number"
                        value={modal.client?.nb_salaries ?? 0}
                        onChange={(e) =>
                          updateField("nb_salaries", Number(e.target.value))
                        }
                        className="auth-input w-full px-3 py-2 text-sm"
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Jour de versement salaires
                      </label>
                      <input
                        value={modal.client?.jour_versement_salaires || ""}
                        onChange={(e) =>
                          updateField("jour_versement_salaires", e.target.value)
                        }
                        className="auth-input w-full px-3 py-2 text-sm"
                        placeholder="15"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Date de paye
                      </label>
                      <input
                        value={modal.client?.date_paye || ""}
                        onChange={(e) =>
                          updateField("date_paye", e.target.value)
                        }
                        className="auth-input w-full px-3 py-2 text-sm"
                        placeholder="JJ/MM/AAAA"
                      />
                    </div>
                    <div className="flex flex-col gap-3">
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Options sociales
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={!!modal.client?.option_versement_mensuel}
                            onChange={(e) =>
                              updateField(
                                "option_versement_mensuel",
                                e.target.checked,
                              )
                            }
                            className="form-checkbox h-4 w-4 text-blue-600"
                          />
                          Versement mensuel
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={
                              !!modal.client?.entreprise_travail_temporaire
                            }
                            onChange={(e) =>
                              updateField(
                                "entreprise_travail_temporaire",
                                e.target.checked,
                              )
                            }
                            className="form-checkbox h-4 w-4 text-blue-600"
                          />
                          Entreprise travail temporaire
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={!!modal.client?.rattachement_decalage_paie}
                            onChange={(e) =>
                              updateField(
                                "rattachement_decalage_paie",
                                e.target.checked,
                              )
                            }
                            className="form-checkbox h-4 w-4 text-blue-600"
                          />
                          Rattachement décalage paie
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={!!modal.client?.soumis_cotisations_tns}
                            onChange={(e) =>
                              updateField(
                                "soumis_cotisations_tns",
                                e.target.checked,
                              )
                            }
                            className="form-checkbox h-4 w-4 text-blue-600"
                          />
                          Soumis cotisations TNS
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={!!modal.client?.vrp_mono_carte}
                        onChange={(e) =>
                          updateField("vrp_mono_carte", e.target.checked)
                        }
                        className="form-checkbox h-4 w-4 text-blue-600"
                      />
                      VRP mono carte
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={!!modal.client?.vrp_multi_carte}
                        onChange={(e) =>
                          updateField("vrp_multi_carte", e.target.checked)
                        }
                        className="form-checkbox h-4 w-4 text-blue-600"
                      />
                      VRP multi carte
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={!!modal.client?.prevoyance_cadres_obligatoire}
                        onChange={(e) =>
                          updateField(
                            "prevoyance_cadres_obligatoire",
                            e.target.checked,
                          )
                        }
                        className="form-checkbox h-4 w-4 text-blue-600"
                      />
                      Prévoyance cadres obligatoire
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={!!modal.client?.prevoyance_cadres_non_cadres}
                        onChange={(e) =>
                          updateField(
                            "prevoyance_cadres_non_cadres",
                            e.target.checked,
                          )
                        }
                        className="form-checkbox h-4 w-4 text-blue-600"
                      />
                      Prévoyance cadres/non-cadres
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={
                          !!modal.client?.retraite_complementaire_non_cadre
                        }
                        onChange={(e) =>
                          updateField(
                            "retraite_complementaire_non_cadre",
                            e.target.checked,
                          )
                        }
                        className="form-checkbox h-4 w-4 text-blue-600"
                      />
                      Retraite complémentaire non-cadre
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={!!modal.client?.retraite_complementaire_cadre}
                        onChange={(e) =>
                          updateField(
                            "retraite_complementaire_cadre",
                            e.target.checked,
                          )
                        }
                        className="form-checkbox h-4 w-4 text-blue-600"
                      />
                      Retraite complémentaire cadre
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={!!modal.client?.mutuelle}
                        onChange={(e) =>
                          updateField("mutuelle", e.target.checked)
                        }
                        className="form-checkbox h-4 w-4 text-blue-600"
                      />
                      Mutuelle
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={!!modal.client?.retraite_capitalisation}
                        onChange={(e) =>
                          updateField(
                            "retraite_capitalisation",
                            e.target.checked,
                          )
                        }
                        className="form-checkbox h-4 w-4 text-blue-600"
                      />
                      Retraite capitalisation
                    </label>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!modal.client?.versement_1_pourcent_cdd}
                      onChange={(e) =>
                        updateField(
                          "versement_1_pourcent_cdd",
                          e.target.checked,
                        )
                      }
                      className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    Versement 1% CDD
                  </label>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setModal({ open: false, client: null })}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#2a4f7f] disabled:opacity-60"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
