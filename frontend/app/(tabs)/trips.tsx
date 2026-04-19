import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus, Link as LinkIcon, MapPin } from 'lucide-react-native';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { SegmentedTab } from '@/components/SegmentedTab';
import { TripItineraryCard } from '@/components/TripItineraryCard';
import { useTheme } from '@/context/ThemeContext';
import { listTrips } from '@/services/trips';
import type { Trip } from '@/types';

type Segment = 'upcoming' | 'drafts' | 'past';

const todayIso = () => new Date().toISOString().slice(0, 10);

const formatDateRange = (start: string, end: string) => {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
};

const itemCount = (trip: Trip) =>
  trip.days.reduce((acc, day) => acc + day.items.length, 0);

const tripCategory = (trip: Trip): Segment => {
  const today = todayIso();
  if (trip.end_date < today) return 'past';
  if (itemCount(trip) === 0) return 'drafts';
  return 'upcoming';
};

const segmentBadge: Record<Segment, string> = {
  upcoming: 'Upcoming',
  drafts: 'Draft',
  past: 'Past',
};

const segmentEmpty: Record<Segment, { title: string; subtitle: string }> = {
  upcoming: {
    title: 'No upcoming trips',
    subtitle: 'Bundle your saved places or paste a video link to start planning.',
  },
  drafts: {
    title: 'No drafts',
    subtitle: 'Drafts show up here when a trip exists but its itinerary isn\u2019t generated yet.',
  },
  past: {
    title: 'No past trips',
    subtitle: 'Once a trip\u2019s end date passes, it lands here for revisiting.',
  },
};

export default function TripsTab() {
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [segment, setSegment] = useState<Segment>('upcoming');
  const { colors } = useTheme();
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      setError(null);
      setTrips(await listTrips());
    } catch (e) {
      setTrips([]);
      setError((e as Error).message || 'Could not load trips.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const buckets = useMemo(() => {
    const result: Record<Segment, Trip[]> = { upcoming: [], drafts: [], past: [] };
    (trips ?? []).forEach((t) => result[tripCategory(t)].push(t));
    result.upcoming.sort((a, b) => a.start_date.localeCompare(b.start_date));
    result.drafts.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    result.past.sort((a, b) => b.end_date.localeCompare(a.end_date));
    return result;
  }, [trips]);

  if (trips === null) return <LoadingState label="Loading trips\u2026" />;

  const visible = buckets[segment];

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Trips</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Plan, organize, and revisit.
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/trips/new')}
          accessibilityLabel="New trip"
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            },
            pressed && { opacity: 0.85 },
          ]}
          hitSlop={6}
        >
          <Plus size={20} color={colors.primaryForeground} />
        </Pressable>
      </View>

      <View style={styles.quickRow}>
        <Pressable
          onPress={() => router.push('/trips/new')}
          style={({ pressed }) => [
            styles.quickCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
            pressed && { opacity: 0.9 },
          ]}
          hitSlop={4}
        >
          <View style={[styles.quickIcon, { backgroundColor: colors.accentBg }]}>
            <MapPin size={18} color={colors.accentFg} />
          </View>
          <Text style={[styles.quickTitle, { color: colors.foreground }]}>From saved places</Text>
          <Text style={[styles.quickBody, { color: colors.mutedForeground }]}>
            Bundle places into a dated trip.
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/ingestion/new')}
          style={({ pressed }) => [
            styles.quickCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
            pressed && { opacity: 0.9 },
          ]}
          hitSlop={4}
        >
          <View style={[styles.quickIcon, { backgroundColor: colors.accentBg }]}>
            <LinkIcon size={18} color={colors.accentFg} />
          </View>
          <Text style={[styles.quickTitle, { color: colors.foreground }]}>Paste a video link</Text>
          <Text style={[styles.quickBody, { color: colors.mutedForeground }]}>
            Generate places from a TikTok.
          </Text>
        </Pressable>
      </View>

      <SegmentedTab<Segment>
        value={segment}
        onChange={setSegment}
        options={[
          { value: 'upcoming', label: `Upcoming \u00b7 ${buckets.upcoming.length}` },
          { value: 'drafts', label: `Drafts \u00b7 ${buckets.drafts.length}` },
          { value: 'past', label: `Past \u00b7 ${buckets.past.length}` },
        ]}
      />

      {error ? (
        <View style={[styles.errorBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          <Pressable onPress={load} hitSlop={6}>
            <Text style={[styles.retry, { color: colors.primary }]}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={visible}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TripItineraryCard
            title={item.title}
            destination={item.destination}
            dateRange={formatDateRange(item.start_date, item.end_date)}
            daysCount={item.days.length || null}
            placesCount={item.places.length || null}
            badge={segmentBadge[tripCategory(item)]}
            onPress={() => router.push(`/trips/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title={segmentEmpty[segment].title}
            subtitle={segmentEmpty[segment].subtitle}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 2 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickRow: { flexDirection: 'row', gap: 12 },
  quickCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: { fontSize: 14, fontWeight: '700' },
  quickBody: { fontSize: 12, lineHeight: 16 },
  errorBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  errorText: { fontSize: 13, flex: 1 },
  retry: { fontSize: 13, fontWeight: '700' },
});
