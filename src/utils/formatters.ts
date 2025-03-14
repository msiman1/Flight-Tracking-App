// Utility to format a timestamp to readable date
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

// Utility to format a timestamp to readable time
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format a full datetime from a timestamp
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format a relative time (e.g., "2 minutes ago")
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  // Less than a minute
  if (diff < 60000) {
    return 'just now';
  }
  
  // Less than an hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  
  // Less than a day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  // Otherwise show the date
  return formatDateTime(timestamp / 1000);
}

// Format flight duration from two timestamps
export function formatDuration(startTime: number, endTime: number): string {
  const durationInSeconds = endTime - startTime;
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  
  if (hours === 0) {
    return `${minutes}m`;
  }
  
  return `${hours}h ${minutes}m`;
}

// Format distance in nautical miles
export function formatDistance(meters: number | null): string {
  if (meters === null) return 'Unknown';
  
  const nauticalMiles = meters / 1852;
  return `${nauticalMiles.toFixed(1)} NM`;
}

// Format altitude in feet
export function formatAltitude(meters: number | null): string {
  if (meters === null) return 'Unknown';
  
  const feet = meters * 3.28084;
  return `${Math.round(feet).toLocaleString()} ft`;
}

// Format speed in knots
export function formatSpeed(metersPerSecond: number | null): string {
  if (metersPerSecond === null) return 'Unknown';
  
  const knots = metersPerSecond * 1.94384;
  return `${Math.round(knots)} kts`;
}

// Format direction in degrees
export function formatDirection(degrees: number | null): string {
  if (degrees === null) return 'Unknown';
  
  // Convert degrees to cardinal direction
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  
  return `${Math.round(degrees)}° (${directions[index]})`;
}

// Get a meaningful callsign display
export function formatCallsign(callsign: string | null): string {
  if (!callsign || callsign.trim() === '') {
    return 'Unknown';
  }
  
  return callsign.trim();
}

// Airport name lookup (simple static map for common airports)
const airportNames: Record<string, string> = {
  'KJFK': 'John F. Kennedy Intl',
  'KLAX': 'Los Angeles Intl',
  'KORD': 'Chicago O\'Hare Intl',
  'KATL': 'Atlanta Hartsfield-Jackson',
  'KDFW': 'Dallas/Fort Worth Intl',
  'KSFO': 'San Francisco Intl',
  'KBOS': 'Boston Logan Intl',
  'KMIA': 'Miami Intl',
  'KLAS': 'Las Vegas Harry Reid Intl',
  'KSEA': 'Seattle-Tacoma Intl',
  'KDCA': 'Washington Reagan',
  'KIAD': 'Washington Dulles',
  'KPHL': 'Philadelphia Intl',
  'KDEN': 'Denver Intl',
  'KPHX': 'Phoenix Sky Harbor',
  'EGLL': 'London Heathrow',
  'EGLC': 'London City',
  'EGKK': 'London Gatwick',
  'LFPG': 'Paris Charles de Gaulle',
  'EDDF': 'Frankfurt Intl',
  'LEMD': 'Madrid Barajas',
  'LEBL': 'Barcelona El Prat',
  'LTBA': 'Istanbul Intl',
  'LTFM': 'Istanbul New Airport',
  'VHHH': 'Hong Kong Intl',
  'RJTT': 'Tokyo Haneda',
  'RJAA': 'Tokyo Narita',
  'ZBAA': 'Beijing Capital Intl',
  'KLGA': 'New York LaGuardia',
  'KEWR': 'Newark Liberty Intl',
  'KMCO': 'Orlando Intl',
  'KFLL': 'Fort Lauderdale Intl',
  'KEAU': 'Eau Claire Regional',
  'KSAN': 'San Diego Intl',
  'KPDX': 'Portland Intl',
  'PANC': 'Anchorage Intl',
  'PHNL': 'Honolulu Intl',
  'KSDF': 'Louisville Intl',
  'KPIT': 'Pittsburgh Intl'
};

// Get airport name from code
export function getAirportName(code: string | null): string {
  if (!code) return 'Unknown';
  return airportNames[code] || code;
}

// Format airport for display
export function formatAirport(code: string | null): string {
  if (!code) return 'Unknown';
  const name = getAirportName(code);
  
  if (name === code) {
    return code;
  }
  
  return `${name} (${code})`;
}
