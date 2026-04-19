import { useCallback, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { GoogleMapView, Marker } from '@/components/Map';
import { Button } from '@/components/Button';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { theme } from '@/components/theme';
import { generateItinerary, getTrip } from '@/services/trips';
import type { Trip } from '@/types';

const BLOCK_ORDER: ('morning' | 'afternoon' | 'evening')[] = ['morning', 'afternoon', 'evening'];
const BLOCK_LABEL = { morning: '☀️ Morning', afternoon: '🌤️ Afternoon', evening: '🌙 Evening' } as const;

export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const load = useCallback(async () => {
    try {
      if (id) setTrip(await getTrip(id));
    } catch (e) {
      Alert.alert('Failed to load trip', (e as Error).message);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const regenerate = async () => {
    if (!trip) return;
    const placeIds = trip.places.map((p) => p.id);
    if (placeIds.length === 0) {
      Alert.alert('Add saved places to this trip first.');
      return;
    }
    setRegenerating(true);
    try {
      const updated = await generateItinerary(trip.id, placeIds);
      setTrip(updated);
    } catch (e) {
      Alert.alert('Regeneration failed', (e as Error).message);
    } finally {
      setRegenerating(false);
    }
  };

  const bottomSheetRef = useRef<BottomSheet>(null);

  if (!trip) return <LoadingState />;

  const totalItems = trip.days.reduce((acc, d) => acc + d.items.length, 0);

  // Find places with lat/lon for the map markers
  const mapPlaces = trip.places.filter(p => p.latitude != null && p.longitude != null);
  const initialRegion = mapPlaces.length > 0 ? {
    latitude: mapPlaces[0].latitude!,
    longitude: mapPlaces[0].longitude!,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  } : undefined;

  const snapPoints = ['25%', '50%', '90%'];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Background Map taking up the full screen */}
      <View style={StyleSheet.absoluteFillObject}>
        <GoogleMapView 
          style={styles.map} 
          initialRegion={initialRegion}
        >
          {mapPlaces.map(p => (
             <Marker
                key={p.id}
                coordinate={{ latitude: p.latitude!, longitude: p.longitude! }}
                title={p.normalized_name}
                description={p.category || undefined}
             />
          ))}
        </GoogleMapView>
      </View>

      {/* Floating Bottom Sheet for Itinerary */}
      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetIndicator}
      >
        <View style={styles.headerStack}>
          <Text style={styles.title}>{trip.title}</Text>
          <Text style={styles.sub}>{trip.destination ?? 'Destination TBD'}</Text>
          <Text style={styles.dates}>{trip.start_date} → {trip.end_date}</Text>
        </View>

        <BottomSheetScrollView contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: 32 }}>
          <Button title={regenerating ? 'Generating…' : '✨ Regenerate itinerary'} onPress={regenerate} loading={regenerating} />

          {totalItems === 0 ? (
            <EmptyState title="No itinerary yet" subtitle="Tap regenerate to plan your days." />
          ) : null}

          {trip.days.map((day) => (
            <View key={day.id} style={styles.dayCard}>
              <Text style={styles.dayTitle}>Day {day.day_number} · {day.day_date}</Text>
              {day.summary ? <Text style={styles.daySummary}>{day.summary}</Text> : null}

              {BLOCK_ORDER.map((block) => {
                const items = day.items.filter((i) => i.block === block).sort((a, b) => a.position - b.position);
                if (items.length === 0) return null;
                return (
                  <View key={block} style={styles.block}>
                    <Text style={styles.blockLabel}>{BLOCK_LABEL[block]}</Text>
                    {items.map((it) => (
                      <View key={it.id} style={styles.item}>
                        <Text style={styles.itemTitle}>{it.title}</Text>
                        {it.rationale ? <Text style={styles.itemBody}>{it.rationale}</Text> : null}
                        {it.estimated_travel_minutes ? (
                          <Text style={styles.itemMeta}>~{it.estimated_travel_minutes} min travel</Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          ))}
        </BottomSheetScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetBackground: {
    backgroundColor: theme.colors.bg,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
  },
  sheetIndicator: {
    backgroundColor: theme.colors.border,
  },
  headerStack: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
  },
  title: { color: theme.colors.text, fontSize: 26, fontWeight: '800' },
  sub: { color: theme.colors.textDim, marginTop: 4 },
  dates: { color: theme.colors.accentSoft, marginTop: 6 },
  dayCard: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: 16,
    gap: 10,
  },
  dayTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
  daySummary: { color: theme.colors.textDim, fontStyle: 'italic' },
  block: { gap: 8 },
  blockLabel: { color: theme.colors.accentSoft, fontWeight: '700', marginTop: 4 },
  item: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: theme.radius.md,
    padding: 12,
    gap: 4,
  },
  itemTitle: { color: theme.colors.text, fontWeight: '600' },
  itemBody: { color: theme.colors.textDim, fontSize: 13 },
  itemMeta: { color: theme.colors.textDim, fontSize: 11 },
});
