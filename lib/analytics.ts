// ============================================================
// B737 Speedbrake Predictive Maintenance — Analytics engine
// ============================================================
import {
  FlightRecord,
  TailHealthScore,
  PredictiveInsight,
  LandingDistanceAnalysisRecord,
  FlightTimelineEntry,
} from './types';

// ----------------------------------------------------------------
// Tail‑level health scoring
// ----------------------------------------------------------------
export function computeTailHealthScores(data: FlightRecord[]): TailHealthScore[] {
  const tailMap = new Map<string, FlightRecord[]>();
  data.forEach((d) => {
    if (!tailMap.has(d.tailNumber)) tailMap.set(d.tailNumber, []);
    tailMap.get(d.tailNumber)!.push(d);
  });

  const scores: TailHealthScore[] = [];

  tailMap.forEach((flights, tailNumber) => {
    const sorted = [...flights].sort((a, b) => a.flightDate.localeCompare(b.flightDate));
    const aircraftType = flights[0].aircraftType;
    const totalFlights = flights.length;

    const avg = (fn: (f: FlightRecord) => number, lo = 0, hi = 999999) => {
      const v = flights.filter((f) => fn(f) > lo && fn(f) < hi);
      return v.length > 0 ? v.reduce((s, f) => s + fn(f), 0) / v.length : 0;
    };

    const avgPfd = avg((f) => f.normalizedPfd, 0, 105);
    const avgDeg = avg((f) => f.pfdTurn1Deg, 0, 100);
    const avgDurationDeriv = avg((f) => f.durationDerivative, 0);
    const avgDurationExt = avg((f) => f.durationExtTo99, 0);
    const avgLanding30 = avg((f) => f.landingDist30kn, 0);
    const avgLanding50 = avg((f) => f.landingDist50kn, 0);
    const criticalCount = flights.filter((f) => f.anomalyLevel === 'critical').length;
    const warningCount = flights.filter((f) => f.anomalyLevel === 'warning').length;
    const durationRatioAvg = avg((f) => f.durationRatio, 0, 50);
    const landingDistAnomalyRate = flights.filter((f) => f.landingDistAnomaly).length / Math.max(totalFlights, 1);

    // Health score 0–100
    let hs = 100;
    if (avgPfd < 95) hs -= (95 - avgPfd) * 1.5;
    if (avgPfd < 80) hs -= (80 - avgPfd) * 2;
    hs -= criticalCount * 5;
    hs -= warningCount * 2;
    if (durationRatioAvg > 2) hs -= (durationRatioAvg - 2) * 5;
    hs -= landingDistAnomalyRate * 20;
    if (avgDeg < 40) hs -= (40 - avgDeg) * 0.5;
    hs = Math.max(0, Math.min(100, hs));

    let riskLevel: TailHealthScore['riskLevel'] = 'LOW';
    if (hs < 50) riskLevel = 'CRITICAL';
    else if (hs < 70) riskLevel = 'HIGH';
    else if (hs < 85) riskLevel = 'MEDIUM';

    // Trend: compare first half vs second half average PFD
    const mid = Math.floor(sorted.length / 2) || 1;
    const firstAvg = avg.call(null, (f: FlightRecord) => f.normalizedPfd, 0, 105); // approximate
    const firstPfd = sorted.slice(0, mid).filter((f) => f.normalizedPfd > 0 && f.normalizedPfd <= 105);
    const secondPfd = sorted.slice(mid).filter((f) => f.normalizedPfd > 0 && f.normalizedPfd <= 105);
    const fp = firstPfd.length > 0 ? firstPfd.reduce((s, f) => s + f.normalizedPfd, 0) / firstPfd.length : 0;
    const sp = secondPfd.length > 0 ? secondPfd.reduce((s, f) => s + f.normalizedPfd, 0) / secondPfd.length : 0;
    const degradationRate = fp - sp;
    let trend: TailHealthScore['trend'] = 'stable';
    if (degradationRate > 3) trend = 'degrading';
    else if (degradationRate < -3) trend = 'improving';

    scores.push({
      tailNumber,
      aircraftType,
      totalFlights,
      avgPfd,
      avgDeg,
      avgDurationDeriv,
      avgDurationExt,
      avgLanding30,
      avgLanding50,
      criticalCount,
      warningCount,
      healthScore: Math.round(hs * 10) / 10,
      riskLevel,
      trend,
      durationRatioAvg,
      landingDistAnomalyRate,
      lastFlightDate: sorted[sorted.length - 1]?.flightDate || '',
      degradationRate,
    });
  });

  return scores.sort((a, b) => a.healthScore - b.healthScore);
}

// ----------------------------------------------------------------
// Predictive insights generation
// ----------------------------------------------------------------
export function generatePredictiveInsights(
  data: FlightRecord[],
  healthScores: TailHealthScore[],
): PredictiveInsight[] {
  const insights: PredictiveInsight[] = [];
  let id = 0;

  for (const h of healthScores) {
    const flights = data.filter((d) => d.tailNumber === h.tailNumber);

    // 1. Hydraulic resistance: persistently high duration ratio
    const hiRatio = flights.filter((f) => f.durationRatio > 3);
    if (hiRatio.length >= 2) {
      insights.push({
        id: `ins-${++id}`,
        tailNumber: h.tailNumber,
        category: 'hydraulic',
        severity: hiRatio.length >= 4 ? 'critical' : 'warning',
        title: `Hidrolik Direnç Şüphesi — ${h.tailNumber}`,
        description: `Speedbrake %99'a ulaşma süresi, türev süresinin ${h.durationRatioAvg.toFixed(1)}x katı. Hidrolik sistemde artan direnç veya basınç düşüşü.`,
        evidence: hiRatio.slice(0, 5).map(
          (f) =>
            `${f.flightDate} ${f.takeoffAirport}→${f.landingAirport}: Ratio ${f.durationRatio.toFixed(1)}x (${f.durationExtTo99.toFixed(1)}s / ${f.durationDerivative.toFixed(1)}s)`,
        ),
        recommendation:
          'Hidrolik aktuatör basıncını kontrol edin. Hidrolik sıvı seviyesi ve kalitesini test edin. PCU (Power Control Unit) muayenesi önerilir.',
        relatedFlights: hiRatio.length,
        confidence: Math.min(95, 60 + hiRatio.length * 8),
      });
    }

    // 2. Mechanical failure: very low PFD + low DEG
    const mechFail = flights.filter((f) => f.normalizedPfd < 75 && f.pfdTurn1Deg < 30);
    if (mechFail.length >= 1) {
      insights.push({
        id: `ins-${++id}`,
        tailNumber: h.tailNumber,
        category: 'mechanical',
        severity: mechFail.length >= 2 ? 'critical' : 'warning',
        title: `Mekanik Arıza Tespiti — ${h.tailNumber}`,
        description: `Speedbrake fiziksel olarak tam açılamıyor. PFD ${mechFail[0].normalizedPfd.toFixed(1)}%, açı sadece ${mechFail[0].pfdTurn1Deg.toFixed(1)}°.`,
        evidence: mechFail.slice(0, 5).map(
          (f) =>
            `${f.flightDate} ${f.takeoffAirport}→${f.landingAirport}: PFD=${f.pfdTurn1.toFixed(1)}, DEG=${f.pfdTurn1Deg.toFixed(1)}°`,
        ),
        recommendation:
          `Speedbrake mekanik bağlantılarını, rulmanları ve actuator linkage'ı kontrol edin. Fiziksel engel/hasar muayenesi yapın.`,
        relatedFlights: mechFail.length,
        confidence: Math.min(95, 70 + mechFail.length * 10),
      });
    }

    // 3. Slow/delayed opening: PFD_DEG << PFE_TO_99_DEG
    const slow = flights.filter((f) => f.pfeTo99Deg - f.pfdTurn1Deg > 8 && f.normalizedPfd < 90);
    if (slow.length >= 2) {
      insights.push({
        id: `ins-${++id}`,
        tailNumber: h.tailNumber,
        category: 'actuator',
        severity: 'warning',
        title: `Yavaş / Gecikmeli Açılma — ${h.tailNumber}`,
        description: `Speedbrake başlangıçta eksik açılıyor, zamanla %99'a ulaşıyor. Başlangıç açısı ve son açı arasındaki fark sürekli yüksek.`,
        evidence: slow.slice(0, 5).map(
          (f) =>
            `${f.flightDate}: ${f.pfdTurn1Deg.toFixed(1)}° → ${f.pfeTo99Deg.toFixed(1)}° (Δ${(f.pfeTo99Deg - f.pfdTurn1Deg).toFixed(1)}°)`,
        ),
        recommendation:
          'Actuator hız ayarını kontrol edin. Speedbrake hinge noktalarında sürtünme olup olmadığını inceleyin.',
        relatedFlights: slow.length,
        confidence: Math.min(90, 55 + slow.length * 7),
      });
    }

    // 4. Landing‑distance anomaly
    const ldAnom = flights.filter((f) => f.landingDistAnomaly);
    if (ldAnom.length >= 2) {
      insights.push({
        id: `ins-${++id}`,
        tailNumber: h.tailNumber,
        category: 'operational',
        severity: ldAnom.length >= 4 ? 'critical' : 'warning',
        title: `İniş Mesafesi Anomalisi — ${h.tailNumber}`,
        description: `${ldAnom.length} uçuşta 50kn iniş mesafesi > 30kn iniş mesafesi. Fiziksel olarak anormal — sensör veya fren sistemi sorunu olabilir.`,
        evidence: ldAnom.slice(0, 5).map(
          (f) =>
            `${f.flightDate} ${f.takeoffAirport}→${f.landingAirport}: 30kn=${f.landingDist30kn.toFixed(0)}m, 50kn=${f.landingDist50kn.toFixed(0)}m`,
        ),
        recommendation:
          'Wheel speed sensörlerini kalibre edin. Fren sistemi performansını test edin. Landing distance hesaplama algoritmasını doğrulayın.',
        relatedFlights: ldAnom.length,
        confidence: Math.min(90, 65 + ldAnom.length * 5),
      });
    }

    // 5. Performance degradation trend
    if (h.trend === 'degrading' && h.degradationRate > 5) {
      insights.push({
        id: `ins-${++id}`,
        tailNumber: h.tailNumber,
        category: 'sensor',
        severity: h.degradationRate > 10 ? 'critical' : 'warning',
        title: `Performans Degradasyonu — ${h.tailNumber}`,
        description: `Son uçuşlarda PFD değeri ortalama ${h.degradationRate.toFixed(1)} puan düşmüş. Speedbrake performansı kötüleşiyor.`,
        evidence: [
          `İlk yarı ort. PFD: ${(h.avgPfd + h.degradationRate / 2).toFixed(1)}`,
          `İkinci yarı ort. PFD: ${(h.avgPfd - h.degradationRate / 2).toFixed(1)}`,
          `Degradasyon hızı: ${h.degradationRate.toFixed(1)} puan`,
          `Son uçuş: ${h.lastFlightDate}`,
        ],
        recommendation:
          'Speedbrake sisteminin tüm bileşenlerini kapsamlı şekilde inceleyin. Preventif bakım zamanlaması öne alınmalıdır.',
        relatedFlights: h.totalFlights,
        confidence: Math.min(85, 50 + h.degradationRate * 3),
      });
    }
  }

  return insights.sort((a, b) => {
    const sev = { critical: 0, warning: 1, info: 2 };
    return (sev[a.severity] ?? 2) - (sev[b.severity] ?? 2) || b.confidence - a.confidence;
  });
}

// ----------------------------------------------------------------
// Landing‑distance analysis rows
// ----------------------------------------------------------------
export function analyzeLandingDistances(data: FlightRecord[]): LandingDistanceAnalysisRecord[] {
  return data
    .filter((d) => d.landingDist30kn > 0 && d.landingDist50kn > 0)
    .map((d) => {
      let anomalyType: LandingDistanceAnalysisRecord['anomalyType'] = 'normal';
      let risk = 0;

      if (d.landingDist50kn > d.landingDist30kn * 1.05) {
        anomalyType = '50kn_exceeds_30kn';
        risk += 40;
      }
      if (d.landingDist30kn > 2000) {
        if (anomalyType === 'normal') anomalyType = 'excessive_distance';
        risk += 20;
      }
      if (d.normalizedPfd < 85 && d.landingDist30kn > 1800) {
        if (anomalyType === 'normal') anomalyType = 'pfd_correlation';
        risk += 30;
      }
      if (d.normalizedPfd < 70) risk += 20;
      if (d.durationRatio > 3) risk += 10;

      return {
        tailNumber: d.tailNumber,
        route: `${d.takeoffAirport}→${d.landingAirport}`,
        date: d.flightDate,
        dist30kn: d.landingDist30kn,
        dist50kn: d.landingDist50kn,
        pfd: d.normalizedPfd,
        deg: d.pfdTurn1Deg,
        anomalyType,
        riskScore: Math.min(100, risk),
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);
}

// ----------------------------------------------------------------
// Flight timeline entries
// ----------------------------------------------------------------
export function buildFlightTimeline(data: FlightRecord[]): FlightTimelineEntry[] {
  return data
    .sort((a, b) => a.flightDate.localeCompare(b.flightDate) || a.tailNumber.localeCompare(b.tailNumber))
    .map((d) => ({
      date: d.flightDate,
      tailNumber: d.tailNumber,
      route: `${d.takeoffAirport}→${d.landingAirport}`,
      pfd: d.normalizedPfd,
      deg: d.pfdTurn1Deg,
      durationRatio: d.durationRatio,
      anomalyLevel: d.anomalyLevel,
      reasons: d.anomalyReasons,
      landingDist30: d.landingDist30kn,
      landingDist50: d.landingDist50kn,
      gsAtSbop: d.gsAtAutoSbop,
    }));
}
