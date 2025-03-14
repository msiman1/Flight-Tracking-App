import { StateVector } from "@/types/aircraft";

// Function to get the ICAO code from a tail number using the ADSBDB API
export const getTailToIcao = async (tailNumber: string): Promise<string> => {
  const url = `${import.meta.env.VITE_ADSBDB_BASE_URL}/aircraft/${tailNumber}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ICAO code: ${response.statusText}`);
  }

  const data = await response.json();
  // Assuming the ICAO code is returned in data.icao24, adjust as necessary
  const icao = data.icao24 || '';
  if (!icao) {
    throw new Error('ICAO code not found in the response.');
  }
  return icao;
};

// Function to get the current state (StateVector) from the ICAO code using the OpenSky API
export const getCurrentStateByIcao = async (icao: string): Promise<StateVector | null> => {
  const url = `${import.meta.env.VITE_OPENSKY_BASE_URL}/states/all?icao24=${icao.toLowerCase()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch state data: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.states || data.states.length === 0) {
    return null;
  }

  // Extract the first state vector from the returned states array
  const state = data.states[0];
  const stateVector: StateVector = {
    icao24: state[0],
    callsign: state[1]?.trim() || 'Unknown',
    originCountry: state[2] || 'Unknown',
    timePosition: state[3],
    lastContact: state[4],
    longitude: state[5],
    latitude: state[6],
    baroAltitude: state[7],
    onGround: state[8],
    velocity: state[9],
    trueTrack: state[10],
    verticalRate: state[11],
    sensors: state[12],
    geoAltitude: state[13],
    squawk: state[14],
    spi: state[15],
    positionSource: state[16],
    category: null,
    timestamp: Date.now()
  };
  
  return stateVector;
};
