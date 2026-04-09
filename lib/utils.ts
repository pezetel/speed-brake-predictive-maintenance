// ============================================================
// B737 Speedbrake Predictive Maintenance — Utility helpers
// ============================================================
import {
  FlightRecord,
  AnomalySummary,
  FilterState,
} from './types';

// ----------------------------------------------------------------
// Number parsing (handles European comma decimals, etc.)
// ----------------------------------------------------------------
function parseNumberSmart(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  const s = String(val).trim();
  // Pure comma‑decimal (no dot)
  if (s.includes(',') && !s.includes('.')) {
    return parseFloat(s.replace(',', '.')) || 0;
  }
  // Both comma and dot → figure out which is decimal
  if (s.includes(',') && s.includes('.')) {
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    if (lastComma > lastDot) {
      return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
    }
    return parseFloat(s.replace(/,/g, '')) || 0;
  }
  return parseFloat(s) || 0;
}

// ----------------------------------------------------------------
// Aircraft‑type heuristic
// ----------------------------------------------------------------
export function detectAircraftType(tail: string): 'NG' | 'MAX' {
  if (!tail) return 'NG';
  const t = tail.toUpperCase();
  if (t.startsWith('TC-SM')) return 'MAX';
  // TC-SP* is 737 NG (SunExpress 737-800 fleet)
  // TC-SE* is 737 NG (older)
  // TC-SN* is 737 NG
  return 'NG';
}

// ----------------------------------------------------------------
// Per‑record anomaly detection
// ----------------------------------------------------------------
export function detectAnomaly(
  record: Omit<FlightRecord, 'anomalyLevel' | 'anomalyReasons'>,
): { level: 'normal' | 'warning' | 'critical'; reasons: string[] } {
  const reasons: string[] = [];
  let level: 'normal' | 'warning' | 'critical' = 'normal';
  const nPfd = record.normalizedPfd;

  // 1. PFD thresholds
  if (nPfd > 0 && nPfd < 70) {
    level = 'critical';
    reasons.push(`PFD çok düşük: ${record.pfdTurn1.toFixed(1)}% → Speedbrake tam açılamıyor`);
  } else if (nPfd >= 70 && nPfd < 80) {
    level = 'critical';
    reasons.push(`PFD düşük: ${record.pfdTurn1.toFixed(1)}% → Mekanik arıza şüphesi`);
  } else if (nPfd >= 80 && nPfd < 95) {
    if (level !== 'critical') level = 'warning';
    reasons.push(`PFD normalin altında: ${record.pfdTurn1.toFixed(1)}%`);
  }

  // 2. Duration ratio (extTo99 / derivative)
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

  // 3. Absolute extension‑to‑99 duration
  if (record.durationExtTo99 > 10) {
    level = 'critical';
    reasons.push(`%99 uzama süresi aşırı yüksek: ${record.durationExtTo99.toFixed(1)}s`);
  } else if (record.durationExtTo99 > 5) {
    if (level !== 'critical') level = 'warning';
    reasons.push(`%99 uzama süresi yüksek: ${record.durationExtTo99.toFixed(1)}s`);
  }

  // 4. Landing distance: 50kn > 30kn (physically anomalous)
  if (record.landingDist30kn > 0 && record.landingDist50kn > 0) {
    if (record.landingDist50kn > record.landingDist30kn * 1.05) {
      level = 'critical';
      reasons.push(
        `İniş mesafesi anomalisi: 50kn(${record.landingDist50kn.toFixed(0)}m) > 30kn(${record.landingDist30kn.toFixed(0)}m) 🔴`,
      );
    }
  }

  // 5. Excessive landing distance
  if (record.landingDist30kn > 2200) {
    if (level !== 'critical') level = 'warning';
    reasons.push(`İniş mesafesi uzun: ${record.landingDist30kn.toFixed(0)}m (30kn)`);
  }

  // 6. DEG vs PFD correlation
  if (record.pfdTurn1Deg > 0 && record.pfeTo99Deg > 0) {
    if (record.pfdTurn1Deg < 25 && nPfd < 90) {
      level = 'critical';
      reasons.push(`Açı çok düşük: ${record.pfdTurn1Deg.toFixed(1)}° → Speedbrake fiziksel olarak açılamıyor`);
    } else if (record.pfdTurn1Deg < 35 && nPfd < 90) {
      if (level !== 'critical') level = 'warning';
      reasons.push(`Açı düşük: ${record.pfdTurn1Deg.toFixed(1)}° (PFD: ${nPfd.toFixed(1)})`);
    }
    // Slow opening: initial DEG << final DEG
    const degDiff = record.pfeTo99Deg - record.pfdTurn1Deg;
    if (degDiff > 8 && nPfd < 90) {
      if (level !== 'critical') level = 'warning';
      reasons.push(
        `Gecikmeli açılma: Başlangıç ${record.pfdTurn1Deg.toFixed(1)}° → Son ${record.pfeTo99Deg.toFixed(1)}° (Δ${degDiff.toFixed(1)}°)`,
      );
    }
  }

  // 7. Doubled record flag
  if (record.isDoubledRecord) {
    reasons.push(`Çift kayıt tespit edildi (PFD: ${record.pfdTurn1.toFixed(1)})`);
  }

  // 8. GS at SBOP extremely low (possible early activation or data error)
  if (record.gsAtAutoSbop > 0 && record.gsAtAutoSbop < 2500) {
    if (level !== 'critical') level = 'warning';
    reasons.push(`GS at SBOP çok düşük: ${record.gsAtAutoSbop.toFixed(0)} → Erken açılma veya veri hatası`);
  }

  return { level, reasons };
}

// ----------------------------------------------------------------
// Parse Excel rows → FlightRecord[]
// ----------------------------------------------------------------
export function parseExcelData(rows: any[]): FlightRecord[] {
  const records: FlightRecord[] = [];

  for (const row of rows) {
    const vals = Object.values(row);
    if (vals.length < 12) continue;

    const tailNumber = String(vals[1] || '').trim().toUpperCase();
    if (!tailNumber || !tailNumber.startsWith('TC-')) continue;

    // ---- date handling ----
    let dateVal = vals[0];
    let flightDate = '';
    if (dateVal instanceof Date) {
      flightDate = dateVal.toISOString().split('T')[0];
    } else if (typeof dateVal === 'number') {
      // Excel serial date
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
    const isDoubledRecord = pfdTurn1 > 150;
    const normalizedPfd = isDoubledRecord
      ? pfdTurn1 / Math.round(pfdTurn1 / 100)
      : pfdTurn1;
    const durationRatio =
      durationDerivative > 0 ? durationExtTo99 / durationDerivative : 0;
    const landingDistAnomaly =
      landingDist30kn > 0 &&
      landingDist50kn > 0 &&
      landingDist50kn > landingDist30kn * 1.05;

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

// ----------------------------------------------------------------
// Aggregate summary
// ----------------------------------------------------------------
export function computeSummary(data: FlightRecord[]): AnomalySummary {
  const tails = new Set(data.map((d) => d.tailNumber));
  const ngTails = new Set(data.filter((d) => d.aircraftType === 'NG').map((d) => d.tailNumber));
  const maxTails = new Set(data.filter((d) => d.aircraftType === 'MAX').map((d) => d.tailNumber));
  const criticals = data.filter((d) => d.anomalyLevel === 'critical');
  const warnings = data.filter((d) => d.anomalyLevel === 'warning');
  const normals = data.filter((d) => d.anomalyLevel === 'normal');

  const problematicTailSet = new Set<string>();
  criticals.forEach((d) => problematicTailSet.add(d.tailNumber));

  const safe = (arr: FlightRecord[], fn: (d: FlightRecord) => number, lo = 0, hi = 999999) => {
    const filtered = arr.filter((d) => fn(d) > lo && fn(d) < hi);
    return filtered.length > 0 ? filtered.reduce((s, d) => s + fn(d), 0) / filtered.length : 0;
  };

  const avgPFD = safe(data, (d) => d.normalizedPfd, 0, 105);
  const avgDeg = safe(data, (d) => d.pfdTurn1Deg, 0, 100);
  const avgDuration = safe(data, (d) => d.durationDerivative, 0, 50);
  const avgLandingDist = safe(data, (d) => d.landingDist30kn, 0, 5000);
  const avgDurationRatio = safe(data, (d) => d.durationRatio, 0, 50);

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
    doubledRecords: data.filter((d) => d.isDoubledRecord).length,
    landingDistAnomalyCount: data.filter((d) => d.landingDistAnomaly).length,
    avgDurationRatio,
    slowOpeningCount: data.filter((d) => d.normalizedPfd < 90 && d.pfeTo99Deg - d.pfdTurn1Deg > 5).length,
    mechanicalFailureCount: data.filter((d) => d.normalizedPfd < 70 && d.pfdTurn1Deg < 25).length,
  };
}

// ----------------------------------------------------------------
// Filtering
// ----------------------------------------------------------------
export function applyFilters(data: FlightRecord[], filters: FilterState): FlightRecord[] {
  let f = [...data];
  if (filters.aircraftType !== 'ALL') f = f.filter((d) => d.aircraftType === filters.aircraftType);
  if (filters.anomalyLevel !== 'ALL') f = f.filter((d) => d.anomalyLevel === filters.anomalyLevel);
  if (filters.tails.length > 0) f = f.filter((d) => filters.tails.includes(d.tailNumber));
  if (filters.airport) {
    const ap = filters.airport.toUpperCase();
    f = f.filter((d) => d.takeoffAirport === ap || d.landingAirport === ap);
  }
  if (filters.dateRange) {
    f = f.filter((d) => d.flightDate >= filters.dateRange![0] && d.flightDate <= filters.dateRange![1]);
  }
  return f;
}

// ----------------------------------------------------------------
// Pearson correlation
// ----------------------------------------------------------------
export function computeCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;
  const mx = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const my = y.slice(0, n).reduce((a, b) => a + b, 0) / n;
  let num = 0,
    dx = 0,
    dy = 0;
  for (let i = 0; i < n; i++) {
    const xi = x[i] - mx;
    const yi = y[i] - my;
    num += xi * yi;
    dx += xi * xi;
    dy += yi * yi;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? 0 : num / den;
}

// ----------------------------------------------------------------
// Label / field helpers
// ----------------------------------------------------------------
export function getFieldLabel(key: string): string {
  const m: Record<string, string> = {
    pfdTurn1: 'PFD Turn 1 (%)',
    normalizedPfd: 'PFD (Normalized)',
    durationDerivative: 'Süre (Türev) s',
    durationExtTo99: 'Süre (→99%) s',
    durationRatio: 'Süre Oranı (99/D)',
    pfdTurn1Deg: 'PFD Açı (°)',
    pfeTo99Deg: 'PFE→99 Açı (°)',
    landingDist30kn: 'İniş 30kn (m)',
    landingDist50kn: 'İniş 50kn (m)',
    gsAtAutoSbop: 'GS@AutoSBOP',
  };
  return m[key] || key;
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
