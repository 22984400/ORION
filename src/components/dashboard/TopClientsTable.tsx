import { useTranslation } from "react-i18next";
import { DataTable } from "../ui/DataTable";
import { formatCurrency, formatDate } from "../../lib/utils";
import type { ColumnDef } from "../../types";

export interface TopClientRow {
  clientName: string;
  totalRevenue: number;
  invoiceCount: number;
  averageInvoice: number;
  lastInvoice: string;
}

interface TopClientsTableProps {
  data: TopClientRow[];
  loading?: boolean;
}

export function TopClientsTable({
  data,
  loading = false,
}: TopClientsTableProps) {
  const { t } = useTranslation();

  const columns: ColumnDef<TopClientRow>[] = [
    {
      key: "clientName",
      label: t("dashboard.topClients.client"),
      sortable: true,
      width: "30%",
    },
    {
      key: "totalRevenue",
      label: t("dashboard.topClients.revenue"),
      sortable: true,
      render: (value) => formatCurrency(Number(value ?? 0)),
      width: "20%",
    },
    {
      key: "invoiceCount",
      label: t("dashboard.topClients.invoices"),
      sortable: true,
      width: "15%",
    },
    {
      key: "averageInvoice",
      label: t("dashboard.topClients.average"),
      sortable: true,
      render: (value) => formatCurrency(Number(value ?? 0)),
      width: "20%",
    },
    {
      key: "lastInvoice",
      label: t("dashboard.topClients.lastInvoice"),
      sortable: true,
      render: (value) => (value ? formatDate(String(value)) : "—"),
      width: "15%",
    },
  ];

  if (loading) {
    return (
      <div className="card p-5">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-slate-200">
            Clients les plus rentables
          </h3>
          <p className="text-xs text-slate-400">
            {t("dashboard.topClients.loading")}
          </p>
        </div>
        <div className="text-sm text-slate-500">{t("common.loading")}</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card p-5">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-slate-200">
            Clients les plus rentables
          </h3>
          <p className="text-xs text-slate-400">
            {t("dashboard.topClients.subtitle")}
          </p>
        </div>
        <div className="text-sm text-slate-500">
          {t("dashboard.topClients.empty")}
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-slate-200">
            Clients les plus rentables
          </h3>
          <p className="text-xs text-slate-400">
            {t("dashboard.topClients.subtitle")}
          </p>
        </div>
        <span className="text-xs text-slate-500">Top {data.length}</span>
      </div>
      <DataTable
        data={data}
        columns={columns}
        searchable={false}
        exportable={false}
        pageSize={5}
        emptyTitle={t("dashboard.topClients.empty")}
        emptyDescription={t("dashboard.topClients.emptyDescription")}
      />
    </div>
  );
}
