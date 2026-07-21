// src/pages/collaborateurs/CollaborateurFiche.tsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { supabase } from "../../lib/supabase";
import { format, differenceInYears } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "../../contexts/AuthContext";

// ==================== STYLES ====================
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

const Section = styled.div`
  background: #1e293b;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #334155;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #4facfe;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
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
  select,
  textarea {
    padding: 8px 12px;
    border: 1px solid #334155;
    border-radius: 6px;
    background: #0f172a;
    color: #e2e8f0;
    font-size: 14px;
    &:focus {
      outline: none;
      border-color: #4facfe;
    }
    &::placeholder {
      color: #64748b;
    }
  }
  textarea {
    min-height: 60px;
    resize: vertical;
  }
`;

const PhotoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;

const PhotoPreview = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #334155;
  background: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .placeholder {
    font-size: 40px;
    color: #475569;
  }
`;

const UploadButton = styled.button`
  padding: 8px 16px;
  background: #4facfe;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  &:hover {
    background: #3b8edb;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const Button = styled.button<{
  variant?: "primary" | "secondary" | "danger" | "success";
}>`
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
    if (variant === "success")
      return "background: #22c55e; color: #fff; &:hover { background: #16a34a; }";
    return "background: #1e293b; color: #e2e8f0; &:hover { background: #334155; }";
  }}
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #1e293b;
    .info {
      flex: 1;
    }
    .actions {
      display: flex;
      gap: 4px;
    }
  }
`;

const ScoreGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  .score-item {
    background: #0f172a;
    padding: 12px;
    border-radius: 8px;
    text-align: center;
    .value {
      font-size: 24px;
      font-weight: 700;
      color: #e2e8f0;
    }
    .label {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      margin-top: 4px;
    }
  }
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
`;

// ==================== COMPOSANT ====================
interface Collaborateur {
  id: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance: string;
  sexe: "M" | "F";
  photo_url: string;
  fonction: string;
  pays: string;
  bureau: string;
  date_embauche: string;
  date_depart: string;
  cv_url: string;
  cni_url: string;
}

interface Formation {
  id: string;
  titre: string;
  etablissement: string;
  date_obtention: string;
}

interface Discipline {
  id: string;
  date: string;
  description: string;
  document_url: string;
}

interface Score {
  mois: string;
  score_mensuel: number;
  score_trimestriel: number;
  score_annuel: number;
}

const CollaborateurFiche: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new" || !id;

  const [collaborateur, setCollaborateur] = useState<Partial<Collaborateur>>(
    {},
  );
  const [formations, setFormations] = useState<Formation[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [scores, setScores] = useState<Score[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [age, setAge] = useState<number | null>(null);

  // Nouvelle formation
  const [newFormation, setNewFormation] = useState({
    titre: "",
    etablissement: "",
    date_obtention: "",
  });
  // Nouvelle discipline
  const [newDiscipline, setNewDiscipline] = useState({
    date: "",
    description: "",
    document_url: "",
  });

  const photoInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const cniInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (isNew) return;
    try {
      setLoading(true);
      const { data: collab, error } = await supabase
        .from("collaborateurs")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      setCollaborateur(collab);

      if (collab.date_naissance) {
        const age = differenceInYears(
          new Date(),
          new Date(collab.date_naissance),
        );
        setAge(age);
      }

      const { data: f, error: fErr } = await supabase
        .from("formations")
        .select("*")
        .eq("collaborateur_id", id)
        .order("date_obtention", { ascending: false });
      if (!fErr) setFormations(f || []);

      const { data: d, error: dErr } = await supabase
        .from("disciplines")
        .select("*")
        .eq("collaborateur_id", id)
        .order("date", { ascending: false });
      if (!dErr) setDisciplines(d || []);

      const { data: s, error: sErr } = await supabase
        .from("scores")
        .select("*")
        .eq("collaborateur_id", id)
        .order("mois", { ascending: false })
        .limit(1);
      if (!sErr && s && s.length > 0) setScores(s);
    } catch (err) {
      console.error(err);
      alert("Erreur chargement du collaborateur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, user]);

  useEffect(() => {
    if (collaborateur.date_naissance) {
      const age = differenceInYears(
        new Date(),
        new Date(collaborateur.date_naissance),
      );
      setAge(age);
    } else {
      setAge(null);
    }
  }, [collaborateur.date_naissance]);

  const handleChange = (field: keyof Collaborateur, value: any) => {
    setCollaborateur({ ...collaborateur, [field]: value });
  };

  const handleUpload = async (
    field: "photo_url" | "cv_url" | "cni_url",
    file: File,
  ) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${field}.${fileExt}`;
      const filePath = `collaborateurs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      handleChange(field, urlData.publicUrl);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'upload du fichier");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collaborateur.nom || !collaborateur.prenom) {
      alert("Veuillez renseigner au moins le nom et le prénom.");
      return;
    }
    // Vérifier que la date d'embauche est renseignée
    if (!collaborateur.date_embauche) {
      alert("Veuillez renseigner la date d'embauche.");
      return;
    }

    try {
      setSaving(true);
      const dataToSave = { ...collaborateur };

      let savedId = id;
      if (isNew) {
        const { data, error } = await supabase
          .from("collaborateurs")
          .insert([dataToSave])
          .select()
          .single();
        if (error) throw error;
        savedId = data.id;
        navigate(`/collaborateurs/${data.id}`);
      } else {
        const { error } = await supabase
          .from("collaborateurs")
          .update(dataToSave)
          .eq("id", id);
        if (error) throw error;
      }

      // Mettre à jour la table profiles avec la date d'embauche pour l'utilisateur courant
      if (user && dataToSave.date_embauche) {
        await supabase
          .from("profiles")
          .update({ hire_date: dataToSave.date_embauche })
          .eq("id", user.id);
      }

      alert("Collaborateur sauvegardé !");
      loadData();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const addFormation = async () => {
    if (!newFormation.titre || !id) return;
    try {
      const { data, error } = await supabase
        .from("formations")
        .insert([
          {
            collaborateur_id: id,
            titre: newFormation.titre,
            etablissement: newFormation.etablissement,
            date_obtention: newFormation.date_obtention || null,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      setFormations([data, ...formations]);
      setNewFormation({ titre: "", etablissement: "", date_obtention: "" });
    } catch (err) {
      alert("Erreur ajout formation");
    }
  };

  const deleteFormation = async (formationId: string) => {
    if (!window.confirm("Supprimer cette formation ?")) return;
    try {
      await supabase.from("formations").delete().eq("id", formationId);
      setFormations(formations.filter((f) => f.id !== formationId));
    } catch (err) {
      alert("Erreur suppression");
    }
  };

  const addDiscipline = async () => {
    if (!newDiscipline.description || !id) return;
    try {
      const { data, error } = await supabase
        .from("disciplines")
        .insert([
          {
            collaborateur_id: id,
            date: newDiscipline.date || new Date().toISOString().split("T")[0],
            description: newDiscipline.description,
            document_url: newDiscipline.document_url || null,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      setDisciplines([data, ...disciplines]);
      setNewDiscipline({ date: "", description: "", document_url: "" });
    } catch (err) {
      alert("Erreur ajout discipline");
    }
  };

  const deleteDiscipline = async (disciplineId: string) => {
    if (!window.confirm("Supprimer cette sanction ?")) return;
    try {
      await supabase.from("disciplines").delete().eq("id", disciplineId);
      setDisciplines(disciplines.filter((d) => d.id !== disciplineId));
    } catch (err) {
      alert("Erreur suppression");
    }
  };

  if (loading) {
    return (
      <LoadingContainer>
        <i className="fas fa-spinner fa-spin"></i> Chargement...
      </LoadingContainer>
    );
  }

  return (
    <Container>
      <Header>
        <HeaderTitle>
          <i className="fas fa-user"></i>
          {isNew
            ? "Nouveau collaborateur"
            : `${collaborateur.prenom || ""} ${collaborateur.nom || ""}`}
        </HeaderTitle>
        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            variant="secondary"
            onClick={() => navigate("/collaborateurs")}
          >
            <i className="fas fa-arrow-left"></i> Retour
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "Sauvegarde..." : "Enregistrer"}
          </Button>
        </div>
      </Header>

      <form onSubmit={handleSubmit}>
        {/* ===== SECTION PERSONNELLE ===== */}
        <Section>
          <SectionTitle>
            <i className="fas fa-id-card"></i> Informations personnelles
          </SectionTitle>

          <PhotoSection>
            <PhotoPreview>
              {collaborateur.photo_url ? (
                <img src={collaborateur.photo_url} alt="Photo" />
              ) : (
                <span className="placeholder">
                  <i className="fas fa-user-circle"></i>
                </span>
              )}
            </PhotoPreview>
            <div>
              <UploadButton
                type="button"
                onClick={() => photoInputRef.current?.click()}
              >
                <i className="fas fa-upload"></i> Importer une photo
              </UploadButton>
              <FileInput
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0])
                    handleUpload("photo_url", e.target.files[0]);
                }}
              />
              {collaborateur.photo_url && (
                <Button
                  variant="danger"
                  type="button"
                  onClick={() => handleChange("photo_url", "")}
                >
                  Supprimer
                </Button>
              )}
            </div>
          </PhotoSection>

          <Grid>
            <Field>
              <label>Nom *</label>
              <input
                value={collaborateur.nom || ""}
                onChange={(e) => handleChange("nom", e.target.value)}
              />
            </Field>
            <Field>
              <label>Prénom *</label>
              <input
                value={collaborateur.prenom || ""}
                onChange={(e) => handleChange("prenom", e.target.value)}
              />
            </Field>
            <Field>
              <label>Date de naissance</label>
              <input
                type="date"
                value={collaborateur.date_naissance || ""}
                onChange={(e) => handleChange("date_naissance", e.target.value)}
              />
            </Field>
            <Field>
              <label>Âge</label>
              <input value={age !== null ? `${age} ans` : ""} disabled />
            </Field>
            <Field>
              <label>Lieu de naissance</label>
              <input
                value={collaborateur.lieu_naissance || ""}
                onChange={(e) => handleChange("lieu_naissance", e.target.value)}
              />
            </Field>
            <Field>
              <label>Sexe</label>
              <select
                value={collaborateur.sexe || ""}
                onChange={(e) => handleChange("sexe", e.target.value)}
              >
                <option value="">--</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </Field>
          </Grid>
        </Section>

        {/* ===== SECTION PROFESSIONNELLE ===== */}
        <Section>
          <SectionTitle>
            <i className="fas fa-briefcase"></i> Informations professionnelles
          </SectionTitle>
          <Grid>
            <Field>
              <label>Fonction / Poste</label>
              <input
                value={collaborateur.fonction || ""}
                onChange={(e) => handleChange("fonction", e.target.value)}
              />
            </Field>
            <Field>
              <label>Pays</label>
              <input
                value={collaborateur.pays || ""}
                onChange={(e) => handleChange("pays", e.target.value)}
              />
            </Field>
            <Field>
              <label>Bureau</label>
              <input
                value={collaborateur.bureau || ""}
                onChange={(e) => handleChange("bureau", e.target.value)}
              />
            </Field>
            <Field>
              <label>Date d'embauche *</label>
              <input
                type="date"
                value={collaborateur.date_embauche || ""}
                onChange={(e) => handleChange("date_embauche", e.target.value)}
                required
              />
            </Field>
            <Field>
              <label>Date de départ</label>
              <input
                type="date"
                value={collaborateur.date_depart || ""}
                onChange={(e) => handleChange("date_depart", e.target.value)}
              />
            </Field>
          </Grid>
        </Section>

        {/* ===== SECTION DOCUMENTS ===== */}
        <Section>
          <SectionTitle>
            <i className="fas fa-paperclip"></i> Documents
          </SectionTitle>
          <Grid>
            <Field>
              <label>CV</label>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                {collaborateur.cv_url ? (
                  <>
                    <a
                      href={collaborateur.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#4facfe" }}
                    >
                      <i className="fas fa-file-pdf"></i> Voir le CV
                    </a>
                    <Button
                      variant="danger"
                      type="button"
                      onClick={() => handleChange("cv_url", "")}
                    >
                      Supprimer
                    </Button>
                  </>
                ) : (
                  <UploadButton
                    type="button"
                    onClick={() => cvInputRef.current?.click()}
                  >
                    <i className="fas fa-upload"></i> Importer
                  </UploadButton>
                )}
                <FileInput
                  ref={cvInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    if (e.target.files?.[0])
                      handleUpload("cv_url", e.target.files[0]);
                  }}
                />
              </div>
            </Field>
            <Field>
              <label>CNI</label>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                {collaborateur.cni_url ? (
                  <>
                    <a
                      href={collaborateur.cni_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#4facfe" }}
                    >
                      <i className="fas fa-file-pdf"></i> Voir la CNI
                    </a>
                    <Button
                      variant="danger"
                      type="button"
                      onClick={() => handleChange("cni_url", "")}
                    >
                      Supprimer
                    </Button>
                  </>
                ) : (
                  <UploadButton
                    type="button"
                    onClick={() => cniInputRef.current?.click()}
                  >
                    <i className="fas fa-upload"></i> Importer
                  </UploadButton>
                )}
                <FileInput
                  ref={cniInputRef}
                  type="file"
                  accept=".pdf,.jpg,.png"
                  onChange={(e) => {
                    if (e.target.files?.[0])
                      handleUpload("cni_url", e.target.files[0]);
                  }}
                />
              </div>
            </Field>
          </Grid>
        </Section>

        {/* ===== FORMATIONS ===== */}
        <Section>
          <SectionTitle>
            <i className="fas fa-graduation-cap"></i> Formations et diplômes
          </SectionTitle>
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "12px",
            }}
          >
            <input
              placeholder="Titre"
              value={newFormation.titre}
              onChange={(e) =>
                setNewFormation({ ...newFormation, titre: e.target.value })
              }
              style={{
                padding: "6px 10px",
                border: "1px solid #334155",
                borderRadius: "4px",
                background: "#0f172a",
                color: "#e2e8f0",
                flex: 1,
              }}
            />
            <input
              placeholder="Établissement"
              value={newFormation.etablissement}
              onChange={(e) =>
                setNewFormation({
                  ...newFormation,
                  etablissement: e.target.value,
                })
              }
              style={{
                padding: "6px 10px",
                border: "1px solid #334155",
                borderRadius: "4px",
                background: "#0f172a",
                color: "#e2e8f0",
                flex: 1,
              }}
            />
            <input
              type="date"
              value={newFormation.date_obtention}
              onChange={(e) =>
                setNewFormation({
                  ...newFormation,
                  date_obtention: e.target.value,
                })
              }
              style={{
                padding: "6px 10px",
                border: "1px solid #334155",
                borderRadius: "4px",
                background: "#0f172a",
                color: "#e2e8f0",
              }}
            />
            <Button variant="success" type="button" onClick={addFormation}>
              <i className="fas fa-plus"></i> Ajouter
            </Button>
          </div>
          <List>
            {formations.map((f) => (
              <li key={f.id}>
                <span className="info">
                  <strong>{f.titre}</strong> – {f.etablissement}{" "}
                  {f.date_obtention &&
                    `(${format(new Date(f.date_obtention), "dd/MM/yyyy")})`}
                </span>
                <Button
                  variant="danger"
                  type="button"
                  onClick={() => deleteFormation(f.id)}
                >
                  <i className="fas fa-trash"></i>
                </Button>
              </li>
            ))}
            {formations.length === 0 && (
              <li
                style={{
                  color: "#94a3b8",
                  textAlign: "center",
                  padding: "12px",
                }}
              >
                Aucune formation enregistrée
              </li>
            )}
          </List>
        </Section>

        {/* ===== DISCIPLINE ===== */}
        <Section>
          <SectionTitle>
            <i className="fas fa-gavel"></i> Discipline (sanctions)
          </SectionTitle>
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "12px",
            }}
          >
            <input
              type="date"
              value={newDiscipline.date}
              onChange={(e) =>
                setNewDiscipline({ ...newDiscipline, date: e.target.value })
              }
              style={{
                padding: "6px 10px",
                border: "1px solid #334155",
                borderRadius: "4px",
                background: "#0f172a",
                color: "#e2e8f0",
              }}
            />
            <input
              placeholder="Description"
              value={newDiscipline.description}
              onChange={(e) =>
                setNewDiscipline({
                  ...newDiscipline,
                  description: e.target.value,
                })
              }
              style={{
                padding: "6px 10px",
                border: "1px solid #334155",
                borderRadius: "4px",
                background: "#0f172a",
                color: "#e2e8f0",
                flex: 2,
              }}
            />
            <input
              placeholder="Lien pièce jointe (optionnel)"
              value={newDiscipline.document_url}
              onChange={(e) =>
                setNewDiscipline({
                  ...newDiscipline,
                  document_url: e.target.value,
                })
              }
              style={{
                padding: "6px 10px",
                border: "1px solid #334155",
                borderRadius: "4px",
                background: "#0f172a",
                color: "#e2e8f0",
                flex: 1,
              }}
            />
            <Button variant="success" type="button" onClick={addDiscipline}>
              <i className="fas fa-plus"></i> Ajouter
            </Button>
          </div>
          <List>
            {disciplines.map((d) => (
              <li key={d.id}>
                <span className="info">
                  <strong>{format(new Date(d.date), "dd/MM/yyyy")}</strong> –{" "}
                  {d.description}
                  {d.document_url && (
                    <a
                      href={d.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ marginLeft: "8px", color: "#4facfe" }}
                    >
                      <i className="fas fa-paperclip"></i>
                    </a>
                  )}
                </span>
                <Button
                  variant="danger"
                  type="button"
                  onClick={() => deleteDiscipline(d.id)}
                >
                  <i className="fas fa-trash"></i>
                </Button>
              </li>
            ))}
            {disciplines.length === 0 && (
              <li
                style={{
                  color: "#94a3b8",
                  textAlign: "center",
                  padding: "12px",
                }}
              >
                Aucune sanction enregistrée
              </li>
            )}
          </List>
        </Section>

        {/* ===== ÉVALUATIONS (placeholder) ===== */}
        <Section>
          <SectionTitle>
            <i className="fas fa-chart-line"></i> Évaluations
          </SectionTitle>
          <div
            style={{
              color: "#94a3b8",
              textAlign: "center",
              padding: "20px",
              background: "#0f172a",
              borderRadius: "8px",
            }}
          >
            <i
              className="fas fa-code"
              style={{
                fontSize: "32px",
                display: "block",
                marginBottom: "12px",
                color: "#475569",
              }}
            ></i>
            <p>Module d'évaluations interne à venir</p>
            <p style={{ fontSize: "13px", marginTop: "4px" }}>
              Cette section permettra de gérer les évaluations périodiques des
              collaborateurs.
            </p>
          </div>
        </Section>

        {/* ===== SCORES ===== */}
        <Section>
          <SectionTitle>
            <i className="fas fa-star"></i> Scores
          </SectionTitle>
          <ScoreGrid>
            {scores.length > 0 ? (
              <>
                <div className="score-item">
                  <div className="value">
                    {scores[0].score_mensuel?.toFixed(1) || "-"}
                  </div>
                  <div className="label">Mensuel</div>
                </div>
                <div className="score-item">
                  <div className="value">
                    {scores[0].score_trimestriel?.toFixed(1) || "-"}
                  </div>
                  <div className="label">Trimestriel</div>
                </div>
                <div className="score-item">
                  <div className="value">
                    {scores[0].score_annuel?.toFixed(1) || "-"}
                  </div>
                  <div className="label">Annuel</div>
                </div>
                <div
                  className="score-item"
                  style={{
                    gridColumn: "1 / -1",
                    fontSize: "13px",
                    color: "#94a3b8",
                  }}
                >
                  Dernière mise à jour :{" "}
                  {scores[0].mois
                    ? format(new Date(scores[0].mois), "MMMM yyyy", {
                        locale: fr,
                      })
                    : "N/A"}
                </div>
              </>
            ) : (
              <div
                style={{
                  color: "#94a3b8",
                  textAlign: "center",
                  padding: "12px",
                  gridColumn: "1 / -1",
                }}
              >
                Aucun score enregistré
              </div>
            )}
          </ScoreGrid>
        </Section>
      </form>
    </Container>
  );
};

export default CollaborateurFiche;
