import { useMemo, useState, useRef } from "react";
import {
  Download,
  Upload,
  FileText,
  FileSpreadsheet,
  File,
  List,
  Grid3x3,
  FolderOpen,
} from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { cn, formatDate, formatNumber } from "../../lib/utils";
import { useSupabaseQuery } from "../../hooks/useSupabaseData";
import { supabase } from "../../lib/supabase";
import type { WorkingPaper } from "../../types";

const BUCKET_NAME = "working-papers"; // ✅ nom exact avec tiret

function getFileIcon(type: string) {
  const lowerType = type.toLowerCase();
  if (lowerType === "xlsx" || lowerType === "xls") return FileSpreadsheet;
  if (lowerType === "pdf") return FileText;
  return File;
}

export function WorkingPapersPage() {
  const { data: papers, refetch } = useSupabaseQuery<WorkingPaper>({
    table: "working_papers",
    orderBy: "created_at",
    orderAsc: false,
  });
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showDetail, setShowDetail] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<WorkingPaper | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({
    name: "",
    folder: "",
    reference: "",
    status: "draft" as string,
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const folders = useMemo(
    () => [...new Set(papers.map((p) => p.folder).filter(Boolean))] as string[],
    [papers],
  );

  const filtered = selectedFolder
    ? papers.filter((p) => p.folder === selectedFolder)
    : papers;

  const handleUpload = async () => {
    if (!file) {
      alert("Veuillez sélectionner un fichier");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `documents/${fileName}`; // sous-dossier optionnel

      // 1. Upload
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. URL publique
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      const fileUrl = urlData.publicUrl;

      // 3. Payload avec génération automatique de référence
      const payload = {
        name: form.name || file.name.replace(/\.[^.]+$/, ""),
        folder: form.folder || null,
        reference: form.reference || `WP-${Date.now()}`, // ✅ correction ici
        status: form.status,
        file_type: fileExt || "unknown",
        file_size: Math.round(file.size / 1024),
        file_path: fileUrl,
        version: 1,
      };

      const { error: insertError } = await supabase
        .from("working_papers")
        .insert([payload]);

      if (insertError) throw insertError;

      await refetch();
      setShowUpload(false);
      setFile(null);
      setForm({ name: "", folder: "", reference: "", status: "draft" });
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      console.error("Erreur upload :", err);
      alert("Erreur : " + (err.message || "Inconnue"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Documents de travail"
        description="Organisez et gérez les documents de travail d'audit"
        actions={
          <button
            onClick={() => setShowUpload(true)}
            className="btn-primary btn-md"
          >
            <Upload className="w-4 h-4" />
            Téléverser
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center gap-2 shrink-0">
          <FolderOpen className="w-4 h-4 text-slate-400" />
          <button
            onClick={() => setSelectedFolder(null)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition-colors",
              !selectedFolder
                ? "bg-primary-600/15 text-primary-300"
                : "text-slate-400 hover:bg-slate-700/40",
            )}
          >
            Tous
          </button>
          {folders.map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFolder(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm transition-colors",
                selectedFolder === f
                  ? "bg-primary-600/15 text-primary-300"
                  : "text-slate-400 hover:bg-slate-700/40",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-slate-400">
            {filtered.length} document(s)
          </span>
          <div className="flex bg-slate-800 rounded-lg border border-slate-700/50 p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-md",
                viewMode === "list"
                  ? "bg-primary-600 text-white"
                  : "text-slate-400",
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-md",
                viewMode === "grid"
                  ? "bg-primary-600 text-white"
                  : "text-slate-400",
              )}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {[
                    "Nom",
                    "Référence",
                    "Type",
                    "Version",
                    "Statut",
                    "Téléversé le",
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
                {filtered.map((paper) => {
                  const Icon = getFileIcon(paper.file_type);
                  return (
                    <tr
                      key={paper.id}
                      className="hover:bg-slate-700/30 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedPaper(paper);
                        setShowDetail(true);
                      }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-100">
                            {paper.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">
                        {paper.reference}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {paper.file_type}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        v{paper.version}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            paper.status === "final" ? "primary" : "neutral"
                          }
                        >
                          {paper.status === "final" ? "Final" : "Brouillon"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {formatDate(paper.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {paper.file_path && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(paper.file_path!, "_blank");
                            }}
                            className="p-1.5 rounded hover:bg-slate-700/50 text-slate-400 hover:text-slate-200"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((paper) => {
            const Icon = getFileIcon(paper.file_type);
            return (
              <div
                key={paper.id}
                className="card-hover p-4 cursor-pointer"
                onClick={() => {
                  setSelectedPaper(paper);
                  setShowDetail(true);
                }}
              >
                <div className="w-10 h-10 rounded-lg bg-primary-600/10 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-primary-400" />
                </div>
                <h4 className="text-sm font-medium text-slate-100 mb-1 truncate">
                  {paper.name}
                </h4>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={paper.status === "final" ? "primary" : "neutral"}
                  >
                    {paper.status === "final" ? "Final" : "Brouillon"}
                  </Badge>
                  <span className="text-2xs text-slate-500">
                    v{paper.version}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showDetail && selectedPaper && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowDetail(false)}
        >
          <div
            className="card p-6 w-full max-w-lg animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-50">
                {selectedPaper.name}
              </h2>
              <button
                onClick={() => setShowDetail(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                &times;
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-400">Référence</p>
                <p className="text-sm text-slate-200 font-mono">
                  {selectedPaper.reference}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Type de fichier</p>
                <p className="text-sm text-slate-200">
                  {selectedPaper.file_type}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Taille</p>
                <p className="text-sm text-slate-200">
                  {formatNumber(selectedPaper.file_size)} Ko
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Version</p>
                <p className="text-sm text-slate-200">
                  v{selectedPaper.version}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Statut</p>
                <Badge
                  variant={
                    selectedPaper.status === "final" ? "primary" : "neutral"
                  }
                >
                  {selectedPaper.status === "final" ? "Final" : "Brouillon"}
                </Badge>
              </div>
              {selectedPaper.file_path && (
                <button
                  onClick={() =>
                    window.open(selectedPaper.file_path!, "_blank")
                  }
                  className="btn-primary btn-sm gap-1 mt-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showUpload && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowUpload(false)}
        >
          <div
            className="card p-6 w-full max-w-lg animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-50 mb-4">
              Téléverser un document
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Nom</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="input-md"
                  placeholder="Laisser vide pour utiliser le nom du fichier"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Dossier
                </label>
                <input
                  type="text"
                  value={form.folder}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, folder: e.target.value }))
                  }
                  className="input-md"
                  placeholder="Nom du dossier"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Référence
                </label>
                <input
                  type="text"
                  value={form.reference}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, reference: e.target.value }))
                  }
                  className="input-md"
                  placeholder="Laisser vide pour génération automatique"
                />
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
                  <option value="draft">Brouillon</option>
                  <option value="final">Final</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Fichier
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="input-md"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                    }
                  }}
                />
                {file && (
                  <p className="text-xs text-slate-400 mt-1">
                    {file.name} ({Math.round(file.size / 1024)} Ko)
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleUpload}
                  className="btn-primary btn-md"
                  disabled={uploading}
                >
                  {uploading ? "Téléversement..." : "Téléverser"}
                </button>
                <button
                  onClick={() => setShowUpload(false)}
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
