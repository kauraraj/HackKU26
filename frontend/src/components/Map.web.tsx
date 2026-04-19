import { forwardRef, Children, isValidElement } from 'react';
import { View, Text } from 'react-native';

export const GoogleMapView = forwardRef<any, any>((props, ref) => {
  const { initialRegion, children } = props;
  
  if (!initialRegion) return (
    <View style={[{ alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2e8f0' }, props.style]}>
      <Text style={{ color: '#64748b' }}>Loading Map...</Text>
    </View>
  );

  if (!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) return (
    <View style={[{ alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef9c3' }, props.style]}>
      <Text style={{ color: '#92400e', fontWeight: '600', textAlign: 'center' }}>
        Map unavailable — set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in your .env.local
      </Text>
    </View>
  );

  const markers: any[] = [];
  let directions: any = null;

  Children.forEach(children, (child) => {
    if (isValidElement(child)) {
      const childProps = child.props as any;
      if (childProps.coordinate) {
        markers.push({
          lat: childProps.coordinate.latitude,
          lng: childProps.coordinate.longitude,
          title: childProps.title || '',
        });
      } else if (childProps.origin && childProps.destination) {
        directions = {
          origin: { lat: childProps.origin.latitude, lng: childProps.origin.longitude },
          destination: { lat: childProps.destination.latitude, lng: childProps.destination.longitude },
          waypoints: (childProps.waypoints || []).map((w: any) => ({ location: { lat: w.latitude, lng: w.longitude }, stopover: true })),
          optimizeWaypoints: childProps.optimizeWaypoints || false,
          strokeColor: childProps.strokeColor || '#ff0000',
        };
      }
    }
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          html, body { margin: 0; padding: 0; height: 100%; }
          #map { width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          function initMap() {
            var map = new google.maps.Map(document.getElementById('map'), {
              center: { lat: ${initialRegion.latitude}, lng: ${initialRegion.longitude} },
              zoom: 12,
              disableDefaultUI: true,
              zoomControl: true,
            });
            var markersData = ${JSON.stringify(markers)};
            var directionsData = ${JSON.stringify(directions)};
            var bounds = new google.maps.LatLngBounds();
            
            markersData.forEach(function(m) {
              var pos = { lat: m.lat, lng: m.lng };
              new google.maps.Marker({
                position: pos,
                map: map,
                title: m.title
              });
              bounds.extend(pos);
            });

            function decodePolyline(encoded) {
              var points = [], index = 0, lat = 0, lng = 0;
              while (index < encoded.length) {
                var shift = 0, result = 0, byte;
                do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
                lat += (result & 1) ? ~(result >> 1) : (result >> 1);
                shift = 0; result = 0;
                do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
                lng += (result & 1) ? ~(result >> 1) : (result >> 1);
                points.push({ lat: lat / 1e5, lng: lng / 1e5 });
              }
              return points;
            }

            function showErrorBanner() {
              var banner = document.createElement('div');
              banner.style.cssText = 'position:absolute;top:8px;left:50%;transform:translateX(-50%);background:#fef9c3;color:#92400e;padding:6px 12px;border-radius:6px;font-size:12px;font-family:sans-serif;z-index:999;white-space:nowrap;';
              banner.textContent = 'Route unavailable — places shown as pins';
              document.body.appendChild(banner);
            }

            if (directionsData) {
              var apiKey = '${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ''}';
              var reqBody = {
                origin: { location: { latLng: { latitude: directionsData.origin.lat, longitude: directionsData.origin.lng } } },
                destination: { location: { latLng: { latitude: directionsData.destination.lat, longitude: directionsData.destination.lng } } },
                travelMode: 'DRIVE',
              };
              if (directionsData.waypoints.length > 0) {
                reqBody.intermediates = directionsData.waypoints.map(function(w) {
                  return { location: { latLng: { latitude: w.location.lat, longitude: w.location.lng } } };
                });
                reqBody.optimizeWaypointOrder = directionsData.optimizeWaypoints;
              }
              fetch('https://routes.googleapis.com/directions/v2:computeRoutes?key=' + apiKey, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Goog-FieldMask': 'routes.polyline.encodedPolyline,routes.optimizedIntermediateWaypointIndex',
                },
                body: JSON.stringify(reqBody),
              })
                .then(function(r) {
                  return r.json().then(function(data) {
                    if (!r.ok) { console.error('Routes API error:', JSON.stringify(data)); throw new Error(r.status); }
                    return data;
                  });
                })
                .then(function(data) {
                  if (!data.routes || !data.routes.length) { showErrorBanner(); if (markersData.length > 0) map.fitBounds(bounds); return; }
                  var decoded = decodePolyline(data.routes[0].polyline.encodedPolyline);
                  new google.maps.Polyline({
                    path: decoded,
                    map: map,
                    strokeColor: directionsData.strokeColor,
                    strokeWeight: 4,
                  });
                  decoded.forEach(function(p) { bounds.extend(p); });
                  map.fitBounds(bounds);
                })
                .catch(function(err) { console.error('Routes fetch failed:', err); showErrorBanner(); if (markersData.length > 0) map.fitBounds(bounds); });
            } else if (markersData.length > 0) {
              map.fitBounds(bounds);
            }
          }
        </script>
        <script src="https://maps.googleapis.com/maps/api/js?key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&callback=initMap" async defer></script>
      </body>
    </html>
  `;

  return (
    <iframe
      width="100%"
      height="100%"
      style={{ border: 0 }}
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer"
      srcDoc={html}
    ></iframe>
  );
});

export function Marker(props: any) {
  return null;
}

export function RoutePolyline(props: any) {
  return null;
}