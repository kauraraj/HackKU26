import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/EmptyState';
import { theme } from '@/components/theme';
import { mapPlaces } from '@/services/places';
import type { MapPlace } from '@/types';

// expo-maps is imported lazily to avoid breaking web preview when the native module is absent.
let AppleMaps: any = null;
let GoogleMaps: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const maps = require('expo-maps');
  AppleMaps = maps.AppleMaps;
  GoogleMaps = maps.GoogleMaps;
} catch {
  // Expo Maps unavailable (e.g. web or dev client without module). We render a fallback list.
}

export default function MapTab() {
  const [places, setPlaces] = useState<MapPlace[]>([]);

  useFocusEffect(
    useCallback(() => {
      mapPlaces().then(setPlaces).catch(() => setPlaces([]));
    }, [])
  );

  const markers = places.map((p) => ({
    coordinates: { latitude: p.latitude, longitude: p.longitude },
    title: p.name,
    tintColor: theme.colors.accent,
  }));

  const initialRegion = places.length
    ? {
        latitude: places[0].latitude,
        longitude: places[0].longitude,
        latitudeDelta: 2,
        longitudeDelta: 2,
      }
    : { latitude: 40, longitude: -20, latitudeDelta: 60, longitudeDelta: 60 };

  if (!AppleMaps && !GoogleMaps) {
    return (
      <Screen>
        <Text style={styles.title}>Map</Text>
        <EmptyState
          title="Map preview unavailable"
          subtitle="Open the app on iOS or Android with a dev client built that includes expo-maps."
        />
        {places.map((p) => (
          <Text key={p.id} style={styles.fallbackRow}>
            📍 {p.name} — {p.latitude.toFixed(2)}, {p.longitude.toFixed(2)}
          </Text>
        ))}
      </Screen>
    );
  }

  const Maps = AppleMaps ?? GoogleMaps;
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <Maps.View
        style={{ flex: 1 }}
        cameraPosition={{ coordinates: { latitude: initialRegion.latitude, longitude: initialRegion.longitude }, zoom: 6 }}
        markers={markers}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.colors.text, fontSize: 28, fontWeight: '800' },
  fallbackRow: { color: theme.colors.text, fontSize: 14, marginBottom: 4 },
});
