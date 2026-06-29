import { useState } from 'react';
import { Search } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { cn, formatCurrency } from '../../lib/utils';
import { useSupabaseQuery } from '../../hooks/useSupabaseData';
import type { FixedAsset } from '../../types';

export function FixedAssetsPage() {
  const { data: assets } = useSupabaseQuery<FixedAsset>({ table: 'fixed_assets', orderBy: 'created_at', orderAsc: false });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = assets.filter(a => {
    const matchSearch = a.asset_name.toLowerCase().includes(search.toLowerCase()) || a.asset_code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPurchaseValue = assets.reduce((s, a) => s + a.purchase_value, 0);
  const totalNBV = assets.reduce((s, a) => s + a.net_book_value, 0);
  const totalDepreciation = assets.reduce((s, a) => s + a.accumulated_depreciation, 0);

  return (
    <div className="page-container">
      <PageHeader title="Immobilisations" description="Suivez les actifs et les amortissements" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Valeur d\'acquisition', value: formatCurrency(totalPurchaseValue), color: 'text-primary-400' },
          { label: 'Amortissements cumulés', value: formatCurrency(totalDepreciation), color: 'text-warning-500' },
          { label: 'Valeur nette comptable', value: formatCurrency(totalNBV), color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="card p-4"><p className="text-xs text-slate-400">{s.label}</p><p className={`text-lg font-semibold mt-1 ${s.color}`}>{s.value}</p></div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un actif..." className="input-md pl-10" />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'disposed', 'maintenance'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn('px-3 py-2 rounded-lg text-sm transition-colors', statusFilter === s ? 'bg-primary-600/15 text-primary-300 ring-1 ring-primary-500/25' : 'text-slate-400 hover:bg-slate-700/40')}>
              {s === 'all' ? 'Tous' : s === 'active' ? 'Actif' : s === 'disposed' ? 'Cédé' : 'Maintenance'}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Code', 'Actif', 'Catégorie', 'Valeur d\'acquisition', 'Amortissement', 'VNC', 'Durée', 'Taux', 'Statut'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filtered.map(asset => (
                <tr key={asset.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{asset.asset_code}</td>
                  <td className="px-4 py-3 font-medium text-slate-100">{asset.asset_name}</td>
                  <td className="px-4 py-3 text-slate-300">{asset.category}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-200">{formatCurrency(asset.purchase_value)}</td>
                  <td className="px-4 py-3 tabular-nums text-warning-400">{formatCurrency(asset.accumulated_depreciation)}</td>
                  <td className="px-4 py-3 tabular-nums font-medium text-emerald-400">{formatCurrency(asset.net_book_value)}</td>
                  <td className="px-4 py-3 text-slate-300">{asset.useful_life} ans</td>
                  <td className="px-4 py-3 text-slate-300">{asset.depreciation_rate}%</td>
                  <td className="px-4 py-3"><Badge variant={asset.status === 'active' ? 'success' : asset.status === 'disposed' ? 'error' : 'warning'}>{asset.status === 'active' ? 'Actif' : asset.status === 'disposed' ? 'Cédé' : 'Maintenance'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
