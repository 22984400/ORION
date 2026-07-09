import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Download, Plus, X, FileSpreadsheet } from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// ============================================================
// HELPERS
// ============================================================
const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR");
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"audit" | "hr" | "custom">(
    "audit",
  );
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  // États pour le rapport personnalisé
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [customResult, setCustomResult] = useState<any>(null);
  const [customStartDate, setCustomStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
  );
  const [customEndDate, setCustomEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [customNotes, setCustomNotes] = useState("");

  // Mapping des modules vers les tables Supabase et les labels
  const moduleConfig = {
    missions: { table: "weekly_missions", label: "Missions" },
    review_notes: { table: "review_notes", label: "Notes de revue" },
    findings: { table: "findings", label: "Constats" },
    stock_items: { table: "stock_items", label: "Stock" },
    fixed_assets: { table: "fixed_assets", label: "Immobilisations" },
    leave_requests: { table: "leave_requests", label: "Congés" },
    clients: { table: "clients", label: "Clients" },
    cac: { table: "audit_mission_assignments", label: "Suivi CAC" },
    collaborateurs: { table: "collaborateurs", label: "Collaborateurs" },
    factures: { table: "invoices", label: "Factures" },
    notes_de_frais: { table: "expenses", label: "Notes de frais" },
    // Vous pouvez ajouter d'autres modules ici
  };

  const moduleKeys = Object.keys(moduleConfig);
  const moduleLabels: Record<string, string> = {};
  moduleKeys.forEach((key) => {
    moduleLabels[key] = moduleConfig[key as keyof typeof moduleConfig].label;
  });

  const [modules, setModules] = useState(
    moduleKeys.map((id) => ({
      id,
      label: moduleLabels[id],
      checked: true,
    })),
  );

  // Chargement des onglets standards (Audit, RH)
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
          .order("date", { ascending: false });
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
      const results: any = {};
      for (const moduleId of selectedModules) {
        const tableName =
          moduleConfig[moduleId as keyof typeof moduleConfig].table;
        // Utiliser la colonne de date : créée_at pour la plupart, mais adapter si besoin
        const dateColumn = "created_at"; // Par défaut
        // Certaines tables utilisent "date" au lieu de created_at
        let finalDateColumn = dateColumn;
        if (moduleId === "missions") finalDateColumn = "date";
        if (moduleId === "leave_requests") finalDateColumn = "created_at";
        // Pour les autres, on garde created_at

        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .gte(finalDateColumn, `${customStartDate}T00:00:00`)
          .lte(finalDateColumn, `${customEndDate}T23:59:59`)
          .order(finalDateColumn, { ascending: false });

        if (!error && data) {
          results[moduleId] = data;
        } else {
          console.warn(`Erreur pour ${moduleId}:`, error);
        }
      }

      // Résumé en français
      const summaryLines = [
        `Rapport personnalisé généré le ${new Date().toLocaleString("fr-FR")}.`,
        `Période du ${formatDate(customStartDate)} au ${formatDate(customEndDate)}.`,
        "Récapitulatif :",
      ];
      for (const [id, data] of Object.entries(results)) {
        const count = (data as any[]).length;
        const label = moduleLabels[id] || id;
        summaryLines.push(`  - ${count} ${label}${count > 1 ? "s" : ""}`);
      }
      if (customNotes.trim()) {
        summaryLines.push("Notes supplémentaires :");
        summaryLines.push(customNotes.trim());
      }
      const summary = summaryLines.join("\n");

      setCustomResult({
        dateRange: { start: customStartDate, end: customEndDate },
        modules: selectedModules,
        data: results,
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

  // ---------- EXPORT EXCEL (vrai tableau) ----------
  const exportCustomReport = async () => {
    if (!customResult) return;

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Rapport personnalisé");
      const { data, notes } = customResult;

      // Définition des sections (basé sur la configuration)
      const sections = moduleKeys.map((id) => ({
        id,
        label: moduleLabels[id],
      }));

      // Titre principal (fusion)
      worksheet.mergeCells("A1:E1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value = `RAPPORT PERSONNALISÉ - ${new Date(customResult.generatedAt).toLocaleString("fr-FR")}`;
      titleCell.font = { bold: true, size: 16 };
      titleCell.alignment = { horizontal: "center" };

      // Période (fusion)
      worksheet.mergeCells("A2:E2");
      const periodCell = worksheet.getCell("A2");
      periodCell.value = `Période du ${formatDate(customResult.dateRange.start)} au ${formatDate(customResult.dateRange.end)}`;
      periodCell.alignment = { horizontal: "center" };

      let currentRow = 3;

      // Récapitulatif
      worksheet.addRow([]);
      currentRow++;
      const recapTitle = worksheet.addRow(["RÉCAPITULATIF"]);
      recapTitle.font = { bold: true };
      currentRow++;

      Object.entries(data).forEach(([moduleId, moduleData]) => {
        const count = Array.isArray(moduleData) ? moduleData.length : 0;
        worksheet.addRow([`${count} ${moduleLabels[moduleId] || moduleId}`]);
        currentRow++;
      });
      worksheet.addRow([]);
      currentRow++;

      // Sections
      for (const section of sections) {
        const moduleData = data[section.id];
        if (!Array.isArray(moduleData) || moduleData.length === 0) continue;

        // Titre de section
        worksheet.addRow([]);
        currentRow++;
        const sectionTitle = `${section.label} (${moduleData.length} enregistrements)`;
        worksheet.mergeCells(`A${currentRow + 1}:E${currentRow + 1}`);
        const titleRow = worksheet.getRow(currentRow + 1);
        titleRow.getCell(1).value = sectionTitle;
        titleRow.getCell(1).font = {
          bold: true,
          size: 14,
          color: { argb: "1F4E78" },
        };
        titleRow.getCell(1).alignment = { horizontal: "left" };
        currentRow += 2;

        // Création des colonnes
        const firstItem = moduleData[0];
        const keys = Object.keys(firstItem);
        const columns = keys.map((key) => ({
          header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
          key: key,
          width: Math.max(15, key.length + 5),
        }));
        worksheet.columns = columns;

        // En‑tête stylé
        const headerRow = worksheet.addRow(columns.map((c) => c.header));
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
        currentRow++;

        // Données (chaque champ dans sa colonne)
        for (const item of moduleData) {
          const rowData: Record<string, any> = {};
          keys.forEach((key) => {
            rowData[key] = item[key] ?? "";
          });
          const dataRow = worksheet.addRow(rowData);
          dataRow.eachCell((cell) => {
            cell.alignment = { horizontal: "left", vertical: "middle" };
            cell.border = {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" },
            };
          });
          currentRow++;
        }

        // Auto‑fit
        worksheet.columns.forEach((column) => {
          let maxLength = 10;
          column.eachCell?.({ includeEmpty: true }, (cell) => {
            const length = cell.value ? cell.value.toString().length : 10;
            if (length > maxLength) maxLength = length;
          });
          column.width = Math.min(maxLength + 3, 50);
        });

        worksheet.addRow([]);
        currentRow += 2;
      }

      // Notes
      if (notes?.trim()) {
        worksheet.addRow([]);
        const notesRow = worksheet.addRow(["Notes :"]);
        notesRow.getCell(1).font = { bold: true };
        const notesContent = worksheet.addRow([notes.trim()]);
        notesContent.getCell(1).alignment = { wrapText: true };
        worksheet.getColumn(1).width = 80;
      }

      // Sauvegarde
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

  // ---------- MODAL ----------
  const CustomReportModal = () => {
    if (!showCustomModal) return null;

    const toggleModule = (id: string) => {
      setModules((prev) =>
        prev.map((m) => (m.id === id ? { ...m, checked: !m.checked } : m)),
      );
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Créer un rapport personnalisé
            </h2>
            <button
              onClick={() => {
                setShowCustomModal(false);
                setCustomResult(null);
                setCustomNotes("");
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Modules à inclure
              </label>
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
                Commentaires / Explications (optionnel)
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
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleGenerateCustomReport}
                disabled={generating}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {generating ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Génération...
                  </span>
                ) : (
                  <>
                    <FileSpreadsheet className="h-4 w-4 inline mr-2" />
                    Générer le rapport
                  </>
                )}
              </button>
            </div>

            {customResult && (
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Rapport généré
                  </h3>
                  <button
                    onClick={exportCustomReport}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Exporter XLSX
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 mb-4 text-sm whitespace-pre-wrap font-mono text-gray-700 dark:text-gray-300">
                  {customResult.summary}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    Période : {formatDate(customResult.dateRange.start)} →{" "}
                    {formatDate(customResult.dateRange.end)}
                  </p>
                  <p>Modules : {customResult.modules.join(", ")}</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                    Généré le{" "}
                    {new Date(customResult.generatedAt).toLocaleString("fr-FR")}
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
            Rapports
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Consultez et exportez les données
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
          <button
            onClick={() => setShowCustomModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Rapport personnalisé
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 pb-2">
        {(["audit", "hr", "custom"] as const).map((tab) => {
          const labels = { audit: "Audit", hr: "RH", custom: "Personnalisé" };
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
            Aucune donnée trouvée pour cet onglet.
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
