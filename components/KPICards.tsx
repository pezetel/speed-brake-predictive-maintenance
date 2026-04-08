'use client';

import { AnomalySummary } from '@/lib/types';
import { Plane, AlertTriangle, AlertCircle, CheckCircle, Activity } from 'lucide-react';

interface Props {
  summary: AnomalySummary;
}

export default function KPICards({ summary }: Props) {
  const cards = [
    {
      title: 'Toplam Uçuş',
      value: summary.totalFlights.toLocaleString(),
      icon: <Plane className="w-5 h-5" />,
      color: 'blue',
      sub: `${summary.uniqueTails} uçak`,
    },
    {
      title: 'Kritik Anomali',
      value: summary.criticalCount.toLocaleString(),
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'red',
      sub: `${summary.problematicTails.length} uçak`,
      glow: summary.criticalCount > 0,
    },
    {
      title: 'Uyarı',
      value: summary.warningCount.toLocaleString(),
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'amber',
      sub: `${((summary.warningCount / Math.max(summary.totalFlights, 1)) * 100).toFixed(1)}%`,
    },
    {
      title: 'Normal',
      value: summary.normalCount.toLocaleString(),
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'emerald',
      sub: `${((summary.normalCount / Math.max(summary.totalFlights, 1)) * 100).toFixed(1)}%`,
    },
    {
      title: 'Ort. PFD',
      value: summary.avgPFD.toFixed(1),
      icon: <Activity className="w-5 h-5" />,
      color: summary.avgPFD >= 99 ? 'emerald' : summary.avgPFD >= 95 ? 'amber' : 'red',
      sub: summary.avgPFD >= 99 ? 'Normal' : 'Dikkat',
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
    blue: { bg: 'bg-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-400', iconBg: 'bg-blue-500/20' },
    red: { bg: 'bg-red-500/5', border: 'border-red-500/20', text: 'text-red-400', iconBg: 'bg-red-500/20' },
    amber: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-400', iconBg: 'bg-amber-500/20' },
    emerald: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400', iconBg: 'bg-emerald-500/20' },
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card, i) => {
        const cm = colorMap[card.color] || colorMap.blue;
        return (
          <div
            key={i}
            className={`${cm.bg} border ${cm.border} rounded-xl p-4 transition-all hover:scale-[1.02] ${card.glow ? 'glow-red' : ''}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{card.title}</span>
              <div className={`p-1.5 ${cm.iconBg} rounded-lg ${cm.text}`}>{card.icon}</div>
            </div>
            <div className={`text-2xl font-bold ${cm.text}`}>{card.value}</div>
            <div className="text-xs text-slate-500 mt-1">{card.sub}</div>
          </div>
        );
      })}
    </div>
  );
}
