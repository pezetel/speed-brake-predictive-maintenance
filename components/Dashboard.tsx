'use client';

import { useState, useMemo } from 'react';
import { TabType } from '@/lib/types';
import { computeAircraftHealth, detectAnomalies, getAllFlights, getUniqueTails } from '@/lib/data';
import FleetOverview from './FleetOverview';
import AircraftDetail from './AircraftDetail';
import AnomalyDetection from './AnomalyDetection';
import DataTable from './DataTable';
import { Plane, Activity, AlertTriangle, Database, Shield, ChevronRight } from 'lucide-react';

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Filo Genel Bakış', icon: <Plane size={18} /> },
  { id: 'aircraft', label: 'Uçak Detay', icon: <Activity size={18} /> },
  { id: 'anomalies', label: 'Anomali Tespiti', icon: <AlertTriangle size={18} /> },
  { id: 'data', label: 'Ham Veri', icon: <Database size={18} /> },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedTail, setSelectedTail] = useState<string>('');

  const healthData = useMemo(() => computeAircraftHealth(), []);
  const anomalies = useMemo(() => detectAnomalies(), []);
  const flights = useMemo(() => getAllFlights(), []);
  const tails = useMemo(() => getUniqueTails(), []);

  const criticalCount = healthData.filter(h => h.riskLevel === 'CRITICAL').length;
  const highCount = healthData.filter(h => h.riskLevel === 'HIGH').length;
  const totalAnomalies = anomalies.length;
  const criticalAnomalies = anomalies.filter(a => a.severity === 'CRITICAL').length;

  const handleAircraftClick = (tail: string) => {
    setSelectedTail(tail);
    setActiveTab('aircraft');
  };

  return (
    <div className="min-h-screen bg-sb-dark">
      {/* Header */}
      <header className="border-b border-sb-border bg-sb-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Shield size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">B737 Speedbrake</h1>
                <p className="text-xs text-slate-400">Predictive Maintenance Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sb-dark/50">
                  <span className="text-slate-400">Filo:</span>
                  <span className="font-semibold text-white">{tails.length} uçak</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sb-dark/50">
                  <span className="text-slate-400">Uçuş:</span>
                  <span className="font-semibold text-white">{flights.length}</span>
                </div>
                {criticalCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 animate-pulse-slow">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span className="font-semibold text-red-400">{criticalCount} Kritik</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-500">Veri: 8 Nisan 2025</div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="border-b border-sb-border bg-sb-card/30">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-thin py-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-sb-accent text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-sb-card'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.id === 'anomalies' && totalAnomalies > 0 && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                    criticalAnomalies > 0 ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'
                  }`}>
                    {totalAnomalies}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 py-6 animate-fade-in">
        {activeTab === 'overview' && (
          <FleetOverview
            healthData={healthData}
            flights={flights}
            onAircraftClick={handleAircraftClick}
          />
        )}
        {activeTab === 'aircraft' && (
          <AircraftDetail
            healthData={healthData}
            selectedTail={selectedTail}
            onTailChange={setSelectedTail}
            tails={tails}
          />
        )}
        {activeTab === 'anomalies' && (
          <AnomalyDetection
            anomalies={anomalies}
            healthData={healthData}
            onAircraftClick={handleAircraftClick}
          />
        )}
        {activeTab === 'data' && (
          <DataTable flights={flights} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-sb-border py-4 mt-8">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-2">
              <span>B737 NG/MAX Speedbrake Predictive Maintenance System</span>
              <ChevronRight size={12} />
              <span>Parametre Analizi &amp; Anomali Tespiti</span>
            </div>
            <div>Veriler DFDR/QAR kaynaklıdır • {flights.length} uçuş • {tails.length} uçak analiz edildi</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
