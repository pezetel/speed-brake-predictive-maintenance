export interface FlightRecord {
  flightDate: string;
  tailNumber: string;
  takeoffAirport: string;
  landingAirport: string;
  pfdTurn1: number;
  durationDerivativeSec: number;
  durationExtTo99Sec: number;
  pfdTurn1Deg: number;
  pfeTo99Deg: number;
  landingDist30Knot: number;
  landingDist50Knot: number;
  gsAtAutoSbopSec: number;
}

export interface AircraftHealth {
  tailNumber: string;
  aircraftType: 'NG' | 'MAX';
  totalFlights: number;
  avgPfdTurn1: number;
  avgDurationDerivative: number;
  avgDurationExtTo99: number;
  avgPfdTurn1Deg: number;
  avgPfeTo99Deg: number;
  avgLandingDist30: number;
  avgLandingDist50: number;
  avgGsAtAutoSbop: number;
  healthScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  anomalies: Anomaly[];
}

export interface Anomaly {
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  description: string;
  value: number;
  threshold: number;
  flight?: string;
}

export type TabType = 'overview' | 'aircraft' | 'anomalies' | 'data';
