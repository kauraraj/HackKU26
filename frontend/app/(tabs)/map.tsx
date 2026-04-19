import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/context/ThemeContext';
import { mapPlaces } from '@/services/places';
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

  if (!AppleMaps && !GoogleMaps) {
    return (
      <Screen>
        <Text style={[styles.title, { color: colors.foreground }]}>Map</Text>
        <View style={[styles.unavailableCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <MapPin size={40} color={colors.mutedForeground} />
          <Text style={[styles.unavailableTitle, { color: colors.foreground }]}>Map preview unavailable</Text>
          <Text style={[styles.unavailableSub, { color: colors.mutedForeground }]}>
            Open the app on iOS or Android with a dev client built that includes expo-maps.
          </Text>
        </View>
        {places.map((p) => (
          <View key={p.id} style={[styles.locationRow, { borderBottomColor: colors.border }]}>
            <MapPin size={14} color={colors.primary} />
            <Text style={[styles.locationText, { color: colors.foreground }]}>
              {p.name}
            </Text>
            <Text style={[styles.locationCoords, { color: colors.mutedForeground }]}>
              {p.latitude.toFixed(2)}, {p.longitude.toFixed(2)}
            </Text>
          </View>
        ))}
      </Screen>
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

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800' },
  unavailableCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  unavailableTitle: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  unavailableSub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  locationText: { flex: 1, fontSize: 14, fontWeight: '500' },
  locationCoords: { fontSize: 12 },
});
