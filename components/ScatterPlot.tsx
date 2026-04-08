'use client';

import { useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Legend } from 'recharts';
import { FlightRecord } from '@/lib/types';
import { numericFields, getFieldLabel } from '@/lib/utils';

interface Props {
  data: FlightRecord[];
  fullSize?: boolean;
}

const PRESETS = [
  { label: 'PFD vs İniş Mesafesi', x: 'pfdTurn1', y: 'landingDist30kn' },
  { label: 'PFD vs Duration', x: 'pfdTurn1', y: 'durationExtTo99' },
  { label: 'PFD Açı vs PFE Açı', x: 'pfdTurn1Deg', y: 'pfeTo99Deg' },
  { label: 'Duration vs İniş Mesafesi', x: 'durationDerivative', y: 'landingDist30kn' },
  { label: 'İniş 30kn vs 50kn', x: 'landingDist30kn', y: 'landingDist50kn' },
  { label: 'GS at SBOP vs İniş Mesafesi', x: 'gsAtAutoSbop', y: 'landingDist30kn' },
];

export default function ScatterPlot({ data, fullSize }: Props) {
  const [xField, setXField] = useState<string>('pfdTurn1');
  const [yField, setYField] = useState<string>('landingDist30kn');
  const [colorBy, setColorBy] = useState<'anomaly' | 'type'>('anomaly');

  const chartData = useMemo(() => {
    return data
      .filter(d => {
        const xv = d[xField as keyof FlightRecord] as number;
        const yv = d[yField as keyof FlightRecord] as number;
        return xv > 0 && yv > 0 && xv < 100000 && yv < 100000;
      })
      .map(d => ({
        x: d[xField as keyof FlightRecord] as number,
        y: d[yField as keyof FlightRecord] as number,
        tail: d.tailNumber,
        date: d.flightDate,
        route: `${d.takeoffAirport}→${d.landingAirport}`,
        anomaly: d.anomalyLevel,
        type: d.aircraftType,
      }));
  }, [data, xField, yField]);

  const normalData = chartData.filter(d => colorBy === 'anomaly' ? d.anomaly === 'normal' : d.type === 'NG');
  const warningData = chartData.filter(d => colorBy === 'anomaly' ? d.anomaly === 'warning' : false);
  const criticalData = chartData.filter(d => colorBy === 'anomaly' ? d.anomaly === 'critical' : d.type === 'MAX');

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-xs shadow-xl">
        <p className="font-bold text-white">{d.tail}</p>
        <p className="text-slate-400">{d.date} · {d.route}</p>
        <p className="text-blue-400 mt-1">{getFieldLabel(xField)}: {d.x.toFixed(2)}</p>
        <p className="text-cyan-400">{getFieldLabel(yField)}: {d.y.toFixed(2)}</p>
        <p className={`mt-1 ${
          d.anomaly === 'critical' ? 'text-red-400' : d.anomaly === 'warning' ? 'text-amber-400' : 'text-emerald-400'
        }`}>
          {d.anomaly === 'critical' ? '🔴 Kritik' : d.anomaly === 'warning' ? '🟡 Uyarı' : '🟢 Normal'}
        </p>
      </div>
    );
  };

  return (
    <div className={`card ${fullSize ? '' : ''}`}>
      <div className="card-header">Scatter Plot Analizi</div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PRESETS.map((p, i) => (
          <button
            key={i}
            onClick={() => { setXField(p.x); setYField(p.y); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              xField === p.x && yField === p.y
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">X:</label>
          <select
            value={xField}
            onChange={e => setXField(e.target.value)}
            className="bg-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 border border-slate-600"
          >
            {numericFields.map(f => (
              <option key={f} value={f}>{getFieldLabel(f)}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Y:</label>
          <select
            value={yField}
            onChange={e => setYField(e.target.value)}
            className="bg-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 border border-slate-600"
          >
            {numericFields.map(f => (
              <option key={f} value={f}>{getFieldLabel(f)}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Renk:</label>
          <select
            value={colorBy}
            onChange={e => setColorBy(e.target.value as any)}
            className="bg-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 border border-slate-600"
          >
            <option value="anomaly">Anomali Seviyesi</option>
            <option value="type">NG / MAX</option>
          </select>
        </div>
      </div>

      <div className={`${fullSize ? 'h-[600px]' : 'h-[350px]'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 40, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="x"
              type="number"
              name={getFieldLabel(xField)}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              label={{ value: getFieldLabel(xField), position: 'bottom', fill: '#94a3b8', fontSize: 11, dy: 20 }}
            />
            <YAxis
              dataKey="y"
              type="number"
              name={getFieldLabel(yField)}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              label={{ value: getFieldLabel(yField), angle: -90, position: 'left', fill: '#94a3b8', fontSize: 11, dx: -10 }}
            />
            <ZAxis range={[30, 80]} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter
              name={colorBy === 'anomaly' ? 'Normal' : 'NG'}
              data={normalData}
              fill={colorBy === 'anomaly' ? '#22c55e' : '#3b82f6'}
              fillOpacity={0.6}
            />
            {colorBy === 'anomaly' && (
              <Scatter
                name="Uyarı"
                data={warningData}
                fill="#f59e0b"
                fillOpacity={0.7}
              />
            )}
            <Scatter
              name={colorBy === 'anomaly' ? 'Kritik' : 'MAX'}
              data={criticalData}
              fill={colorBy === 'anomaly' ? '#ef4444' : '#a855f7'}
              fillOpacity={0.8}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="text-center text-[10px] text-slate-500 mt-2">
        {chartData.length} veri noktası gösteriliyor (aşırı değerler filtrelendi)
      </div>
    </div>
  );
}
