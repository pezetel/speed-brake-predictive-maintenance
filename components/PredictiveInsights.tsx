'use client';

import { useState, useMemo } from 'react';
import { PredictiveInsight, FlightRecord, TailHealthScore } from '@/lib/types';
import { Brain, AlertTriangle, Droplets, Wrench, Cpu, Radio, Plane, ChevronDown, ChevronUp, ShieldAlert, TrendingDown, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface Props {
  insights: PredictiveInsight[];
  data: FlightRecord[];
  healthScores: TailHealthScore[];
}

const categoryConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string; label: string }> = {
  hydraulic: { icon: <Droplets className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Hidrolik' },
  mechanical: { icon: <Wrench className="w-4 h-4" />, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', label: 'Mekanik' },
  sensor: { icon: <Cpu className="w-4 h-4" />, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', label: 'Sensör' },
  actuator: { icon: <Radio className="w-4 h-4" />, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', label: 'Aktüatör' },
  operational: { icon: <Plane className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'Operasyonel' },
};

const severityConfig: Record<string, { color: string; bg: string; border: string; label: string; glow: string }> = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: '🔴 Kritik', glow: 'shadow-red-500/10 shadow-lg' },
  warning: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: '🟡 Uyarı', glow: '' },
  info: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: '🔵 Bilgi', glow: '' },
};

export default function PredictiveInsights({ insights, data, healthScores }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const filtered = useMemo(() => {
    let result = [...insights];
    if (filterCategory !== 'ALL') result = result.filter(i => i.category === filterCategory);
    if (filterSeverity !== 'ALL') result = result.filter(i => i.severity === filterSeverity);
    return result;
  }, [insights, filterCategory, filterSeverity]);

  const categorySummary = useMemo(() => {
    const counts: Record<string, number> = {};
    insights.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({
      name: categoryConfig[name]?.label || name, value,
      fill: name === 'hydraulic' ? '#3b82f6' : name === 'mechanical' ? '#f97316' : name === 'sensor' ? '#a855f7' : name === 'actuator' ? '#06b6d4' : '#f59e0b',
    }));
  }, [insights]);

  const severitySummary = useMemo(() => {
    const c = { critical: 0, warning: 0, info: 0 };
    insights.forEach(i => { c[i.severity as keyof typeof c]++; });
    return [{ name: 'Kritik', value: c.critical, fill: '#ef4444' }, { name: 'Uyarı', value: c.warning, fill: '#f59e0b' }, { name: 'Bilgi', value: c.info, fill: '#3b82f6' }].filter(s => s.value > 0);
  }, [insights]);

  const tailRiskData = useMemo(() => {
    return healthScores.filter(h => h.healthScore < 90).slice(0, 15).map(h => ({ tail: h.tailNumber, risk: 100 - h.healthScore, type: h.aircraftType }));
  }, [healthScores]);

  const criticalCount = insights.filter(i => i.severity === 'critical').length;
  const warningCount = insights.filter(i => i.severity === 'warning').length;
  const avgConfidence = insights.length > 0 ? insights.reduce((s, i) => s + i.confidence, 0) / insights.length : 0;
  const affectedTails = new Set(insights.map(i => i.tailNumber)).size;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card border-red-500/20"><div className="flex items-center justify-between mb-2"><span className="text-[10px] text-slate-400 uppercase">Kritik</span><ShieldAlert className="w-4 h-4 text-red-400" /></div><div className="text-2xl font-bold text-red-400">{criticalCount}</div></div>
        <div className="card border-amber-500/20"><div className="flex items-center justify-between mb-2"><span className="text-[10px] text-slate-400 uppercase">Uyarı</span><AlertTriangle className="w-4 h-4 text-amber-400" /></div><div className="text-2xl font-bold text-amber-400">{warningCount}</div></div>
        <div className="card border-purple-500/20"><div className="flex items-center justify-between mb-2"><span className="text-[10px] text-slate-400 uppercase">Güven</span><Brain className="w-4 h-4 text-purple-400" /></div><div className="text-2xl font-bold text-purple-400">%{avgConfidence.toFixed(0)}</div></div>
        <div className="card border-cyan-500/20"><div className="flex items-center justify-between mb-2"><span className="text-[10px] text-slate-400 uppercase">Uçak</span><Plane className="w-4 h-4 text-cyan-400" /></div><div className="text-2xl font-bold text-cyan-400">{affectedTails}</div></div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card"><div className="card-header">Kategori</div><div className="h-[200px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categorySummary} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>{categorySummary.map((e, i) => <Cell key={i} fill={e.fill} />)}</Pie><Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px', fontSize: '11px' }} /></PieChart></ResponsiveContainer></div></div>
        <div className="card"><div className="card-header">Seviye</div><div className="h-[200px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={severitySummary} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>{severitySummary.map((e, i) => <Cell key={i} fill={e.fill} />)}</Pie><Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px', fontSize: '11px' }} /></PieChart></ResponsiveContainer></div></div>
        <div className="card"><div className="card-header">Risk Skoru</div><div className="h-[200px]">{tailRiskData.length > 0 ? <ResponsiveContainer width="100%" height="100%"><BarChart data={tailRiskData} layout="vertical" margin={{ top: 5, right: 5, bottom: 5, left: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#334155" /><XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 9 }} domain={[0, 100]} /><YAxis dataKey="tail" type="category" tick={{ fill: '#94a3b8', fontSize: 9 }} width={65} /><Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px', fontSize: '11px' }} /><Bar dataKey="risk" radius={[0, 4, 4, 0]} isAnimationActive={false}>{tailRiskData.map((e, i) => <Cell key={i} fill={e.risk > 30 ? '#ef4444' : e.risk > 15 ? '#f59e0b' : '#22c55e'} />)}</Bar></BarChart></ResponsiveContainer> : <div className="flex items-center justify-center h-full text-slate-500 text-sm">Tüm uçaklar sağlıklı</div>}</div></div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-slate-400">Filtre:</span>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="bg-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-slate-600">
          <option value="ALL">Tüm Kategoriler</option>
          {Object.entries(categoryConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="bg-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-slate-600">
          <option value="ALL">Tüm Seviyeler</option><option value="critical">🔴 Kritik</option><option value="warning">🟡 Uyarı</option><option value="info">🔵 Bilgi</option>
        </select>
        <span className="text-xs text-slate-500 ml-2">{filtered.length} / {insights.length}</span>
      </div>

      {/* Insight Cards */}
      <div className="space-y-3">
        {filtered.length === 0 && <div className="card text-center py-10 text-slate-500"><Brain className="w-10 h-10 mx-auto mb-3 text-slate-600" /><p>Insight bulunamadı.</p></div>}
        {filtered.map(insight => {
          const cat = categoryConfig[insight.category] || categoryConfig.operational;
          const sev = severityConfig[insight.severity] || severityConfig.info;
          const isExpanded = expandedId === insight.id;
          return (
            <div key={insight.id} className={`card ${sev.border} ${sev.glow} transition-all`}>
              <div className="flex items-start gap-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : insight.id)}>
                <div className={`p-2 rounded-lg ${cat.bg} shrink-0`}><span className={cat.color}>{cat.icon}</span></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-white">{insight.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sev.bg} ${sev.border} ${sev.color}`}>{sev.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${cat.bg} ${cat.border} ${cat.color}`}>{cat.label}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{insight.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
                    <span>Güven: <strong className={sev.color}>%{insight.confidence}</strong></span>
                    <span>{insight.relatedFlights} uçuş</span>
                    <span>{insight.tailNumber}</span>
                  </div>
                </div>
                <div className="shrink-0 p-1">{isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}</div>
              </div>
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-3 animate-fade-in">
                  <div><h4 className="text-xs font-semibold text-slate-300 mb-2">Kanıtlar</h4><div className="space-y-1">{insight.evidence.map((ev, i) => <div key={i} className="text-[11px] text-slate-400 bg-slate-700/30 rounded-lg px-3 py-1.5 font-mono">#{i + 1} {ev}</div>)}</div></div>
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3"><h4 className="text-xs font-semibold text-emerald-400 mb-1">💡 Öneri</h4><p className="text-xs text-slate-300">{insight.recommendation}</p></div>
                  <div><div className="flex justify-between text-[10px] text-slate-400 mb-1"><span>Güven</span><span>%{insight.confidence}</span></div><div className="h-2 bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full ${insight.confidence >= 80 ? 'bg-emerald-500' : insight.confidence >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${insight.confidence}%` }} /></div></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
