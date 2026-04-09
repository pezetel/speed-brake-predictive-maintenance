'use client';

import { useMemo } from 'react';
import { FlightRecord, FilterState } from '@/lib/types';
import { Filter, X } from 'lucide-react';

interface Props {
  data: FlightRecord[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export default function Filters({ data, filters, onFilterChange }: Props) {
  const allTails = useMemo(() => Array.from(new Set(data.map(d => d.tailNumber))).sort(), [data]);

  const allAirports = useMemo(() => {
    const set = new Set<string>();
    data.forEach(d => {
      if (d.takeoffAirport && d.takeoffAirport !== 'UNKNOWN') set.add(d.takeoffAirport);
      if (d.landingAirport && d.landingAirport !== 'UNKNOWN') set.add(d.landingAirport);
    });
    return Array.from(set).sort();
  }, [data]);

  const dates = useMemo(() => Array.from(new Set(data.map(d => d.flightDate))).sort(), [data]);

  const hasFilters = filters.aircraftType !== 'ALL' || filters.anomalyLevel !== 'ALL' || filters.tails.length > 0 || filters.airport !== '' || filters.dateRange !== null;

  const resetFilters = () => onFilterChange({ dateRange: null, tails: [], aircraftType: 'ALL', anomalyLevel: 'ALL', airport: '' });

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-400"><Filter className="w-3.5 h-3.5" />Filtre:</div>

        <select value={filters.aircraftType} onChange={e => onFilterChange({ ...filters, aircraftType: e.target.value as any })} className="bg-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-slate-600">
          <option value="ALL">Tüm Tipler</option><option value="NG">B737 NG</option><option value="MAX">B737 MAX</option>
        </select>

        <select value={filters.anomalyLevel} onChange={e => onFilterChange({ ...filters, anomalyLevel: e.target.value as any })} className="bg-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-slate-600">
          <option value="ALL">Tüm Seviyeler</option><option value="critical">🔴 Kritik</option><option value="warning">🟡 Uyarı</option><option value="normal">🟢 Normal</option>
        </select>

        <select value={filters.tails.length === 1 ? filters.tails[0] : ''} onChange={e => onFilterChange({ ...filters, tails: e.target.value ? [e.target.value] : [] })} className="bg-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-slate-600 max-w-[150px]">
          <option value="">Tüm Uçaklar ({allTails.length})</option>
          {allTails.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select value={filters.airport} onChange={e => onFilterChange({ ...filters, airport: e.target.value })} className="bg-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-slate-600 max-w-[130px]">
          <option value="">Tüm Havalimanları</option>
          {allAirports.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <div className="flex items-center gap-1">
          <select value={filters.dateRange?.[0] || ''} onChange={e => { const s = e.target.value; if (!s) onFilterChange({ ...filters, dateRange: null }); else onFilterChange({ ...filters, dateRange: [s, filters.dateRange?.[1] || dates[dates.length - 1]] }); }} className="bg-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 border border-slate-600">
            <option value="">Başlangıç</option>
            {dates.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <span className="text-slate-500 text-xs">–</span>
          <select value={filters.dateRange?.[1] || ''} onChange={e => { const end = e.target.value; if (!end) onFilterChange({ ...filters, dateRange: null }); else onFilterChange({ ...filters, dateRange: [filters.dateRange?.[0] || dates[0], end] }); }} className="bg-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 border border-slate-600">
            <option value="">Bitiş</option>
            {dates.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {hasFilters && (
          <button onClick={resetFilters} className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-xs hover:bg-red-500/20 transition-colors">
            <X className="w-3 h-3" />Temizle
          </button>
        )}
      </div>
    </div>
  );
}
