import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  AlertTriangle,
  Clock,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { cn, formatPercent } from '../../lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  change: number;
  changeLabel: string;
  trend: 'up' | 'down' | 'flat';
  color: 'primary' | 'royal' | 'emerald' | 'cyan' | 'warning' | 'error';
  icon: string;
  miniChart?: number[];
  className?: string;
}

const colorMap = {
  primary: { bg: 'bg-primary-500/10', border: 'border-primary-500/20', icon: 'text-primary-400', glow: 'shadow-primary-500/5' },
  royal: { bg: 'bg-royal-500/10', border: 'border-royal-500/20', icon: 'text-royal-400', glow: 'shadow-royal-500/5' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400', glow: 'shadow-emerald-500/5' },
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', icon: 'text-cyan-400', glow: 'shadow-cyan-500/5' },
  warning: { bg: 'bg-warning-500/10', border: 'border-warning-500/20', icon: 'text-warning-400', glow: 'shadow-warning-500/5' },
  error: { bg: 'bg-error-500/10', border: 'border-error-500/20', icon: 'text-error-400', glow: 'shadow-error-500/5' },
};

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  'dollar-sign': DollarSign,
  'bar-chart': BarChart3,
  'alert-triangle': AlertTriangle,
  clock: Clock,
  users: Users,
  'shield-check': ShieldCheck,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
};

export function StatCard({ label, value, change, changeLabel, trend, color, icon, miniChart, className }: StatCardProps) {
  const colors = colorMap[color];
  const IconComponent = iconMap[icon];

  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;
  const trendColor = trend === 'up' ? 'text-success-500' : trend === 'down' ? 'text-error-500' : 'text-slate-400';

  return (
    <div className={cn(
      'card-hover p-5 transition-all duration-300 group',
      colors.glow,
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colors.bg, colors.border, 'border')}>
          {IconComponent && <IconComponent className={cn('w-5 h-5', colors.icon)} />}
        </div>
        <div className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
          <TrendIcon className="w-3.5 h-3.5" />
          <span>{formatPercent(change)}</span>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-2xl font-semibold text-slate-50 tracking-tight">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>

      {miniChart && miniChart.length > 0 && (
        <div className="mt-4 flex items-end gap-1 h-8">
          {miniChart.map((val, i) => {
            const max = Math.max(...miniChart);
            const height = max > 0 ? (val / max) * 100 : 0;
            return (
              <div
                key={i}
                className={cn('flex-1 rounded-sm transition-all duration-300', colors.bg, 'group-hover:opacity-100 opacity-70')}
                style={{ height: `${Math.max(height, 8)}%` }}
              />
            );
          })}
        </div>
      )}

      <p className="text-2xs text-slate-500 mt-3">{changeLabel}</p>
    </div>
  );
}
