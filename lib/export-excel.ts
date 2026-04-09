// ============================================================
// Excel Export Utility
// Uses xlsx (SheetJS) to generate .xlsx files client-side
// ============================================================
import * as XLSX from 'xlsx';
import { PredictiveInsight, TailHealthScore, FlightRecord } from './types';
import type { FlightTimelineEntry } from './types';

// ----------------------------------------------------------------
// Helper: trigger browser download
// ----------------------------------------------------------------
function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// ----------------------------------------------------------------
// Helper: auto-size columns
// ----------------------------------------------------------------
function autoWidth(ws: XLSX.WorkSheet, data: Record<string, any>[]) {
  if (data.length === 0) return;
  const keys = Object.keys(data[0]);
  const colWidths = keys.map(k => {
    const maxLen = Math.max(
      k.length,
      ...data.map(row => {
        const v = row[k];
        return v == null ? 0 : String(v).length;
      }),
    );
    return { wch: Math.min(maxLen + 2, 50) };
  });
  ws['!cols'] = colWidths;
}

// ================================================================
// Export: Predictive Insights (Tahminsel Bakım)
// ================================================================
export function exportPredictiveInsights(
  insights: PredictiveInsight[],
  healthScores: TailHealthScore[],
) {
  const healthMap = new Map<string, TailHealthScore>();
  healthScores.forEach(h => healthMap.set(h.tailNumber, h));

  // Sheet 1: All insights
  const insightRows = insights.map(ins => {
    const h = healthMap.get(ins.tailNumber);
    return {
      'Kuyruk No': ins.tailNumber,
      'Uçak Tipi': h?.aircraftType ?? '',
      'Sağlık Skoru': h?.healthScore != null ? Math.round(h.healthScore * 10) / 10 : '',
      'Risk Seviyesi': h?.riskLevel ?? '',
      'Trend': h?.trend === 'improving' ? 'İyileşiyor' : h?.trend === 'degrading' ? 'Kötüleşiyor' : 'Stabil',
      'Seviye': ins.severity === 'critical' ? 'Kritik' : ins.severity === 'warning' ? 'Uyarı' : 'Bilgi',
      'Kategori': ins.category === 'hydraulic' ? 'Hidrolik' : ins.category === 'mechanical' ? 'Mekanik' : ins.category === 'sensor' ? 'Sensör' : ins.category === 'actuator' ? 'Aktüatör' : 'Operasyonel',
      'Başlık': ins.title,
      'Açıklama': ins.description,
      'Güven (%)': ins.confidence,
      'İlgili Uçuş': ins.relatedFlights,
      'Öneri': ins.recommendation,
      'Kanıtlar': ins.evidence.join(' | '),
    };
  });

  // Sheet 2: Health scores summary
  const healthRows = healthScores
    .sort((a, b) => a.healthScore - b.healthScore)
    .map(h => ({
      'Kuyruk No': h.tailNumber,
      'Uçak Tipi': h.aircraftType,
      'Sağlık Skoru': Math.round(h.healthScore * 10) / 10,
      'Risk Seviyesi': h.riskLevel,
      'Trend': h.trend === 'improving' ? 'İyileşiyor' : h.trend === 'degrading' ? 'Kötüleşiyor' : 'Stabil',
      'Toplam Uçuş': h.totalFlights,
      'Kritik Uçuş': h.criticalCount,
      'Uyarılı Uçuş': h.warningCount,
      'Ort. PFD (%)': Math.round(h.avgPfd * 10) / 10,
      'Ort. Açı (°)': Math.round(h.avgDeg * 10) / 10,
      'Süre Oranı': Math.round(h.durationRatioAvg * 100) / 100,
      'İniş Anomali (%)': Math.round(h.landingDistAnomalyRate * 1000) / 10,
      'Degradasyon': Math.round(h.degradationRate * 100) / 100,
      'Son Uçuş': h.lastFlightDate,
    }));

  // Sheet 3: Sadece Kritik & Uyarı
  const alertRows = insightRows.filter(r => r['Seviye'] === 'Kritik' || r['Seviye'] === 'Uyarı');

  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.json_to_sheet(insightRows);
  autoWidth(ws1, insightRows);
  XLSX.utils.book_append_sheet(wb, ws1, 'Tüm Bulgular');

  const ws2 = XLSX.utils.json_to_sheet(alertRows);
  autoWidth(ws2, alertRows);
  XLSX.utils.book_append_sheet(wb, ws2, 'Kritik & Uyarı');

  const ws3 = XLSX.utils.json_to_sheet(healthRows);
  autoWidth(ws3, healthRows);
  XLSX.utils.book_append_sheet(wb, ws3, 'Uçak Sağlık Skorları');

  const now = new Date().toISOString().split('T')[0];
  downloadWorkbook(wb, `tahminsel-bakim-${now}.xlsx`);
}

// ================================================================
// Export: Flight Timeline (Zaman Çizelgesi)
// ================================================================
export function exportFlightTimeline(
  timeline: FlightTimelineEntry[],
  filterLabel?: string,
) {
  const rows = timeline.map(t => ({
    'Tarih': t.date,
    'Kuyruk No': t.tailNumber,
    'Rota': t.route,
    'PFD (%)': Math.round(t.pfd * 10) / 10,
    'Açı (°)': Math.round(t.deg * 10) / 10,
    'Süre Oranı': t.durationRatio > 0 ? Math.round(t.durationRatio * 100) / 100 : '',
    'İniş 30kn (m)': t.landingDist30 > 0 ? Math.round(t.landingDist30) : '',
    'İniş 50kn (m)': t.landingDist50 > 0 ? Math.round(t.landingDist50) : '',
    'GS@SBOP': t.gsAtSbop > 0 ? Math.round(t.gsAtSbop) : '',
    'Seviye': t.anomalyLevel === 'critical' ? 'Kritik' : t.anomalyLevel === 'warning' ? 'Uyarı' : 'Normal',
    'Anomali Sebepleri': t.reasons.join(' | '),
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  autoWidth(ws, rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Zaman Çizelgesi');

  // Summary sheet
  const total = timeline.length;
  const critCount = timeline.filter(t => t.anomalyLevel === 'critical').length;
  const warnCount = timeline.filter(t => t.anomalyLevel === 'warning').length;
  const normCount = timeline.filter(t => t.anomalyLevel === 'normal').length;
  const pfdVals = timeline.filter(t => t.pfd > 0 && t.pfd <= 105);
  const avgPfd = pfdVals.length > 0 ? pfdVals.reduce((s, t) => s + t.pfd, 0) / pfdVals.length : 0;
  const uniqueTails = new Set(timeline.map(t => t.tailNumber)).size;
  const uniqueDates = new Set(timeline.map(t => t.date)).size;

  const summaryRows = [
    { 'Metrik': 'Toplam Uçuş', 'Değer': total },
    { 'Metrik': 'Farklı Uçak', 'Değer': uniqueTails },
    { 'Metrik': 'Farklı Gün', 'Değer': uniqueDates },
    { 'Metrik': 'Kritik Uçuş', 'Değer': critCount },
    { 'Metrik': 'Uyarılı Uçuş', 'Değer': warnCount },
    { 'Metrik': 'Normal Uçuş', 'Değer': normCount },
    { 'Metrik': 'Ort. PFD (%)', 'Değer': Math.round(avgPfd * 10) / 10 },
    { 'Metrik': 'Filtre', 'Değer': filterLabel || 'Yok' },
  ];

  const ws2 = XLSX.utils.json_to_sheet(summaryRows);
  autoWidth(ws2, summaryRows);
  XLSX.utils.book_append_sheet(wb, ws2, 'Özet');

  const now = new Date().toISOString().split('T')[0];
  downloadWorkbook(wb, `zaman-cizelgesi-${now}.xlsx`);
}
