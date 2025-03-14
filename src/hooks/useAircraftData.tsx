import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { AircraftData, StateVector } from '@/types/aircraft';
import { ApiError, AircraftError } from '@/types/errors';
import { getTailToIcao, getCurrentStateByIcao } from '@/services/aircraftApi';

interface UseAircraftDataReturn {
  aircraftData: AircraftData | null;
  isLoading: boolean;
  error: AircraftError | null;
  searchAircraft: (tailNumber: string) => Promise<void>;
  refreshState: () => Promise<void>;
}

const useAircraftData = (): UseAircraftDataReturn => {
  const [aircraftData, setAircraftData] = useState<AircraftData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<AircraftError | null>(null);
  const { toast } = useToast();

  // Check if environment variables are set
  if (!import.meta.env.VITE_ADSBDB_BASE_URL || !import.meta.env.VITE_OPENSKY_BASE_URL) {
    console.error('Missing required environment variables');
    toast({
      title: 'Configuration Error',
      description: 'Application is not properly configured. Please check environment variables.',
      variant: 'destructive',
      duration: 5000,
    });
  }

  const searchAircraft = async (tailNumber: string) => {
    if (!tailNumber || tailNumber.trim() === '') {
      setError({
        message: 'Please enter a valid tail number',
        source: 'tailNumber'
      });
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid tail number',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Convert tail number to ICAO24 code
      let icao24: string;
      
      try {
        icao24 = await getTailToIcao(tailNumber);
      } catch (err) {
        const apiError = err as ApiError;
        setError({
          message: apiError.message || `Could not find ICAO24 code for ${tailNumber}`,
          source: 'icao24',
          status: apiError.status
        });
        
        toast({
          title: 'Aircraft Not Found',
          description: `Could not find ICAO24 code for tail number ${tailNumber}`,
          variant: 'destructive',
          duration: 5000,
        });
        
        setIsLoading(false);
        return;
      }
      
      // 2. Get current state from OpenSky
      try {
        const stateVector = await getCurrentStateByIcao(icao24);
        
        setAircraftData({
          icao24: icao24,
          tailNumber: tailNumber.toUpperCase(),
          currentState: stateVector,
          isLoading: false,
          error: null,
          lastUpdated: Date.now()
        });
        
        if (!stateVector) {
          toast({
            title: 'Aircraft Not Active',
            description: `No current flight data found for ${tailNumber}. The aircraft might not be in flight.`,
            duration: 5000,
          });
        } else {
          toast({
            title: 'Aircraft Found',
            description: `Retrieved current position for ${tailNumber}`,
            duration: 3000,
          });
        }
      } catch (err) {
        const apiError = err as ApiError;
        console.error("Error fetching state:", apiError);
        
        if (apiError.status === 429) {
          setError({
            message: 'Daily request limit reached. Try again tomorrow.',
            source: 'state',
            status: apiError.status
          });
          
          toast({
            title: 'Rate Limit Exceeded',
            description: 'Daily request limit reached. Try again tomorrow.',
            variant: 'destructive',
            duration: 5000,
          });
        } else {
          setError({
            message: apiError.message || 'Failed to retrieve current aircraft data',
            source: 'state',
            status: apiError.status,
            retry: true
          });
          
          toast({
            title: 'API Error',
            description: `Failed to retrieve current position: ${apiError.message}`,
            variant: 'destructive',
            duration: 5000,
          });
        }
        
        // Still keep the aircraft data we found, just with null state
        setAircraftData({
          icao24: icao24,
          tailNumber: tailNumber.toUpperCase(),
          currentState: null,
          isLoading: false,
          error: apiError.message || 'Failed to retrieve current aircraft data',
          lastUpdated: Date.now()
        });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError({
        message: 'An unexpected error occurred while processing your request',
        source: 'general'
      });
      
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshState = async () => {
    if (!aircraftData) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const stateVector = await getCurrentStateByIcao(aircraftData.icao24);
      
      setAircraftData({
        ...aircraftData,
        currentState: stateVector,
        error: null,
        lastUpdated: Date.now()
      });
      
      if (!stateVector) {
        toast({
          title: 'Aircraft Not Active',
          description: `No current flight data found for ${aircraftData.tailNumber}. The aircraft might not be in flight.`,
          duration: 5000,
        });
      } else {
        toast({
          title: 'Data Refreshed',
          description: `Updated position for ${aircraftData.tailNumber}`,
          duration: 3000,
        });
      }
    } catch (err) {
      const apiError = err as ApiError;
      
      if (apiError.status === 429) {
        setError({
          message: 'Daily request limit reached. Try again tomorrow.',
          source: 'state',
          status: apiError.status
        });
        
        toast({
          title: 'Rate Limit Exceeded',
          description: 'Daily request limit reached. Try again tomorrow.',
          variant: 'destructive',
          duration: 5000,
        });
      } else {
        setError({
          message: apiError.message || 'Failed to refresh aircraft data',
          source: 'state',
          status: apiError.status,
          retry: true
        });
        
        toast({
          title: 'Refresh Error',
          description: `Failed to update position: ${apiError.message}`,
          variant: 'destructive',
          duration: 5000,
        });
      }
      
      setAircraftData({
        ...aircraftData,
        error: apiError.message || 'Failed to refresh aircraft data',
        lastUpdated: Date.now()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    aircraftData,
    isLoading,
    error,
    searchAircraft,
    refreshState
  };
};

export default useAircraftData;
