import { FlightRecord, AnomalySummary, FilterState } from './types';

function parseNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  const s = String(val).replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

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

  const basePfd = record.aircraftType === 'MAX' ? 100 : 100;
  const normalizedPfd = record.pfdTurn1 > 150 ? record.pfdTurn1 / Math.round(record.pfdTurn1 / basePfd) : record.pfdTurn1;

  if (normalizedPfd < 80) {
    level = 'critical';
    reasons.push(`PFD çok düşük: ${record.pfdTurn1.toFixed(1)}`);
  } else if (normalizedPfd < 95) {
    level = level === 'critical' ? 'critical' : 'warning';
    reasons.push(`PFD düşük: ${record.pfdTurn1.toFixed(1)}`);
  }

  if (record.durationExtTo99 > 0 && record.durationDerivative > 0) {
    const ratio = record.durationExtTo99 / record.durationDerivative;
    if (ratio > 3) {
      level = 'critical';
      reasons.push(`Uzama süresi oranı çok yüksek: ${ratio.toFixed(1)}x`);
    } else if (ratio > 2) {
      if (level !== 'critical') level = 'warning';
      reasons.push(`Uzama süresi oranı yüksek: ${ratio.toFixed(1)}x`);
    }
  }

  if (record.durationExtTo99 > 5) {
    level = 'critical';
    reasons.push(`%99'a uzama süresi çok yüksek: ${record.durationExtTo99.toFixed(1)}s`);
  } else if (record.durationExtTo99 > 3) {
    if (level !== 'critical') level = 'warning';
    reasons.push(`%99'a uzama süresi yüksek: ${record.durationExtTo99.toFixed(1)}s`);
  }

  if (record.landingDist30kn > 0 && record.landingDist50kn > 0) {
    if (record.landingDist50kn > record.landingDist30kn * 1.1) {
      if (level !== 'critical') level = 'warning';
      reasons.push(`İniş mesafesi anomalisi: 50kn(${record.landingDist50kn.toFixed(0)}) > 30kn(${record.landingDist30kn.toFixed(0)})`);
    }
  }

  if (record.landingDist30kn > 50000 || record.landingDist50kn > 50000) {
    level = 'critical';
    reasons.push(`İniş mesafesi veri hatası`);
  }

  const degDiff = Math.abs(record.pfdTurn1Deg - record.pfeTo99Deg);
  if (record.pfdTurn1Deg > 0 && record.pfeTo99Deg > 0) {
    if (record.pfdTurn1Deg < 35 && normalizedPfd < 90) {
      level = 'critical';
      reasons.push(`Açı değeri çok düşük: ${record.pfdTurn1Deg.toFixed(1)}°`);
    }
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

  const validPfd = data.filter(d => d.pfdTurn1 > 0 && d.pfdTurn1 <= 150);
  const avgPFD = validPfd.length > 0 ? validPfd.reduce((s, d) => s + d.pfdTurn1, 0) / validPfd.length : 0;

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
  const n = x.length;
  if (n === 0) return 0;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
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
    durationDerivative: 'Duration (Derivative)',
    durationExtTo99: 'Duration (Ext to 99)',
    pfdTurn1Deg: 'PFD Turn 1 (°)',
    pfeTo99Deg: 'PFE to 99 (°)',
    landingDist30kn: 'Landing Dist 30kn',
    landingDist50kn: 'Landing Dist 50kn',
    gsAtAutoSbop: 'GS at Auto SBOP',
  };
  return labels[key] || key;
}

export const numericFields = [
  'pfdTurn1',
  'durationDerivative',
  'durationExtTo99',
  'pfdTurn1Deg',
  'pfeTo99Deg',
  'landingDist30kn',
  'landingDist50kn',
  'gsAtAutoSbop',
] as const;
