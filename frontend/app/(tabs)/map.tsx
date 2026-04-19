import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/context/ThemeContext';
import { mapPlaces } from '@/services/places';
import { GoogleMapView, Marker } from '@/components/Map';
import type { MapPlace } from '@/types';

let AppleMaps: any = null;
let GoogleMaps: any = null;
try {
  const maps = require('expo-maps');
  AppleMaps = maps.AppleMaps;
  GoogleMaps = maps.GoogleMaps;
} catch {
  // Expo Maps unavailable on web/dev client without module.
}

export default function MapTab() {
  const [places, setPlaces] = useState<MapPlace[]>([]);
  const { colors } = useTheme();

  useFocusEffect(
    useCallback(() => {
      mapPlaces().then(setPlaces).catch(() => setPlaces([]));
    }, [])
  );

  const markers = places.map((p) => ({
    coordinates: { latitude: p.latitude, longitude: p.longitude },
    title: p.name,
    tintColor: colors.primary,
  }));

  const initialRegion = places.length
    ? { latitude: places[0].latitude, longitude: places[0].longitude, latitudeDelta: 2, longitudeDelta: 2 }
    : { latitude: 40, longitude: -20, latitudeDelta: 60, longitudeDelta: 60 };

  // Uses expo-maps for native Apple/Google Maps UX.
  // Falls back to GoogleMapView (react-native-maps web iframe) on web.
  if (!AppleMaps && !GoogleMaps) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {places.length === 0 ? (
          <Screen>
            <EmptyState title="No saved places" subtitle="Save places from TikTok videos to see them on the map." />
          </Screen>
        ) : (
          <GoogleMapView style={{ flex: 1 }} initialRegion={initialRegion}>
            {places.map((p) => (
              <Marker
                key={p.id}
                coordinate={{ latitude: p.latitude, longitude: p.longitude }}
                title={p.name}
                description={p.category ?? undefined}
              />
            ))}
          </GoogleMapView>
        )}
      </View>
    );
  }

  const Maps = AppleMaps ?? GoogleMaps;
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Maps.View
        style={StyleSheet.absoluteFillObject}
        cameraPosition={{
          coordinates: { latitude: initialRegion.latitude, longitude: initialRegion.longitude },
          zoom: 6,
        }}
        markers={markers}
      />
    </View>
  );
}
