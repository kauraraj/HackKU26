import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
export function GoogleMapView(props: any) {
  return <MapView provider={PROVIDER_GOOGLE} {...props} />;
}
export { Marker };
