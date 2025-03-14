import { StateVector, AircraftData } from "@/types/aircraft";
import { ApiError } from "@/types/errors";
import { aircraftCache } from "./aircraftCache";

const ADSBDB_BASE_URL = import.meta.env.VITE_ADSBDB_BASE_URL;
const OPENSKY_BASE_URL = import.meta.env.VITE_OPENSKY_BASE_URL;

// Rate limiting configuration for anonymous access
const MAX_REQUESTS_PER_DAY = 400;
const MIN_REQUEST_INTERVAL = 10000; // 10 seconds minimum between requests
const REQUEST_INTERVAL = (24 * 60 * 60 * 1000) / MAX_REQUESTS_PER_DAY; // Time between requests in ms

// Rate limiting state
let lastRequestTime = 0;
let requestCount = 0;
let retryAfterSeconds = 0;

// Reset request count daily
setInterval(() => {
  requestCount = 0;
  retryAfterSeconds = 0;
}, 24 * 60 * 60 * 1000);

// Helper function to handle rate limiting
async function checkRateLimit() {
  const now = Date.now();
  
  // Check if we're in a retry-after period
  if (retryAfterSeconds > 0) {
    const waitTime = retryAfterSeconds * 1000 - (now - lastRequestTime);
    if (waitTime > 0) {
      throw {
        status: 429,
        message: `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`,
        source: "opensky"
      } as ApiError;
    }
    retryAfterSeconds = 0;
  }

  // Check daily limit
  if (requestCount >= MAX_REQUESTS_PER_DAY) {
    throw {
      status: 429,
      message: "Daily request limit exceeded. Please try again tomorrow.",
      source: "opensky"
    } as ApiError;
  }
  
  // Enforce minimum interval between requests
  const timeToWait = Math.max(
    MIN_REQUEST_INTERVAL - (now - lastRequestTime),
    lastRequestTime + REQUEST_INTERVAL - now
  );
  
  if (timeToWait > 0) {
    throw {
      status: 429,
      message: `Rate limit: Please wait ${Math.ceil(timeToWait / 1000)} seconds between requests.`,
      source: "opensky"
    } as ApiError;
  }
}

// Convert a tail number to ICAO24 using ADSBDB API
export async function getTailToIcao(tailNumber: string): Promise<string> {
  try {
    tailNumber = tailNumber.trim().toUpperCase();
    
    // Check cache first
    const cachedIcao = localStorage.getItem(`tail_${tailNumber}`);
    if (cachedIcao) {
      return cachedIcao;
    }
    
    // If it's a US registration (N-number), use the specific endpoint
    if (tailNumber.startsWith('N')) {
      const response = await fetch(`${ADSBDB_BASE_URL}/n-number/${tailNumber}`);
      
      if (!response.ok) {
        throw {
          status: response.status,
          message: `Failed to find ICAO24 code for ${tailNumber}`,
          source: 'adsbdb'
        } as ApiError;
      }
      
      const data = await response.json();
      if (!data.response) {
        throw {
          status: 404,
          message: `No ICAO24 code found for ${tailNumber}`,
          source: 'adsbdb'
        } as ApiError;
      }
      
      // Cache the result
      localStorage.setItem(`tail_${tailNumber}`, data.response);
      return data.response;
    }
    
    // For non-US registrations, use the general aircraft endpoint
    const response = await fetch(`${ADSBDB_BASE_URL}/aircraft/${tailNumber}`);
    
    if (!response.ok) {
      throw {
        status: response.status,
        message: `Failed to find aircraft data for ${tailNumber}`,
        source: 'adsbdb'
      } as ApiError;
    }
    
    const data = await response.json();
    
    try {
      const icao24 = data.response?.aircraft?.mode_s;
      if (!icao24) {
        throw {
          status: 404,
          message: `No ICAO24 code found in aircraft data for ${tailNumber}`,
          source: 'adsbdb'
        } as ApiError;
      }
      
      // Cache the result
      localStorage.setItem(`tail_${tailNumber}`, icao24);
      return icao24;
    } catch (error) {
      throw {
        status: 500,
        message: `Error parsing ADSBDB response for ${tailNumber}`,
        source: 'adsbdb'
      } as ApiError;
    }
  } catch (error) {
    if ((error as ApiError).source) {
      throw error;
    }
    
    throw {
      status: 500,
      message: `Error connecting to aircraft database: ${(error as Error).message}`,
      source: 'adsbdb'
    } as ApiError;
  }
}

// Get current state vector from OpenSky API with caching
export async function getCurrentStateByIcao(icao24: string): Promise<StateVector | null> {
  try {
    icao24 = icao24.toLowerCase();
    
    // Check if we should use cached data
    if (!aircraftCache.shouldPoll(icao24)) {
      const cachedState = aircraftCache.getLatestState(icao24);
      if (cachedState) {
        return cachedState;
      }
    }
    
    // Check rate limiting before making request
    await checkRateLimit();
    
    const url = new URL(`${OPENSKY_BASE_URL}/states/all`);
    url.searchParams.append("icao24", icao24);
    
    const response = await fetch(url);
    
    // Handle rate limit response
    if (response.status === 429) {
      const retryAfter = response.headers.get('X-Rate-Limit-Retry-After-Seconds');
      if (retryAfter) {
        retryAfterSeconds = parseInt(retryAfter, 10);
      }
      throw {
        status: 429,
        message: "Rate limit exceeded. Please try again later.",
        source: "opensky"
      } as ApiError;
    }
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.states && data.states.length > 0) {
        const rawState = data.states[0];
        const stateVector: StateVector = {
          icao24: rawState[0],
          callsign: rawState[1]?.trim() || null,
          originCountry: rawState[2] || null,
          timePosition: rawState[3] || null,
          lastContact: rawState[4] || null,
          longitude: rawState[5] || null,
          latitude: rawState[6] || null,
          baroAltitude: rawState[7] || null,
          onGround: rawState[8] || false,
          velocity: rawState[9] || null,
          trueTrack: rawState[10] || null,
          verticalRate: rawState[11] || null,
          sensors: rawState[12] || null,
          geoAltitude: rawState[13] || null,
          squawk: rawState[14] || null,
          spi: rawState[15] || false,
          positionSource: rawState[16] || 0,
          category: rawState[17] || null,
          timestamp: data.time || Math.floor(Date.now() / 1000)
        };
        
        // Update rate limit tracking
        lastRequestTime = Date.now();
        requestCount++;
        
        // Cache the state
        aircraftCache.addState(icao24, stateVector);
        aircraftCache.updateLastPolled(icao24);
        
        return stateVector;
      }
      return null;
    } else if (response.status === 404) {
      return null;
    } else {
      throw {
        status: response.status,
        message: `OpenSky API returned error ${response.status}: ${response.statusText}`,
        source: 'opensky'
      } as ApiError;
    }
  } catch (error) {
    if ((error as ApiError).source) {
      throw error;
    }
    
    throw {
      status: 500,
      message: `Error connecting to OpenSky API: ${(error as Error).message}`,
      source: 'opensky'
    } as ApiError;
  }
}

// Start periodic cache cleanup
setInterval(() => {
  aircraftCache.cleanup();
}, 60 * 60 * 1000); // Clean up every hour
