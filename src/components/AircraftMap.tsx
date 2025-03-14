import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { StateVector } from '@/types/aircraft';
import { Loader } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface AircraftMapProps {
  state: StateVector | null;
  isLoading?: boolean;
}

const AircraftMap: React.FC<AircraftMapProps> = ({ state, isLoading = false }) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const isMarkerAddedRef = useRef<boolean>(false);

  useEffect(() => {
    // Initialize map if it doesn't exist
    if (!mapRef.current) {
      mapRef.current = L.map('map').setView([0, 0], 2);
      
      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);

      // Create custom aircraft icon
      const aircraftIcon = L.divIcon({
        html: `
          <div class="relative">
            <div class="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            <div class="absolute -inset-1 bg-red-500 rounded-full opacity-25 animate-ping"></div>
          </div>
        `,
        className: 'aircraft-marker',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      // Create marker
      markerRef.current = L.marker([0, 0], { icon: aircraftIcon });
    }

    // Update marker position if we have state data
    if (state && state.latitude !== null && state.longitude !== null && mapRef.current) {
      const position: L.LatLngExpression = [state.latitude, state.longitude];
      
      // Add or move marker
      if (markerRef.current) {
        markerRef.current.setLatLng(position);
        
        // Add marker to map if not already added
        if (!isMarkerAddedRef.current) {
          markerRef.current.addTo(mapRef.current);
          isMarkerAddedRef.current = true;
        }

        // Update rotation based on true track
        if (state.trueTrack !== null) {
          const markerElement = markerRef.current.getElement();
          if (markerElement) {
            markerElement.style.transform = `translate(-50%, -50%) rotate(${state.trueTrack}deg)`;
          }
        }

        // Pan map to aircraft position
        mapRef.current.setView(position, 10);
      }
    } else if (markerRef.current && isMarkerAddedRef.current) {
      // Remove marker if no position data
      markerRef.current.remove();
      isMarkerAddedRef.current = false;
    }

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      isMarkerAddedRef.current = false;
    };
  }, [state]);

  return (
    <Card className="relative overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
          <Loader className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      )}
      <div id="map" className="h-[400px] w-full" />
    </Card>
  );
};

export default AircraftMap; 