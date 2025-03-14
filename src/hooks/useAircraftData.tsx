import { useState } from 'react';
import { toast } from 'sonner';
import { AircraftData, StateVector } from '@/types/aircraft';

const useAircraftData = () => {
  const [aircraftData, setAircraftData] = useState<AircraftData>({
    icao24: '',
    tailNumber: '',
    currentState: null,
    isLoading: false,
    error: null,
    lastUpdated: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Check if environment variables are set
  if (!import.meta.env.VITE_ADSBDB_BASE_URL || !import.meta.env.VITE_OPENSKY_BASE_URL) {
    toast.error('Missing environment variables', {
      description: 'Please check your environment configuration.'
    });
  }

  const searchAircraft = async (tailNumber: string) => {
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_ADSBDB_BASE_URL}/aircraft/${tailNumber}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Aircraft not found', {
            description: 'No aircraft found with this registration number.'
          });
          setAircraftData({
            icao24: '',
            tailNumber: tailNumber,
            currentState: null,
            isLoading: false,
            error: 'Aircraft not found',
            lastUpdated: null
          });
          return;
        }
        
        toast.error('Error fetching aircraft data', {
          description: 'Please try again later.'
        });
        setAircraftData({
          icao24: '',
          tailNumber: tailNumber,
          currentState: null,
          isLoading: false,
          error: 'Error fetching aircraft data',
          lastUpdated: null
        });
        return;
      }

      const data = await response.json();
      console.log("ADSBDB response data:", JSON.stringify(data, null, 2));
      
      let icao24 = data.icao24 || data.icao || data.mode_s;
      if (!icao24 && data.response && data.response.aircraft) {
        const aircraft = data.response.aircraft;
        if (Array.isArray(aircraft) && aircraft.length > 0) {
          icao24 = aircraft[0].icao24 || aircraft[0].icao || aircraft[0].mode_s;
        } else if (typeof aircraft === 'object') {
          icao24 = aircraft.icao24 || aircraft.icao || aircraft.mode_s;
        }
      }

      console.log("Extracted ICAO code:", icao24);

      if (!icao24) {
        toast.error('Invalid aircraft data', {
          description: 'The aircraft data received is invalid. Check the console for details.'
        });
        setAircraftData({
          icao24: '',
          tailNumber: tailNumber,
          currentState: null,
          isLoading: false,
          error: 'Invalid aircraft data',
          lastUpdated: null
        });
        return;
      }

      // Fetch current state from OpenSky
      const stateResponse = await fetch(
        `${import.meta.env.VITE_OPENSKY_BASE_URL}/states/all?icao24=${icao24}`
      );

      if (!stateResponse.ok) {
        toast.error('Error fetching state data', {
          description: 'Could not fetch current aircraft state.'
        });
        setAircraftData({
          icao24: icao24,
          tailNumber: tailNumber,
          currentState: null,
          isLoading: false,
          error: 'Error fetching state data',
          lastUpdated: null
        });
        return;
      }

      const stateData = await stateResponse.json();
      
      if (!stateData.states || stateData.states.length === 0) {
        toast.warning('No current state data', {
          description: 'The aircraft is not currently being tracked.'
        });
        setAircraftData({
          icao24: icao24,
          tailNumber: tailNumber,
          currentState: null,
          isLoading: false,
          error: null,
          lastUpdated: Date.now()
        });
        return;
      }

      const state = stateData.states[0];
      const currentState: StateVector = {
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

      setAircraftData({
        icao24: icao24,
        tailNumber: tailNumber,
        currentState,
        isLoading: false,
        error: null,
        lastUpdated: Date.now()
      });
    } catch (err) {
      toast.error('Network error', {
        description: 'Could not connect to the server.'
      });
      setAircraftData({
        icao24: '',
        tailNumber: tailNumber,
        currentState: null,
        isLoading: false,
        error: 'Network error',
        lastUpdated: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshState = async () => {
    if (!aircraftData.currentState?.icao24) {
      toast.error('No aircraft selected', {
        description: 'Please search for an aircraft first.'
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_OPENSKY_BASE_URL}/states/all?icao24=${aircraftData.currentState.icao24}`
      );

      if (!response.ok) {
        toast.error('Error refreshing state', {
          description: 'Could not fetch updated aircraft state.'
        });
        return;
      }

      const data = await response.json();
      
      if (!data.states || data.states.length === 0) {
        toast.warning('No current state data', {
          description: 'The aircraft is not currently being tracked.'
        });
        setAircraftData(prev => ({
          ...prev,
          lastUpdated: Date.now()
        }));
        return;
      }

      const state = data.states[0];
      const currentState: StateVector = {
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

      setAircraftData(prev => ({
        ...prev,
        currentState,
        error: null,
        lastUpdated: Date.now()
      }));
    } catch (err) {
      toast.error('Network error', {
        description: 'Could not connect to the server.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { aircraftData, isLoading, searchAircraft, refreshState };
};

export default useAircraftData;
