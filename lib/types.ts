export interface FlightRecord {
  flightDate: string;
  tailNumber: string;
  takeoffAirport: string;
  landingAirport: string;
  pfdTurn1: number;
  durationDerivative: number;
  durationExtTo99: number;
  pfdTurn1Deg: number;
  pfeTo99Deg: number;
  landingDist30kn: number;
  landingDist50kn: number;
  gsAtAutoSbop: number;
  aircraftType: 'NG' | 'MAX';
  anomalyLevel: 'normal' | 'warning' | 'critical';
  anomalyReasons: string[];
  // computed fields
  isDoubledRecord: boolean;
  normalizedPfd: number;
  durationRatio: number;
  landingDistAnomaly: boolean;
}

export interface AnomalySummary {
  totalFlights: number;
  criticalCount: number;
  warningCount: number;
  normalCount: number;
  uniqueTails: number;
  uniqueNGTails: number;
  uniqueMAXTails: number;
  avgPFD: number;
  problematicTails: string[];
  avgDeg: number;
  avgDuration: number;
  avgLandingDist: number;
  doubledRecords: number;
  landingDistAnomalyCount: number;
  avgDurationRatio: number;
  slowOpeningCount: number;
  mechanicalFailureCount: number;
}

export interface CorrelationData {
  xKey: string;
  yKey: string;
  value: number;
}

export interface FilterState {
  dateRange: [string, string] | null;
  tails: string[];
  aircraftType: 'ALL' | 'NG' | 'MAX';
  anomalyLevel: 'ALL' | 'normal' | 'warning' | 'critical';
  airport: string;
}

export interface TailHealthScore {
  tailNumber: string;
  aircraftType: 'NG' | 'MAX';
  totalFlights: number;
  avgPfd: number;
  avgDeg: number;
  avgDurationDeriv: number;
  avgDurationExt: number;
  avgLanding30: number;
  avgLanding50: number;
  criticalCount: number;
  warningCount: number;
  healthScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  trend: 'improving' | 'stable' | 'degrading';
  durationRatioAvg: number;
  landingDistAnomalyRate: number;
  lastFlightDate: string;
  degradationRate: number;
}

export interface PredictiveInsight {
  id: string;
  tailNumber: string;
  category: 'hydraulic' | 'mechanical' | 'sensor' | 'actuator' | 'operational';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  evidence: string[];
  recommendation: string;
  relatedFlights: number;
  confidence: number;
}

export interface LandingDistanceAnalysisRecord {
  tailNumber: string;
  route: string;
  date: string;
  dist30kn: number;
  dist50kn: number;
  pfd: number;
  deg: number;
  anomalyType: 'normal' | '50kn_exceeds_30kn' | 'excessive_distance' | 'pfd_correlation';
  riskScore: number;
}

export interface FlightTimelineEntry {
  date: string;
  tailNumber: string;
  route: string;
  pfd: number;
  deg: number;
  durationRatio: number;
  anomalyLevel: 'normal' | 'warning' | 'critical';
  reasons: string[];
  landingDist30: number;
  landingDist50: number;
  gsAtSbop: number;
}
