'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TailHealthScore, FlightRecord } from '@/lib/types';
import { downsample } from '@/lib/performance';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, ReferenceLine,
} from 'recharts';
import { Heart, AlertTriangle, TrendingDown, TrendingUp, Minus, Plane, Activity, ShieldAlert, Search } from 'lucide-react';

interface Props {
  healthScores: TailHealthScore[];
  data: FlightRecord[];
}

const riskColors: Record<string, string> = { LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444' };
const riskLabels: Record<string, string> = { LOW: 'Düşük', MEDIUM: 'Orta', HIGH: 'Yüksek', CRITICAL: 'Kritik' };
const riskBadge: Record<string, string> = {
  LOW: 'badge-success', MEDIUM: 'badge-warning',
  HIGH: 'bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full text-xs font-medium',
  CRITICAL: 'badge-danger',
};
const trendIcons: Record<string, React.ReactNode> = {
  improving: <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />,
  stable: <Minus className="w-3.5 h-3.5 text-slate-400" />,
  degrading: <TrendingDown className="w-3.5 h-3.5 text-red-400" />,
};
const trendLabels: Record<string, string> = { improving: 'İyileşiyor', stable: 'Stabil', degrading: 'Kötüleşiyor' };

const ROW_H = 42;
const MAX_TREND = 300;

export default function TailHealthMatrix({ healthScores, data }: Props) {
  const [selectedTail, setSelectedTail] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'healthScore' | 'totalFlights' | 'criticalCount' | 'avgPfd' | 'durationRatioAvg'>('healthScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const parentRef = useRef<HTMLDivElement>(null);

  const sortedScores = useMemo(() => {
    let filtered = [...healthScores];
    if (search) { const q = search.toUpperCase(); filtered = filtered.filter(h => h.tailNumber.includes(q)); }
    if (filterRisk !== 'ALL') filtered = filtered.filter(h => h.riskLevel === filterRisk);
    filtered.sort((a, b) => {
      const aV = a[sortBy] as number; const bV = b[sortBy] as number;
      return sortDir === 'asc' ? aV - bV : bV - aV;
    });
    return filtered;
  }, [healthScores, sortBy, sortDir, search, filterRisk]);

  const virtualizer = useVirtualizer({
    count: sortedScores.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 15,
  });

  const selectedHealth = useMemo(() => healthScores.find(h => h.tailNumber === selectedTail) || null, [healthScores, selectedTail]);

  const radarData = useMemo(() => {
    if (!selectedHealth) return [];
    return [
      { metric: 'PFD', value: Math.min(100, (selectedHealth.avgPfd / 100) * 100), fullMark: 100 },
      { metric: 'Açı', value: Math.min(100, (selectedHealth.avgDeg / 50) * 100), fullMark: 100 },
      { metric: 'Süre', value: Math.min(100, Math.max(0, 100 - (selectedHealth.durationRatioAvg / 5) * 100)), fullMark: 100 },
      { metric: 'İniş', value: Math.min(100, Math.max(0, 100 - ((selectedHealth.avgLanding30 - 800) / 1700) * 100)), fullMark: 100 },
      { metric: 'Anomali', value: Math.max(0, 100 - (selectedHealth.criticalCount * 10 + selectedHealth.warningCount * 3)), fullMark: 100 },
      { metric: 'Trend', value: selectedHealth.trend === 'improving' ? 90 : selectedHealth.trend === 'stable' ? 70 : 30, fullMark: 100 },
    ];
  }, [selectedHealth]);

  const pfdTrend = useMemo(() => {
    if (!selectedTail) return [];
    const flights = data.filter(d => d.tailNumber === selectedTail).sort((a, b) => a.flightDate.localeCompare(b.flightDate));
    const sampled = downsample(flights, MAX_TREND);
    return sampled.map((f, i) => ({ index: i + 1, pfd: f.normalizedPfd, anomaly: f.anomalyLevel }));
  }, [data, selectedTail]);

  const healthDistribution = useMemo(() => {
    const b = [{ range: '0-50', label: 'Kritik', count: 0, fill: '#ef4444' }, { range: '50-70', label: 'Yüksek', count: 0, fill: '#f97316' }, { range: '70-85', label: 'Orta', count: 0, fill: '#f59e0b' }, { range: '85-100', label: 'Düşük', count: 0, fill: '#22c55e' }];
    healthScores.forEach(h => { if (h.healthScore < 50) b[0].count++; else if (h.healthScore < 70) b[1].count++; else if (h.healthScore < 85) b[2].count++; else b[3].count++; });
    return b;
  }, [healthScores]);

  const fleetAvgHealth = healthScores.length > 0 ? healthScores.reduce((s, h) => s + h.healthScore, 0) / healthScores.length : 0;

  const toggleSort = (f: typeof sortBy) => { if (sortBy === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy(f); setSortDir('asc'); } };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="card border-blue-500/20"><div className="flex items-center justify-between mb-2"><span className="text-[10px] text-slate-400 uppercase">Filo Sağlığı</span><Heart className="w-4 h-4 text-blue-400" /></div><div className={`text-2xl font-bold ${fleetAvgHealth >= 85 ? 'text-emerald-400' : fleetAvgHealth >= 70 ? 'text-amber-400' : 'text-red-400'}`}>{fleetAvgHealth.toFixed(1)}</div></div>
        <div className="card border-red-500/20"><div className="flex items-center justify-between mb-2"><span className="text-[10px] text-slate-400 uppercase">Kritik Risk</span><ShieldAlert className="w-4 h-4 text-red-400" /></div><div className="text-2xl font-bold text-red-400">{healthScores.filter(h => h.riskLevel === 'CRITICAL').length}</div></div>
        <div className="card border-orange-500/20"><div className="flex items-center justify-between mb-2"><span className="text-[10px] text-slate-400 uppercase">Yüksek Risk</span><AlertTriangle className="w-4 h-4 text-orange-400" /></div><div className="text-2xl font-bold text-orange-400">{healthScores.filter(h => h.riskLevel === 'HIGH').length}</div></div>
        <div className="card border-amber-500/20"><div className="flex items-center justify-between mb-2"><span className="text-[10px] text-slate-400 uppercase">Kötüleşen</span><TrendingDown className="w-4 h-4 text-amber-400" /></div><div className="text-2xl font-bold text-amber-400">{healthScores.filter(h => h.trend === 'degrading').length}</div></div>
        <div className="card border-emerald-500/20"><div className="flex items-center justify-between mb-2"><span className="text-[10px] text-slate-400 uppercase">Toplam Uçuş</span><Plane className="w-4 h-4 text-emerald-400" /></div><div className="text-2xl font-bold text-emerald-400">{healthScores.reduce((s, h) => s + h.totalFlights, 0).toLocaleString()}</div></div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header">Uçak Sağlık Skorları (Top 25)</div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedScores.slice(0, 25)} margin={{ top: 5, right: 10, bottom: 25, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="tailNumber" tick={{ fill: '#94a3b8', fontSize: 9 }} angle={-45} textAnchor="end" height={55} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px', fontSize: '11px' }} />
                <ReferenceLine y={85} stroke="#22c55e" strokeDasharray="5 5" /><ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="5 5" /><ReferenceLine y={50} stroke="#ef4444" strokeDasharray="5 5" />
                <Bar dataKey="healthScore" radius={[4, 4, 0, 0]} cursor="pointer" isAnimationActive={false} onClick={(e: any) => setSelectedTail(e.tailNumber)}>
                  {sortedScores.slice(0, 25).map((e, i) => <Cell key={i} fill={riskColors[e.riskLevel]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="space-y-4">
          <div className="card">
            <div className="card-header">Risk Dağılımı</div>
            <div className="h-[130px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={healthDistribution} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px', fontSize: '11px' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>{healthDistribution.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {selectedHealth && (
            <div className="card border-blue-500/20 animate-fade-in">
              <div className="card-header mb-0 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-400" />{selectedHealth.tailNumber} Radar</div>
              <div className="h-[190px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                    <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 8 }} domain={[0, 100]} />
                    <Radar dataKey="value" stroke={riskColors[selectedHealth.riskLevel]} fill={riskColors[selectedHealth.riskLevel]} fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PFD Trend */}
      {selectedHealth && pfdTrend.length > 0 && (
        <div className="card animate-fade-in">
          <div className="card-header flex items-center gap-2">{selectedHealth.tailNumber} — PFD Trend ({pfdTrend.length} nokta) {trendIcons[selectedHealth.trend]} <span className="text-[10px] text-slate-400">{trendLabels[selectedHealth.trend]}</span></div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pfdTrend} margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="index" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px', fontSize: '11px' }} />
                <ReferenceLine y={100} stroke="#22c55e" strokeDasharray="5 5" /><ReferenceLine y={95} stroke="#f59e0b" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="pfd" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Virtualized Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="card-header mb-0 flex items-center gap-2"><Heart className="w-4 h-4 text-red-400" /> Sağlık Matrisi <span className="badge-info">{sortedScores.length}</span></div>
          <div className="flex items-center gap-2">
            <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} className="bg-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-slate-600">
              <option value="ALL">Tüm Riskler</option><option value="CRITICAL">🔴 Kritik</option><option value="HIGH">🟠 Yüksek</option><option value="MEDIUM">🟡 Orta</option><option value="LOW">🟢 Düşük</option>
            </select>
            <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /><input type="text" placeholder="Kuyruk No..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 pr-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-xs text-slate-200 w-36 focus:outline-none focus:border-blue-500" /></div>
          </div>
        </div>
        <div ref={parentRef} className="overflow-auto" style={{ maxHeight: '55vh' }}>
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-slate-800">
              <tr className="border-b border-slate-700">
                <th className="px-2 py-2 text-left text-slate-400">Kuyruk</th><th className="px-2 py-2 text-center text-slate-400">Tip</th><th className="px-2 py-2 text-center text-slate-400">Risk</th>
                <th className="px-2 py-2 text-center text-slate-400 cursor-pointer" onClick={() => toggleSort('healthScore')}>Skor</th>
                <th className="px-2 py-2 text-center text-slate-400 cursor-pointer" onClick={() => toggleSort('totalFlights')}>Uçuş</th>
                <th className="px-2 py-2 text-center text-slate-400 cursor-pointer" onClick={() => toggleSort('avgPfd')}>PFD</th>
                <th className="px-2 py-2 text-center text-slate-400 cursor-pointer" onClick={() => toggleSort('durationRatioAvg')}>Süre O.</th>
                <th className="px-2 py-2 text-center text-slate-400 cursor-pointer" onClick={() => toggleSort('criticalCount')}>Kritik</th>
                <th className="px-2 py-2 text-center text-slate-400">Trend</th>
              </tr>
            </thead>
            <tbody>
              {virtualizer.getVirtualItems().length > 0 && <tr style={{ height: virtualizer.getVirtualItems()[0]?.start ?? 0 }}><td colSpan={9} /></tr>}
              {virtualizer.getVirtualItems().map(vRow => {
                const h = sortedScores[vRow.index];
                return (
                  <tr key={vRow.index} className={`border-b border-slate-700/30 hover:bg-slate-700/20 cursor-pointer ${selectedTail === h.tailNumber ? 'bg-blue-500/10' : ''}`} style={{ height: ROW_H }} onClick={() => setSelectedTail(selectedTail === h.tailNumber ? null : h.tailNumber)}>
                    <td className="px-2 py-1 font-mono font-bold text-white">{h.tailNumber}</td>
                    <td className="px-2 py-1 text-center"><span className={`text-[10px] px-1.5 py-0.5 rounded-full ${h.aircraftType === 'MAX' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>{h.aircraftType}</span></td>
                    <td className="px-2 py-1 text-center"><span className={riskBadge[h.riskLevel]}>{riskLabels[h.riskLevel]}</span></td>
                    <td className="px-2 py-1 text-center font-mono font-bold" style={{ color: riskColors[h.riskLevel] }}>{h.healthScore.toFixed(1)}</td>
                    <td className="px-2 py-1 text-center text-slate-300">{h.totalFlights}</td>
                    <td className={`px-2 py-1 text-center font-mono ${h.avgPfd < 80 ? 'text-red-400' : h.avgPfd < 95 ? 'text-amber-400' : 'text-slate-200'}`}>{h.avgPfd.toFixed(1)}</td>
                    <td className={`px-2 py-1 text-center font-mono ${h.durationRatioAvg > 3 ? 'text-red-400' : h.durationRatioAvg > 2 ? 'text-amber-400' : 'text-slate-200'}`}>{h.durationRatioAvg.toFixed(2)}x</td>
                    <td className="px-2 py-1 text-center"><span className={`font-mono font-bold ${h.criticalCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>{h.criticalCount}</span>{h.warningCount > 0 && <span className="text-amber-400 ml-1">+{h.warningCount}</span>}</td>
                    <td className="px-2 py-1 text-center"><div className="flex items-center justify-center gap-1">{trendIcons[h.trend]}<span className="text-[10px]">{trendLabels[h.trend]}</span></div></td>
                  </tr>
                );
              })}
              <tr style={{ height: virtualizer.getTotalSize() - (virtualizer.getVirtualItems().at(-1)?.end ?? 0) }}><td colSpan={9} /></tr>
            </tbody>
          </table>
        </div>
        {sortedScores.length === 0 && <div className="text-center py-8 text-slate-500 text-sm">Filtrelere uygun uçak bulunamadı</div>}
      </div>
    </div>
  );
}
