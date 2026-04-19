import { forwardRef, useState, useEffect } from 'react';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

type Coord = { latitude: number; longitude: number };

function decodePolyline(encoded: string): Coord[] {
  const points: Coord[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let shift = 0, result = 0, byte: number;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

type RoutePolylineProps = {
  origin: Coord;
  destination: Coord;
  waypoints?: Coord[];
  apikey: string;
  strokeWidth?: number;
  strokeColor?: string;
  optimizeWaypoints?: boolean;
  onReady?: (result: { waypointOrder: number[]; coordinates: Coord[] }) => void;
  onError?: (message: string) => void;
};

export function RoutePolyline({
  origin, destination, waypoints = [], apikey,
  strokeWidth = 3, strokeColor = '#0000ff',
  optimizeWaypoints = false, onReady, onError,
}: RoutePolylineProps) {
  const [coords, setCoords] = useState<Coord[]>([]);

  useEffect(() => {
    fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apikey,
        'X-Goog-FieldMask': 'routes.polyline.encodedPolyline,routes.optimizedIntermediateWaypointIndex',
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: origin.latitude, longitude: origin.longitude } } },
        destination: { location: { latLng: { latitude: destination.latitude, longitude: destination.longitude } } },
        intermediates: waypoints.map(w => ({ location: { latLng: { latitude: w.latitude, longitude: w.longitude } } })),
        travelMode: 'DRIVE',
        optimizeWaypointOrder: optimizeWaypoints,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (!data.routes?.length) { onError?.('No routes returned'); return; }
        const route = data.routes[0];
        const decoded = decodePolyline(route.polyline.encodedPolyline);
        setCoords(decoded);
        onReady?.({ waypointOrder: route.optimizedIntermediateWaypointIndex ?? [], coordinates: decoded });
      })
      .catch(e => onError?.(e.message));
  // waypoints array identity changes every render — stringify for stable comparison
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin.latitude, origin.longitude, destination.latitude, destination.longitude, JSON.stringify(waypoints), apikey, optimizeWaypoints]);

  if (coords.length === 0) return null;
  return <Polyline coordinates={coords} strokeWidth={strokeWidth} strokeColor={strokeColor} />;
}

export const GoogleMapView = forwardRef<MapView, any>((props, ref) => {
  return <MapView ref={ref} provider={PROVIDER_GOOGLE} {...props} />;
});
export { Marker };
