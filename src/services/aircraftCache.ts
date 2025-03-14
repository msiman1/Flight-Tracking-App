import { StateVector } from '@/types/aircraft';

interface CachedStateVector extends StateVector {
  cached: boolean;
}

interface AircraftCache {
  [icao24: string]: {
    states: CachedStateVector[];
    lastPolled: number;
  };
}

// Cache settings optimized for anonymous API usage
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration
const POLL_INTERVAL = 60 * 1000; // 1 minute polling interval
const MAX_STATES_PER_AIRCRAFT = 30; // Store up to 30 states per aircraft (5 minutes of data)

class AircraftCacheService {
  private cache: AircraftCache = {};
  
  // Add a new state vector to the cache
  public addState(icao24: string, state: StateVector): void {
    if (!this.cache[icao24]) {
      this.cache[icao24] = {
        states: [],
        lastPolled: Date.now()
      };
    }
    
    const cachedState: CachedStateVector = {
      ...state,
      cached: true
    };
    
    // Add the new state
    this.cache[icao24].states.push(cachedState);
    
    // Trim old states if we exceed the maximum
    if (this.cache[icao24].states.length > MAX_STATES_PER_AIRCRAFT) {
      this.cache[icao24].states = this.cache[icao24].states.slice(-MAX_STATES_PER_AIRCRAFT);
    }
  }
  
  // Get the most recent state for an aircraft
  public getLatestState(icao24: string): CachedStateVector | null {
    const states = this.cache[icao24]?.states;
    if (!states || states.length === 0) return null;
    
    const latestState = states[states.length - 1];
    const age = Date.now() - (latestState.timestamp * 1000);
    
    // Return null if the data is too old
    if (age > CACHE_DURATION) {
      return null;
    }
    
    return latestState;
  }
  
  // Check if we should poll for new data
  public shouldPoll(icao24: string): boolean {
    if (!this.cache[icao24]) return true;
    
    const timeSinceLastPoll = Date.now() - this.cache[icao24].lastPolled;
    return timeSinceLastPoll >= POLL_INTERVAL;
  }
  
  // Update the last polled timestamp
  public updateLastPolled(icao24: string): void {
    if (this.cache[icao24]) {
      this.cache[icao24].lastPolled = Date.now();
    }
  }
  
  // Clean up old cache entries
  public cleanup(): void {
    const now = Date.now();
    Object.keys(this.cache).forEach(icao24 => {
      // Remove states older than cache duration
      this.cache[icao24].states = this.cache[icao24].states.filter(state => {
        const age = now - (state.timestamp * 1000);
        return age <= CACHE_DURATION;
      });
      
      // Remove aircraft with no states
      if (this.cache[icao24].states.length === 0) {
        delete this.cache[icao24];
      }
    });
  }
}

export const aircraftCache = new AircraftCacheService(); 