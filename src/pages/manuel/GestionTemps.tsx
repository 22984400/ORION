// src/pages/manuel/GestionTemps.tsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { supabase } from "../../lib/supabase";
import * as XLSX from "xlsx";

// ==================== STYLES (unifiés) ====================
const Container = styled.div`
  background: #0f172a;
  border-radius: 16px;
  padding: 24px 28px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  border: 1px solid #1e293b;
  color: #e2e8f0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #1e293b;
`;

const HeaderTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  i {
    color: #4facfe;
  }
`;

const Description = styled.p`
  color: #94a3b8;
  font-size: 14px;
  margin: 12px 0 20px;
  line-height: 1.6;
  i {
    color: #4facfe;
    margin-right: 6px;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 4px;
  border-bottom: 2px solid #1e293b;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: 10px 20px;
  border: none;
  background: transparent;
  font-weight: 500;
  font-size: 14px;
  color: ${({ $active }) => ($active ? "#4facfe" : "#94a3b8")};
  cursor: pointer;
  border-bottom: 3px solid
    ${({ $active }) => ($active ? "#4facfe" : "transparent")};
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  &:hover {
    color: #e2e8f0;
    background: #1e293b;
  }
  i {
    font-size: 16px;
  }
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  margin: 16px 0;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  th,
  td {
    padding: 6px 8px;
    border-bottom: 1px solid #1e293b;
    text-align: left;
    vertical-align: top;
    min-width: 80px;
  }
  th {
    color: #94a3b8;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 10px;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #334155;
    white-space: nowrap;
  }
  td:first-child {
    color: #e2e8f0;
  }
`;

const Input = styled.input`
  padding: 4px 6px;
  border: 1px solid #334155;
  border-radius: 4px;
  background: #0f172a;
  color: #e2e8f0;
  font-size: 12px;
  width: 100%;
  min-width: 60px;
  &:focus {
    outline: none;
    border-color: #4facfe;
  }
`;

const StyledSelect = styled.select`
  padding: 4px 6px;
  border: 1px solid #334155;
  border-radius: 4px;
  background: #0f172a;
  color: #e2e8f0;
  font-size: 12px;
  width: 100%;
  min-width: 80px;
  &:focus {
    outline: none;
    border-color: #4facfe;
  }
`;

const Button = styled.button<{ $variant?: "primary" | "secondary" | "danger" }>`
  padding: 6px 14px;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
  ${({ $variant }) => {
    if ($variant === "primary")
      return "background: #4facfe; color: #fff; &:hover { background: #3b8edb; }";
    if ($variant === "secondary")
      return "background: #334155; color: #e2e8f0; &:hover { background: #475569; }";
    if ($variant === "danger")
      return "background: #dc2626; color: #fff; &:hover { background: #b91c1c; }";
    return "background: #1e293b; color: #e2e8f0; &:hover { background: #334155; }";
  }}
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ExportButton = styled.button`
  padding: 8px 18px;
  background: #22c55e;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  &:hover {
    background: #16a34a;
  }
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
`;

const FilterRow = styled.div`
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  align-items: flex-end;
  margin: 16px 0;
  div {
    display: flex;
    flex-direction: column;
    gap: 4px;
    label {
      font-size: 12px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    select,
    input {
      padding: 4px 8px;
      border: 1px solid #334155;
      border-radius: 4px;
      background: #0f172a;
      color: #e2e8f0;
      font-size: 13px;
      min-width: 150px;
      &:focus {
        outline: none;
        border-color: #4facfe;
      }
    }
  }
`;

const SummaryTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  margin: 12px 0;
  th,
  td {
    padding: 6px 10px;
    border: 1px solid #1e293b;
    text-align: left;
  }
  th {
    color: #94a3b8;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 10px;
    letter-spacing: 0.5px;
    background: #1e293b;
  }
  td {
    color: #e2e8f0;
  }
  .total-row {
    font-weight: bold;
    background: #0f172a;
  }
`;

const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

// ==================== INTERFACES ====================
interface Intervenant {
  id: string;
  nom: string;
  niveau: string;
  taux: number;
}

interface Client {
  id: string;
  nom: string;
  code: string;
}

interface Mission {
  id: string;
  nom: string;
  code: string;
  tasks: string[];
}

interface TimeEntry {
  id: string;
  intervenant_id: string;
  date: string; // ISO date
  client_code: string;
  duree: number;
  mission_id: string;
  task: string;
  detail: string;
  facturable: "F" | "NF";
  ca_facturable: number;
}

// ==================== COMPOSANT ====================
const GestionTemps: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "parametres" | "saisie" | "synthese"
  >("saisie");

  // États des paramètres
  const [intervenants, setIntervenants] = useState<Intervenant[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);

  // États pour la saisie
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [newEntry, setNewEntry] = useState<Partial<TimeEntry>>({});

  // États pour les synthèses
  const [filterClient, setFilterClient] = useState<string>("");
  const [filterIntervenant, setFilterIntervenant] = useState<string>("");
  const [filterMission, setFilterMission] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Chargement des données
  const loadData = async () => {
    try {
      setLoading(true);
      const [intervRes, clientRes, missRes, entriesRes] = await Promise.all([
        supabase.from("intervenants").select("*").order("nom"),
        supabase.from("clients").select("*").order("nom"),
        supabase.from("missions").select("*").order("nom"),
        supabase
          .from("time_entries")
          .select("*")
          .order("date", { ascending: false }),
      ]);
      if (intervRes.error) throw intervRes.error;
      if (clientRes.error) throw clientRes.error;
      if (missRes.error) throw missRes.error;
      if (entriesRes.error) throw entriesRes.error;
      setIntervenants(intervRes.data || []);
      setClients(clientRes.data || []);
      setMissions(missRes.data || []);
      setTimeEntries(entriesRes.data || []);
    } catch (err: any) {
      console.error(err);
      setError("Erreur chargement des données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ===== Gestion des paramètres =====
  // Ajouter un intervenant
  const addIntervenant = async (nom: string, niveau: string, taux: number) => {
    if (!nom || !niveau || taux <= 0) return;
    try {
      const { data, error } = await supabase
        .from("intervenants")
        .insert([{ nom, niveau, taux }])
        .select()
        .single();
      if (error) throw error;
      setIntervenants([...intervenants, data]);
    } catch (err: any) {
      alert("Erreur ajout intervenant: " + err.message);
    }
  };

  const deleteIntervenant = async (id: string) => {
    if (!window.confirm("Supprimer cet intervenant ?")) return;
    try {
      await supabase.from("intervenants").delete().eq("id", id);
      setIntervenants(intervenants.filter((i) => i.id !== id));
    } catch (err: any) {
      alert("Erreur suppression: " + err.message);
    }
  };

  // Ajouter un client
  const addClient = async (nom: string, code: string) => {
    if (!nom || !code) return;
    try {
      const { data, error } = await supabase
        .from("clients")
        .insert([{ nom, code }])
        .select()
        .single();
      if (error) throw error;
      setClients([...clients, data]);
    } catch (err: any) {
      alert("Erreur ajout client: " + err.message);
    }
  };

  const deleteClient = async (id: string) => {
    if (!window.confirm("Supprimer ce client ?")) return;
    try {
      await supabase.from("clients").delete().eq("id", id);
      setClients(clients.filter((c) => c.id !== id));
    } catch (err: any) {
      alert("Erreur suppression: " + err.message);
    }
  };

  // Ajouter une mission
  const addMission = async (nom: string, code: string, tasks: string[]) => {
    if (!nom || !code) return;
    try {
      const { data, error } = await supabase
        .from("missions")
        .insert([{ nom, code, tasks }])
        .select()
        .single();
      if (error) throw error;
      setMissions([...missions, data]);
    } catch (err: any) {
      alert("Erreur ajout mission: " + err.message);
    }
  };

  const deleteMission = async (id: string) => {
    if (!window.confirm("Supprimer cette mission ?")) return;
    try {
      await supabase.from("missions").delete().eq("id", id);
      setMissions(missions.filter((m) => m.id !== id));
    } catch (err: any) {
      alert("Erreur suppression: " + err.message);
    }
  };

  // ===== Gestion des temps =====
  const handleEntryChange = (field: keyof TimeEntry, value: any) => {
    setNewEntry((prev) => ({ ...prev, [field]: value }));
  };

  // Calcul du CA facturable (à l'ajout ou modification)
  const calculateCA = (entry: Partial<TimeEntry>): number => {
    if (entry.facturable === "NF") return 0;
    const intervenant = intervenants.find((i) => i.id === entry.intervenant_id);
    if (!intervenant) return 0;
    return (entry.duree || 0) * intervenant.taux;
  };

  const addTimeEntry = async () => {
    // Validation
    if (
      !newEntry.intervenant_id ||
      !newEntry.date ||
      !newEntry.client_code ||
      !newEntry.duree ||
      !newEntry.mission_id
    ) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    const ca = calculateCA(newEntry);
    const entryToInsert = {
      ...newEntry,
      ca_facturable: ca,
      facturable: newEntry.facturable || "F",
    };
    try {
      const { data, error } = await supabase
        .from("time_entries")
        .insert([entryToInsert])
        .select()
        .single();
      if (error) throw error;
      setTimeEntries([data, ...timeEntries]);
      setNewEntry({});
    } catch (err: any) {
      alert("Erreur ajout ligne: " + err.message);
    }
  };

  const deleteTimeEntry = async (id: string) => {
    if (!window.confirm("Supprimer cette ligne ?")) return;
    try {
      await supabase.from("time_entries").delete().eq("id", id);
      setTimeEntries(timeEntries.filter((e) => e.id !== id));
    } catch (err: any) {
      alert("Erreur suppression: " + err.message);
    }
  };

  // ===== Synthèse =====
  const getClientCode = (code: string) => code || "";

  const getIntervenantName = (id: string) => {
    const i = intervenants.find((iv) => iv.id === id);
    return i ? i.nom : "";
  };

  const getMissionName = (id: string) => {
    const m = missions.find((mi) => mi.id === id);
    return m ? m.nom : "";
  };

  // Filtrer les entrées pour la synthèse
  const filteredEntries = timeEntries.filter((e) => {
    if (filterClient && e.client_code !== filterClient) return false;
    if (filterIntervenant && e.intervenant_id !== filterIntervenant)
      return false;
    if (filterMission && e.mission_id !== filterMission) return false;
    return true;
  });

  // Fonction pour générer les tableaux de synthèse par mois (pour un filtre donné)
  const buildMonthlySummary = (
    entries: TimeEntry[],
    groupBy: "client" | "intervenant" | "client_intervenant",
  ) => {
    // On regroupe par mois (1-12) et éventuellement par client/intervenant
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const result: any = {};

    entries.forEach((e) => {
      const month = new Date(e.date).getMonth() + 1;
      const key =
        groupBy === "client"
          ? e.client_code
          : groupBy === "intervenant"
            ? e.intervenant_id
            : `${e.client_code}_${e.intervenant_id}`;
      if (!result[key]) {
        result[key] = {
          label:
            groupBy === "client"
              ? e.client_code
              : groupBy === "intervenant"
                ? getIntervenantName(e.intervenant_id)
                : `${e.client_code} - ${getIntervenantName(e.intervenant_id)}`,
          months: {},
          total: { duree: 0, facturable: 0, nonFacturable: 0, ca: 0 },
        };
      }
      if (!result[key].months[month]) {
        result[key].months[month] = {
          duree: 0,
          facturable: 0,
          nonFacturable: 0,
          ca: 0,
        };
      }
      const m = result[key].months[month];
      m.duree += e.duree;
      if (e.facturable === "F") {
        m.facturable += e.duree;
        m.ca += e.ca_facturable || 0;
      } else {
        m.nonFacturable += e.duree;
      }
      result[key].total.duree += e.duree;
      result[key].total.facturable += e.facturable === "F" ? e.duree : 0;
      result[key].total.nonFacturable += e.facturable === "NF" ? e.duree : 0;
      result[key].total.ca += e.ca_facturable || 0;
    });

    // Transformer en tableau pour affichage
    const rows: any[] = [];
    Object.keys(result).forEach((key) => {
      const item = result[key];
      const row = { label: item.label, months: {} };
      months.forEach((m) => {
        row.months[m] = item.months[m] || {
          duree: 0,
          facturable: 0,
          nonFacturable: 0,
          ca: 0,
        };
      });
      row.total = item.total;
      rows.push(row);
    });
    return rows;
  };

  // Synthèse par type de mission
  const getMissionSummary = (entries: TimeEntry[]) => {
    const missionMap: { [key: string]: { ca: number } } = {};
    entries.forEach((e) => {
      const missionName = getMissionName(e.mission_id) || "Non défini";
      if (!missionMap[missionName]) missionMap[missionName] = { ca: 0 };
      missionMap[missionName].ca += e.ca_facturable || 0;
    });
    return Object.entries(missionMap).map(([mission, { ca }]) => ({
      mission,
      ca,
    }));
  };

  // ===== Export Excel =====
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Feuille Saisie
    const rows: any[] = [
      ["Gestion des temps - Saisie"],
      [],
      [
        "Intervenant",
        "Date",
        "Client",
        "Durée (h)",
        "Mission",
        "Tâche",
        "Détail",
        "F/NF",
        "CA facturable",
      ],
    ];
    timeEntries.forEach((e) => {
      rows.push([
        getIntervenantName(e.intervenant_id),
        new Date(e.date).toLocaleDateString("fr-FR"),
        e.client_code,
        e.duree,
        getMissionName(e.mission_id),
        e.task,
        e.detail,
        e.facturable,
        e.ca_facturable ? `${e.ca_facturable} FCFA` : "0 FCFA",
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Saisie");

    // Synthèse par client (avec filtres appliqués)
    // ... etc (on peut ajouter d'autres feuilles)
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Gestion_temps.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  // ===== Rendu =====
  if (loading) {
    return (
      <LoadingContainer>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: "2rem" }}></i>
        <p>Chargement...</p>
      </LoadingContainer>
    );
  }

  return (
    <Container>
      <Header>
        <HeaderTitle>
          <i className="fas fa-clock"></i> Gestion des temps
        </HeaderTitle>
        <ExportButton onClick={exportExcel}>
          <i className="fas fa-file-excel"></i> Exporter Excel
        </ExportButton>
      </Header>

      <Description>
        <i className="fas fa-info-circle"></i>
        Saisissez les temps d'intervention des collaborateurs. Le CA facturable
        est calculé automatiquement en fonction du taux horaire de
        l'intervenant.
      </Description>

      <TabsContainer>
        <TabButton
          $active={activeTab === "parametres"}
          onClick={() => setActiveTab("parametres")}
        >
          <i className="fas fa-cogs"></i> Paramètres
        </TabButton>
        <TabButton
          $active={activeTab === "saisie"}
          onClick={() => setActiveTab("saisie")}
        >
          <i className="fas fa-pen"></i> Saisie des temps
        </TabButton>
        <TabButton
          $active={activeTab === "synthese"}
          onClick={() => setActiveTab("synthese")}
        >
          <i className="fas fa-chart-bar"></i> Synthèse
        </TabButton>
      </TabsContainer>

      {activeTab === "parametres" && (
        <div>
          <h3 style={{ color: "#4facfe", marginBottom: "12px" }}>
            <i className="fas fa-user-cog"></i> Intervenants
          </h3>
          {/* Formulaire ajout intervenant */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "12px",
            }}
          >
            <Input
              placeholder="Nom"
              id="intervNom"
              style={{ width: "150px" }}
            />
            <Input
              placeholder="Niveau"
              id="intervNiveau"
              style={{ width: "100px" }}
            />
            <Input
              placeholder="Taux horaire (FCFA)"
              id="intervTaux"
              style={{ width: "150px" }}
              type="number"
            />
            <Button
              $variant="primary"
              onClick={() => {
                const nom = (
                  document.getElementById("intervNom") as HTMLInputElement
                ).value;
                const niveau = (
                  document.getElementById("intervNiveau") as HTMLInputElement
                ).value;
                const taux = parseFloat(
                  (document.getElementById("intervTaux") as HTMLInputElement)
                    .value,
                );
                addIntervenant(nom, niveau, taux);
              }}
            >
              Ajouter
            </Button>
          </div>
          <TableWrapper>
            <StyledTable>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Niveau</th>
                  <th>Taux (FCFA)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {intervenants.map((i) => (
                  <tr key={i.id}>
                    <td>{i.nom}</td>
                    <td>{i.niveau}</td>
                    <td>{i.taux}</td>
                    <td>
                      <Button
                        $variant="danger"
                        onClick={() => deleteIntervenant(i.id)}
                      >
                        Suppr.
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </StyledTable>
          </TableWrapper>

          <h3 style={{ color: "#4facfe", margin: "24px 0 12px" }}>
            <i className="fas fa-users"></i> Clients
          </h3>
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "12px",
            }}
          >
            <Input
              placeholder="Nom du client"
              id="clientNom"
              style={{ width: "200px" }}
            />
            <Input
              placeholder="Code client"
              id="clientCode"
              style={{ width: "100px" }}
            />
            <Button
              $variant="primary"
              onClick={() => {
                const nom = (
                  document.getElementById("clientNom") as HTMLInputElement
                ).value;
                const code = (
                  document.getElementById("clientCode") as HTMLInputElement
                ).value;
                addClient(nom, code);
              }}
            >
              Ajouter
            </Button>
          </div>
          <TableWrapper>
            <StyledTable>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Code</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nom}</td>
                    <td>{c.code}</td>
                    <td>
                      <Button
                        $variant="danger"
                        onClick={() => deleteClient(c.id)}
                      >
                        Suppr.
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </StyledTable>
          </TableWrapper>

          <h3 style={{ color: "#4facfe", margin: "24px 0 12px" }}>
            <i className="fas fa-tasks"></i> Missions
          </h3>
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "12px",
            }}
          >
            <Input
              placeholder="Nom de la mission"
              id="missionNom"
              style={{ width: "200px" }}
            />
            <Input
              placeholder="Code mission"
              id="missionCode"
              style={{ width: "100px" }}
            />
            <Input
              placeholder="Tâches (séparées par ;)"
              id="missionTasks"
              style={{ width: "250px" }}
            />
            <Button
              $variant="primary"
              onClick={() => {
                const nom = (
                  document.getElementById("missionNom") as HTMLInputElement
                ).value;
                const code = (
                  document.getElementById("missionCode") as HTMLInputElement
                ).value;
                const tasksStr = (
                  document.getElementById("missionTasks") as HTMLInputElement
                ).value;
                const tasks = tasksStr
                  .split(";")
                  .map((t) => t.trim())
                  .filter((t) => t);
                addMission(nom, code, tasks);
              }}
            >
              Ajouter
            </Button>
          </div>
          <TableWrapper>
            <StyledTable>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Code</th>
                  <th>Tâches</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {missions.map((m) => (
                  <tr key={m.id}>
                    <td>{m.nom}</td>
                    <td>{m.code}</td>
                    <td>{m.tasks.join(", ")}</td>
                    <td>
                      <Button
                        $variant="danger"
                        onClick={() => deleteMission(m.id)}
                      >
                        Suppr.
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </StyledTable>
          </TableWrapper>
        </div>
      )}

      {activeTab === "saisie" && (
        <div>
          <div
            style={{
              marginBottom: "16px",
              background: "#1e293b",
              padding: "12px",
              borderRadius: "8px",
            }}
          >
            <h4 style={{ color: "#94a3b8", marginBottom: "8px" }}>
              Nouvelle ligne
            </h4>
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <StyledSelect
                value={newEntry.intervenant_id || ""}
                onChange={(e) =>
                  handleEntryChange("intervenant_id", e.target.value)
                }
              >
                <option value="">Intervenant</option>
                {intervenants.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nom}
                  </option>
                ))}
              </StyledSelect>
              <Input
                type="date"
                value={newEntry.date || ""}
                onChange={(e) => handleEntryChange("date", e.target.value)}
                style={{ width: "130px" }}
              />
              <StyledSelect
                value={newEntry.client_code || ""}
                onChange={(e) =>
                  handleEntryChange("client_code", e.target.value)
                }
              >
                <option value="">Client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.code} - {c.nom}
                  </option>
                ))}
              </StyledSelect>
              <Input
                type="number"
                step="0.25"
                min="0"
                placeholder="Durée (h)"
                value={newEntry.duree || ""}
                onChange={(e) =>
                  handleEntryChange("duree", parseFloat(e.target.value) || 0)
                }
                style={{ width: "100px" }}
              />
              <StyledSelect
                value={newEntry.mission_id || ""}
                onChange={(e) =>
                  handleEntryChange("mission_id", e.target.value)
                }
              >
                <option value="">Mission</option>
                {missions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom}
                  </option>
                ))}
              </StyledSelect>
              <StyledSelect
                value={newEntry.task || ""}
                onChange={(e) => handleEntryChange("task", e.target.value)}
                disabled={!newEntry.mission_id}
              >
                <option value="">Tâche</option>
                {newEntry.mission_id &&
                  missions
                    .find((m) => m.id === newEntry.mission_id)
                    ?.tasks.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
              </StyledSelect>
              <Input
                placeholder="Détail"
                value={newEntry.detail || ""}
                onChange={(e) => handleEntryChange("detail", e.target.value)}
                style={{ width: "150px" }}
              />
              <StyledSelect
                value={newEntry.facturable || "F"}
                onChange={(e) =>
                  handleEntryChange("facturable", e.target.value as "F" | "NF")
                }
              >
                <option value="F">Facturable</option>
                <option value="NF">Non facturable</option>
              </StyledSelect>
              <Button $variant="primary" onClick={addTimeEntry}>
                <i className="fas fa-plus"></i> Ajouter
              </Button>
            </div>
            {newEntry.intervenant_id && newEntry.duree && (
              <div
                style={{ marginTop: "8px", color: "#4facfe", fontSize: "13px" }}
              >
                CA facturable estimé : {calculateCA(newEntry)} FCFA
              </div>
            )}
          </div>

          <TableWrapper>
            <StyledTable>
              <thead>
                <tr>
                  <th>Intervenant</th>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Durée</th>
                  <th>Mission</th>
                  <th>Tâche</th>
                  <th>Détail</th>
                  <th>F/NF</th>
                  <th>CA facturable</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {timeEntries.map((e) => {
                  const interv = intervenants.find(
                    (i) => i.id === e.intervenant_id,
                  );
                  const mission = missions.find((m) => m.id === e.mission_id);
                  return (
                    <tr key={e.id}>
                      <td>{interv?.nom || ""}</td>
                      <td>{new Date(e.date).toLocaleDateString("fr-FR")}</td>
                      <td>{e.client_code}</td>
                      <td>{e.duree}</td>
                      <td>{mission?.nom || ""}</td>
                      <td>{e.task}</td>
                      <td>{e.detail}</td>
                      <td>{e.facturable}</td>
                      <td>
                        {e.ca_facturable ? `${e.ca_facturable} FCFA` : "0 FCFA"}
                      </td>
                      <td>
                        <Button
                          $variant="danger"
                          onClick={() => deleteTimeEntry(e.id)}
                        >
                          Suppr.
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </StyledTable>
          </TableWrapper>
        </div>
      )}

      {activeTab === "synthese" && (
        <div>
          <FilterRow>
            <div>
              <label>Client</label>
              <select
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
              >
                <option value="">Tous</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.code} - {c.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Intervenant</label>
              <select
                value={filterIntervenant}
                onChange={(e) => setFilterIntervenant(e.target.value)}
              >
                <option value="">Tous</option>
                {intervenants.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Mission</label>
              <select
                value={filterMission}
                onChange={(e) => setFilterMission(e.target.value)}
              >
                <option value="">Toutes</option>
                {missions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Button
                $variant="primary"
                onClick={() => {
                  setFilterClient("");
                  setFilterIntervenant("");
                  setFilterMission("");
                }}
              >
                Réinitialiser
              </Button>
            </div>
          </FilterRow>

          <h4 style={{ color: "#94a3b8", marginTop: "20px" }}>
            Synthèse par client
          </h4>
          {(() => {
            const data = buildMonthlySummary(filteredEntries, "client");
            if (data.length === 0) return <p>Aucune donnée.</p>;
            return (
              <TableWrapper>
                <SummaryTable>
                  <thead>
                    <tr>
                      <th>Client</th>
                      {MONTHS.map((m, idx) => (
                        <th
                          key={idx}
                          colSpan={4}
                          style={{ textAlign: "center" }}
                        >
                          {m}
                        </th>
                      ))}
                      <th colSpan={4} style={{ textAlign: "center" }}>
                        Total
                      </th>
                    </tr>
                    <tr>
                      <th></th>
                      {MONTHS.map((_, idx) => (
                        <React.Fragment key={idx}>
                          <th style={{ fontSize: "9px" }}>Tps</th>
                          <th style={{ fontSize: "9px" }}>Fact.</th>
                          <th style={{ fontSize: "9px" }}>NF</th>
                          <th style={{ fontSize: "9px" }}>CA</th>
                        </React.Fragment>
                      ))}
                      <th style={{ fontSize: "9px" }}>Tps</th>
                      <th style={{ fontSize: "9px" }}>Fact.</th>
                      <th style={{ fontSize: "9px" }}>NF</th>
                      <th style={{ fontSize: "9px" }}>CA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row) => (
                      <tr key={row.label}>
                        <td>
                          <strong>{row.label}</strong>
                        </td>
                        {MONTHS.map((_, idx) => {
                          const m = row.months[idx + 1] || {
                            duree: 0,
                            facturable: 0,
                            nonFacturable: 0,
                            ca: 0,
                          };
                          return (
                            <React.Fragment key={idx}>
                              <td>{m.duree.toFixed(1)}</td>
                              <td>{m.facturable.toFixed(1)}</td>
                              <td>{m.nonFacturable.toFixed(1)}</td>
                              <td>{m.ca ? `${m.ca} FCFA` : "-"}</td>
                            </React.Fragment>
                          );
                        })}
                        <td>{row.total.duree.toFixed(1)}</td>
                        <td>{row.total.facturable.toFixed(1)}</td>
                        <td>{row.total.nonFacturable.toFixed(1)}</td>
                        <td>{row.total.ca ? `${row.total.ca} FCFA` : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </SummaryTable>
              </TableWrapper>
            );
          })()}

          <h4 style={{ color: "#94a3b8", marginTop: "30px" }}>
            Synthèse par intervenant
          </h4>
          {(() => {
            const data = buildMonthlySummary(filteredEntries, "intervenant");
            if (data.length === 0) return <p>Aucune donnée.</p>;
            return (
              <TableWrapper>
                <SummaryTable>
                  <thead>
                    <tr>
                      <th>Intervenant</th>
                      {MONTHS.map((m, idx) => (
                        <th
                          key={idx}
                          colSpan={4}
                          style={{ textAlign: "center" }}
                        >
                          {m}
                        </th>
                      ))}
                      <th colSpan={4} style={{ textAlign: "center" }}>
                        Total
                      </th>
                    </tr>
                    <tr>
                      <th></th>
                      {MONTHS.map((_, idx) => (
                        <React.Fragment key={idx}>
                          <th style={{ fontSize: "9px" }}>Tps</th>
                          <th style={{ fontSize: "9px" }}>Fact.</th>
                          <th style={{ fontSize: "9px" }}>NF</th>
                          <th style={{ fontSize: "9px" }}>CA</th>
                        </React.Fragment>
                      ))}
                      <th style={{ fontSize: "9px" }}>Tps</th>
                      <th style={{ fontSize: "9px" }}>Fact.</th>
                      <th style={{ fontSize: "9px" }}>NF</th>
                      <th style={{ fontSize: "9px" }}>CA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row) => (
                      <tr key={row.label}>
                        <td>
                          <strong>{row.label}</strong>
                        </td>
                        {MONTHS.map((_, idx) => {
                          const m = row.months[idx + 1] || {
                            duree: 0,
                            facturable: 0,
                            nonFacturable: 0,
                            ca: 0,
                          };
                          return (
                            <React.Fragment key={idx}>
                              <td>{m.duree.toFixed(1)}</td>
                              <td>{m.facturable.toFixed(1)}</td>
                              <td>{m.nonFacturable.toFixed(1)}</td>
                              <td>{m.ca ? `${m.ca} FCFA` : "-"}</td>
                            </React.Fragment>
                          );
                        })}
                        <td>{row.total.duree.toFixed(1)}</td>
                        <td>{row.total.facturable.toFixed(1)}</td>
                        <td>{row.total.nonFacturable.toFixed(1)}</td>
                        <td>{row.total.ca ? `${row.total.ca} FCFA` : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </SummaryTable>
              </TableWrapper>
            );
          })()}

          <h4 style={{ color: "#94a3b8", marginTop: "30px" }}>
            Synthèse par type de mission
          </h4>
          {(() => {
            const data = getMissionSummary(filteredEntries);
            if (data.length === 0) return <p>Aucune donnée.</p>;
            return (
              <TableWrapper>
                <SummaryTable>
                  <thead>
                    <tr>
                      <th>Mission</th>
                      <th>CA facturable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item) => (
                      <tr key={item.mission}>
                        <td>{item.mission}</td>
                        <td>{item.ca ? `${item.ca} FCFA` : "0 FCFA"}</td>
                      </tr>
                    ))}
                  </tbody>
                </SummaryTable>
              </TableWrapper>
            );
          })()}
        </div>
      )}
    </Container>
  );
};

export default GestionTemps;
