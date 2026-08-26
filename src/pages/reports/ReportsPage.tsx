import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../lib/supabase";
import {
  Download,
  Plus,
  X,
  FileSpreadsheet,
  CheckSquare,
  Square,
} from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// ============================================================
// TYPES
// ============================================================
type ModuleId =
  | "missions"
  | "review_notes"
  | "findings"
  | "stock_items"
  | "fixed_assets"
  | "leave_requests"
  | "clients"
  | "cac"
  | "collaborateurs"
  | "factures"
  | "notes_de_frais"
  | "etablissements"
  | "client_documents"
  | "client_taxes";

type ModuleConfig = {
  table: string;
  label: string;
  dateColumn: string; // which column to use for date filtering
};

type ModuleState = {
  id: ModuleId;
  label: string;
  checked: boolean;
};

type CustomReportResult = {
  dateRange: { start: string; end: string };
  modules: ModuleId[];
  data: Record<ModuleId, any[]>;
  generatedAt: string;
  summary: string;
  notes: string;
};

// ============================================================
// CONFIGURATION
// ============================================================
const MODULE_CONFIG: Record<ModuleId, ModuleConfig> = {
  missions: { table: "weekly_missions", label: "Missions", dateColumn: "date" },
  review_notes: {
    table: "review_notes",
    label: "Notes de revue",
    dateColumn: "created_at",
  },
  findings: { table: "findings", label: "Constats", dateColumn: "created_at" },
  stock_items: {
    table: "stock_items",
    label: "Stock",
    dateColumn: "created_at",
  },
  fixed_assets: {
    table: "fixed_assets",
    label: "Immobilisations",
    dateColumn: "created_at",
  },
  leave_requests: {
    table: "leave_requests",
    label: "Congés",
    dateColumn: "created_at",
  },
  clients: { table: "clients", label: "Clients", dateColumn: "created_at" },
  cac: {
    table: "audit_mission_assignments",
    label: "Suivi CAC",
    dateColumn: "created_at",
  },
  collaborateurs: {
    table: "collaborateurs",
    label: "Collaborateurs",
    dateColumn: "created_at",
  },
  factures: { table: "invoices", label: "Factures", dateColumn: "created_at" },
  notes_de_frais: {
    table: "expenses",
    label: "Notes de frais",
    dateColumn: "created_at",
  },
  etablissements: {
    table: "etablissements",
    label: "Établissements",
    dateColumn: "created_at",
  },
  client_documents: {
    table: "client_documents",
    label: "Documents clients",
    dateColumn: "created_at",
  },
  client_taxes: {
    table: "client_taxes",
    label: "Taxes clients",
    dateColumn: "created_at",
  },
};

const MODULE_IDS = Object.keys(MODULE_CONFIG) as ModuleId[];

// ============================================================
// HELPERS
// ============================================================
const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR");
};

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("fr-FR");
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function ReportsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"audit" | "hr" | "custom">(
    "audit",
  );
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  // États pour le rapport personnalisé
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [customResult, setCustomResult] = useState<CustomReportResult | null>(
    null,
  );
  const [customStartDate, setCustomStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
  );
  const [customEndDate, setCustomEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [customNotes, setCustomNotes] = useState("");

  // Nouvel état : ignorer les dates
  const [ignoreDates, setIgnoreDates] = useState(false);

  // État des modules (cochés)
  const [modules, setModules] = useState<ModuleState[]>(() =>
    MODULE_IDS.map((id) => ({
      id,
      label: MODULE_CONFIG[id].label,
      checked: true,
    })),
  );

  // Vérifier si tous les modules sont cochés
  const allChecked = useMemo(() => modules.every((m) => m.checked), [modules]);

  // Chargement des onglets standards
  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === "audit") {
        const { data: missions } = await supabase
          .from("weekly_missions")
          .select("subject, status, progress, date")
          .order("date", { ascending: false, nullsLast: true });
        setData(missions || []);
      } else if (activeTab === "hr") {
        const { data: leaves } = await supabase
          .from("leave_requests")
          .select("employee_name, leave_type, status, start_date, end_date")
          .order("created_at", { ascending: false });
        setData(leaves || []);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Erreur de chargement :", err);
    } finally {
      setLoading(false);
    }
  }

  // ---------- EXPORT STANDARD (CSV) ----------
  const handleExport = () => {
    if (data.length === 0) {
      alert("Aucune donnée à exporter.");
      return;
    }
    const headers = Object.keys(data[0]);
    const rows = [
      headers.join(","),
      ...data.map((row) => headers.map((h) => row[h] ?? "").join(",")),
    ];
    const csv = rows.join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_${activeTab}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // ---------- GÉNÉRATION DU RAPPORT PERSONNALISÉ ----------
  const handleGenerateCustomReport = async () => {
    const selectedModules = modules.filter((m) => m.checked).map((m) => m.id);
    if (selectedModules.length === 0) {
      alert("Veuillez sélectionner au moins un module.");
      return;
    }

    setGenerating(true);
    try {
      const results: Partial<Record<ModuleId, any[]>> = {};
      for (const moduleId of selectedModules) {
        const config = MODULE_CONFIG[moduleId];
        const tableName = config.table;
        const dateCol = config.dateColumn;

        let query = supabase.from(tableName).select("*");
        if (!ignoreDates) {
          query = query
            .gte(dateCol, `${customStartDate}T00:00:00`)
            .lte(dateCol, `${customEndDate}T23:59:59`);
        }
        query = query.order(dateCol, { ascending: false, nullsLast: true });

        const { data, error } = await query;
        if (!error && data) {
          results[moduleId] = data;
        } else {
          console.warn(`Erreur pour ${moduleId}:`, error);
        }
      }

      // Construire le résumé
      const summaryLines = [
        `Rapport personnalisé généré le ${formatDateTime(new Date().toISOString())}.`,
        ignoreDates
          ? "📅 Période : TOUTES LES DATES"
          : `📅 Période du ${formatDate(customStartDate)} au ${formatDate(customEndDate)}.`,
        "📊 Récapitulatif :",
      ];
      for (const [id, data] of Object.entries(results)) {
        const count = (data as any[]).length;
        const label = MODULE_CONFIG[id as ModuleId].label;
        summaryLines.push(`  - ${count} ${label}${count > 1 ? "s" : ""}`);
      }
      if (customNotes.trim()) {
        summaryLines.push("📝 Notes supplémentaires :");
        summaryLines.push(customNotes.trim());
      }
      const summary = summaryLines.join("\n");

      setCustomResult({
        dateRange: { start: customStartDate, end: customEndDate },
        modules: selectedModules,
        data: results as Record<ModuleId, any[]>,
        generatedAt: new Date().toISOString(),
        summary,
        notes: customNotes,
      });
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération du rapport.");
    } finally {
      setGenerating(false);
    }
  };

  // ---------- EXPORT EXCEL (multi‑feuilles) ----------
  const exportCustomReport = async () => {
    if (!customResult) return;

    try {
      const workbook = new ExcelJS.Workbook();
      const {
        data,
        notes,
        dateRange,
        generatedAt,
        modules: selectedModules,
      } = customResult;

      // ----- Feuille "Résumé" -----
      const summarySheet = workbook.addWorksheet("Résumé");
      summarySheet.mergeCells("A1:D1");
      const titleCell = summarySheet.getCell("A1");
      titleCell.value = `RAPPORT PERSONNALISÉ - ${formatDateTime(generatedAt)}`;
      titleCell.font = { bold: true, size: 16 };
      titleCell.alignment = { horizontal: "center" };

      summarySheet.mergeCells("A2:D2");
      const periodCell = summarySheet.getCell("A2");
      periodCell.value = ignoreDates
        ? "Période : TOUTES LES DATES"
        : `Période du ${formatDate(dateRange.start)} au ${formatDate(dateRange.end)}`;
      periodCell.alignment = { horizontal: "center" };

      summarySheet.addRow([]);
      const recapRow = summarySheet.addRow(["Module", "Enregistrements"]);
      recapRow.font = { bold: true };
      recapRow.getCell(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "1F4E78" },
      };
      recapRow.getCell(1).font = { color: { argb: "FFFFFF" } };
      recapRow.getCell(2).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "1F4E78" },
      };
      recapRow.getCell(2).font = { color: { argb: "FFFFFF" } };

      let totalRecords = 0;
      for (const moduleId of selectedModules) {
        const moduleData = data[moduleId] || [];
        const count = moduleData.length;
        totalRecords += count;
        summarySheet.addRow([MODULE_CONFIG[moduleId].label, count]);
      }
      summarySheet.addRow([]);
      const totalRow = summarySheet.addRow(["TOTAL", totalRecords]);
      totalRow.font = { bold: true };
      totalRow.getCell(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "D3D3D3" },
      };
      totalRow.getCell(2).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "D3D3D3" },
      };

      if (notes.trim()) {
        summarySheet.addRow([]);
        summarySheet.addRow(["Notes :"]);
        const notesRow = summarySheet.addRow([notes.trim()]);
        notesRow.getCell(1).alignment = { wrapText: true };
        summarySheet.getColumn(1).width = 80;
      }

      // ----- Une feuille par module -----
      for (const moduleId of selectedModules) {
        const moduleData = data[moduleId] || [];
        if (moduleData.length === 0) continue;

        const label = MODULE_CONFIG[moduleId].label;
        const sheet = workbook.addWorksheet(label, {
          properties: { tabColor: { argb: "1F4E78" } },
        });

        // En‑tête
        const firstItem = moduleData[0];
        const keys = Object.keys(firstItem);
        const columns = keys.map((key) => ({
          header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
          key: key,
          width: Math.max(15, key.length + 5),
        }));
        sheet.columns = columns;

        // Ligne de titre
        sheet.addRow([`${label} - ${moduleData.length} enregistrements`]);
        const titleRow = sheet.getRow(1);
        titleRow.font = { bold: true, size: 14 };
        sheet.mergeCells(`A1:${String.fromCharCode(64 + columns.length)}1`);

        // En‑têtes stylés (ligne 2)
        const headerRow = sheet.addRow(columns.map((c) => c.header));
        headerRow.eachCell((cell) => {
          cell.font = { bold: true, color: { argb: "FFFFFF" } };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "1F4E78" },
          };
          cell.alignment = { horizontal: "center" };
          cell.border = {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          };
        });

        // Données
        for (const item of moduleData) {
          const rowData: Record<string, any> = {};
          keys.forEach((key) => {
            rowData[key] = item[key] ?? "";
          });
          const dataRow = sheet.addRow(rowData);
          dataRow.eachCell((cell) => {
            cell.alignment = { horizontal: "left", vertical: "middle" };
            cell.border = {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" },
            };
          });
        }

        // Auto‑fit
        sheet.columns.forEach((column) => {
          let maxLength = 10;
          column.eachCell?.({ includeEmpty: true }, (cell) => {
            const length = cell.value ? cell.value.toString().length : 10;
            if (length > maxLength) maxLength = length;
          });
          column.width = Math.min(maxLength + 3, 50);
        });
      }

      // Génération du fichier
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer]),
        `Rapport_Personnalise_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'exportation.");
    }
  };

  // ---------- GESTION DES MODULES ----------
  const toggleModule = (id: ModuleId) => {
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, checked: !m.checked } : m)),
    );
  };

  const toggleAll = () => {
    setModules((prev) => prev.map((m) => ({ ...m, checked: !allChecked })));
  };

  // ---------- MODAL ----------
  const CustomReportModal = () => {
    if (!showCustomModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("reports.customReportTitle")}
            </h2>
            <button
              onClick={() => {
                setShowCustomModal(false);
                setCustomResult(null);
                setCustomNotes("");
                setIgnoreDates(false);
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  disabled={ignoreDates}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  disabled={ignoreDates}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-slate-700"
                />
              </div>
            </div>

            {/* Nouvelle option : ignorer les dates */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ignoreDates"
                checked={ignoreDates}
                onChange={(e) => setIgnoreDates(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="ignoreDates"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Ignorer les dates (toutes les données)
              </label>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("reports.modules")}
                </label>
                <button
                  onClick={toggleAll}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                >
                  {allChecked ? (
                    <Square className="h-4 w-4" />
                  ) : (
                    <CheckSquare className="h-4 w-4" />
                  )}
                  {allChecked ? "Désélectionner tout" : "Tout sélectionner"}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {modules.map((module) => (
                  <label
                    key={module.id}
                    className="flex items-center gap-2 text-sm cursor-pointer text-gray-700 dark:text-gray-300"
                  >
                    <input
                      type="checkbox"
                      checked={module.checked}
                      onChange={() => toggleModule(module.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {module.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("reports.comments")}
              </label>
              <textarea
                rows={3}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Ajoutez des explications sur le contexte de ce rapport..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowCustomModal(false);
                  setCustomResult(null);
                  setCustomNotes("");
                  setIgnoreDates(false);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                {t("reports.cancel")}
              </button>
              <button
                onClick={handleGenerateCustomReport}
                disabled={generating}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t("common.loading")}
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-4 w-4" />
                    {t("reports.generateReport")}
                  </>
                )}
              </button>
            </div>

            {customResult && (
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {t("reports.generatedReport")}
                  </h3>
                  <button
                    onClick={exportCustomReport}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {t("reports.exportXlsx")}
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 mb-4 text-sm whitespace-pre-wrap font-mono text-gray-700 dark:text-gray-300">
                  {customResult.summary}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    {ignoreDates
                      ? "📅 Période : TOUTES LES DATES"
                      : `📅 Période : ${formatDate(customResult.dateRange.start)} → ${formatDate(customResult.dateRange.end)}`}
                  </p>
                  <p>📦 Modules : {customResult.modules.join(", ")}</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                    ⏱️ Généré le {formatDateTime(customResult.generatedAt)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("reports.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t("reports.description")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t("reports.exportCsv")}
          </button>
          <button
            onClick={() => setShowCustomModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t("reports.customReport")}
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 pb-2">
        {(["audit", "hr", "custom"] as const).map((tab) => {
          const labels = {
            audit: t("reports.audit"),
            hr: t("reports.hr"),
            custom: t("reports.custom"),
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium text-sm transition ${
                activeTab === tab
                  ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Tableau des données */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
        {data.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-center py-8">
            {t("reports.noData")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {Object.keys(data[0]).map((key) => (
                    <th
                      key={key}
                      className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400"
                    >
                      {key.replace(/_/g, " ").toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.map((item, idx) => (
                  <tr key={idx}>
                    {Object.values(item).map((val, i) => (
                      <td
                        key={i}
                        className="px-4 py-3 text-gray-800 dark:text-gray-200"
                      >
                        {val !== null && val !== undefined ? String(val) : "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modale */}
      <CustomReportModal />
    </div>
  );
}
