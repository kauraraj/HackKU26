import { forwardRef } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';

export const GoogleMapView = forwardRef<MapView, any>((props, ref) => {
  return <MapView ref={ref} provider={PROVIDER_GOOGLE} {...props} />;
});
export { Marker, MapViewDirections };
