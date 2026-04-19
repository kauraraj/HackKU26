import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { Alert, StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import type MapView from 'react-native-maps';
import { GoogleMapView, Marker, RoutePolyline } from '@/components/Map';
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
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [optimizedRouteOrder, setOptimizedRouteOrder] = useState<Record<string, number[]>>({});
  const [directionsError, setDirectionsError] = useState(false);

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

  // All unique places across every day — shown as markers simultaneously
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

  // Compute places for the selected day specifically
  const selectedDayPlaces = useMemo(() => {
    if (!trip || !selectedDayId) return [];
    const day = trip.days.find(d => d.id === selectedDayId);
    if (!day) return [];

    // Sort items chronologically: morning -> afternoon -> evening
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

    // Apply Google Directions optimized waypoint ordering if we have it
    const orderRef = optimizedRouteOrder[selectedDayId];
    if (orderRef && placesSeq.length > 2 && orderRef.length === placesSeq.length - 2) {
      const start = placesSeq[0];
      const end = placesSeq[placesSeq.length - 1];
      const middle = placesSeq.slice(1, -1);
      
      // reorder middle according to Google's TSP optimized order
      const optimizedMiddle = orderRef.map((idx) => middle[idx]);
      return [start, ...optimizedMiddle, end];
    }
    
    return placesSeq;
  }, [trip, selectedDayId, optimizedRouteOrder]);

  // Reset directions error when the selected day or places change
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

  // Stable region covering all places — does not change on day switch
  const initialRegion = useMemo(() => getBoundingRegion(allMapPlaces), [allMapPlaces]);

  // Fit camera to all places once after the map mounts
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

  const snapPoints = ['25%', '50%', '90%'];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Background Map taking up the full screen */}
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
              strokeColor={theme.colors.accent}
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
                console.warn('Directions request failed:', errorMessage);
                setDirectionsError(true);
              }}
            />
          )}

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
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelectorRow}>
              {trip.days.map((d) => {
                const isSel = d.id === selectedDayId;
                return (
                  <Pressable key={d.id} onPress={() => setSelectedDayId(d.id)}>
                    <View style={[styles.daySelectorTab, isSel && styles.daySelectorTabActive]}>
                      <Text style={[styles.daySelectorText, isSel && styles.daySelectorTextActive]}>
                        Day {d.day_number}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {trip.days.filter(d => d.id === selectedDayId).map((day) => (
            <View key={day.id} style={styles.dayCard}>
              <Text style={styles.dayTitle}>Day {day.day_number} · {day.day_date}</Text>
              {day.summary ? <Text style={styles.daySummary}>{day.summary}</Text> : null}

              {/* Show items by the optimal day routing if available */}
              <View style={[styles.block, { marginTop: 12 }]}>
                {mapPlaces.length > 0 ? (
                  <>
                    <Text style={styles.blockLabel}>🚕 Optimal Route</Text>
                    {mapPlaces.map((p, idx) => {
                      const it = day.items.find(i => i.saved_place_id === p.id);
                      if (!it) return null;
                      return (
                        <View key={`${it.id}-${idx}`} style={styles.item}>
                          <Text style={styles.itemTitle}>{idx + 1}. {it.title}</Text>
                          {it.rationale ? <Text style={styles.itemBody}>{it.rationale}</Text> : null}
                          <Text style={styles.itemMeta}>Scheduled originally for {BLOCK_LABEL[it.block]}</Text>
                        </View>
                      );
                    })}
                  </>
                ) : null}
                
                {/* Fallback for items missing map coordinates */}
                {day.items.filter(i => !mapPlaces.find(mp => mp.id === i.saved_place_id)).map(it => (
                  <View key={it.id} style={[styles.item, { marginTop: 8 }]}>
                     <Text style={styles.itemTitle}>{it.title}</Text>
                     {it.rationale ? <Text style={styles.itemBody}>{it.rationale}</Text> : null}
                  </View>
                ))}
              </View>
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
  daySelectorRow: { marginBottom: 8, paddingBottom: 8 },
  daySelectorTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.bgElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 8,
  },
  daySelectorTabActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  daySelectorText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  daySelectorTextActive: {
    color: '#fff',
  }
});
