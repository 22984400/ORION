import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Check,
  X as XIcon,
  Clock,
  UserCheck,
  UserX,
  Download,
  FileText,
  X,
} from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { cn, formatDate } from "../../lib/utils";
import { supabase } from "../../lib/supabase";
import { addNotification } from "../../lib/notifications";
import { LEAVE_TYPE_LABELS } from "../../lib/constants";
import { useAuth } from "../../contexts/AuthContext";
import type { LeaveRequest } from "../../types";

const BUCKET_NAME = "leave_documents";

export function LeavePage() {
  const { user } = useAuth(); // ✅ Utilisation de useAuth

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showRequest, setShowRequest] = useState(false);
  const [form, setForm] = useState({
    employee_id: "",
    leave_type: "annual",
    reason: "",
    start_date: "",
    end_date: "",
    duration: 1,
  });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Charger les demandes avec les noms des employés
  const fetchLeaves = async () => {
    // ⚠️ Attendre que l'utilisateur soit authentifié
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: leavesData, error: leavesError } = await supabase
        .from("leave_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (leavesError) throw leavesError;

      if (!leavesData || leavesData.length === 0) {
        setLeaves([]);
        setError(null);
        setLoading(false);
        return;
      }

      const employeeIds = [
        ...new Set(leavesData.map((l) => l.employee_id).filter(Boolean)),
      ];
      let profilesMap: Record<string, string> = {};
      if (employeeIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", employeeIds);
        if (profilesError) throw profilesError;
        profilesMap = profiles.reduce(
          (acc, p) => ({ ...acc, [p.id]: p.full_name }),
          {},
        );
      }

      const mapped = leavesData.map((item: any) => ({
        ...item,
        employee_name: profilesMap[item.employee_id] || "Utilisateur inconnu",
      }));
      setLeaves(mapped);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  // Initialiser le formulaire avec l'utilisateur actuel
  useEffect(() => {
    if (user) {
      setForm((prev) => ({ ...prev, employee_id: user.id }));
    }
  }, [user]);

  // Charger les données au montage et quand l'utilisateur change
  useEffect(() => {
    fetchLeaves();
  }, [user]); // ✅ Dépendance à "user"

  const filtered = leaves.filter(
    (l) => statusFilter === "all" || l.status === statusFilter,
  );

  const summary = {
    total: leaves.length,
    approved: leaves.filter((l) => l.status === "approved").length,
    pending: leaves.filter((l) => l.status === "submitted").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
  };

  // ----- SOUMISSION AVEC UPLOAD -----
  const handleSubmit = async () => {
    if (!form.employee_id) {
      alert("Vous devez être connecté pour demander un congé");
      return;
    }
    if (!form.reason.trim()) {
      alert("Veuillez saisir un motif");
      return;
    }
    if (!form.start_date || !form.end_date) {
      alert("Veuillez sélectionner les dates de début et de fin");
      return;
    }
    if (new Date(form.start_date) > new Date(form.end_date)) {
      alert("La date de début doit être antérieure ou égale à la date de fin");
      return;
    }

    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const duration = diffDays;

    setSubmitting(true);
    setUploading(!!file);

    try {
      let supportingDocumentUrl: string | null = null;

      // 1. Upload du fichier si présent
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `leave_documents/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);

        supportingDocumentUrl = urlData.publicUrl;
      }

      // 2. Insérer la demande
      const payload = {
        employee_id: form.employee_id,
        leave_type: form.leave_type,
        reason: form.reason.trim(),
        start_date: form.start_date,
        end_date: form.end_date,
        duration: duration,
        status: "submitted",
        supporting_document: supportingDocumentUrl,
      };

      const { error } = await supabase.from("leave_requests").insert([payload]);

      if (error) throw error;

      // 3. Rafraîchir et fermer
      await fetchLeaves();
      setShowRequest(false);
      setForm((prev) => ({
        ...prev,
        leave_type: "annual",
        reason: "",
        start_date: "",
        end_date: "",
        duration: 1,
      }));
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      void addNotification({
        title: "Demande de congé soumise",
        message: "Votre demande de congé a été soumise avec succès.",
        type: "leave",
      });
    } catch (err: any) {
      alert("Erreur lors de la soumission : " + err.message);
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  // ----- APPROBATION / REJET -----
  const handleApprove = async (id: string) => {
    if (!confirm("Approuver cette demande ?")) return;
    try {
      const { error } = await supabase
        .from("leave_requests")
        .update({ status: "approved" })
        .eq("id", id);
      if (error) throw error;
      await fetchLeaves();
      void addNotification({
        title: "Demande de congé approuvée",
        message: "Une demande de congé a été approuvée.",
        type: "leave",
      });
    } catch (err: any) {
      alert("Erreur : " + err.message);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Rejeter cette demande ?")) return;
    try {
      const { error } = await supabase
        .from("leave_requests")
        .update({ status: "rejected" })
        .eq("id", id);
      if (error) throw error;
      await fetchLeaves();
      void addNotification({
        title: "Demande de congé rejetée",
        message: "Une demande de congé a été rejetée.",
        type: "leave",
      });
    } catch (err: any) {
      alert("Erreur : " + err.message);
    }
  };

  // ----- RENDU -----
  return (
    <div className="page-container">
      <PageHeader
        title="Congés"
        description="Gérez les demandes de congé et les approbations"
        actions={
          <button
            onClick={() => setShowRequest(true)}
            className="btn-primary btn-md"
          >
            <Plus className="w-4 h-4" />
            Demander un congé
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
            label: "Total demandes",
            value: summary.total,
            icon: Clock,
            color: "text-primary-400",
          },
          {
            label: "Approuvées",
            value: summary.approved,
            icon: UserCheck,
            color: "text-success-500",
          },
          {
            label: "En attente",
            value: summary.pending,
            icon: Clock,
            color: "text-warning-500",
          },
          {
            label: "Rejetées",
            value: summary.rejected,
            icon: UserX,
            color: "text-error-500",
          },
        ].map((s) => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <s.icon className={cn("w-5 h-5", s.color)} />
            <div>
              <p className="text-lg font-semibold text-slate-100">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        {["all", "submitted", "approved", "rejected"].map((s) => (
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
              ? "Toutes"
              : s === "submitted"
                ? "En attente"
                : s === "approved"
                  ? "Approuvées"
                  : "Rejetées"}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {[
                  "Employé",
                  "Type de congé",
                  "Durée",
                  "Début",
                  "Fin",
                  "Statut",
                  "Document",
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
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    Chargement...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    Aucune demande
                  </td>
                </tr>
              ) : (
                filtered.map((leave) => (
                  <tr
                    key={leave.id}
                    className="hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-100">
                      {leave.employee_name}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {LEAVE_TYPE_LABELS[leave.leave_type] ?? leave.leave_type}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-300">
                      {leave.duration} jours
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {formatDate(leave.start_date)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {formatDate(leave.end_date)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          leave.status === "approved"
                            ? "success"
                            : leave.status === "submitted"
                              ? "warning"
                              : leave.status === "rejected"
                                ? "error"
                                : "neutral"
                        }
                      >
                        {leave.status === "approved"
                          ? "Approuvé"
                          : leave.status === "submitted"
                            ? "En attente"
                            : leave.status === "rejected"
                              ? "Rejeté"
                              : "Autre"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {leave.supporting_document ? (
                        <a
                          href={leave.supporting_document}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary-400 hover:text-primary-300 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          <span className="text-xs">Télécharger</span>
                        </a>
                      ) : (
                        <span className="text-slate-500 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {leave.status === "submitted" && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleApprove(leave.id)}
                            className="p-1.5 rounded hover:bg-slate-700/50 text-slate-400 hover:text-success-400"
                            aria-label="Approuver"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(leave.id)}
                            className="p-1.5 rounded hover:bg-slate-700/50 text-slate-400 hover:text-error-400"
                            aria-label="Rejeter"
                          >
                            <XIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DEMANDE DE CONGÉ */}
      {showRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => !submitting && !uploading && setShowRequest(false)}
        >
          <div
            className="card p-6 w-full max-w-lg animate-scale-in max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-50 mb-4">
              Demander un congé
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Employé
                </label>
                <input
                  type="text"
                  value={
                    user?.user_metadata?.full_name ||
                    user?.email ||
                    "Utilisateur connecté"
                  }
                  className="input-md w-full bg-slate-800/50 cursor-not-allowed"
                  disabled
                />
                <p className="text-xs text-slate-400 mt-1">
                  Connecté en tant que {user?.email}
                </p>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Type de congé
                </label>
                <select
                  value={form.leave_type}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, leave_type: e.target.value }))
                  }
                  className="input-md w-full"
                >
                  {Object.entries(LEAVE_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Motif
                </label>
                <textarea
                  value={form.reason}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, reason: e.target.value }))
                  }
                  className="input-md min-h-[80px] w-full"
                  placeholder="Raison de la demande"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Date début
                  </label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, start_date: e.target.value }));
                      if (form.end_date && e.target.value) {
                        const start = new Date(e.target.value);
                        const end = new Date(form.end_date);
                        if (start <= end) {
                          const diff =
                            Math.ceil(
                              (end.getTime() - start.getTime()) /
                                (1000 * 60 * 60 * 24),
                            ) + 1;
                          setForm((p) => ({ ...p, duration: diff }));
                        }
                      }
                    }}
                    className="input-md w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Date fin
                  </label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, end_date: e.target.value }));
                      if (form.start_date && e.target.value) {
                        const start = new Date(form.start_date);
                        const end = new Date(e.target.value);
                        if (start <= end) {
                          const diff =
                            Math.ceil(
                              (end.getTime() - start.getTime()) /
                                (1000 * 60 * 60 * 24),
                            ) + 1;
                          setForm((p) => ({ ...p, duration: diff }));
                        }
                      }
                    }}
                    className="input-md w-full"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Durée (jours)
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.duration}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      duration: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="input-md w-full"
                  disabled={!!form.start_date && !!form.end_date}
                />
                <p className="text-xs text-slate-400 mt-1">
                  {form.start_date && form.end_date
                    ? `Calculé automatiquement : ${form.duration} jour(s)`
                    : "Renseignez les dates pour le calcul automatique"}
                </p>
              </div>

              {/* Champ de téléversement de fichier */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Justificatif (optionnel)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                    }
                  }}
                  className="input-md w-full"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                />
                {file && (
                  <p className="text-xs text-slate-400 mt-1">
                    📄 {file.name} ({Math.round(file.size / 1024)} Ko)
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSubmit}
                  className="btn-primary btn-md flex-1"
                  disabled={submitting || uploading}
                >
                  {uploading
                    ? "Téléversement..."
                    : submitting
                      ? "Soumission..."
                      : "Soumettre"}
                </button>
                <button
                  onClick={() => setShowRequest(false)}
                  className="btn-secondary btn-md"
                  disabled={submitting || uploading}
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
