import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plane } from 'lucide-react';
import useAircraftData from '@/hooks/useAircraftData';
import AircraftState from '@/components/AircraftState';
import AircraftStateDetails from '@/components/AircraftStateDetails';
import AircraftMap from '@/components/AircraftMap';
import { ApiError } from '@/types/errors';

export default function Index() {
  const [searchTerm, setSearchTerm] = useState('');
  const { aircraftData, isLoading, searchAircraft, refreshState } = useAircraftData();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      searchAircraft(searchTerm.trim().toUpperCase());
    }
  };

  const handleExampleClick = (example: string) => {
    setSearchTerm(example);
    searchAircraft(example);
  };

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
        <CardContent className="pt-6">
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
            <AircraftMap state={aircraftData.currentState} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 justify-center">
        {['N12345', 'N54321', 'N98765'].map((example) => (
          <button
            key={example}
            onClick={() => handleExampleClick(example)}
            className="px-3 py-1.5 bg-white/60 hover:bg-white/80 backdrop-blur-sm rounded-lg text-sm text-red-900 border border-white/30 transition-all hover:shadow-md"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
