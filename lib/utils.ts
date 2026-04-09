import { FlightRecord, AnomalySummary, FilterState } from './types';

function parseNumberSmart(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  const s = String(val).trim();
  if (s.includes(',') && !s.includes('.')) {
    return parseFloat(s.replace(',', '.')) || 0;
  }
  if (s.includes(',') && s.includes('.')) {
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    if (lastComma > lastDot) {
      return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
    } else {
      return parseFloat(s.replace(/,/g, '')) || 0;
    }
  }
  return parseFloat(s) || 0;
}

export function detectAircraftType(tail: string): 'NG' | 'MAX' {
  if (!tail) return 'NG';
  const prefix = tail.substring(0, 5).toUpperCase();
  if (prefix.startsWith('TC-SM')) return 'MAX';
  return 'NG';
}

export function detectAnomaly(record: Omit<FlightRecord, 'anomalyLevel' | 'anomalyReasons'>): { level: 'normal' | 'warning' | 'critical'; reasons: string[] } {
  const reasons: string[] = [];
  let level: 'normal' | 'warning' | 'critical' = 'normal';

  const normalizedPfd = record.normalizedPfd;

  // 1. PFD anomalisi
  if (normalizedPfd < 70) {
    level = 'critical';
    reasons.push(`PFD çok düşük: ${record.pfdTurn1.toFixed(1)} → Speedbrake tam açılamıyor`);
  } else if (normalizedPfd < 80) {
    level = 'critical';
    reasons.push(`PFD düşük: ${record.pfdTurn1.toFixed(1)} → Mekanik arıza şüphesi`);
  } else if (normalizedPfd < 95) {
    if (level !== 'critical') level = 'warning';
    reasons.push(`PFD normalin altında: ${record.pfdTurn1.toFixed(1)}`);
  }

  // 2. Duration ratio anomalisi (ext_to_99 / derivative)
  if (record.durationDerivative > 0 && record.durationExtTo99 > 0) {
    const ratio = record.durationRatio;
    if (ratio > 4) {
      level = 'critical';
      reasons.push(`Yavaş açılma: %99'a ulaşım ${ratio.toFixed(1)}x daha uzun → Hidrolik/mekanik direnç`);
    } else if (ratio > 2.5) {
      if (level !== 'critical') level = 'warning';
      reasons.push(`Gecikmeli açılma: Oran ${ratio.toFixed(1)}x`);
    }
  }

  // 3. Duration extension to 99 mutlak değer
  if (record.durationExtTo99 > 10) {
    level = 'critical';
    reasons.push(`%99 uzama süresi aşırı yüksek: ${record.durationExtTo99.toFixed(1)}s`);
  } else if (record.durationExtTo99 > 5) {
    if (level !== 'critical') level = 'warning';
    reasons.push(`%99 uzama süresi yüksek: ${record.durationExtTo99.toFixed(1)}s`);
  }

  // 4. Landing distance anomalisi: 50kn > 30kn
  if (record.landingDist30kn > 0 && record.landingDist50kn > 0) {
    if (record.landingDist50kn > record.landingDist30kn * 1.05) {
      level = 'critical';
      reasons.push(`İniş mesafesi anomalisi: 50kn(${record.landingDist50kn.toFixed(0)}m) > 30kn(${record.landingDist30kn.toFixed(0)}m) 🔴`);
    }
  }

  // 5. Aşırı iniş mesafesi
  if (record.landingDist30kn > 2200) {
    if (level !== 'critical') level = 'warning';
    reasons.push(`İniş mesafesi uzun: ${record.landingDist30kn.toFixed(0)}m (30kn)`);
  }

  // 6. DEG anomalisi - PFD ile ilişkili
  if (record.pfdTurn1Deg > 0 && record.pfeTo99Deg > 0) {
    if (record.pfdTurn1Deg < 25 && normalizedPfd < 90) {
      level = 'critical';
      reasons.push(`Açı çok düşük: ${record.pfdTurn1Deg.toFixed(1)}° → Speedbrake fiziksel olarak açılamıyor`);
    } else if (record.pfdTurn1Deg < 35 && normalizedPfd < 90) {
      if (level !== 'critical') level = 'warning';
      reasons.push(`Açı düşük: ${record.pfdTurn1Deg.toFixed(1)}° (PFD: ${normalizedPfd.toFixed(1)})`);
    }
    // Yavaş açılma tespiti: PFD_DEG << PFE_TO_99_DEG
    const degDiff = record.pfeTo99Deg - record.pfdTurn1Deg;
    if (degDiff > 8 && normalizedPfd < 90) {
      if (level !== 'critical') level = 'warning';
      reasons.push(`Gecikmeli açılma: Başlangıç ${record.pfdTurn1Deg.toFixed(1)}° → Son ${record.pfeTo99Deg.toFixed(1)}° (Δ${degDiff.toFixed(1)}°)`);
    }
  }

  // 7. Doubled record check (PFD > 150)
  if (record.isDoubledRecord) {
    reasons.push(`Çift kayıt tespit edildi (PFD: ${record.pfdTurn1.toFixed(1)})`);
  }

  // 8. GS at SBOP anomali - kısa mesafe ama yüksek GS veya tersi
  if (record.gsAtAutoSbop > 0 && record.gsAtAutoSbop < 4000) {
    // Very low GS for what should be a normal flight
    if (level !== 'critical') level = 'warning';
    reasons.push(`GS at SBOP çok düşük: ${record.gsAtAutoSbop.toFixed(0)} → Erken açılma veya veri hatası`);
  }

  return { level, reasons };
}

export function parseExcelData(rows: any[]): FlightRecord[] {
  const records: FlightRecord[] = [];

  for (const row of rows) {
    const vals = Object.values(row);
    if (vals.length < 12) continue;

    const tailNumber = String(vals[1] || '').trim().toUpperCase();
    if (!tailNumber || !tailNumber.startsWith('TC-')) continue;

    let dateVal = vals[0];
    let flightDate = '';
    if (dateVal instanceof Date) {
      flightDate = dateVal.toISOString().split('T')[0];
    } else if (typeof dateVal === 'number') {
      const d = new Date((dateVal - 25569) * 86400 * 1000);
      flightDate = d.toISOString().split('T')[0];
    } else {
      const s = String(dateVal || '').trim();
      const parts = s.split('.');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
        flightDate = `${year}-${month}-${day}`;
      } else {
        flightDate = s;
      }
    }

    const takeoffAirport = String(vals[2] || '').trim().toUpperCase();
    const landingAirport = String(vals[3] || '').trim().toUpperCase();
    const pfdTurn1 = parseNumberSmart(vals[4]);
    const durationDerivative = parseNumberSmart(vals[5]);
    const durationExtTo99 = parseNumberSmart(vals[6]);
    const pfdTurn1Deg = parseNumberSmart(vals[7]);
    const pfeTo99Deg = parseNumberSmart(vals[8]);
    const landingDist30kn = parseNumberSmart(vals[9]);
    const landingDist50kn = parseNumberSmart(vals[10]);
    const gsAtAutoSbop = parseNumberSmart(vals[11]);

    const aircraftType = detectAircraftType(tailNumber);

    // Doubled record detection
    const isDoubledRecord = pfdTurn1 > 150;
    const normalizedPfd = isDoubledRecord ? pfdTurn1 / Math.round(pfdTurn1 / 100) : pfdTurn1;

    // Duration ratio
    const durationRatio = durationDerivative > 0 ? durationExtTo99 / durationDerivative : 0;

    // Landing distance anomaly
    const landingDistAnomaly = landingDist30kn > 0 && landingDist50kn > 0 && landingDist50kn > landingDist30kn * 1.05;

    const partial = {
      flightDate,
      tailNumber,
      takeoffAirport,
      landingAirport,
      pfdTurn1,
      durationDerivative,
      durationExtTo99,
      pfdTurn1Deg,
      pfeTo99Deg,
      landingDist30kn,
      landingDist50kn,
      gsAtAutoSbop,
      aircraftType,
      isDoubledRecord,
      normalizedPfd,
      durationRatio,
      landingDistAnomaly,
    };

    const { level, reasons } = detectAnomaly(partial);

    records.push({
      ...partial,
      anomalyLevel: level,
      anomalyReasons: reasons,
    });
  }

  return records;
}

export function computeSummary(data: FlightRecord[]): AnomalySummary {
  const tails = new Set(data.map(d => d.tailNumber));
  const ngTails = new Set(data.filter(d => d.aircraftType === 'NG').map(d => d.tailNumber));
  const maxTails = new Set(data.filter(d => d.aircraftType === 'MAX').map(d => d.tailNumber));
  const criticals = data.filter(d => d.anomalyLevel === 'critical');
  const warnings = data.filter(d => d.anomalyLevel === 'warning');
  const normals = data.filter(d => d.anomalyLevel === 'normal');

  const problematicTailSet = new Set<string>();
  criticals.forEach(d => problematicTailSet.add(d.tailNumber));

  const validPfd = data.filter(d => d.normalizedPfd > 0 && d.normalizedPfd <= 105);
  const avgPFD = validPfd.length > 0 ? validPfd.reduce((s, d) => s + d.normalizedPfd, 0) / validPfd.length : 0;

  const validDeg = data.filter(d => d.pfdTurn1Deg > 0 && d.pfdTurn1Deg < 100);
  const avgDeg = validDeg.length > 0 ? validDeg.reduce((s, d) => s + d.pfdTurn1Deg, 0) / validDeg.length : 0;

  const validDur = data.filter(d => d.durationDerivative > 0 && d.durationDerivative < 50);
  const avgDuration = validDur.length > 0 ? validDur.reduce((s, d) => s + d.durationDerivative, 0) / validDur.length : 0;

  const validLand = data.filter(d => d.landingDist30kn > 0 && d.landingDist30kn < 5000);
  const avgLandingDist = validLand.length > 0 ? validLand.reduce((s, d) => s + d.landingDist30kn, 0) / validLand.length : 0;

  const doubledRecords = data.filter(d => d.isDoubledRecord).length;
  const landingDistAnomalyCount = data.filter(d => d.landingDistAnomaly).length;

  const validRatio = data.filter(d => d.durationRatio > 0 && d.durationRatio < 50);
  const avgDurationRatio = validRatio.length > 0 ? validRatio.reduce((s, d) => s + d.durationRatio, 0) / validRatio.length : 0;

  // Slow opening: PFD < 90 and PFD_DEG < PFE_TO_99_DEG with significant diff
  const slowOpeningCount = data.filter(d => d.normalizedPfd < 90 && d.pfeTo99Deg - d.pfdTurn1Deg > 5).length;
  // Mechanical failure: PFD < 70 and DEG < 25
  const mechanicalFailureCount = data.filter(d => d.normalizedPfd < 70 && d.pfdTurn1Deg < 25).length;

  return {
    totalFlights: data.length,
    criticalCount: criticals.length,
    warningCount: warnings.length,
    normalCount: normals.length,
    uniqueTails: tails.size,
    uniqueNGTails: ngTails.size,
    uniqueMAXTails: maxTails.size,
    avgPFD,
    problematicTails: Array.from(problematicTailSet),
    avgDeg,
    avgDuration,
    avgLandingDist,
    doubledRecords,
    landingDistAnomalyCount,
    avgDurationRatio,
    slowOpeningCount,
    mechanicalFailureCount,
  };
}

export function applyFilters(data: FlightRecord[], filters: FilterState): FlightRecord[] {
  let filtered = [...data];

  if (filters.aircraftType !== 'ALL') {
    filtered = filtered.filter(d => d.aircraftType === filters.aircraftType);
  }

  if (filters.anomalyLevel !== 'ALL') {
    filtered = filtered.filter(d => d.anomalyLevel === filters.anomalyLevel);
  }

  if (filters.tails.length > 0) {
    filtered = filtered.filter(d => filters.tails.includes(d.tailNumber));
  }

  if (filters.airport) {
    filtered = filtered.filter(d =>
      d.takeoffAirport === filters.airport.toUpperCase() ||
      d.landingAirport === filters.airport.toUpperCase()
    );
  }

  if (filters.dateRange) {
    filtered = filtered.filter(d =>
      d.flightDate >= filters.dateRange![0] && d.flightDate <= filters.dateRange![1]
    );
  }

  return filtered;
}

export function computeCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;
  const meanX = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const meanY = y.slice(0, n).reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

export function getFieldLabel(key: string): string {
  const labels: Record<string, string> = {
    pfdTurn1: 'PFD Turn 1',
    normalizedPfd: 'PFD (Normalized)',
    durationDerivative: 'Duration (Derivative)',
    durationExtTo99: 'Duration (Ext→99)',
    durationRatio: 'Duration Ratio (99/D)',
    pfdTurn1Deg: 'PFD Turn 1 (°)',
    pfeTo99Deg: 'PFE to 99 (°)',
    landingDist30kn: 'Landing Dist 30kn (m)',
    landingDist50kn: 'Landing Dist 50kn (m)',
    gsAtAutoSbop: 'GS at Auto SBOP',
  };
  return labels[key] || key;
}

export const numericFields = [
  'pfdTurn1',
  'durationDerivative',
  'durationExtTo99',
  'durationRatio',
  'pfdTurn1Deg',
  'pfeTo99Deg',
  'landingDist30kn',
  'landingDist50kn',
  'gsAtAutoSbop',
] as const;

export const analysisFields = [
  'normalizedPfd',
  'durationDerivative',
  'durationExtTo99',
  'durationRatio',
  'pfdTurn1Deg',
  'pfeTo99Deg',
  'landingDist30kn',
  'landingDist50kn',
  'gsAtAutoSbop',
] as const;
