import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/EmptyState';
import { theme } from '@/components/theme';
import { mapPlaces } from '@/services/places';
import { GoogleMapView, Marker } from '@/components/Map';
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
      <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
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
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <Maps.View
        style={{ flex: 1 }}
        cameraPosition={{ coordinates: { latitude: initialRegion.latitude, longitude: initialRegion.longitude }, zoom: 6 }}
        markers={markers}
      />
    </View>
  );
}

