import { Target, Search, PackagePlus, CalendarDays, Upload } from 'lucide-react';
import { cn } from '../../lib/utils';
import { QUICK_ACTIONS } from '../../lib/constants';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  Target, Search, PackagePlus, CalendarDays, Upload,
};

const colorClasses: Record<string, { bg: string; icon: string; hover: string }> = {
  primary: { bg: 'bg-primary-500/10', icon: 'text-primary-400', hover: 'hover:bg-primary-500/20' },
  royal: { bg: 'bg-royal-500/10', icon: 'text-royal-400', hover: 'hover:bg-royal-500/20' },
  emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', hover: 'hover:bg-emerald-500/20' },
  cyan: { bg: 'bg-cyan-500/10', icon: 'text-cyan-400', hover: 'hover:bg-cyan-500/20' },
  warning: { bg: 'bg-warning-500/10', icon: 'text-warning-400', hover: 'hover:bg-warning-500/20' },
};

interface QuickActionsProps {
  className?: string;
  onAction?: (id: string) => void;
}

export function QuickActions({ className, onAction }: QuickActionsProps) {
  return (
    <div className={cn('card p-5', className)}>
      <h3 className="text-sm font-medium text-slate-200 mb-4">Actions rapides</h3>
      <div className="space-y-1">
        {QUICK_ACTIONS.map((action) => {
          const Icon = iconMap[action.icon];
          const colors = colorClasses[action.color];
          return (
            <button
              key={action.id}
              onClick={() => onAction?.(action.id)}
              className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group', colors.hover)}
            >
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors.bg)}>
                {Icon && <Icon className={cn('w-4 h-4', colors.icon)} />}
              </div>
              <span className="text-sm text-slate-300 group-hover:text-slate-100">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
