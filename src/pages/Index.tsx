import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Plane } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import AircraftInfo from '@/components/AircraftInfo';
import AircraftState from '@/components/AircraftState';
import AircraftStateDetails from '@/components/AircraftStateDetails';
import AircraftMap from '@/components/AircraftMap';
import AnimatedTransition from '@/components/AnimatedTransition';
import useAircraftData from '@/hooks/useAircraftData';

const Index = () => {
  const [hasSearched, setHasSearched] = useState(false);
  const { aircraftData, isLoading, error, searchAircraft, refreshState } = useAircraftData();
  const [currentTailNumber, setCurrentTailNumber] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);

  // Set up interval for auto-refresh when aircraft data exists
  useEffect(() => {
    if (!autoRefresh || !aircraftData) return;
    
    const interval = setInterval(() => {
      refreshState();
    }, 60000); // Refresh every 60 seconds to stay within rate limits
    
    return () => clearInterval(interval);
  }, [autoRefresh, aircraftData, refreshState]);

  const handleSearch = async (tailNumber: string) => {
    setHasSearched(true);
    setCurrentTailNumber(tailNumber);
    await searchAircraft(tailNumber);
    // Enable auto-refresh after a successful search
    setAutoRefresh(true);
  };

  const handleRefresh = () => {
    if (aircraftData) {
      refreshState();
    } else if (currentTailNumber) {
      searchAircraft(currentTailNumber);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#fff5f5] to-[#ffe5e5] dark:from-[#1a202c] dark:to-[#2d3748]">
      <header className="pt-8 pb-6 px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container max-w-6xl mx-auto"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Plane className="h-8 w-8 text-red-500 animate-float" />
            <h1 className="text-3xl font-medium text-center">
              Live Aircraft Tracker
            </h1>
          </div>
          <p className="text-center text-muted-foreground max-w-lg mx-auto mb-6">
            Track private aircraft in real-time using tail numbers and registration data
          </p>
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        </motion.div>
      </header>

      <main className="flex-grow px-6 md:px-10 pb-20">
        <div className="container max-w-6xl mx-auto">
          <AnimatedTransition show={hasSearched}>
            <div className="mt-8 space-y-8">
              {aircraftData && (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-8">
                      <AircraftInfo 
                        tailNumber={aircraftData.tailNumber}
                        icao24={aircraftData.icao24}
                        isLoading={isLoading}
                      />
                      
                      <AircraftState
                        tailNumber={aircraftData.tailNumber}
                        icao24={aircraftData.icao24}
                        state={aircraftData.currentState}
                        lastUpdated={aircraftData.lastUpdated}
                        isLoading={isLoading}
                        error={aircraftData.error}
                        onRefresh={handleRefresh}
                      />
                    </div>
                    
                    <div className="space-y-8">
                      {aircraftData.currentState && (
                        <>
                          <AircraftMap 
                            state={aircraftData.currentState}
                            isLoading={isLoading}
                          />
                          <AircraftStateDetails
                            state={aircraftData.currentState}
                            lastUpdated={aircraftData.lastUpdated}
                            isCached={aircraftData.currentState.cached || false}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </AnimatedTransition>
          
          {!hasSearched && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mt-16 text-center"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="mx-auto w-32 h-32 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center mb-6"
              >
                <Plane className="h-16 w-16 text-red-500 animate-float" />
              </motion.div>
              <h2 className="text-2xl font-medium mb-3">Track Any Aircraft</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Enter an aircraft tail number to see its real-time position, speed, and flight data.
              </p>
              <div className="mt-8 flex flex-wrap gap-4 justify-center max-w-md mx-auto">
                {['N12345', 'G-ABCD', 'C-FTJK', 'VH-ABC'].map((example, i) => (
                  <button
                    key={example}
                    onClick={() => handleSearch(example)}
                    className="px-3 py-1.5 bg-white/60 hover:bg-white/80 backdrop-blur-sm rounded-lg text-sm text-red-900 border border-white/30 transition-all hover:shadow-md"
                    style={{ animationDelay: `${0.8 + i * 0.1}s` }}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <footer className="mt-auto py-4 px-4 bg-white/30 backdrop-blur-sm border-t border-white/20">
        <div className="container max-w-6xl mx-auto">
          <p className="text-xs text-center text-muted-foreground">
            Real-time aircraft data provided by OpenSky Network and ADSBDB. Updates every 60 seconds with a daily limit of 400 requests.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
