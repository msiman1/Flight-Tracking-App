import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StateVector } from '@/types/aircraft';
import { 
  Plane, 
  ArrowUp, 
  ArrowDown, 
  Gauge, 
  Navigation2, 
  Radio, 
  Flag,
  Clock
} from 'lucide-react';
import { formatAltitude, formatSpeed, formatDirection } from '@/utils/formatters';

interface AircraftStateDetailsProps {
  state: StateVector;
  isCached?: boolean;
}

export function AircraftStateDetails({
  state,
  isCached = false
}: AircraftStateDetailsProps) {
  const lastContactTime = state.lastContact ? new Date(state.lastContact * 1000).toLocaleString() : 'Unknown';

  return (
    <Card className="bg-white/70 border border-white/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Technical Details</CardTitle>
          </div>
          {isCached && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
              Cached Data
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Flight Parameters */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-blue-600" />
            <div>
              <div className="text-sm text-gray-500">Ground Speed</div>
              <div className="font-medium">
                {state.velocity !== null ? formatSpeed(state.velocity) : 'N/A'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Navigation2 className="h-4 w-4 text-blue-600" />
            <div>
              <div className="text-sm text-gray-500">True Track</div>
              <div className="font-medium">
                {state.trueTrack !== null ? formatDirection(state.trueTrack) : 'N/A'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {state.verticalRate && state.verticalRate > 0 ? (
              <ArrowUp className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowDown className="h-4 w-4 text-red-600" />
            )}
            <div>
              <div className="text-sm text-gray-500">Vertical Rate</div>
              <div className="font-medium">
                {state.verticalRate !== null ? `${Math.abs(state.verticalRate)} ft/min` : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-blue-600" />
            <div>
              <div className="text-sm text-gray-500">Squawk</div>
              <div className="font-medium">
                {state.squawk || 'N/A'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-blue-600" />
            <div>
              <div className="text-sm text-gray-500">Origin Country</div>
              <div className="font-medium">
                {state.originCountry || 'N/A'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <div>
              <div className="text-sm text-gray-500">Last Contact</div>
              <div className="font-medium">
                {lastContactTime}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Data */}
        <div className="col-span-1 md:col-span-2 pt-2 border-t">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Barometric Altitude</div>
              <div className="font-medium">
                {state.baroAltitude !== null ? formatAltitude(state.baroAltitude) : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Geometric Altitude</div>
              <div className="font-medium">
                {state.geoAltitude !== null ? formatAltitude(state.geoAltitude) : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AircraftStateDetails; 