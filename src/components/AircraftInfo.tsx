
import React from 'react';
import { cn } from '@/lib/utils';
import { Plane } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AircraftInfoProps {
  tailNumber: string;
  icao24?: string;
  className?: string;
  isLoading?: boolean;
}

const AircraftInfo: React.FC<AircraftInfoProps> = ({
  tailNumber,
  icao24,
  className,
  isLoading = false,
}) => {
  return (
    <Card className={cn(
      "overflow-hidden glass-card bg-white/70 border border-white/50 transition-all duration-300",
      isLoading ? "opacity-70" : "opacity-100",
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-red-500" />
            <CardTitle className="text-lg font-medium">Aircraft Details</CardTitle>
          </div>
          {icao24 && (
            <Badge variant="outline" className="bg-white/50 backdrop-blur text-red-900 text-xs px-2 py-0.5">
              ICAO24: {icao24.toUpperCase()}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Registration</span>
            <span className="text-2xl font-semibold text-red-900">{tailNumber.toUpperCase()}</span>
          </div>
          
          {isLoading ? (
            <div className="animate-pulse space-y-3 mt-4">
              <div className="h-4 bg-secondary rounded w-3/4"></div>
              <div className="h-4 bg-secondary rounded w-1/2"></div>
              <div className="h-4 bg-secondary rounded w-2/3"></div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground mt-2">
              {icao24 ? 
                "Aircraft information retrieved successfully." : 
                "Search for flight data using the registration number."
              }
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AircraftInfo;
