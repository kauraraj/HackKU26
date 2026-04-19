import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { Alert, StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import type MapView from 'react-native-maps';
import { Clock } from 'lucide-react-native';
import { GoogleMapView, Marker, RoutePolyline } from '@/components/Map';
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
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [optimizedRouteOrder, setOptimizedRouteOrder] = useState<Record<string, number[]>>({});
  const [directionsError, setDirectionsError] = useState(false);
  const { colors } = useTheme();

  const load = useCallback(async () => {
    try {
      if (id) {
        const fetchedTrip = await getTrip(id);
        setTrip(fetchedTrip);
        if (fetchedTrip?.days?.length > 0 && !selectedDayId) {
          setSelectedDayId(fetchedTrip.days[0].id);
        }
      }
    } catch (e) {
      Alert.alert('Failed to load trip', (e as Error).message);
    }
  }, [id, selectedDayId]);

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
  const mapRef = useRef<MapView>(null);
  const hasFittedRef = useRef(false);

  // All unique geocoded places across every day — shown as markers simultaneously
  const allMapPlaces = useMemo(() => {
    if (!trip) return [];
    const seen = new Set<string>();
    const result: typeof trip.places = [];
    for (const day of trip.days) {
      for (const item of day.items) {
        if (item.saved_place_id && !seen.has(item.saved_place_id)) {
          const place = trip.places.find(p => p.id === item.saved_place_id);
          if (place && place.latitude != null && place.longitude != null) {
            seen.add(item.saved_place_id);
            result.push(place);
          }
        }
      }
    }
    return result;
  }, [trip]);

  // Ordered places for the selected day (route-optimized when available)
  const selectedDayPlaces = useMemo(() => {
    if (!trip || !selectedDayId) return [];
    const day = trip.days.find(d => d.id === selectedDayId);
    if (!day) return [];

    const items = [...day.items].sort((a, b) => {
      const bDiff = BLOCK_ORDER.indexOf(a.block) - BLOCK_ORDER.indexOf(b.block);
      if (bDiff !== 0) return bDiff;
      return a.position - b.position;
    });

    const placesSeq: typeof trip.places = [];
    for (const it of items) {
      if (it.saved_place_id) {
        const place = trip.places.find(p => p.id === it.saved_place_id);
        if (place && place.latitude != null && place.longitude != null) {
          placesSeq.push(place);
        }
      }
    }

    const orderRef = optimizedRouteOrder[selectedDayId];
    if (orderRef && placesSeq.length > 2 && orderRef.length === placesSeq.length - 2) {
      const start = placesSeq[0];
      const end = placesSeq[placesSeq.length - 1];
      const middle = placesSeq.slice(1, -1);
      return [start, ...orderRef.map((idx) => middle[idx]), end];
    }

    return placesSeq;
  }, [trip, selectedDayId, optimizedRouteOrder]);

  useEffect(() => { setDirectionsError(false); }, [selectedDayId]);

  const mapPlaces = selectedDayPlaces;

  const getBoundingRegion = (places: { latitude: number | null; longitude: number | null }[]) => {
    if (places.length === 0) return undefined;
    const lats = places.map(p => p.latitude!);
    const lons = places.map(p => p.longitude!);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.05),
      longitudeDelta: Math.max((maxLon - minLon) * 1.5, 0.05),
    };
  };

  const initialRegion = useMemo(() => getBoundingRegion(allMapPlaces), [allMapPlaces]);

  // Fit camera to cover all places once on mount
  useEffect(() => {
    if (allMapPlaces.length > 0 && !hasFittedRef.current) {
      hasFittedRef.current = true;
      setTimeout(() => {
        try {
          mapRef.current?.fitToCoordinates(
            allMapPlaces.map(p => ({ latitude: p.latitude!, longitude: p.longitude! })),
            { edgePadding: { top: 50, right: 50, bottom: 400, left: 50 }, animated: true }
          );
        } catch {}
      }, 500);
    }
  }, [allMapPlaces]);

  if (!trip) return <LoadingState />;

  const totalItems = trip.days.reduce((acc, d) => acc + d.items.length, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={StyleSheet.absoluteFillObject}>
        <GoogleMapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
        >
          {allMapPlaces.map((p) => (
            <Marker
              key={p.id}
              coordinate={{ latitude: p.latitude!, longitude: p.longitude! }}
              title={p.normalized_name}
              description={p.category || undefined}
            />
          ))}
          {mapPlaces.length > 1 && !directionsError && (
            <RoutePolyline
              origin={{ latitude: mapPlaces[0].latitude!, longitude: mapPlaces[0].longitude! }}
              destination={{ latitude: mapPlaces[mapPlaces.length - 1].latitude!, longitude: mapPlaces[mapPlaces.length - 1].longitude! }}
              waypoints={mapPlaces.slice(1, -1).map(p => ({ latitude: p.latitude!, longitude: p.longitude! }))}
              apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
              strokeWidth={4}
              strokeColor={colors.primary}
              optimizeWaypoints={true}
              onReady={(result) => {
                if (result.waypointOrder && result.waypointOrder.length > 0 && selectedDayId) {
                  setOptimizedRouteOrder(prev => {
                    const currentOrder = prev[selectedDayId];
                    if (currentOrder && JSON.stringify(currentOrder) === JSON.stringify(result.waypointOrder)) {
                      return prev;
                    }
                    return { ...prev, [selectedDayId]: result.waypointOrder };
                  });
                }
              }}
              onError={(errorMessage) => {
                console.warn('Route request failed:', errorMessage);
                setDirectionsError(true);
              }}
            />
          )}
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
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelectorRow}>
              {trip.days.map((d) => {
                const isSel = d.id === selectedDayId;
                return (
                  <Pressable key={d.id} onPress={() => setSelectedDayId(d.id)}>
                    <View style={[
                      styles.daySelectorTab,
                      { borderColor: isSel ? colors.primary : colors.border },
                      isSel && { backgroundColor: colors.primary },
                    ]}>
                      <Text style={[styles.daySelectorText, { color: isSel ? '#fff' : colors.foreground }]}>
                        Day {d.day_number}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {trip.days.filter(d => d.id === selectedDayId).map((day) => (
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
  daySelectorRow: { marginBottom: 8, paddingBottom: 8 },
  daySelectorTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  daySelectorText: { fontWeight: '600' },
});
