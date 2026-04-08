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
