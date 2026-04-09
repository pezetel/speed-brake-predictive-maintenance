'use client';

import { useState, useMemo } from 'react';
import { TailHealthScore, FlightRecord } from '@/lib/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
  LineChart, Line, ReferenceLine,
} from 'recharts';
import { Heart, AlertTriangle, TrendingDown, TrendingUp, Minus, Plane, Activity, ShieldAlert, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface Props {
  healthScores: TailHealthScore[];
  data: FlightRecord[];
}

const riskColors: Record<string, string> = {
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

const riskLabels: Record<string, string> = {
  LOW: 'Düşük',
  MEDIUM: 'Orta',
  HIGH: 'Yüksek',
  CRITICAL: 'Kritik',
};

const riskBadge: Record<string, string> = {
  LOW: 'badge-success',
  MEDIUM: 'badge-warning',
  HIGH: 'bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full text-xs font-medium',
  CRITICAL: 'badge-danger',
};

const trendIcons: Record<string, React.ReactNode> = {
  improving: <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />,
  stable: <Minus className="w-3.5 h-3.5 text-slate-400" />,
  degrading: <TrendingDown className="w-3.5 h-3.5 text-red-400" />,
};

const trendLabels: Record<string, string> = {
  improving: 'İyileşiyor',
  stable: 'Stabil',
  degrading: 'Kötüleşiyor',
};

export default function TailHealthMatrix({ healthScores, data }: Props) {
  const [selectedTail, setSelectedTail] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'healthScore' | 'totalFlights' | 'criticalCount' | 'avgPfd' | 'durationRatioAvg'>('healthScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');

  const sortedScores = useMemo(() => {
    let filtered = [...healthScores];
    if (search) {
      const q = search.toUpperCase();
      filtered = filtered.filter(h => h.tailNumber.includes(q));
    }
    if (filterRisk !== 'ALL') {
      filtered = filtered.filter(h => h.riskLevel === filterRisk);
    }
    filtered.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
    return filtered;
  }, [healthScores, sortBy, sortDir, search, filterRisk]);

  const selectedHealth = useMemo(() => {
    return healthScores.find(h => h.tailNumber === selectedTail) || null;
  }, [healthScores, selectedTail]);

  const selectedFlights = useMemo(() => {
    if (!selectedTail) return [];
    return data
      .filter(d => d.tailNumber === selectedTail)
      .sort((a, b) => a.flightDate.localeCompare(b.flightDate));
  }, [data, selectedTail]);

  // Radar data for selected tail
  const radarData = useMemo(() => {
    if (!selectedHealth) return [];
    // Normalize each metric to 0-100 scale for radar
    const maxPfd = 100;
    const maxDeg = 50;
    const maxDurRatio = 5;
    const maxLanding = 2500;

    return [
      { metric: 'PFD Skoru', value: Math.min(100, (selectedHealth.avgPfd / maxPfd) * 100), fullMark: 100 },
      { metric: 'Açı Skoru', value: Math.min(100, (selectedHealth.avgDeg / maxDeg) * 100), fullMark: 100 },
      { metric: 'Süre Skoru', value: Math.min(100, Math.max(0, 100 - (selectedHealth.durationRatioAvg / maxDurRatio) * 100)), fullMark: 100 },
      { metric: 'İniş Skoru', value: Math.min(100, Math.max(0, 100 - ((selectedHealth.avgLanding30 - 800) / (maxLanding - 800)) * 100)), fullMark: 100 },
      { metric: 'Anomali Skoru', value: Math.max(0, 100 - (selectedHealth.criticalCount * 10 + selectedHealth.warningCount * 3)), fullMark: 100 },
      { metric: 'Trend Skoru', value: selectedHealth.trend === 'improving' ? 90 : selectedHealth.trend === 'stable' ? 70 : 30, fullMark: 100 },
    ];
  }, [selectedHealth]);

  // PFD trend for selected tail
  const pfdTrend = useMemo(() => {
    return selectedFlights.map((f, i) => ({
      index: i + 1,
      date: f.flightDate,
      route: `${f.takeoffAirport}→${f.landingAirport}`,
      pfd: f.normalizedPfd,
      deg: f.pfdTurn1Deg,
      anomaly: f.anomalyLevel,
    }));
  }, [selectedFlights]);

  // Fleet health distribution
  const healthDistribution = useMemo(() => {
    const buckets = [
      { range: '0-50', label: 'Kritik', count: 0, fill: '#ef4444' },
      { range: '50-70', label: 'Yüksek Risk', count: 0, fill: '#f97316' },
      { range: '70-85', label: 'Orta Risk', count: 0, fill: '#f59e0b' },
      { range: '85-100', label: 'Düşük Risk', count: 0, fill: '#22c55e' },
    ];
    healthScores.forEach(h => {
      if (h.healthScore < 50) buckets[0].count++;
      else if (h.healthScore < 70) buckets[1].count++;
      else if (h.healthScore < 85) buckets[2].count++;
      else buckets[3].count++;
    });
    return buckets;
  }, [healthScores]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortBy }) => {
    if (sortBy !== field) return null;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const fleetAvgHealth = healthScores.length > 0
    ? healthScores.reduce((s, h) => s + h.healthScore, 0) / healthScores.length
    : 0;

  const criticalTails = healthScores.filter(h => h.riskLevel === 'CRITICAL').length;
  const highRiskTails = healthScores.filter(h => h.riskLevel === 'HIGH').length;
  const degradingTails = healthScores.filter(h => h.trend === 'degrading').length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="card border-blue-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Filo Sağlığı</span>
            <Heart className="w-4 h-4 text-blue-400" />
          </div>
          <div className={`text-2xl font-bold ${
            fleetAvgHealth >= 85 ? 'text-emerald-400' : fleetAvgHealth >= 70 ? 'text-amber-400' : 'text-red-400'
          }`}>{fleetAvgHealth.toFixed(1)}</div>
          <div className="text-[10px] text-slate-500">{healthScores.length} uçak ortalaması</div>
        </div>
        <div className="card border-red-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Kritik Risk</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">{criticalTails}</div>
          <div className="text-[10px] text-slate-500">Acil müdahale gerektiren</div>
        </div>
        <div className="card border-orange-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Yüksek Risk</span>
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-orange-400">{highRiskTails}</div>
          <div className="text-[10px] text-slate-500">Yakın takip gerekli</div>
        </div>
        <div className="card border-amber-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Kötüleşen</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{degradingTails}</div>
          <div className="text-[10px] text-slate-500">Performans düşüşü trendi</div>
        </div>
        <div className="card border-emerald-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Toplam Uçuş</span>
            <Plane className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {healthScores.reduce((s, h) => s + h.totalFlights, 0)}
          </div>
          <div className="text-[10px] text-slate-500">Analiz edilen uçuş</div>
        </div>
      </div>

      {/* Fleet Health Distribution + Health Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Health Score Bar Chart */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-400" />
            Uçak Sağlık Skorları
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedScores.slice(0, 25)}
                margin={{ top: 5, right: 10, bottom: 25, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="tailNumber"
                  tick={{ fill: '#94a3b8', fontSize: 9 }}
                  angle={-45}
                  textAnchor="end"
                  height={55}
                />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(value: number) => [`${value.toFixed(1)}`, 'Sağlık Skoru']}
                />
                <ReferenceLine y={85} stroke="#22c55e" strokeDasharray="5 5" />
                <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="5 5" />
                <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="5 5" />
                <Bar
                  dataKey="healthScore"
                  name="Sağlık Skoru"
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(entry: any) => setSelectedTail(entry.tailNumber)}
                >
                  {sortedScores.slice(0, 25).map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={riskColors[entry.riskLevel]}
                      stroke={selectedTail === entry.tailNumber ? '#fff' : 'transparent'}
                      strokeWidth={selectedTail === entry.tailNumber ? 2 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-slate-400">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{ background: '#ef4444' }} /> Kritik (&lt;50)</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{ background: '#f97316' }} /> Yüksek (50-70)</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{ background: '#f59e0b' }} /> Orta (70-85)</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{ background: '#22c55e' }} /> Düşük (&gt;85)</div>
          </div>
        </div>

        {/* Risk Distribution + Detail Panel */}
        <div className="space-y-4">
          <div className="card">
            <div className="card-header">Risk Dağılımı</div>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={healthDistribution} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px', fontSize: '11px' }} />
                  <Bar dataKey="count" name="Uçak Sayısı" radius={[4, 4, 0, 0]}>
                    {healthDistribution.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Selected tail radar */}
          {selectedHealth && (
            <div className="card border-blue-500/20 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <div className="card-header mb-0 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  {selectedHealth.tailNumber} Radar Profili
                </div>
                <span className={riskBadge[selectedHealth.riskLevel]}>
                  {riskLabels[selectedHealth.riskLevel]}
                </span>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                    <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 8 }} domain={[0, 100]} />
                    <Radar
                      name={selectedHealth.tailNumber}
                      dataKey="value"
                      stroke={riskColors[selectedHealth.riskLevel]}
                      fill={riskColors[selectedHealth.riskLevel]}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PFD Trend for selected tail */}
      {selectedHealth && pfdTrend.length > 0 && (
        <div className="card animate-fade-in">
          <div className="card-header flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            {selectedHealth.tailNumber} — PFD Trend ({pfdTrend.length} uçuş)
            <div className="flex items-center gap-1 ml-2">
              {trendIcons[selectedHealth.trend]}
              <span className={`text-[10px] ${
                selectedHealth.trend === 'improving' ? 'text-emerald-400' :
                selectedHealth.trend === 'degrading' ? 'text-red-400' : 'text-slate-400'
              }`}>{trendLabels[selectedHealth.trend]}</span>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-2 mb-3">
            <div className="bg-slate-700/30 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-500">Ort. PFD</div>
              <div className="text-sm font-bold text-white">{selectedHealth.avgPfd.toFixed(1)}%</div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-500">Ort. Açı</div>
              <div className="text-sm font-bold text-white">{selectedHealth.avgDeg.toFixed(1)}°</div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-500">Süre Oranı</div>
              <div className={`text-sm font-bold ${selectedHealth.durationRatioAvg > 2 ? 'text-amber-400' : 'text-white'}`}>
                {selectedHealth.durationRatioAvg.toFixed(2)}x
              </div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-500">İniş 30kn</div>
              <div className="text-sm font-bold text-white">{selectedHealth.avgLanding30.toFixed(0)}m</div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-500">Mesafe Anomali</div>
              <div className={`text-sm font-bold ${selectedHealth.landingDistAnomalyRate > 0.1 ? 'text-red-400' : 'text-white'}`}>
                {(selectedHealth.landingDistAnomalyRate * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-500">Degradasyon</div>
              <div className={`text-sm font-bold ${selectedHealth.degradationRate > 3 ? 'text-red-400' : 'text-white'}`}>
                {selectedHealth.degradationRate.toFixed(1)}
              </div>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pfdTrend} margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="index"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  label={{ value: 'Uçuş Sırası', position: 'bottom', fill: '#94a3b8', fontSize: 11, dy: 15 }}
                />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(value: number, name: string) => [value.toFixed(2), name === 'pfd' ? 'PFD (%)' : 'Açı (°)']}
                  labelFormatter={(label: number) => {
                    const item = pfdTrend[label - 1];
                    return item ? `${item.date} · ${item.route}` : `Uçuş #${label}`;
                  }}
                />
                <ReferenceLine y={100} stroke="#22c55e" strokeDasharray="5 5" />
                <ReferenceLine y={95} stroke="#f59e0b" strokeDasharray="5 5" />
                <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="5 5" />
                <Line
                  type="monotone"
                  dataKey="pfd"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="PFD"
                  dot={({ cx, cy, payload }: any) => {
                    const color = payload.anomaly === 'critical' ? '#ef4444' : payload.anomaly === 'warning' ? '#f59e0b' : '#22c55e';
                    const r = payload.anomaly === 'critical' ? 5 : payload.anomaly === 'warning' ? 4 : 3;
                    return <circle key={`pfd-${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={color} stroke="#1e293b" strokeWidth={1} />;
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Health Matrix Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="card-header mb-0 flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-400" />
            Uçak Sağlık Matrisi
            <span className="badge-info">{sortedScores.length} uçak</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterRisk}
              onChange={e => setFilterRisk(e.target.value)}
              className="bg-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Tüm Riskler</option>
              <option value="CRITICAL">🔴 Kritik</option>
              <option value="HIGH">🟠 Yüksek</option>
              <option value="MEDIUM">🟡 Orta</option>
              <option value="LOW">🟢 Düşük</option>
            </select>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Kuyruk No..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-xs text-slate-200 w-36 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-2 py-2 text-left text-slate-400 font-medium">Kuyruk No</th>
                <th className="px-2 py-2 text-center text-slate-400 font-medium">Tip</th>
                <th className="px-2 py-2 text-center text-slate-400 font-medium">Risk</th>
                <th
                  className="px-2 py-2 text-center text-slate-400 font-medium cursor-pointer hover:text-slate-200 select-none"
                  onClick={() => toggleSort('healthScore')}
                >
                  <div className="flex items-center justify-center gap-1">Skor <SortIcon field="healthScore" /></div>
                </th>
                <th
                  className="px-2 py-2 text-center text-slate-400 font-medium cursor-pointer hover:text-slate-200 select-none"
                  onClick={() => toggleSort('totalFlights')}
                >
                  <div className="flex items-center justify-center gap-1">Uçuş <SortIcon field="totalFlights" /></div>
                </th>
                <th
                  className="px-2 py-2 text-center text-slate-400 font-medium cursor-pointer hover:text-slate-200 select-none"
                  onClick={() => toggleSort('avgPfd')}
                >
                  <div className="flex items-center justify-center gap-1">Ort PFD <SortIcon field="avgPfd" /></div>
                </th>
                <th className="px-2 py-2 text-center text-slate-400 font-medium">Ort Açı</th>
                <th
                  className="px-2 py-2 text-center text-slate-400 font-medium cursor-pointer hover:text-slate-200 select-none"
                  onClick={() => toggleSort('durationRatioAvg')}
                >
                  <div className="flex items-center justify-center gap-1">Süre Oranı <SortIcon field="durationRatioAvg" /></div>
                </th>
                <th className="px-2 py-2 text-center text-slate-400 font-medium">İniş 30kn</th>
                <th className="px-2 py-2 text-center text-slate-400 font-medium">Mesafe Anom.</th>
                <th
                  className="px-2 py-2 text-center text-slate-400 font-medium cursor-pointer hover:text-slate-200 select-none"
                  onClick={() => toggleSort('criticalCount')}
                >
                  <div className="flex items-center justify-center gap-1">Kritik <SortIcon field="criticalCount" /></div>
                </th>
                <th className="px-2 py-2 text-center text-slate-400 font-medium">Trend</th>
                <th className="px-2 py-2 text-center text-slate-400 font-medium">Son Uçuş</th>
              </tr>
            </thead>
            <tbody>
              {sortedScores.map((h, i) => (
                <tr
                  key={h.tailNumber}
                  className={`border-b border-slate-700/30 hover:bg-slate-700/20 cursor-pointer transition-colors ${
                    selectedTail === h.tailNumber ? 'bg-blue-500/10 border-blue-500/30' : ''
                  } ${h.riskLevel === 'CRITICAL' ? 'bg-red-500/5' : ''}`}
                  onClick={() => setSelectedTail(selectedTail === h.tailNumber ? null : h.tailNumber)}
                >
                  <td className="px-2 py-2 font-mono font-bold text-white">{h.tailNumber}</td>
                  <td className="px-2 py-2 text-center">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      h.aircraftType === 'MAX' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>{h.aircraftType}</span>
                  </td>
                  <td className="px-2 py-2 text-center">
                    <span className={riskBadge[h.riskLevel]}>{riskLabels[h.riskLevel]}</span>
                  </td>
                  <td className="px-2 py-2 text-center">
                    <div className="flex items-center gap-1.5 justify-center">
                      <div className="w-12 h-2 rounded-full overflow-hidden bg-slate-700">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${h.healthScore}%`,
                            background: riskColors[h.riskLevel],
                          }}
                        />
                      </div>
                      <span className="font-mono font-bold" style={{ color: riskColors[h.riskLevel] }}>
                        {h.healthScore.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center text-slate-300">{h.totalFlights}</td>
                  <td className={`px-2 py-2 text-center font-mono ${
                    h.avgPfd < 80 ? 'text-red-400 font-bold' : h.avgPfd < 95 ? 'text-amber-400' : 'text-slate-200'
                  }`}>{h.avgPfd.toFixed(1)}</td>
                  <td className={`px-2 py-2 text-center font-mono ${
                    h.avgDeg < 35 ? 'text-amber-400' : 'text-slate-200'
                  }`}>{h.avgDeg.toFixed(1)}°</td>
                  <td className={`px-2 py-2 text-center font-mono ${
                    h.durationRatioAvg > 3 ? 'text-red-400 font-bold' : h.durationRatioAvg > 2 ? 'text-amber-400' : 'text-slate-200'
                  }`}>{h.durationRatioAvg.toFixed(2)}x</td>
                  <td className="px-2 py-2 text-center font-mono text-slate-200">{h.avgLanding30.toFixed(0)}m</td>
                  <td className="px-2 py-2 text-center">
                    <span className={`font-mono ${
                      h.landingDistAnomalyRate > 0.1 ? 'text-red-400 font-bold' : h.landingDistAnomalyRate > 0 ? 'text-amber-400' : 'text-slate-400'
                    }`}>{(h.landingDistAnomalyRate * 100).toFixed(0)}%</span>
                  </td>
                  <td className="px-2 py-2 text-center">
                    <span className={`font-mono font-bold ${
                      h.criticalCount > 0 ? 'text-red-400' : 'text-slate-400'
                    }`}>{h.criticalCount}</span>
                    {h.warningCount > 0 && (
                      <span className="text-amber-400 font-mono ml-1">+{h.warningCount}</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {trendIcons[h.trend]}
                      <span className={`text-[10px] ${
                        h.trend === 'improving' ? 'text-emerald-400' :
                        h.trend === 'degrading' ? 'text-red-400' : 'text-slate-400'
                      }`}>{trendLabels[h.trend]}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center text-slate-400 text-[10px]">{h.lastFlightDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedScores.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            Filtrelere uygun uçak bulunamadı
          </div>
        )}
      </div>
    </div>
  );
}
