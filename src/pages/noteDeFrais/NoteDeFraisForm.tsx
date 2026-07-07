// src/pages/NoteDeFrais/NoteDeFraisForm.tsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { supabase } from "../../lib/supabase";
import { addNotification } from "../../lib/notifications";
import { format } from "date-fns";

interface ExpenseLine {
  id?: string;
  date: string;
  designation: string;
  quantite: number;
  devise: string;
  montant_ht: number;
  tva: number;
  category?: string;
}

interface ExpenseReport {
  id: string;
  reference: string;
  collaborateur_name: string;
  collaborateur_initials: string;
  collaborateur_phone: string;
  collaborateur_address: string;
  mission_id: string;
  client_id: string;
  date_debut: string;
  date_fin: string;
  mois: string;
  taux_tva: number;
  avance: number;
  modalite_reglement: string;
  status: string;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  net_a_payer: number;
  montant_lettres: string;
  signature_auditeur: boolean;
  lines: ExpenseLine[];
}

interface Props {
  reportId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  label {
    font-size: 12px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  input,
  select {
    padding: 6px 10px;
    border: 1px solid #334155;
    border-radius: 6px;
    background: #0f172a;
    color: #e2e8f0;
    font-size: 13px;
    &:focus {
      outline: none;
      border-color: #4facfe;
    }
  }
`;

const LineTableWrapper = styled.div`
  overflow-x: auto;
  margin: 12px 0;
`;

const LineTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  th,
  td {
    padding: 6px 8px;
    border: 1px solid #1e293b;
    text-align: left;
  }
  th {
    background: #1e293b;
    color: #94a3b8;
    text-transform: uppercase;
    font-size: 10px;
  }
  input {
    width: 100%;
    background: transparent;
    border: none;
    color: #e2e8f0;
    &:focus {
      outline: 1px solid #4facfe;
    }
  }
`;

const Button = styled.button<{ variant?: "primary" | "secondary" | "danger" }>`
  padding: 6px 14px;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
  ${({ variant }) => {
    if (variant === "primary")
      return "background: #4facfe; color: #fff; &:hover { background: #3b8edb; }";
    if (variant === "secondary")
      return "background: #334155; color: #e2e8f0; &:hover { background: #475569; }";
    if (variant === "danger")
      return "background: #dc2626; color: #fff; &:hover { background: #b91c1c; }";
    return "background: #1e293b; color: #e2e8f0; &:hover { background: #334155; }";
  }}
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 40px;
  padding: 12px 0;
  border-top: 2px solid #334155;
  margin-top: 12px;
  .total-item {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    span:first-child {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
    }
    span:last-child {
      font-size: 16px;
      font-weight: 700;
      color: #e2e8f0;
    }
  }
`;

const defaultLine: ExpenseLine = {
  date: "",
  designation: "",
  quantite: 1,
  devise: "Fcfa",
  montant_ht: 0,
  tva: 0,
};

export const NoteDeFraisForm: React.FC<Props> = ({
  reportId,
  onSuccess,
  onCancel,
}) => {
  const [header, setHeader] = useState<Partial<ExpenseReport>>({
    collaborateur_name: "",
    collaborateur_initials: "",
    collaborateur_phone: "",
    collaborateur_address: "",
    date_debut: "",
    date_fin: "",
    mois: "",
    taux_tva: 0,
    avance: 0,
    modalite_reglement: "Chèque",
    status: "brouillon",
  });
  const [lines, setLines] = useState<ExpenseLine[]>([{ ...defaultLine }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missions, setMissions] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  // Charger missions et clients pour les dropdowns
  useEffect(() => {
    const fetchData = async () => {
      const [missionsRes, clientsRes] = await Promise.all([
        supabase.from("weekly_missions").select("id, name"),
        supabase.from("clients").select("id, name"),
      ]);
      if (missionsRes.data) setMissions(missionsRes.data);
      if (clientsRes.data) setClients(clientsRes.data);
    };
    fetchData();
  }, []);

  // Charger une note existante si reportId fourni
  useEffect(() => {
    if (reportId) {
      const fetchReport = async () => {
        try {
          setLoading(true);
          const { data: report, error } = await supabase
            .from("expense_reports")
            .select("*, lines:expense_lines(*)")
            .eq("id", reportId)
            .single();
          if (error) throw error;
          setHeader(report);
          if (report.lines) {
            setLines(report.lines);
          }
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchReport();
    }
  }, [reportId]);

  const addLine = () => {
    setLines([...lines, { ...defaultLine, date: header.date_debut || "" }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof ExpenseLine, value: any) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    // Recalculer p_net_ht (quantite * montant_ht) ?
    // On le fera globalement
    setLines(updated);
  };

  const handleHeaderChange = (field: keyof ExpenseReport, value: any) => {
    setHeader({ ...header, [field]: value });
  };

  const calculateTotals = () => {
    const total_ht = lines.reduce(
      (sum, l) => sum + l.quantite * l.montant_ht,
      0,
    );
    const taux_tva = header.taux_tva || 0;
    const total_tva = total_ht * (taux_tva / 100);
    const total_ttc = total_ht + total_tva;
    const avance = header.avance || 0;
    const net_a_payer = total_ttc - avance;
    return { total_ht, total_tva, total_ttc, net_a_payer };
  };

  const { total_ht, total_tva, total_ttc, net_a_payer } = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!header.collaborateur_name) {
      alert("Veuillez renseigner le nom du collaborateur.");
      return;
    }
    if (lines.length === 0) {
      alert("Ajoutez au moins une ligne de frais.");
      return;
    }

    try {
      setLoading(true);
      const { total_ht, total_tva, total_ttc, net_a_payer } = calculateTotals();

      // Générer la référence
      let reference = header.reference;
      if (!reference) {
        const initials = header.collaborateur_initials || "XX";
        const today = new Date();
        const dateStr = format(today, "ddMMyy");
        reference = `NDF_${dateStr}_${initials}`;
      }
      const moisDate = header.mois ? header.mois + "-01" : null;
      // Préparer l'objet header
      const headerData = {
        ...header,
        reference,
        mois: moisDate,
        total_ht,
        total_tva,
        total_ttc,
        net_a_payer,
        // montant_lettres à générer plus tard
      };

      let savedReportId = reportId;

      if (reportId) {
        // Mise à jour
        const { error } = await supabase
          .from("expense_reports")
          .update(headerData)
          .eq("id", reportId);
        if (error) throw error;

        // Supprimer les anciennes lignes et réinsérer
        await supabase
          .from("expense_lines")
          .delete()
          .eq("expense_report_id", reportId);
      } else {
        // Insertion
        const { data, error } = await supabase
          .from("expense_reports")
          .insert([headerData])
          .select()
          .single();
        if (error) throw error;
        savedReportId = data.id;
      }

      // Insérer les lignes
      if (savedReportId) {
        const linesToInsert = lines.map((l) => ({
          expense_report_id: savedReportId,
          date: l.date || header.date_debut,
          designation: l.designation,
          quantite: l.quantite,
          devise: l.devise,
          montant_ht: l.montant_ht,
          tva: l.tva || 0,
          category: l.category,
        }));
        const { error } = await supabase
          .from("expense_lines")
          .insert(linesToInsert);
        if (error) throw error;
      }

      if (reportId) {
        void addNotification({
          title: "Note de frais mise à jour",
          message: "Une note de frais a été mise à jour.",
          type: "expense",
        });
      } else {
        void addNotification({
          title: "Nouvelle note de frais",
          message: "Une nouvelle note de frais a été enregistrée.",
          type: "expense",
        });
      }
      onSuccess();
    } catch (err: any) {
      alert("Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div style={{ color: "#dc2626" }}>Erreur : {error}</div>;

  return (
    <form onSubmit={handleSubmit}>
      <FormContainer>
        <Grid>
          <Field>
            <label>Collaborateur</label>
            <input
              value={header.collaborateur_name || ""}
              onChange={(e) =>
                handleHeaderChange("collaborateur_name", e.target.value)
              }
              placeholder="Nom complet"
              required
            />
          </Field>
          <Field>
            <label>Initiales</label>
            <input
              value={header.collaborateur_initials || ""}
              onChange={(e) =>
                handleHeaderChange("collaborateur_initials", e.target.value)
              }
              placeholder="MJ"
              maxLength={10}
            />
          </Field>
          <Field>
            <label>Téléphone</label>
            <input
              value={header.collaborateur_phone || ""}
              onChange={(e) =>
                handleHeaderChange("collaborateur_phone", e.target.value)
              }
            />
          </Field>
          <Field>
            <label>Adresse</label>
            <input
              value={header.collaborateur_address || ""}
              onChange={(e) =>
                handleHeaderChange("collaborateur_address", e.target.value)
              }
            />
          </Field>
          <Field>
            <label>Date début</label>
            <input
              type="date"
              value={header.date_debut || ""}
              onChange={(e) => handleHeaderChange("date_debut", e.target.value)}
            />
          </Field>
          <Field>
            <label>Date fin</label>
            <input
              type="date"
              value={header.date_fin || ""}
              onChange={(e) => handleHeaderChange("date_fin", e.target.value)}
            />
          </Field>
          <Field>
            <label>Mois</label>
            <input
              type="month"
              value={header.mois || ""}
              onChange={(e) => handleHeaderChange("mois", e.target.value)}
            />
          </Field>
          <Field>
            <label>Mission</label>
            <select
              value={header.mission_id || ""}
              onChange={(e) => handleHeaderChange("mission_id", e.target.value)}
            >
              <option value="">-- Sélectionner --</option>
              {missions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <label>Client</label>
            <select
              value={header.client_id || ""}
              onChange={(e) => handleHeaderChange("client_id", e.target.value)}
            >
              <option value="">-- Sélectionner --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <label>Taux TVA (%)</label>
            <input
              type="number"
              step="0.01"
              value={header.taux_tva || 0}
              onChange={(e) =>
                handleHeaderChange("taux_tva", parseFloat(e.target.value) || 0)
              }
            />
          </Field>
          <Field>
            <label>Avance</label>
            <input
              type="number"
              value={header.avance || 0}
              onChange={(e) =>
                handleHeaderChange("avance", parseFloat(e.target.value) || 0)
              }
            />
          </Field>
          <Field>
            <label>Modalité de règlement</label>
            <select
              value={header.modalite_reglement || "Chèque"}
              onChange={(e) =>
                handleHeaderChange("modalite_reglement", e.target.value)
              }
            >
              <option value="Chèque">Chèque</option>
              <option value="Virement">Virement</option>
              <option value="Espèce">Espèce</option>
            </select>
          </Field>
        </Grid>

        <h4 style={{ color: "#94a3b8", marginTop: "12px" }}>
          <i className="fas fa-list"></i> Lignes de frais
        </h4>
        <LineTableWrapper>
          <LineTable>
            <thead>
              <tr>
                <th style={{ width: "120px" }}>Date</th>
                <th>Désignation</th>
                <th style={{ width: "70px" }}>Qté</th>
                <th style={{ width: "80px" }}>Devise</th>
                <th style={{ width: "100px" }}>Montant HT</th>
                <th style={{ width: "80px" }}>TVA</th>
                <th style={{ width: "100px" }}>P Net HT</th>
                <th style={{ width: "60px" }}></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      type="date"
                      value={line.date || ""}
                      onChange={(e) => updateLine(idx, "date", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      value={line.designation}
                      onChange={(e) =>
                        updateLine(idx, "designation", e.target.value)
                      }
                      placeholder="Libellé"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="1"
                      value={line.quantite}
                      onChange={(e) =>
                        updateLine(
                          idx,
                          "quantite",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      value={line.devise}
                      onChange={(e) =>
                        updateLine(idx, "devise", e.target.value)
                      }
                      style={{ width: "70px" }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="1"
                      value={line.montant_ht}
                      onChange={(e) =>
                        updateLine(
                          idx,
                          "montant_ht",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={line.tva || 0}
                      onChange={(e) =>
                        updateLine(idx, "tva", parseFloat(e.target.value) || 0)
                      }
                    />
                  </td>
                  <td>{(line.quantite * line.montant_ht).toFixed(0)}</td>
                  <td>
                    <Button
                      variant="danger"
                      type="button"
                      onClick={() => removeLine(idx)}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </LineTable>
        </LineTableWrapper>
        <Button variant="secondary" type="button" onClick={addLine}>
          <i className="fas fa-plus"></i> Ajouter une ligne
        </Button>

        <TotalRow>
          <div className="total-item">
            <span>Total HT</span>
            <span>{total_ht.toFixed(0)} FCFA</span>
          </div>
          <div className="total-item">
            <span>TVA</span>
            <span>{total_tva.toFixed(0)} FCFA</span>
          </div>
          <div className="total-item">
            <span>Total TTC</span>
            <span>{total_ttc.toFixed(0)} FCFA</span>
          </div>
          <div className="total-item">
            <span>Net à payer</span>
            <span>{net_a_payer.toFixed(0)} FCFA</span>
          </div>
        </TotalRow>

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
            marginTop: "16px",
          }}
        >
          <Button variant="secondary" type="button" onClick={onCancel}>
            Annuler
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading
              ? "Enregistrement..."
              : reportId
                ? "Mettre à jour"
                : "Créer la note"}
          </Button>
        </div>
      </FormContainer>
    </form>
  );
};
