import React from 'react';
import { Plane, Info, Navigation, MapPin, RotateCw, RefreshCw, AlertCircle } from 'lucide-react';
import { formatDistance, formatRelativeTime, formatAltitude, formatSpeed, formatDirection } from '@/utils/formatters';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StateVector } from '@/types/aircraft';
import { ApiError } from '@/types/errors';
import { cn } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface AircraftStateProps {
  tailNumber: string;
  state: StateVector | null;
  lastUpdated: Date | null;
  isLoading?: boolean;
  error?: ApiError | null;
  onRefresh?: () => void;
}

const AircraftState: React.FC<AircraftStateProps> = ({
  tailNumber,
  state,
  lastUpdated,
  isLoading,
  error,
  onRefresh
}) => {
  // Function to get status indicators based on aircraft state
  const getStatusInfo = () => {
    if (!state) {
      return {
        status: 'unknown',
        statusText: 'Not Currently Tracked',
        statusColor: 'text-gray-500'
      };
    }

    if (state.onGround) {
      return {
        status: 'ground',
        statusText: 'On Ground',
        statusColor: 'text-amber-500'
      };
    }

    return {
      status: 'airborne',
      statusText: 'In Flight',
      statusColor: 'text-red-500'
    };
  };

  const { status, statusText, statusColor } = getStatusInfo();

  return (
    <Card className={cn(
      "overflow-hidden glass-card bg-white/70 border border-white/50 transition-all duration-300",
      isLoading ? "opacity-70" : "opacity-100"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-red-500" />
            <CardTitle className="text-lg font-medium">Live Aircraft Data</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-xs px-2 py-0.5 rounded-full", statusColor, 
              status === 'airborne' ? "bg-red-100" : 
              status === 'ground' ? "bg-amber-100" : "bg-gray-100"
            )}>
              {statusText}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (error.source === 'opensky' || error.source === 'adsbdb') && (
          <Alert variant="destructive" className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Error Retrieving Data</AlertTitle>
            <AlertDescription>
              {error.message}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Registration</span>
                <div className="text-2xl font-semibold text-red-900">{tailNumber}</div>
              </div>
              
              {state?.callsign && (
                <div>
                  <span className="text-sm text-muted-foreground">Callsign</span>
                  <div className="text-xl font-medium">{state.callsign}</div>
                </div>
              )}
              
              {state?.originCountry && (
                <div>
                  <span className="text-sm text-muted-foreground">Country</span>
                  <div>{state.originCountry}</div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1">
            {state ? (
              <>
                {(state.latitude && state.longitude) ? (
                  <div className="mb-2">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Position
                    </span>
                    <div className="font-mono">
                      {state.latitude.toFixed(4)}° {state.latitude > 0 ? 'N' : 'S'},&nbsp; 
                      {state.longitude.toFixed(4)}° {state.longitude > 0 ? 'E' : 'W'}
                    </div>
                  </div>
                ) : (
                  <div className="mb-2">
                    <span className="text-sm text-muted-foreground">Position</span>
                    <div className="text-sm italic text-muted-foreground">No position data available</div>
                  </div>
                )}

                {state.baroAltitude !== null && (
                  <div className="mb-2">
                    <span className="text-sm text-muted-foreground">Altitude</span>
                    <div>{formatAltitude(state.baroAltitude)}</div>
                  </div>
                )}

                {state.velocity !== null && (
                  <div className="mb-2">
                    <span className="text-sm text-muted-foreground">Speed</span>
                    <div>{formatSpeed(state.velocity)}</div>
                  </div>
                )}

                {state.trueTrack !== null && (
                  <div>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Navigation className="h-3 w-3" /> Heading
                    </span>
                    <div>{formatDirection(state.trueTrack)}</div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center p-4">
                  <div className="text-muted-foreground mb-2">
                    No current tracking data available
                  </div>
                  <div className="text-sm text-muted-foreground">
                    The aircraft might not be in flight or outside coverage area
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="text-xs text-muted-foreground">
          Last updated {lastUpdated ? formatRelativeTime(lastUpdated.getTime()) : 'Never'}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          disabled={isLoading}
          className="ml-auto"
        >
          {isLoading ? (
            <div className="h-4 w-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin mr-2" />
          ) : (
            <RotateCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AircraftState;
