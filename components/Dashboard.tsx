'use client';

import { useState, useMemo } from 'react';
import { FlightRecord, FilterState } from '@/lib/types';
import { applyFilters, computeSummary } from '@/lib/utils';
import KPICards from './KPICards';
import CorrelationHeatmap from './CorrelationHeatmap';
import ScatterPlot from './ScatterPlot';
import AnomalyTable from './AnomalyTable';
import TailTrend from './TailTrend';
import NGvsMAX from './NGvsMAX';
import Filters from './Filters';
import { Plane, RotateCcw, AlertTriangle, BarChart3, GitCompareArrows, Activity, Table2, TrendingUp } from 'lucide-react';

interface Props {
  data: FlightRecord[];
  onReset: () => void;
}

type TabKey = 'overview' | 'correlation' | 'scatter' | 'anomalies' | 'trends' | 'ngmax';

export default function Dashboard({ data, onReset }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [filters, setFilters] = useState<FilterState>({
    dateRange: null,
    tails: [],
    aircraftType: 'ALL',
    anomalyLevel: 'ALL',
    airport: '',
  });

  const filteredData = useMemo(() => applyFilters(data, filters), [data, filters]);
  const summary = useMemo(() => computeSummary(filteredData), [filteredData]);

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Genel Bakış', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'correlation', label: 'Korelasyon', icon: <GitCompareArrows className="w-4 h-4" /> },
    { key: 'scatter', label: 'Scatter Plot', icon: <Activity className="w-4 h-4" /> },
    { key: 'anomalies', label: 'Anomaliler', icon: <AlertTriangle className="w-4 h-4" /> },
    { key: 'trends', label: 'Tail Trend', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'ngmax', label: 'NG vs MAX', icon: <Plane className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Plane className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">B737 Speedbrake Analizi</h1>
              <p className="text-xs text-slate-400">
                {summary.totalFlights} uçuş · {summary.uniqueTails} uçak · {summary.uniqueNGTails} NG · {summary.uniqueMAXTails} MAX
              </p>
            </div>
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Yeni Dosya
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto pb-0">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap
                  ${activeTab === tab.key
                    ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-400'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                  }`}
              >
                {tab.icon}
                {tab.label}
                {tab.key === 'anomalies' && summary.criticalCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                    {summary.criticalCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-[1600px] mx-auto px-4 pt-4">
        <Filters data={data} filters={filters} onFilterChange={setFilters} />
      </div>

      {/* Content */}
      <div className="max-w-[1600px] mx-auto px-4 py-4 animate-fade-in">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <KPICards summary={summary} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CorrelationHeatmap data={filteredData} />
              <ScatterPlot data={filteredData} />
            </div>
            <AnomalyTable data={filteredData} maxRows={10} />
          </div>
        )}
        {activeTab === 'correlation' && <CorrelationHeatmap data={filteredData} fullSize />}
        {activeTab === 'scatter' && <ScatterPlot data={filteredData} fullSize />}
        {activeTab === 'anomalies' && <AnomalyTable data={filteredData} />}
        {activeTab === 'trends' && <TailTrend data={filteredData} />}
        {activeTab === 'ngmax' && <NGvsMAX data={filteredData} />}
      </div>
    </div>
  );
}
