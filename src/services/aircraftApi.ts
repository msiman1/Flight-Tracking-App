import { StateVector } from "@/types/aircraft";

export async function getTailToIcao(tailNumber: string): Promise<string> {
  const response = await fetch(`${import.meta.env.VITE_ADSBDB_BASE_URL}/aircraft/${tailNumber}`);
  
  if (!response.ok) {
    throw {
      message: `Could not find ICAO24 code for ${tailNumber}`,
      status: response.status
    };
  }

  const data = await response.json();
  return data.icao24;
}

export async function getCurrentStateByIcao(icao24: string): Promise<StateVector | null> {
  const response = await fetch(`${import.meta.env.VITE_OPENSKY_BASE_URL}/states/all?icao24=${icao24}`);
  
  if (!response.ok) {
    throw {
      message: 'Failed to retrieve current aircraft data',
      status: response.status
    };
  }

  const data = await response.json();
  
  if (!data.states || data.states.length === 0) {
    return null;
  }

  const state = data.states[0];
  return {
    icao24: state[0],
    callsign: state[1]?.trim() || null,
    originCountry: state[2],
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
}
