import React from 'react';
import { AircraftData } from '@/types/aircraft';

interface DashboardProps {
  data: AircraftData;
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const { tailNumber, currentState, isLoading, error, lastUpdated } = data;

  const displayValue = (value: any) => (value === null || value === undefined ? 'N/A' : value);

  return (
    <div className="dashboard">
      <h2>Aircraft Dashboard</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          {error && <p className="error">{error}</p>}
          <p><strong>Tail Number:</strong> {displayValue(tailNumber)}</p>
          {currentState ? (
            <div className="state-data">
              <p><strong>ICAO:</strong> {displayValue(currentState.icao24)}</p>
              <p><strong>Callsign:</strong> {displayValue(currentState.callsign)}</p>
              <p><strong>Country:</strong> {displayValue(currentState.originCountry)}</p>
              <p><strong>Time Position:</strong> {displayValue(currentState.timePosition)}</p>
              <p><strong>Last Contact:</strong> {displayValue(currentState.lastContact)}</p>
              <p><strong>Coordinates:</strong> {displayValue(currentState.latitude)}, {displayValue(currentState.longitude)}</p>
              <p><strong>Altitude:</strong> {displayValue(currentState.baroAltitude)}</p>
              <p><strong>On Ground:</strong> {displayValue(currentState.onGround)}</p>
              <p><strong>Velocity:</strong> {displayValue(currentState.velocity)}</p>
              <p><strong>True Track:</strong> {displayValue(currentState.trueTrack)}</p>
              <p><strong>Vertical Rate:</strong> {displayValue(currentState.verticalRate)}</p>
            </div>
          ) : (
            <p>No current state data available.</p>
          )}
          {lastUpdated && <p><small>Last updated: {new Date(lastUpdated).toLocaleTimeString()}</small></p>}
        </>
      )}
    </div>
  );
};

export default Dashboard; 