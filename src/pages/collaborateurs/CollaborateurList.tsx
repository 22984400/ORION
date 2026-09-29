// src/pages/collaborateurs/CollaborateurList.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { supabase } from "../../lib/supabase";
import { format } from "date-fns";
import { useAuth } from "../../contexts/AuthContext";
import { ProtectedAction } from "../../components/auth/ProtectedAction";
import { buildAccessFilter } from "../../lib/permissions"; // ✅ ADDED

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

const Button = styled.button<{ variant?: "primary" | "secondary" }>`
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
    return "background: #334155; color: #e2e8f0; &:hover { background: #475569; }";
  }}
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  th,
  td {
    padding: 8px 12px;
    border-bottom: 1px solid #1e293b;
    text-align: left;
    vertical-align: middle;
  }
  th {
    color: #94a3b8;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 10px;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #334155;
  }
  .clickable {
    cursor: pointer;
    &:hover {
      background: #1e293b;
    }
  }
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  i {
    color: #475569;
    font-size: 16px;
  }
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
`;

interface Collaborateur {
  id: string;
  nom: string;
  prenom: string;
  photo_url: string;
  fonction: string;
  pays: string;
  date_embauche: string;
}

export const CollaborateurList: React.FC = () => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [collaborateurs, setCollaborateurs] = useState<Collaborateur[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // ✅ Row-level filtering: stagiaires/auditors without view permission
      //    only see their own profile + profiles they manage.
      const accessFilter = buildAccessFilter({
        role: profile?.role,
        module: "collaborateurs",
        currentUserId: user.id,
        ownerColumn: "id", // collaborator.id matches current user
        assignmentColumn: "manager_id", // OR their manager is the current user
      });

      let q = supabase
        .from("collaborateurs")
        .select("id, nom, prenom, photo_url, fonction, pays, date_embauche")
        .order("nom");

      if (accessFilter) q = q.or(accessFilter);

      const { data, error } = await q;
      if (error) throw error;
      setCollaborateurs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, profile?.role]);

  if (loading) {
    return (
      <LoadingContainer>
        <i className="fas fa-spinner fa-spin"></i> {t("common.loading")}
      </LoadingContainer>
    );
  }

  return (
    <Container>
      <Header>
        <HeaderTitle>
          <i className="fas fa-users"></i> Collaborateurs
        </HeaderTitle>
        <ProtectedAction module="collaborateurs" action="create">
          <Button
            variant="primary"
            onClick={() => navigate("/collaborateurs/new")}
          >
            <i className="fas fa-plus"></i> Nouveau collaborateur
          </Button>
        </ProtectedAction>
      </Header>

      <TableWrapper>
        <StyledTable>
          <thead>
            <tr>
              <th style={{ width: "50px" }}>Photo</th>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Fonction</th>
              <th>Pays</th>
              <th>Date embauche</th>
            </tr>
          </thead>
          <tbody>
            {collaborateurs.map((c) => (
              <ProtectedAction key={c.id} module="collaborateurs" action="view">
                <tr
                  className="clickable"
                  onClick={() => navigate(`/collaborateurs/${c.id}`)}
                >
                  <td>
                    <Avatar>
                      {c.photo_url ? (
                        <img src={c.photo_url} alt={c.nom} />
                      ) : (
                        <i className="fas fa-user-circle"></i>
                      )}
                    </Avatar>
                  </td>
                  <td>{c.nom}</td>
                  <td>{c.prenom}</td>
                  <td>{c.fonction || "-"}</td>
                  <td>{c.pays || "-"}</td>
                  <td>
                    {c.date_embauche
                      ? format(new Date(c.date_embauche), "dd/MM/yyyy")
                      : "-"}
                  </td>
                </tr>
              </ProtectedAction>
            ))}
            {collaborateurs.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    color: "#94a3b8",
                    padding: "24px",
                  }}
                >
                  Aucun collaborateur enregistré
                </td>
              </tr>
            )}
          </tbody>
        </StyledTable>
      </TableWrapper>
    </Container>
  );
};
