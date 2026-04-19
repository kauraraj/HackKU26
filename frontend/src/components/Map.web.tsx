import { View, Text } from 'react-native';

export function GoogleMapView(props: any) {
  const { initialRegion, children } = props;
  
  if (!initialRegion) return (
     <View style={[{ alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2e8f0' }, props.style]}>
      <Text style={{ color: '#64748b' }}>Loading Map...</Text>
    </View>
  );

  return (
    <iframe
      width="100%"
      height="100%"
      style={{ border: 0 }}
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer"
      src={`https://www.google.com/maps/embed/v1/view?key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&center=${initialRegion.latitude},${initialRegion.longitude}&zoom=12`}
    ></iframe>
  );
}

export function Marker(props: any) {
  return null;
}