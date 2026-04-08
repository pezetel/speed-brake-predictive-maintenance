'use client';

import { AircraftHealth, FlightRecord } from '@/lib/types';
import { getAircraftType, getFieldDescriptions } from '@/lib/data';
import SpeedbrakeHealthChart from './charts/SpeedbrakeHealthChart';
import LandingDistanceChart from './charts/LandingDistanceChart';
import AircraftComparisonRadar from './charts/AircraftComparisonRadar';
import {
  Plane, AlertTriangle, CheckCircle, Info,
  TrendingUp, Timer, Ruler, Gauge
} from 'lucide-react';

interface Props {
  healthData: AircraftHealth[];
  flights: FlightRecord[];
  onAircraftClick: (tail: string) => void;
}

export default function FleetOverview({ healthData, flights, onAircraftClick }: Props) {
  const ngAircraft = healthData.filter(h => h.aircraftType === 'NG');
  const maxAircraft = healthData.filter(h => h.aircraftType === 'MAX');
  const descriptions = getFieldDescriptions();

  const avgHealthNG = ngAircraft.length > 0
    ? ngAircraft.reduce((s, h) => s + h.healthScore, 0) / ngAircraft.length
    : 0;
  const avgHealthMAX = maxAircraft.length > 0
    ? maxAircraft.reduce((s, h) => s + h.healthScore, 0) / maxAircraft.length
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-sb-success';
    if (score >= 70) return 'text-sb-warn';
    if (score >= 50) return 'text-orange-500';
    return 'text-sb-danger';
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-sb-success/10 border-sb-success/30';
    if (score >= 70) return 'bg-sb-warn/10 border-sb-warn/30';
    if (score >= 50) return 'bg-orange-500/10 border-orange-500/30';
    return 'bg-sb-danger/10 border-sb-danger/30';
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return '';
    }
  };

  const riskLabel: Record<string, string> = {
    LOW: 'Düşük',
    MEDIUM: 'Orta',
    HIGH: 'Yüksek',
    CRITICAL: 'Kritik',
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5 glow-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">737 NG Filo Sağlığı</p>
              <p className={`text-3xl font-bold mt-1 ${getScoreColor(avgHealthNG)}`}>
                {avgHealthNG.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500 mt-1">{ngAircraft.length} uçak</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Plane size={24} className="text-blue-400" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 glow-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">737 MAX Filo Sağlığı</p>
              <p className={`text-3xl font-bold mt-1 ${getScoreColor(avgHealthMAX)}`}>
                {avgHealthMAX.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500 mt-1">{maxAircraft.length} uçak</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Plane size={24} className="text-cyan-400" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 glow-yellow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Toplam Anomali</p>
              <p className="text-3xl font-bold mt-1 text-sb-warn">
                {healthData.reduce((s, h) => s + h.anomalies.length, 0)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {healthData.reduce((s, h) => s + h.anomalies.filter(a => a.severity === 'CRITICAL').length, 0)} kritik
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <AlertTriangle size={24} className="text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 glow-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Toplam Uçuş</p>
              <p className="text-3xl font-bold mt-1 text-sb-success">
                {flights.length}
              </p>
              <p className="text-xs text-slate-500 mt-1">8 Nisan 2025</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle size={24} className="text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Parameter Descriptions */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info size={18} className="text-sb-info" />
          <h3 className="font-semibold text-white">Parametre Açıklamaları</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {Object.entries(descriptions).map(([key, desc]) => (
            <div key={key} className="bg-sb-dark/50 rounded-lg p-3">
              <p className="text-xs font-semibold text-sb-info mb-1">{key}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Gauge size={18} className="text-sb-accent" />
            Speedbrake Sağlık Skoru
          </h3>
          <SpeedbrakeHealthChart healthData={healthData} />
        </div>
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Ruler size={18} className="text-sb-accent" />
            İniş Mesafesi Karşılaştırması
          </h3>
          <LandingDistanceChart healthData={healthData} />
        </div>
      </div>

      {/* Radar Comparison */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-sb-accent" />
          NG vs MAX Parametre Karşılaştırması
        </h3>
        <AircraftComparisonRadar healthData={healthData} />
      </div>

      {/* Aircraft Grid */}
      <div>
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Plane size={18} className="text-sb-accent" />
          Uçak Bazlı Durum ({healthData.length} uçak)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {healthData
            .sort((a, b) => a.healthScore - b.healthScore)
            .map(ac => (
              <button
                key={ac.tailNumber}
                onClick={() => onAircraftClick(ac.tailNumber)}
                className={`glass-card rounded-xl p-4 text-left transition-all hover:scale-[1.02] hover:shadow-lg ${
                  ac.riskLevel === 'CRITICAL' ? 'glow-red border-red-500/30' :
                  ac.riskLevel === 'HIGH' ? 'glow-yellow border-orange-500/30' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{ac.tailNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      ac.aircraftType === 'MAX' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {ac.aircraftType}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getRiskBadge(ac.riskLevel)}`}>
                    {riskLabel[ac.riskLevel]}
                  </span>
                </div>

                {/* Health bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Sağlık Skoru</span>
                    <span className={`font-bold ${getScoreColor(ac.healthScore)}`}>
                      {ac.healthScore}%
                    </span>
                  </div>
                  <div className="h-2 bg-sb-dark rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        ac.healthScore >= 85 ? 'bg-sb-success' :
                        ac.healthScore >= 70 ? 'bg-sb-warn' :
                        ac.healthScore >= 50 ? 'bg-orange-500' : 'bg-sb-danger'
                      }`}
                      style={{ width: `${ac.healthScore}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-sb-dark/50 rounded p-2">
                    <span className="text-slate-500">Uçuş</span>
                    <p className="font-semibold text-white">{ac.totalFlights}</p>
                  </div>
                  <div className="bg-sb-dark/50 rounded p-2">
                    <span className="text-slate-500">PFD</span>
                    <p className="font-semibold text-white">{ac.avgPfdTurn1.toFixed(1)}%</p>
                  </div>
                  <div className="bg-sb-dark/50 rounded p-2">
                    <span className="text-slate-500">Açılma</span>
                    <p className="font-semibold text-white">{ac.avgDurationDerivative.toFixed(2)}s</p>
                  </div>
                  <div className="bg-sb-dark/50 rounded p-2">
                    <span className="text-slate-500">Anomali</span>
                    <p className={`font-semibold ${ac.anomalies.length > 0 ? 'text-sb-warn' : 'text-sb-success'}`}>
                      {ac.anomalies.length}
                    </p>
                  </div>
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
