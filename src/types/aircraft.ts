// State vector from OpenSky API
export interface StateVector {
  icao24: string;
  callsign: string | null;
  originCountry: string | null;
  timePosition: number | null;
  lastContact: number | null;
  longitude: number | null;
  latitude: number | null;
  baroAltitude: number | null;
  onGround: boolean;
  velocity: number | null;
  trueTrack: number | null;
  verticalRate: number | null;
  sensors: number[] | null;
  geoAltitude: number | null;
  squawk: string | null;
  spi: boolean;
  positionSource: number;
  category: number | null;
  timestamp: number;
}

// Aircraft data type combining state and metadata
export interface AircraftData {
  icao24: string;
  tailNumber: string;
  currentState: StateVector | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}
