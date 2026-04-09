'use client';

import { useState, useMemo } from 'react';
import { FlightRecord } from '@/lib/types';
import { buildFlightTimeline } from '@/lib/analytics';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceLine, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { Clock, AlertTriangle, Search, Filter, ChevronDown, ChevronUp, Plane, Activity, TrendingDown } from 'lucide-react';

interface Props {
  data: FlightRecord[];
}

export default function FlightTimeline({ data }: Props) {
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [sortField, setSortField] = useState<string>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const timeline = useMemo(() => buildFlightTimeline(data), [data]);

  const filteredTimeline = useMemo(() => {
    let result = [...timeline];
    if (filterLevel !== 'ALL') result = result.filter(t => t.anomalyLevel === filterLevel);
    if (selectedDate) result = result.filter(t => t.date === selectedDate);
    if (search) {
      const q = search.toUpperCase();
      result = result.filter(t =>
        t.tailNumber.includes(q) ||
        t.route.includes(q) ||
        t.date.includes(q)
      );
    }
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'date': cmp = a.date.localeCompare(b.date); break;
        case 'tail': cmp = a.tailNumber.localeCompare(b.tailNumber); break;
        case 'pfd': cmp = a.pfd - b.pfd; break;
        case 'deg': cmp = a.deg - b.deg; break;
        case 'durationRatio': cmp = a.durationRatio - b.durationRatio; break;
        case 'landing30': cmp = a.landingDist30 - b.landingDist30; break;
        default: cmp = a.date.localeCompare(b.date);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [timeline, filterLevel, selectedDate, search, sortField, sortDir]);

  // Daily aggregation for the overview chart
  const dailyStats = useMemo(() => {
    const dateMap = new Map<string, { date: string; total: number; critical: number; warning: number; normal: number; avgPfd: number; pfdSum: number }>();
    timeline.forEach(t => {
      if (!dateMap.has(t.date)) {
        dateMap.set(t.date, { date: t.date, total: 0, critical: 0, warning: 0, normal: 0, avgPfd: 0, pfdSum: 0 });
      }
      const d = dateMap.get(t.date)!;
      d.total++;
      d[t.anomalyLevel]++;
      if (t.pfd > 0 && t.pfd <= 105) d.pfdSum += t.pfd;
    });
    const result = Array.from(dateMap.values()).map(d => ({
      ...d,
      avgPfd: d.total > 0 ? d.pfdSum / d.total : 0,
    }));
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [timeline]);

  // Duration ratio scatter data
  const durationScatter = useMemo(() => {
    return timeline
      .filter(t => t.durationRatio > 0 && t.durationRatio < 50 && t.pfd > 0 && t.pfd <= 105)
      .map(t => ({
        x: t.pfd,
        y: t.durationRatio,
        tail: t.tailNumber,
        route: t.route,
        date: t.date,
        anomaly: t.anomalyLevel,
      }));
  }, [timeline]);

  const dates = useMemo(() => {
    const set = new Set(timeline.map(t => t.date));
    return Array.from(set).sort();
  }, [timeline]);

  const totalFlights = timeline.length;
  const criticalFlights = timeline.filter(t => t.anomalyLevel === 'critical').length;
  const warningFlights = timeline.filter(t => t.anomalyLevel === 'warning').length;
  const avgPfd = timeline.filter(t => t.pfd > 0 && t.pfd <= 105).reduce((s, t) => s + t.pfd, 0) / Math.max(timeline.filter(t => t.pfd > 0 && t.pfd <= 105).length, 1);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-xs shadow-xl">
        <p className="font-bold text-white">{d.date}</p>
        <p className="text-blue-400">Toplam: {d.total} uçuş</p>
        <p className="text-red-400">Kritik: {d.critical}</p>
        <p className="text-amber-400">Uyarı: {d.warning}</p>
        <p className="text-emerald-400">Normal: {d.normal}</p>
        <p className="text-cyan-400">Ort. PFD: {d.avgPfd?.toFixed(1)}%</p>
      </div>
    );
  };

  const ScatterTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-xs shadow-xl">
        <p className="font-bold text-white">{d.tail}</p>
        <p className="text-slate-400">{d.date} · {d.route}</p>
        <p className="text-blue-400">PFD: {d.x?.toFixed(1)}%</p>
        <p className="text-cyan-400">Süre Oranı: {d.y?.toFixed(2)}x</p>
        <p className={`mt-1 ${
          d.anomaly === 'critical' ? 'text-red-400' : d.anomaly === 'warning' ? 'text-amber-400' : 'text-emerald-400'
        }`}>
          {d.anomaly === 'critical' ? '🔴 Kritik' : d.anomaly === 'warning' ? '🟡 Uyarı' : '🟢 Normal'}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card border-blue-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Toplam Uçuş</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400">{totalFlights}</div>
          <div className="text-[10px] text-slate-500">{dates.length} farklı gün</div>
        </div>
        <div className="card border-red-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Kritik</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">{criticalFlights}</div>
          <div className="text-[10px] text-slate-500">{(criticalFlights / Math.max(totalFlights, 1) * 100).toFixed(1)}% oran</div>
        </div>
        <div className="card border-amber-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Uyarı</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{warningFlights}</div>
          <div className="text-[10px] text-slate-500">{(warningFlights / Math.max(totalFlights, 1) * 100).toFixed(1)}% oran</div>
        </div>
        <div className="card border-cyan-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Ort. PFD</span>
            <Plane className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400">{avgPfd.toFixed(1)}%</div>
          <div className="text-[10px] text-slate-500">Normalize edilmiş</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Flight & Anomaly Stacked Bar */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            Günlük Uçuş & Anomali Dağılımı
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyStats} margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#94a3b8', fontSize: 9 }}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="critical" stackId="a" fill="#ef4444" name="Kritik" />
                <Bar dataKey="warning" stackId="a" fill="#f59e0b" name="Uyarı" />
                <Bar dataKey="normal" stackId="a" fill="#22c55e" name="Normal" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PFD vs Duration Ratio Scatter */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-purple-400" />
            PFD vs Süre Oranı (Extension/Derivative)
          </div>
          <p className="text-[10px] text-slate-500 mb-2">Sağ alt köşe: Düşük PFD + yüksek süre oranı → Ciddi problem</p>
          <div className="h-[270px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 40, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="x" type="number" name="PFD" tick={{ fill: '#94a3b8', fontSize: 10 }}
                  label={{ value: 'PFD (%)', position: 'bottom', fill: '#94a3b8', fontSize: 10, dy: 20 }}
                />
                <YAxis
                  dataKey="y" type="number" name="Süre Oranı" tick={{ fill: '#94a3b8', fontSize: 10 }}
                  label={{ value: 'Süre Oranı (x)', angle: -90, position: 'left', fill: '#94a3b8', fontSize: 10, dx: -10 }}
                />
                <ZAxis range={[25, 60]} />
                <Tooltip content={<ScatterTooltip />} />
                <ReferenceLine y={2} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: '2x Uyarı', fill: '#f59e0b', fontSize: 9 }} />
                <ReferenceLine y={4} stroke="#ef4444" strokeDasharray="5 5" label={{ value: '4x Kritik', fill: '#ef4444', fontSize: 9 }} />
                <ReferenceLine x={95} stroke="#f59e0b" strokeDasharray="5 5" />
                <ReferenceLine x={80} stroke="#ef4444" strokeDasharray="5 5" />
                <Scatter
                  name="Normal"
                  data={durationScatter.filter(d => d.anomaly === 'normal')}
                  fill="#22c55e" fillOpacity={0.5}
                />
                <Scatter
                  name="Uyarı"
                  data={durationScatter.filter(d => d.anomaly === 'warning')}
                  fill="#f59e0b" fillOpacity={0.7}
                />
                <Scatter
                  name="Kritik"
                  data={durationScatter.filter(d => d.anomaly === 'critical')}
                  fill="#ef4444" fillOpacity={0.8}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Daily Average PFD Line */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          Günlük Ortalama PFD Trendi
        </div>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyStats} margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#94a3b8', fontSize: 9 }}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={100} stroke="#22c55e" strokeDasharray="5 5" label={{ value: '100%', fill: '#22c55e', fontSize: 9 }} />
              <ReferenceLine y={95} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: '95%', fill: '#f59e0b', fontSize: 9 }} />
              <Line
                type="monotone"
                dataKey="avgPfd"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={{ r: 3, fill: '#06b6d4' }}
                activeDot={{ r: 6, fill: '#22d3ee' }}
                name="Ort. PFD"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Timeline Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="card-header mb-0 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            Uçuş Zaman Çizelgesi
            <span className="badge-info">{filteredTimeline.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterLevel}
              onChange={e => setFilterLevel(e.target.value)}
              className="bg-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Tüm Seviyeler</option>
              <option value="critical">🔴 Kritik</option>
              <option value="warning">🟡 Uyarı</option>
              <option value="normal">🟢 Normal</option>
            </select>
            <select
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:border-blue-500"
            >
              <option value="">Tüm Tarihler</option>
              {dates.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Ara... (tail, rota, tarih)"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-xs text-slate-200 w-48 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-2 py-2 text-left text-slate-400 font-medium w-8">#</th>
                <th
                  className="px-2 py-2 text-left text-slate-400 font-medium cursor-pointer hover:text-slate-200 select-none"
                  onClick={() => toggleSort('date')}
                >
                  <div className="flex items-center gap-1">Tarih <SortIcon field="date" /></div>
                </th>
                <th
                  className="px-2 py-2 text-left text-slate-400 font-medium cursor-pointer hover:text-slate-200 select-none"
                  onClick={() => toggleSort('tail')}
                >
                  <div className="flex items-center gap-1">Kuyruk <SortIcon field="tail" /></div>
                </th>
                <th className="px-2 py-2 text-left text-slate-400 font-medium">Rota</th>
                <th
                  className="px-2 py-2 text-right text-slate-400 font-medium cursor-pointer hover:text-slate-200 select-none"
                  onClick={() => toggleSort('pfd')}
                >
                  <div className="flex items-center justify-end gap-1">PFD% <SortIcon field="pfd" /></div>
                </th>
                <th
                  className="px-2 py-2 text-right text-slate-400 font-medium cursor-pointer hover:text-slate-200 select-none"
                  onClick={() => toggleSort('deg')}
                >
                  <div className="flex items-center justify-end gap-1">Açı° <SortIcon field="deg" /></div>
                </th>
                <th
                  className="px-2 py-2 text-right text-slate-400 font-medium cursor-pointer hover:text-slate-200 select-none"
                  onClick={() => toggleSort('durationRatio')}
                >
                  <div className="flex items-center justify-end gap-1">Süre Oranı <SortIcon field="durationRatio" /></div>
                </th>
                <th
                  className="px-2 py-2 text-right text-slate-400 font-medium cursor-pointer hover:text-slate-200 select-none"
                  onClick={() => toggleSort('landing30')}
                >
                  <div className="flex items-center justify-end gap-1">İniş 30kn <SortIcon field="landing30" /></div>
                </th>
                <th className="px-2 py-2 text-right text-slate-400 font-medium">İniş 50kn</th>
                <th className="px-2 py-2 text-right text-slate-400 font-medium">GS SBOP</th>
                <th className="px-2 py-2 text-center text-slate-400 font-medium">Seviye</th>
              </tr>
            </thead>
            <tbody>
              {filteredTimeline.slice(0, 200).map((row, i) => {
                const isExpanded = expandedRow === i;
                const landingAnomaly = row.landingDist50 > row.landingDist30 * 1.05 && row.landingDist30 > 0;
                return (
                  <>
                    <tr
                      key={i}
                      className={`border-b border-slate-700/30 hover:bg-slate-700/20 cursor-pointer transition-colors ${
                        row.anomalyLevel === 'critical' ? 'bg-red-500/5' :
                        row.anomalyLevel === 'warning' ? 'bg-amber-500/5' : ''
                      }`}
                      onClick={() => setExpandedRow(isExpanded ? null : i)}
                    >
                      <td className="px-2 py-2 text-slate-500 font-mono">{i + 1}</td>
                      <td className="px-2 py-2 text-slate-300">{row.date}</td>
                      <td className="px-2 py-2 font-mono font-bold text-white">{row.tailNumber}</td>
                      <td className="px-2 py-2 text-slate-300">{row.route}</td>
                      <td className={`px-2 py-2 text-right font-mono font-bold ${
                        row.pfd < 80 ? 'text-red-400' : row.pfd < 95 ? 'text-amber-400' : 'text-slate-200'
                      }`}>
                        {row.pfd.toFixed(1)}
                      </td>
                      <td className={`px-2 py-2 text-right font-mono ${
                        row.deg < 30 ? 'text-red-400' : row.deg < 40 ? 'text-amber-400' : 'text-slate-300'
                      }`}>
                        {row.deg.toFixed(1)}
                      </td>
                      <td className={`px-2 py-2 text-right font-mono ${
                        row.durationRatio > 4 ? 'text-red-400 font-bold' : row.durationRatio > 2 ? 'text-amber-400' : 'text-slate-300'
                      }`}>
                        {row.durationRatio > 0 ? row.durationRatio.toFixed(2) + 'x' : '—'}
                      </td>
                      <td className={`px-2 py-2 text-right font-mono ${
                        row.landingDist30 > 2200 ? 'text-amber-400' : 'text-slate-300'
                      }`}>
                        {row.landingDist30 > 0 ? row.landingDist30.toFixed(0) + 'm' : '—'}
                      </td>
                      <td className={`px-2 py-2 text-right font-mono ${
                        landingAnomaly ? 'text-red-400 font-bold' : 'text-slate-300'
                      }`}>
                        {row.landingDist50 > 0 ? row.landingDist50.toFixed(0) + 'm' : '—'}
                        {landingAnomaly && ' 🔴'}
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-slate-400">
                        {row.gsAtSbop > 0 ? row.gsAtSbop.toFixed(0) : '—'}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {row.anomalyLevel === 'critical' ? (
                          <span className="badge-danger text-[10px]">Kritik</span>
                        ) : row.anomalyLevel === 'warning' ? (
                          <span className="badge-warning text-[10px]">Uyarı</span>
                        ) : (
                          <span className="badge-success text-[10px]">Normal</span>
                        )}
                      </td>
                    </tr>
                    {isExpanded && row.reasons.length > 0 && (
                      <tr key={`exp-${i}`} className="bg-slate-800/60">
                        <td colSpan={11} className="px-4 py-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                            <div className="space-y-1">
                              <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Anomali Sebepleri:</span>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {row.reasons.map((reason, j) => (
                                  <span key={j} className="text-[10px] bg-slate-700/80 text-slate-300 px-2 py-1 rounded-lg border border-slate-600/50">
                                    {reason}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTimeline.length > 200 && (
          <div className="text-center mt-3 text-xs text-slate-500">
            İlk 200 kayıt gösteriliyor (toplam: {filteredTimeline.length}). Filtreleri daraltın.
          </div>
        )}

        {filteredTimeline.length === 0 && (
          <div className="text-center py-10 text-slate-500 text-sm">
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            Filtrelere uygun uçuş kaydı bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
}
