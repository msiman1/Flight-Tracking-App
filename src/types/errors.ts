
export interface ApiError {
  status: number;
  message: string;
  source: 'adsbdb' | 'opensky';
}

export type ErrorSource = 'tailNumber' | 'icao24' | 'state' | 'general';

export interface AircraftError {
  message: string;
  source: ErrorSource;
  status?: number;
  retry?: boolean;
}
