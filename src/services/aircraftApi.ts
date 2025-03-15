import { StateVector } from "@/types/aircraft";

// Rate limiting settings for OpenSky API
const RATE_LIMIT_WINDOW = 10000; // 10 seconds
const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 2000; // 2 seconds

let lastOpenSkyCall = 0;

// Function to get the ICAO code from a tail number using the ADSBDB API
export const getTailToIcao = async (tailNumber: string): Promise<string> => {
  const url = `${import.meta.env.VITE_ADSBDB_BASE_URL}/aircraft/${tailNumber}`;
  console.log('getTailToIcao fetching URL:', url);
  const response = await Promise.race([
    fetch(url),
    new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('Timeout fetching ICAO code')), 5000))
  ]);
  console.log('getTailToIcao response status:', response.status);
  if (!response.ok) {
    throw new Error(`Failed to fetch ICAO code: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('getTailToIcao data:', data);
  // Attempt to extract the ICAO code from various possible keys, including nested response.aircraft.mode_s
  const icao = data.icao24 || data.icao || data.ICAO || (data.response && (data.response.icao24 || data.response.icao || data.response.ICAO)) || (data.response && data.response.aircraft && data.response.aircraft.mode_s) || '';
  if (!icao) {
    throw new Error('ICAO code not found in the response.');
  }
  return icao;
};

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to get the current state (StateVector) from the ICAO code using the OpenSky API
export const getCurrentStateByIcao = async (icao: string): Promise<StateVector | null> => {
  const now = Date.now();
  const timeSinceLastCall = now - lastOpenSkyCall;
  
  // Enforce rate limiting
  if (timeSinceLastCall < RATE_LIMIT_WINDOW) {
    await delay(RATE_LIMIT_WINDOW - timeSinceLastCall);
  }

  const url = `${import.meta.env.VITE_OPENSKY_BASE_URL}/states/all?icao24=${icao.toLowerCase()}`;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      lastOpenSkyCall = Date.now();
      const response = await fetch(url);
      
      if (response.status === 429) {
        const backoffTime = INITIAL_BACKOFF * Math.pow(2, attempt);
        console.log(`Rate limited. Waiting ${backoffTime}ms before retry ${attempt + 1}/${MAX_RETRIES}`);
        await delay(backoffTime);
        continue;
      }
      
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
    } catch (error) {
      if (attempt === MAX_RETRIES - 1) {
        throw error;
      }
      const backoffTime = INITIAL_BACKOFF * Math.pow(2, attempt);
      console.log(`Error occurred. Waiting ${backoffTime}ms before retry ${attempt + 1}/${MAX_RETRIES}`);
      await delay(backoffTime);
    }
  }
  
  throw new Error('Max retries exceeded when fetching state data');
};
