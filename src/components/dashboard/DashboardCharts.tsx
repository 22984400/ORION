import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import type { ChartDataPoint } from "../../types";

const CATEGORY_COLORS = [
  "#818cf8",
  "#60a5fa",
  "#34d399",
  "#22d3ee",
  "#f59e0b",
  "#a78bfa",
  "#f87171",
  "#fb923c",
];

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

function ChartCard({ title, subtitle, children, className }: ChartCardProps) {
  return (
    <div className={`card p-5 ${className || ""}`}>
      <div className="mb-4">
        <h3 className="text-sm font-medium text-slate-200">{title}</h3>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    fontSize: "12px",
    color: "#f8fafc",
  },
  itemStyle: { color: "#94a3b8" },
  labelStyle: { color: "#e2e8f0", fontWeight: 600 },
};

interface ChartProps {
  data: ChartDataPoint[];
}

export function RevenueChart({ data }: ChartProps) {
  if (data.length === 0) {
    return (
      <ChartCard
        title="Progression des missions"
        subtitle="Pourcentage d'avancement"
      >
        <p className="text-sm text-slate-500 py-16 text-center">
          Aucune donnée disponible
        </p>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Progression des missions"
      subtitle="Pourcentage d'avancement"
    >
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gradientCurrent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#334155"
            strokeOpacity={0.5}
          />
          <XAxis
            dataKey="name"
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(value) => [`${Number(value ?? 0)}%`, ""]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#818cf8"
            strokeWidth={2}
            fill="url(#gradientCurrent)"
            name="Progression"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CategoryChart({ data }: ChartProps) {
  if (data.length === 0) {
    return (
      <ChartCard
        title="Statut des notes de revue"
        subtitle="Répartition par statut"
      >
        <p className="text-sm text-slate-500 py-16 text-center">
          Aucune donnée disponible
        </p>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Statut des notes de revue"
      subtitle="Répartition par statut"
    >
      <div className="flex items-center gap-4">
        <ResponsiveContainer width="50%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              {...tooltipStyle}
              formatter={(value) => [String(Number(value ?? 0)), ""]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{
                  backgroundColor:
                    CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                }}
              />
              <span className="text-xs text-slate-400 flex-1 truncate">
                {item.name}
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

export function FindingsTrendChart({ data }: ChartProps) {
  if (data.length === 0) {
    return (
      <ChartCard
        title="Répartition des risques"
        subtitle="Constats par niveau de risque"
      >
        <p className="text-sm text-slate-500 py-16 text-center">
          Aucune donnée disponible
        </p>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Répartition des risques"
      subtitle="Constats par niveau de risque"
    >
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#334155"
            strokeOpacity={0.5}
          />
          <XAxis
            dataKey="name"
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip {...tooltipStyle} />
          <Bar
            dataKey="value"
            fill="#818cf8"
            radius={[4, 4, 0, 0]}
            name="Nombre"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
