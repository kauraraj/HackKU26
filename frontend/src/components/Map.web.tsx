import { forwardRef, Children, isValidElement } from 'react';
import { View, Text } from 'react-native';

export const GoogleMapView = forwardRef<any, any>((props, ref) => {
  const { initialRegion, children } = props;
  
  if (!initialRegion) return (
     <View style={[{ alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2e8f0' }, props.style]}>
      <Text style={{ color: '#64748b' }}>Loading Map...</Text>
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

            if (directionsData) {
              var directionsService = new google.maps.DirectionsService();
              var directionsRenderer = new google.maps.DirectionsRenderer({
                map: map,
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: directionsData.strokeColor,
                  strokeWeight: 4
                }
              });

              directionsService.route({
                origin: directionsData.origin,
                destination: directionsData.destination,
                waypoints: directionsData.waypoints,
                optimizeWaypoints: directionsData.optimizeWaypoints,
                travelMode: 'DRIVING'
              }, function(response, status) {
                if (status === 'OK') {
                  directionsRenderer.setDirections(response);
                  // Extend bounds with route
                  response.routes[0].legs.forEach(function(leg) {
                    if (leg.start_location) bounds.extend(leg.start_location);
                    if (leg.end_location) bounds.extend(leg.end_location);
                    leg.steps.forEach(function(step) {
                      bounds.extend(step.start_location);
                      bounds.extend(step.end_location);
                    });
                  });
                  map.fitBounds(bounds);
                } else {
                  console.error('Directions request failed due to ' + status);
                }
              });
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

export function MapViewDirections(props: any) {
  return null;
}