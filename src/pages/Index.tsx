import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plane, Loader2 } from 'lucide-react';
import useAircraftData from '@/hooks/useAircraftData';
import AircraftState from '@/components/AircraftState';
import AircraftStateDetails from '@/components/AircraftStateDetails';
import AircraftMap from '@/components/AircraftMap';
import { ApiError } from '@/types/errors';
import Dashboard from '@/components/Dashboard';
import Chatbot from '@/components/Chatbot';

interface ActiveFlight {
  icao24: string;
  callsign: string;
  originCountry: string;
  longitude: number;
  latitude: number;
  altitude: number;
  velocity: number;
  trueTrack: number;
}

const Index: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFlights, setActiveFlights] = useState<ActiveFlight[]>([]);
  const [loadingFlights, setLoadingFlights] = useState(false);
  const { aircraftData, isLoading, searchAircraft, refreshState } = useAircraftData();

  const handleSearch = (e: React.FormEvent) => {
    console.log('handleSearch triggered with searchTerm:', searchTerm);
    e.preventDefault();
    if (searchTerm.trim()) {
      searchAircraft(searchTerm.trim().toUpperCase());
    }
  };

  const fetchActiveFlights = async () => {
    setLoadingFlights(true);
    try {
      const response = await fetch('/api/activeFlights');
      if (!response.ok) {
        throw new Error('Failed to fetch active flights');
      }
      const data = await response.json();
      setActiveFlights(data.flights);
    } catch (error) {
      console.error('Error fetching active flights:', error);
    } finally {
      setLoadingFlights(false);
    }
  };

  const handleFlightClick = (icao24: string) => {
    searchAircraft(icao24);
  };

  useEffect(() => {
    fetchActiveFlights();
  }, []);

  useEffect(() => {
    let refreshInterval: number | undefined;

    if (aircraftData?.currentState) {
      refreshInterval = window.setInterval(() => {
        refreshState();
      }, 15000);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [aircraftData?.currentState]);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card className="bg-white/70 border border-white/50">
        <CardContent className="pt-6 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter tail number (e.g., N12345)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              <Plane className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Active Flights</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchActiveFlights}
                disabled={loadingFlights}
              >
                {loadingFlights ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Refresh"
                )}
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {activeFlights.map((flight) => (
                <Button
                  key={flight.icao24}
                  variant="outline"
                  className="w-full text-left flex flex-col items-start p-3 h-auto"
                  onClick={() => handleFlightClick(flight.icao24)}
                >
                  <span className="font-medium">{flight.callsign}</span>
                  <span className="text-xs text-gray-500">{flight.originCountry}</span>
                </Button>
              ))}
              {loadingFlights && (
                Array(5).fill(0).map((_, i) => (
                  <div
                    key={i}
                    className="w-full h-[64px] bg-gray-100 animate-pulse rounded-md"
                  />
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {aircraftData?.currentState && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <AircraftState
              tailNumber={aircraftData.tailNumber}
              state={aircraftData.currentState}
              lastUpdated={aircraftData.lastUpdated ? new Date(aircraftData.lastUpdated) : null}
              isLoading={isLoading}
              error={aircraftData.error ? { source: 'opensky', message: aircraftData.error } as ApiError : null}
              onRefresh={refreshState}
            />

            {aircraftData.currentState && (
              <AircraftStateDetails
                state={aircraftData.currentState}
                isCached={false}
              />
            )}
          </div>

          <div className="h-[600px] lg:h-full min-h-[400px]">
            {aircraftData?.currentState &&
              aircraftData.currentState.latitude != null &&
              aircraftData.currentState.longitude != null
                ? <AircraftMap state={aircraftData.currentState} />
                : <Dashboard data={aircraftData} />
            }
          </div>
        </div>
      )}

      <Chatbot aircraftData={aircraftData} />
    </div>
  );
};

export default Index;
