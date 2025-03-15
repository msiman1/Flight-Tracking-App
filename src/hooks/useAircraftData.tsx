import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { AircraftData, StateVector } from '@/types/aircraft';
import { getTailToIcao, getCurrentStateByIcao } from '@/services/aircraftApi';

// Define the return type of the hook
interface UseAircraftDataReturn {
  aircraftData: AircraftData;
  isLoading: boolean;
  error: string | null;
  searchAircraft: (query: string) => Promise<void>;
  refreshState: () => void;
}

// Initial state for AircraftData
const initialAircraftData: AircraftData = {
  icao24: '',
  tailNumber: '',
  currentState: null,
  isLoading: false,
  error: null,
  lastUpdated: Date.now()
};

const useAircraftData = (): UseAircraftDataReturn => {
  const [aircraftData, setAircraftData] = useState<AircraftData>(initialAircraftData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if environment variables are set
  if (!import.meta.env.VITE_ADSBDB_BASE_URL || !import.meta.env.VITE_OPENSKY_BASE_URL) {
    toast.error('Missing environment variables', {
      description: 'Please check your environment configuration.'
    });
  }

  const searchAircraft = useCallback(async (query: string) => {
    console.log('searchAircraft called with query:', query);
    toast.info(`Searching for ${query}...`);
    setLoading(true);
    setError(null);

    try {
      let icao: string;
      let tailNumber: string = query;

      // Check if the query is already an ICAO24 code (24-bit hex)
      const isIcao24 = /^[0-9a-f]{6}$/i.test(query.toLowerCase());

      if (isIcao24) {
        icao = query.toLowerCase();
      } else {
        // If not an ICAO24, treat it as a tail number and fetch the ICAO
        console.log('Fetching ICAO code for tailNumber:', query);
        icao = await getTailToIcao(query);
        console.log('ICAO code received:', icao);
      }

      if (!icao) {
        setError('ICAO code not found for the provided identifier.');
        setAircraftData(prev => ({ ...prev, tailNumber: query, error: 'ICAO code not found.' }));
        return;
      }
      
      // Fetch the current state using the ICAO code
      console.log('Fetching current state for ICAO:', icao);
      const currentState: StateVector | null = await getCurrentStateByIcao(icao);
      console.log('Current state received:', currentState);
      
      if (!currentState) {
        setError('No current state data available.');
        toast.error('The aircraft is not currently being tracked.');
      }

      const newData: AircraftData = {
        icao24: icao,
        tailNumber: isIcao24 ? currentState?.callsign || icao : tailNumber,
        currentState,
        isLoading: false,
        error: null,
        lastUpdated: Date.now()
      };
      
      console.log('New Aircraft Data set to:', newData);
      
      setAircraftData(newData);
    } catch (err: any) {
      console.error('Error in searchAircraft:', err);
      setError(err.message || 'An error occurred while fetching aircraft data.');
      setAircraftData(prev => ({ ...prev, error: err.message || 'Error occurred' }));
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshState = useCallback(() => {
    if (aircraftData.icao24) {
      searchAircraft(aircraftData.icao24);
    }
  }, [aircraftData.icao24, searchAircraft]);

  // Combine local state with aircraftData state
  const combinedData: AircraftData = {
    ...aircraftData,
    isLoading: loading,
    error: error,
    lastUpdated: aircraftData.lastUpdated
  };

  return {
    aircraftData: combinedData,
    isLoading: loading,
    error,
    searchAircraft,
    refreshState
  };
};

export default useAircraftData;
