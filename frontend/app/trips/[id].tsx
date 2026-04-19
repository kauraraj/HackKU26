import { useCallback, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Sparkles, Clock } from 'lucide-react-native';
import { GoogleMapView, Marker } from '@/components/Map';
import { Button } from '@/components/Button';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/context/ThemeContext';
import { generateItinerary, getTrip } from '@/services/trips';
import type { Trip } from '@/types';

const BLOCK_ORDER: ('morning' | 'afternoon' | 'evening')[] = ['morning', 'afternoon', 'evening'];
const BLOCK_DOT_COLORS = { morning: '#38bdf8', afternoon: '#818cf8', evening: '#f472b6' };
const BLOCK_LABEL = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' };

export default function TripDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const { colors } = useTheme();
  const bottomSheetRef = useRef<BottomSheet>(null);

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

  if (!trip) return <LoadingState />;

  const totalItems = trip.days.reduce((acc, d) => acc + d.items.length, 0);

  const mapPlaces = trip.places.filter((p) => p.latitude != null && p.longitude != null);
  const initialRegion = mapPlaces.length > 0
    ? { latitude: mapPlaces[0].latitude!, longitude: mapPlaces[0].longitude!, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : undefined;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={StyleSheet.absoluteFillObject}>
        <GoogleMapView style={styles.map} initialRegion={initialRegion}>
          {mapPlaces.map((p) => (
            <Marker
              key={p.id}
              coordinate={{ latitude: p.latitude!, longitude: p.longitude! }}
              title={p.normalized_name}
              description={p.category || undefined}
            />
          ))}
        </GoogleMapView>
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={['25%', '50%', '90%']}
        backgroundStyle={{ backgroundColor: colors.card }}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
      >
        <View style={[styles.sheetHeader, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>{trip.title}</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>{trip.destination ?? 'Destination TBD'}</Text>
          <Text style={[styles.dates, { color: colors.primary }]}>{trip.start_date} → {trip.end_date}</Text>
        </View>

        <BottomSheetScrollView contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: 32 }}>
          <Button
            title={regenerating ? 'Generating…' : 'Regenerate itinerary'}
            onPress={regenerate}
            loading={regenerating}
          />

          {totalItems === 0 ? (
            <EmptyState title="No itinerary yet" subtitle="Tap regenerate to plan your days." />
          ) : null}

          {trip.days.map((day) => (
            <View key={day.id} style={[styles.dayCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.dayHeaderRow}>
                <Clock size={15} color={colors.primary} />
                <Text style={[styles.dayTitle, { color: colors.foreground }]}>Day {day.day_number} · {day.day_date}</Text>
              </View>
              {day.summary ? <Text style={[styles.daySummary, { color: colors.mutedForeground }]}>{day.summary}</Text> : null}

              {BLOCK_ORDER.map((block) => {
                const items = day.items.filter((i) => i.block === block).sort((a, b) => a.position - b.position);
                if (items.length === 0) return null;
                return (
                  <View key={block} style={styles.block}>
                    <View style={styles.blockLabelRow}>
                      <View style={[styles.blockDot, { backgroundColor: BLOCK_DOT_COLORS[block] }]} />
                      <Text style={[styles.blockLabel, { color: colors.foreground }]}>{BLOCK_LABEL[block]}</Text>
                    </View>
                    {items.map((it) => (
                      <View key={it.id} style={[styles.item, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                        <Text style={[styles.itemTitle, { color: colors.foreground }]}>{it.title}</Text>
                        {it.rationale ? <Text style={[styles.itemBody, { color: colors.mutedForeground }]}>{it.rationale}</Text> : null}
                        {it.estimated_travel_minutes ? (
                          <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>~{it.estimated_travel_minutes} min travel</Text>
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
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  sheetHeader: {
    padding: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 22, fontWeight: '800' },
  sub: { marginTop: 4, fontSize: 14 },
  dates: { marginTop: 6, fontSize: 14, fontWeight: '500' },
  dayCard: {
    borderRadius: 12,
    padding: 16,
    gap: 10,
    borderWidth: 1,
  },
  dayHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayTitle: { fontSize: 16, fontWeight: '700' },
  daySummary: { fontSize: 13, fontStyle: 'italic' },
  block: { gap: 8, marginTop: 4 },
  blockLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  blockDot: { width: 10, height: 10, borderRadius: 5 },
  blockLabel: { fontSize: 14, fontWeight: '600' },
  item: {
    borderRadius: 10,
    padding: 12,
    gap: 4,
    borderWidth: 1,
  },
  itemTitle: { fontWeight: '600', fontSize: 14 },
  itemBody: { fontSize: 13 },
  itemMeta: { fontSize: 11 },
});
