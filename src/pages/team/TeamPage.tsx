import { useState, useEffect } from "react";
import { Plus, Mail, MoreHorizontal, Save, Lock } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { cn, getInitials } from "../../lib/utils";
import { addNotification } from "../../lib/notifications";
import { supabase } from "../../lib/supabase";
import { useSupabaseQuery } from "../../hooks/useSupabaseData";
import { USER_ROLE_LABELS } from "../../lib/constants";
import type { User } from "../../types";

// --- Modules et rôles pour les permissions ---
const MODULES = [
  { id: "dashboard", label: "Tableau de bord" },
  { id: "clients", label: "Clients" },
  { id: "missions", label: "Missions" },
  { id: "review_notes", label: "Notes de revue" },
  { id: "findings", label: "Anomalies" },
  { id: "working_papers", label: "Documents de travail" },
  { id: "stock", label: "Stocks" },
  { id: "assets", label: "Immobilisations" },
  { id: "leaves", label: "Congés" },
  { id: "team", label: "Équipe" },
  { id: "reports", label: "Rapports" },
];

const ROLES = [
  { id: "super_admin", label: "Super Admin" },
  { id: "associe", label: "Associé" },
  { id: "responsable", label: "Responsable" },
  { id: "auditeur_senior", label: "Auditeur Senior" },
  { id: "auditeur", label: "Auditeur" },
  { id: "rh", label: "RH" },
  { id: "gestionnaire_stock", label: "Gestionnaire Stock" },
  { id: "gestionnaire_actifs", label: "Gestionnaire Actifs" },
  { id: "finance", label: "Finance" },
  { id: "lecture_seule", label: "Lecture Seule" },
];

type PermissionsMap = Record<string, Record<string, boolean>>;

export function TeamPage() {
  // --- Partie utilisateurs (existant) ---
  const { data: team, refetch } = useSupabaseQuery<User>({
    table: "profiles",
    orderBy: "full_name",
  });
  const [view, setView] = useState<"grid" | "list">("grid");
  const [roleFilter, setRoleFilter] = useState<string>("all"); // 'all' ou un rôle spécifique

  // --- Partie permissions (nouveau) ---
  const [permissions, setPermissions] = useState<PermissionsMap>({});
  const [loadingPerms, setLoadingPerms] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Filtrage des utilisateurs par rôle
  const filteredTeam =
    roleFilter === "all" ? team : team.filter((u) => u.role === roleFilter);

  // Charger les permissions
  const fetchPermissions = async () => {
    setLoadingPerms(true);
    const { data, error } = await supabase
      .from("role_permissions")
      .select("role, permissions");
    if (error) {
      alert("Erreur de chargement des permissions : " + error.message);
      setLoadingPerms(false);
      return;
    }
    const map: PermissionsMap = {};
    data.forEach((row) => {
      map[row.role] = row.permissions || {};
    });
    setPermissions(map);
    setLoadingPerms(false);
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  // Sauvegarder les permissions
  const handleSavePermissions = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updates = Object.entries(permissions).map(([role, perms]) => ({
        role,
        permissions: perms,
      }));
      for (const update of updates) {
        const { error } = await supabase
          .from("role_permissions")
          .upsert(
            { role: update.role, permissions: update.permissions },
            { onConflict: "role" },
          );
        if (error) throw error;
      }
      setSaved(true);
      void addNotification({
        title: "Permissions mises à jour",
        message: "Les permissions de l'équipe ont été mises à jour.",
        type: "team",
      });
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert("Erreur de sauvegarde : " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // --- Gestion des toggles ---
  const togglePermission = (role: string, moduleId: string) => {
    setPermissions((prev) => {
      const rolePerms = { ...(prev[role] || {}) };
      rolePerms[moduleId] = !rolePerms[moduleId];
      return { ...prev, [role]: rolePerms };
    });
  };

  const toggleAllForRole = (role: string, value: boolean) => {
    const newPerms: Record<string, boolean> = {};
    MODULES.forEach((m) => (newPerms[m.id] = value));
    setPermissions((prev) => ({ ...prev, [role]: newPerms }));
  };

  const toggleModuleForAll = (moduleId: string, value: boolean) => {
    setPermissions((prev) => {
      const newMap = { ...prev };
      ROLES.forEach((r) => {
        if (!newMap[r.id]) newMap[r.id] = {};
        newMap[r.id][moduleId] = value;
      });
      return newMap;
    });
  };

  // --- Rendu ---
  return (
    <div className="page-container">
      <PageHeader
        title="Équipe"
        description="Gérez les membres de l'équipe, leurs rôles et les permissions"
        actions={
          <div className="flex gap-2">
            <button
              onClick={handleSavePermissions}
              className="btn-primary btn-md"
              disabled={saving}
            >
              <Save className="w-4 h-4" />
              {saving ? "Sauvegarde..." : "Sauvegarder les permissions"}
            </button>
          </div>
        }
      />

      {saved && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-success-500/10 text-success-500 text-sm border border-success-500/25">
          ✅ Permissions sauvegardées avec succès.
        </div>
      )}

      {/* ---------- FILTRES ET LISTE DES UTILISATEURS ---------- */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setRoleFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition-colors",
              roleFilter === "all"
                ? "bg-primary-600/15 text-primary-300 ring-1 ring-primary-500/25"
                : "text-slate-400 hover:bg-slate-700/40",
            )}
          >
            Tous
          </button>
          {Object.entries(USER_ROLE_LABELS).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setRoleFilter(k)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm transition-colors",
                roleFilter === k
                  ? "bg-primary-600/15 text-primary-300 ring-1 ring-primary-500/25"
                  : "text-slate-400 hover:bg-slate-700/40",
              )}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex bg-slate-800 rounded-lg border border-slate-700/50 p-0.5 ml-auto">
          <button
            onClick={() => setView("grid")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              view === "grid"
                ? "bg-primary-600 text-white"
                : "text-slate-400 hover:text-slate-200",
            )}
          >
            Grille
          </button>
          <button
            onClick={() => setView("list")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              view === "list"
                ? "bg-primary-600 text-white"
                : "text-slate-400 hover:text-slate-200",
            )}
          >
            Liste
          </button>
        </div>
      </div>

      {/* Affichage des utilisateurs (vue grille ou liste) – inchangé par rapport à l’original */}
      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTeam.map((member) => (
            <div key={member.id} className="card-hover p-5 group">
              {/* ... contenu carte ... */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center text-lg font-semibold text-primary-300">
                  {getInitials(member.full_name)}
                </div>
                <button className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-700/50">
                  <MoreHorizontal className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <h3 className="text-sm font-medium text-slate-100">
                {member.full_name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {USER_ROLE_LABELS[member.role] ?? member.role}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="neutral">{member.department}</Badge>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-700/30">
                <a
                  href={`mailto:${member.email}`}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-primary-300 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {member.email}
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {["Nom", "Email", "Rôle", "Département", "Téléphone"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filteredTeam.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex items-center justify-center text-xs font-semibold text-primary-300">
                          {getInitials(member.full_name)}
                        </div>
                        <span className="font-medium text-slate-100">
                          {member.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{member.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="primary">
                        {USER_ROLE_LABELS[member.role] ?? member.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {member.department}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {member.phone ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------- WIDGET DES PERMISSIONS ---------- */}
      <div className="mt-10">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-primary-400" />
          <h3 className="text-sm font-semibold text-slate-100">
            Permissions par rôle
          </h3>
          <span className="text-xs text-slate-400">
            (Cochez pour accorder l'accès)
          </span>
        </div>
        {loadingPerms ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-900">
                      Rôle
                    </th>
                    {MODULES.map((m) => (
                      <th
                        key={m.id}
                        className="px-2 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider"
                      >
                        <span className="text-[10px]">{m.label}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {ROLES.map((role) => {
                    const rolePerms = permissions[role.id] || {};
                    const hasAll = MODULES.every(
                      (m) => rolePerms[m.id] === true,
                    );
                    return (
                      <tr
                        key={role.id}
                        className="hover:bg-slate-700/20 transition-colors"
                      >
                        <td className="px-4 py-3 sticky left-0 bg-slate-900 font-medium text-slate-100 flex items-center gap-2">
                          <Badge variant="primary" className="text-[10px]">
                            {role.label}
                          </Badge>
                          <button
                            onClick={() => toggleAllForRole(role.id, !hasAll)}
                            className="text-2xs text-slate-400 hover:text-slate-200 underline"
                          >
                            {hasAll ? "Tout désactiver" : "Tout activer"}
                          </button>
                        </td>
                        {MODULES.map((m) => (
                          <td key={m.id} className="px-2 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={!!rolePerms[m.id]}
                              onChange={() => togglePermission(role.id, m.id)}
                              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-primary-500 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  {/* Ligne "Tous les rôles" */}
                  <tr className="border-t border-slate-700/50 bg-slate-800/30">
                    <td className="px-4 py-3 sticky left-0 bg-slate-800/30 font-medium text-slate-400 text-xs">
                      Tous les rôles
                    </td>
                    {MODULES.map((m) => {
                      const allChecked = ROLES.every(
                        (r) => permissions[r.id]?.[m.id] === true,
                      );
                      return (
                        <td key={m.id} className="px-2 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={allChecked}
                            onChange={() =>
                              toggleModuleForAll(m.id, !allChecked)
                            }
                            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-warning-500 focus:ring-warning-500 focus:ring-offset-0 cursor-pointer"
                          />
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
          <Lock className="w-3 h-3" />
          <span>
            Les modifications sont sauvegardées en cliquant sur le bouton
            "Sauvegarder les permissions" en haut.
          </span>
        </div>
      </div>
    </div>
  );
}
