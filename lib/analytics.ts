import { FlightRecord, TailHealthScore, PredictiveInsight, LandingDistanceAnalysisRecord, FlightTimelineEntry } from './types';

export function computeTailHealthScores(data: FlightRecord[]): TailHealthScore[] {
  const tailMap = new Map<string, FlightRecord[]>();
  data.forEach(d => {
    if (!tailMap.has(d.tailNumber)) tailMap.set(d.tailNumber, []);
    tailMap.get(d.tailNumber)!.push(d);
  });

  const scores: TailHealthScore[] = [];

  tailMap.forEach((flights, tailNumber) => {
    const sorted = [...flights].sort((a, b) => a.flightDate.localeCompare(b.flightDate));
    const aircraftType = flights[0].aircraftType;
    const totalFlights = flights.length;

    const validPfd = flights.filter(f => f.normalizedPfd > 0 && f.normalizedPfd <= 105);
    const avgPfd = validPfd.length > 0 ? validPfd.reduce((s, f) => s + f.normalizedPfd, 0) / validPfd.length : 0;

    const validDeg = flights.filter(f => f.pfdTurn1Deg > 0 && f.pfdTurn1Deg < 100);
    const avgDeg = validDeg.length > 0 ? validDeg.reduce((s, f) => s + f.pfdTurn1Deg, 0) / validDeg.length : 0;

    const avgDurationDeriv = flights.filter(f => f.durationDerivative > 0).length > 0
      ? flights.filter(f => f.durationDerivative > 0).reduce((s, f) => s + f.durationDerivative, 0) / flights.filter(f => f.durationDerivative > 0).length
      : 0;

    const avgDurationExt = flights.filter(f => f.durationExtTo99 > 0).length > 0
      ? flights.filter(f => f.durationExtTo99 > 0).reduce((s, f) => s + f.durationExtTo99, 0) / flights.filter(f => f.durationExtTo99 > 0).length
      : 0;

    const avgLanding30 = flights.filter(f => f.landingDist30kn > 0).length > 0
      ? flights.filter(f => f.landingDist30kn > 0).reduce((s, f) => s + f.landingDist30kn, 0) / flights.filter(f => f.landingDist30kn > 0).length
      : 0;

    const avgLanding50 = flights.filter(f => f.landingDist50kn > 0).length > 0
      ? flights.filter(f => f.landingDist50kn > 0).reduce((s, f) => s + f.landingDist50kn, 0) / flights.filter(f => f.landingDist50kn > 0).length
      : 0;

    const criticalCount = flights.filter(f => f.anomalyLevel === 'critical').length;
    const warningCount = flights.filter(f => f.anomalyLevel === 'warning').length;

    const validRatios = flights.filter(f => f.durationRatio > 0 && f.durationRatio < 50);
    const durationRatioAvg = validRatios.length > 0
      ? validRatios.reduce((s, f) => s + f.durationRatio, 0) / validRatios.length
      : 0;

    const landingDistAnomalyRate = flights.filter(f => f.landingDistAnomaly).length / Math.max(totalFlights, 1);

    // Health score calculation (0-100)
    let healthScore = 100;

    // PFD penalty
    if (avgPfd < 95) healthScore -= (95 - avgPfd) * 1.5;
    if (avgPfd < 80) healthScore -= (80 - avgPfd) * 2;

    // Critical/warning penalty
    healthScore -= criticalCount * 5;
    healthScore -= warningCount * 2;

    // Duration ratio penalty
    if (durationRatioAvg > 2) healthScore -= (durationRatioAvg - 2) * 5;

    // Landing distance anomaly penalty
    healthScore -= landingDistAnomalyRate * 20;

    // DEG penalty
    if (avgDeg < 40) healthScore -= (40 - avgDeg) * 0.5;

    healthScore = Math.max(0, Math.min(100, healthScore));

    // Risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (healthScore < 50) riskLevel = 'CRITICAL';
    else if (healthScore < 70) riskLevel = 'HIGH';
    else if (healthScore < 85) riskLevel = 'MEDIUM';

    // Trend calculation: compare first half vs second half
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, Math.max(mid, 1));
    const secondHalf = sorted.slice(mid);
    const firstAvgPfd = firstHalf.filter(f => f.normalizedPfd > 0).reduce((s, f) => s + f.normalizedPfd, 0) / Math.max(firstHalf.filter(f => f.normalizedPfd > 0).length, 1);
    const secondAvgPfd = secondHalf.filter(f => f.normalizedPfd > 0).reduce((s, f) => s + f.normalizedPfd, 0) / Math.max(secondHalf.filter(f => f.normalizedPfd > 0).length, 1);
    const degradationRate = firstAvgPfd - secondAvgPfd;

    let trend: 'improving' | 'stable' | 'degrading' = 'stable';
    if (degradationRate > 3) trend = 'degrading';
    else if (degradationRate < -3) trend = 'improving';

    const lastFlightDate = sorted[sorted.length - 1]?.flightDate || '';

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
      healthScore,
      riskLevel,
      trend,
      durationRatioAvg,
      landingDistAnomalyRate,
      lastFlightDate,
      degradationRate,
    });
  });

  return scores.sort((a, b) => a.healthScore - b.healthScore);
}

export function generatePredictiveInsights(data: FlightRecord[], healthScores: TailHealthScore[]): PredictiveInsight[] {
  const insights: PredictiveInsight[] = [];
  let idCounter = 0;

  for (const health of healthScores) {
    const flights = data.filter(d => d.tailNumber === health.tailNumber);

    // 1. Hydraulic issue: high duration ratio consistently
    const highRatioFlights = flights.filter(f => f.durationRatio > 3);
    if (highRatioFlights.length >= 2) {
      insights.push({
        id: `insight-${++idCounter}`,
        tailNumber: health.tailNumber,
        category: 'hydraulic',
        severity: highRatioFlights.length >= 4 ? 'critical' : 'warning',
        title: `Hidrolik Direnç Şüphesi - ${health.tailNumber}`,
        description: `Speedbrake %99'a ulaşma süresi, türev süresinin ${health.durationRatioAvg.toFixed(1)}x katı. Bu, hidrolik sistemde artan direnç veya basınç düşüşüne işaret eder.`,
        evidence: highRatioFlights.slice(0, 5).map(f => `${f.flightDate} ${f.takeoffAirport}→${f.landingAirport}: Ratio ${f.durationRatio.toFixed(1)}x (${f.durationExtTo99.toFixed(1)}s / ${f.durationDerivative.toFixed(1)}s)`),
        recommendation: 'Hidrolik aktuatör basıncını kontrol edin. Hidrolik sıvı seviyesi ve kalitesini test edin. PCU (Power Control Unit) muayenesi önerilir.',
        relatedFlights: highRatioFlights.length,
        confidence: Math.min(95, 60 + highRatioFlights.length * 8),
      });
    }

    // 2. Mechanical failure: very low PFD + low DEG
    const mechFlights = flights.filter(f => f.normalizedPfd < 75 && f.pfdTurn1Deg < 30);
    if (mechFlights.length >= 1) {
      insights.push({
        id: `insight-${++idCounter}`,
        tailNumber: health.tailNumber,
        category: 'mechanical',
        severity: mechFlights.length >= 2 ? 'critical' : 'warning',
        title: `Mekanik Arıza Tespiti - ${health.tailNumber}`,
        description: `Speedbrake fiziksel olarak tam açılamıyor. PFD ${mechFlights[0].normalizedPfd.toFixed(1)}%, açı sadece ${mechFlights[0].pfdTurn1Deg.toFixed(1)}°.`,
        evidence: mechFlights.slice(0, 5).map(f => `${f.flightDate} ${f.takeoffAirport}→${f.landingAirport}: PFD=${f.pfdTurn1.toFixed(1)}, DEG=${f.pfdTurn1Deg.toFixed(1)}°`),
        recommendation: 'Speedbrake mekanik bağlantılarını, rulmanlari ve actuator linkage\'ı kontrol edin. Fiziksel engel/hasar muayenesi yapın.',
        relatedFlights: mechFlights.length,
        confidence: Math.min(95, 70 + mechFlights.length * 10),
      });
    }

    // 3. Slow opening pattern: PFD_DEG < PFE_TO_99_DEG significantly
    const slowFlights = flights.filter(f => f.pfeTo99Deg - f.pfdTurn1Deg > 8 && f.normalizedPfd < 90);
    if (slowFlights.length >= 2) {
      insights.push({
        id: `insight-${++idCounter}`,
        tailNumber: health.tailNumber,
        category: 'actuator',
        severity: 'warning',
        title: `Yavaş/Gecikmeli Açılma Paterni - ${health.tailNumber}`,
        description: `Speedbrake başlangıçta eksik açılıyor ancak zamanla %99'a ulaşıyor. Başlangıç açısı ve son açı arasındaki fark sürekli yüksek.`,
        evidence: slowFlights.slice(0, 5).map(f => `${f.flightDate}: Başlangıç ${f.pfdTurn1Deg.toFixed(1)}° → Son ${f.pfeTo99Deg.toFixed(1)}° (Δ${(f.pfeTo99Deg - f.pfdTurn1Deg).toFixed(1)}°)`),
        recommendation: 'Actuator hız ayarını kontrol edin. Speedbrake hinge noktalarında sürtünme olup olmadığını inceleyin.',
        relatedFlights: slowFlights.length,
        confidence: Math.min(90, 55 + slowFlights.length * 7),
      });
    }

    // 4. Landing distance correlation with low PFD
    const landingAnomalyFlights = flights.filter(f => f.landingDistAnomaly);
    if (landingAnomalyFlights.length >= 2) {
      insights.push({
        id: `insight-${++idCounter}`,
        tailNumber: health.tailNumber,
        category: 'operational',
        severity: landingAnomalyFlights.length >= 4 ? 'critical' : 'warning',
        title: `İniş Mesafesi Anomalisi - ${health.tailNumber}`,
        description: `${landingAnomalyFlights.length} uçuşta 50kn iniş mesafesi > 30kn iniş mesafesi. Bu fiziksel olarak anormal olup sensör veya fren sistemi sorunu gösterebilir.`,
        evidence: landingAnomalyFlights.slice(0, 5).map(f => `${f.flightDate} ${f.takeoffAirport}→${f.landingAirport}: 30kn=${f.landingDist30kn.toFixed(0)}m, 50kn=${f.landingDist50kn.toFixed(0)}m`),
        recommendation: 'Wheel speed sensörlerini kalibre edin. Fren sistemi performansını test edin. Landing distance hesaplama algoritmasını doğrulayın.',
        relatedFlights: landingAnomalyFlights.length,
        confidence: Math.min(90, 65 + landingAnomalyFlights.length * 5),
      });
    }

    // 5. Degradation trend
    if (health.trend === 'degrading' && health.degradationRate > 5) {
      insights.push({
        id: `insight-${++idCounter}`,
        tailNumber: health.tailNumber,
        category: 'sensor',
        severity: health.degradationRate > 10 ? 'critical' : 'warning',
        title: `Performans Degradasyonu - ${health.tailNumber}`,
        description: `Son uçuşlarda PFD değeri ortalama ${health.degradationRate.toFixed(1)} puan düşmüş. Speedbrake performansı kötüleşiyor.`,
        evidence: [
          `İlk yarı ortalama PFD: ${(health.avgPfd + health.degradationRate / 2).toFixed(1)}`,
          `İkinci yarı ortalama PFD: ${(health.avgPfd - health.degradationRate / 2).toFixed(1)}`,
          `Degradasyon hızı: ${health.degradationRate.toFixed(1)} puan`,
          `Son uçuş: ${health.lastFlightDate}`,
        ],
        recommendation: 'Speedbrake sisteminin tüm bileşenlerini kapsamlı şekilde inceleyin. Preventif bakım zamanlaması öne alınmalıdır.',
        relatedFlights: health.totalFlights,
        confidence: Math.min(85, 50 + health.degradationRate * 3),
      });
    }
  }

  return insights.sort((a, b) => {
    const sevOrder = { critical: 0, warning: 1, info: 2 };
    return sevOrder[a.severity] - sevOrder[b.severity] || b.confidence - a.confidence;
  });
}

export function analyzeLandingDistances(data: FlightRecord[]): LandingDistanceAnalysisRecord[] {
  return data
    .filter(d => d.landingDist30kn > 0 && d.landingDist50kn > 0)
    .map(d => {
      let anomalyType: LandingDistanceAnalysisRecord['anomalyType'] = 'normal';
      let riskScore = 0;

      if (d.landingDist50kn > d.landingDist30kn * 1.05) {
        anomalyType = '50kn_exceeds_30kn';
        riskScore += 40;
      }

      if (d.landingDist30kn > 2000) {
        if (anomalyType === 'normal') anomalyType = 'excessive_distance';
        riskScore += 20;
      }

      if (d.normalizedPfd < 85 && d.landingDist30kn > 1800) {
        if (anomalyType === 'normal') anomalyType = 'pfd_correlation';
        riskScore += 30;
      }

      if (d.normalizedPfd < 70) riskScore += 20;
      if (d.durationRatio > 3) riskScore += 10;

      return {
        tailNumber: d.tailNumber,
        route: `${d.takeoffAirport}→${d.landingAirport}`,
        date: d.flightDate,
        dist30kn: d.landingDist30kn,
        dist50kn: d.landingDist50kn,
        pfd: d.normalizedPfd,
        deg: d.pfdTurn1Deg,
        anomalyType,
        riskScore: Math.min(100, riskScore),
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);
}

export function buildFlightTimeline(data: FlightRecord[]): FlightTimelineEntry[] {
  return data
    .sort((a, b) => a.flightDate.localeCompare(b.flightDate) || a.tailNumber.localeCompare(b.tailNumber))
    .map(d => ({
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
