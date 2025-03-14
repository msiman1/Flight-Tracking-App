import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { AircraftData, StateVector } from '@/types/aircraft';
import { getTailToIcao, getCurrentStateByIcao } from '@/services/aircraftApi';

// Define the return type of the hook
interface UseAircraftDataReturn {
  aircraftData: AircraftData;
  isLoading: boolean;
  error: string | null;
  searchAircraft: (tailNumber: string) => Promise<void>;
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

  const searchAircraft = useCallback(async (tailNumber: string) => {
    console.log('searchAircraft called with tailNumber:', tailNumber);
    toast.info(`Searching for ${tailNumber}...`);
    setLoading(true);
    setError(null);
    console.log('Fetching ICAO code for tailNumber:', tailNumber);
    try {
      // Fetch the ICAO code using the tail number
      const icao = await getTailToIcao(tailNumber);
      if (!icao) {
        setError('ICAO code not found for the provided tail number.');
        setAircraftData(prev => ({ ...prev, tailNumber, error: 'ICAO code not found.' }));
        return;
      }
      
      // Fetch the current state using the ICAO code
      const currentState: StateVector | null = await getCurrentStateByIcao(icao);
      if (!currentState) {
        setError('No current state data available.');
        toast.error('The aircraft is not currently being tracked.');
      }

      const newData: AircraftData = {
        icao24: icao,
        tailNumber,
        currentState,
        isLoading: false,
        error: null,
        lastUpdated: Date.now()
      };
      
      console.log('New Aircraft Data set to:', newData);
      
      setAircraftData(newData);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching aircraft data.');
      setAircraftData(prev => ({ ...prev, error: err.message || 'Error occurred' }));
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshState = useCallback(() => {
    if (aircraftData.tailNumber) {
      searchAircraft(aircraftData.tailNumber);
    }
  }, [aircraftData.tailNumber, searchAircraft]);

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
