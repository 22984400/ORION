// src/pages/NoteDeFrais/NoteDeFraisDashboard.tsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { supabase } from "../../lib/supabase";

// ==================== STYLES ====================
const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin: 20px 0;
`;

const StatCard = styled.div<{ $color?: string }>`
  background: #1e293b;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  border-left: 4px solid ${({ $color }) => $color || "#4facfe"};
  .value {
    font-size: 24px;
    font-weight: 700;
    color: #e2e8f0;
  }
  .label {
    font-size: 12px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 4px;
  }
`;

const ChartContainer = styled.div`
  background: #1e293b;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
`;

const StatusItem = styled.li<{ $color: string }>`
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid #1e293b;
  .status-badge {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: ${({ $color }) => $color};
    margin-right: 8px;
  }
  .status-label {
    display: flex;
    align-items: center;
  }
`;

// ==================== CONFIGURATION DES STATUTS ====================
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  brouillon: { label: "Brouillon", color: "#475569" },
  soumis: { label: "Soumis", color: "#fcd34d" },
  valide: { label: "Validé", color: "#86efac" },
  rejete: { label: "Rejeté", color: "#fca5a5" },
  rembourse: { label: "Remboursé", color: "#94a3b8" },
};

// ==================== COMPOSANT ====================
export const NoteDeFraisDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: reports, error } = await supabase
          .from("expense_reports")
          .select("status, total_ht, total_ttc");
        if (error) throw error;

        const total_by_status: Record<string, number> = {};
        let total_all = 0;
        reports.forEach((r: any) => {
          total_by_status[r.status] =
            (total_by_status[r.status] || 0) + r.total_ht;
          total_all += r.total_ht;
        });

        setStats({
          total_all,
          total_by_status,
          count: reports.length,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div>Chargement des statistiques...</div>;

  return (
    <div>
      <StatGrid>
        <StatCard>
          <div className="value">{stats.count || 0}</div>
          <div className="label">Nombre de notes</div>
        </StatCard>
        <StatCard>
          <div className="value">{stats.total_all?.toFixed(0) || 0} FCFA</div>
          <div className="label">Total HT</div>
        </StatCard>
        {Object.entries(stats.total_by_status || {}).map(([status, total]) => {
          const config = STATUS_CONFIG[status] || {
            label: status,
            color: "#4facfe",
          };
          const amount = Number(total) || 0;
          return (
            <StatCard key={status} $color={config.color}>
              <div className="value">{amount.toFixed(0)} FCFA</div>
              <div className="label">{config.label}</div>
            </StatCard>
          );
        })}
      </StatGrid>

      <ChartContainer>
        <h4 style={{ color: "#94a3b8", marginBottom: "12px" }}>
          Répartition par statut (HT)
        </h4>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {Object.entries(stats.total_by_status || {}).map(
            ([status, total]) => {
              const config = STATUS_CONFIG[status] || {
                label: status,
                color: "#4facfe",
              };
              const amount = Number(total) || 0;
              return (
                <StatusItem key={status} $color={config.color}>
                  <span className="status-label">
                    <span className="status-badge" />
                    {config.label}
                  </span>
                  <span>{amount.toFixed(0)} FCFA</span>
                </StatusItem>
              );
            },
          )}
        </ul>
      </ChartContainer>
    </div>
  );
};
