'use client';

import { useState, useMemo } from 'react';
import { FlightRecord, FilterState } from '@/lib/types';
import { applyFilters, computeSummary } from '@/lib/utils';
import { computeTailHealthScores, generatePredictiveInsights } from '@/lib/analytics';
import KPICards from './KPICards';
import CorrelationHeatmap from './CorrelationHeatmap';
import ScatterPlot from './ScatterPlot';
import AnomalyTable from './AnomalyTable';
import TailTrend from './TailTrend';
import NGvsMAX from './NGvsMAX';
import PredictiveInsights from './PredictiveInsights';
import LandingDistanceAnalysisView from './LandingDistanceAnalysis';
import TailHealthMatrix from './TailHealthMatrix';
import FlightTimeline from './FlightTimeline';
import Filters from './Filters';
import { Plane, RotateCcw, AlertTriangle, BarChart3, GitCompareArrows, Activity, TrendingUp, Brain, Ruler, Heart, Clock } from 'lucide-react';

interface Props {
  data: FlightRecord[];
  onReset: () => void;
}

type TabKey = 'overview' | 'correlation' | 'scatter' | 'anomalies' | 'trends' | 'ngmax' | 'predictive' | 'landing' | 'health' | 'timeline';

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
  const healthScores = useMemo(() => computeTailHealthScores(filteredData), [filteredData]);
  const insights = useMemo(() => generatePredictiveInsights(filteredData, healthScores), [filteredData, healthScores]);

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'overview', label: 'Genel Bakış', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'predictive', label: 'Tahminsel Bakım', icon: <Brain className="w-4 h-4" />, badge: insights.filter(i => i.severity === 'critical').length },
    { key: 'health', label: 'Uçak Sağlığı', icon: <Heart className="w-4 h-4" /> },
    { key: 'correlation', label: 'Korelasyon', icon: <GitCompareArrows className="w-4 h-4" /> },
    { key: 'scatter', label: 'Scatter Plot', icon: <Activity className="w-4 h-4" /> },
    { key: 'anomalies', label: 'Anomaliler', icon: <AlertTriangle className="w-4 h-4" />, badge: summary.criticalCount },
    { key: 'landing', label: 'İniş Mesafesi', icon: <Ruler className="w-4 h-4" /> },
    { key: 'trends', label: 'Tail Trend', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'timeline', label: 'Zaman Çizelgesi', icon: <Clock className="w-4 h-4" /> },
    { key: 'ngmax', label: 'NG vs MAX', icon: <Plane className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-[1800px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Plane className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">B737 Speedbrake Predictive Maintenance</h1>
              <p className="text-xs text-slate-400">
                {summary.totalFlights} uçuş · {summary.uniqueTails} uçak · {summary.criticalCount} kritik · {insights.length} insight
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
        <div className="max-w-[1800px] mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto pb-0 scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-t-lg transition-all whitespace-nowrap
                  ${activeTab === tab.key
                    ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-400'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                  }`}
              >
                {tab.icon}
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded-full font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-[1800px] mx-auto px-4 pt-4">
        <Filters data={data} filters={filters} onFilterChange={setFilters} />
      </div>

      {/* Content */}
      <div className="max-w-[1800px] mx-auto px-4 py-4 animate-fade-in">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <KPICards summary={summary} />
            {/* Quick insights banner */}
            {insights.filter(i => i.severity === 'critical').length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-bold text-red-400">Kritik Tahminsel Bakım Uyarıları</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {insights.filter(i => i.severity === 'critical').slice(0, 6).map(insight => (
                    <div key={insight.id} className="bg-red-500/5 rounded-lg p-2.5 border border-red-500/10">
                      <div className="text-xs font-medium text-red-300">{insight.title}</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {insight.category.toUpperCase()} · %{insight.confidence} güven · {insight.relatedFlights} uçuş
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CorrelationHeatmap data={filteredData} />
              <ScatterPlot data={filteredData} />
            </div>
            <AnomalyTable data={filteredData} maxRows={10} />
          </div>
        )}
        {activeTab === 'predictive' && <PredictiveInsights insights={insights} data={filteredData} healthScores={healthScores} />}
        {activeTab === 'health' && <TailHealthMatrix healthScores={healthScores} data={filteredData} />}
        {activeTab === 'correlation' && <CorrelationHeatmap data={filteredData} fullSize />}
        {activeTab === 'scatter' && <ScatterPlot data={filteredData} fullSize />}
        {activeTab === 'anomalies' && <AnomalyTable data={filteredData} />}
        {activeTab === 'landing' && <LandingDistanceAnalysisView data={filteredData} />}
        {activeTab === 'trends' && <TailTrend data={filteredData} />}
        {activeTab === 'timeline' && <FlightTimeline data={filteredData} />}
        {activeTab === 'ngmax' && <NGvsMAX data={filteredData} />}
      </div>
    </div>
  );
}
