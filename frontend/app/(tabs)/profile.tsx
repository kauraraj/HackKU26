import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { ProfileSummaryBubble } from '@/components/ProfileSummaryBubble';
import { SegmentedTab } from '@/components/SegmentedTab';
import { TripItineraryCard } from '@/components/TripItineraryCard';
import { PlaceCard } from '@/components/PlaceCard';
import { SaveLocationButton } from '@/components/SaveLocationButton';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { getProfile } from '@/services/profile';
import { listTrips } from '@/services/trips';
import { listPlaces } from '@/services/places';
import { getProfileHistory, getProfileSaved } from '@/services/social';
import type { Profile, SavedPlace, Trip } from '@/types';
import type { HistoryEntry, SavedItem } from '@/types/social';

type Segment = 'history' | 'saved';

export default function ProfileTab() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [saved, setSaved] = useState<SavedItem[] | null>(null);
  const [segment, setSegment] = useState<Segment>('history');
  const [unsavedIds, setUnsavedIds] = useState<Set<string>>(new Set());

  const loadAll = useCallback(async () => {
    try {
      const [p, t, pl] = await Promise.all([
        getProfile().catch(() => null),
        listTrips().catch(() => [] as Trip[]),
        listPlaces().catch(() => [] as SavedPlace[]),
      ]);
      setProfile(p);
      setTrips(t);
      setPlaces(pl);
      setHistory(await getProfileHistory(t));
      setSaved(await getProfileSaved(pl));
    } catch (e) {
      console.warn('profile load failed', e);
      setHistory([]);
      setSaved([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const displayName = profile?.display_name ?? profile?.username ?? user?.email ?? 'You';
  const username = profile?.username ?? null;

  const toggleSaved = (id: string) => {
    setUnsavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openPublicProfile = () => {
    const u = username ?? 'you';
    router.push(`/profile/${u}`);
  };

  const pastTripsCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return trips.filter((t) => t.end_date < today).length;
  }, [trips]);

  if (history === null || saved === null) {
    return <LoadingState label="Loading your profile…" />;
  }

  return (
    <Screen scroll>
      <View style={styles.headerRow}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Profile</Text>
        <Pressable
          onPress={() => router.push('/profile/settings')}
          style={[styles.gear, { backgroundColor: colors.card, borderColor: colors.border }]}
          hitSlop={8}
          accessibilityLabel="Settings"
        >
          <Settings size={18} color={colors.foreground} />
        </Pressable>
      </View>

      <ProfileSummaryBubble
        displayName={displayName}
        username={username}
        avatarUrl={profile?.avatar_url ?? null}
        homeCity={profile?.home_city ?? null}
        tripsCount={profile?.trips_count ?? trips.length}
        savedCount={profile?.saved_places_count ?? places.length}
        postedCount={0}
        friendsCount={5}
        onPress={openPublicProfile}
        onFriendsPress={openPublicProfile}
      />

      <SegmentedTab<Segment>
        options={[
          { value: 'history', label: `History${pastTripsCount ? ` · ${pastTripsCount}` : ''}` },
          { value: 'saved', label: `Saved${places.length ? ` · ${places.length}` : ''}` },
        ]}
        value={segment}
        onChange={setSegment}
      />

      {segment === 'history' ? (
        history.length === 0 ? (
          <EmptyState
            title="No history yet"
            subtitle="Past trips and posted itineraries will show up here."
          />
        ) : (
          <View>
            {history.map((entry) =>
              entry.kind === 'trip' ? (
                <TripItineraryCard
                  key={entry.id}
                  title={entry.trip.title}
                  destination={entry.trip.destination}
                  dateRange={`${entry.trip.start_date} → ${entry.trip.end_date}`}
                  daysCount={entry.trip.days.length}
                  placesCount={entry.trip.places.length}
                  onPress={() => router.push(`/trips/${entry.trip.id}`)}
                />
              ) : (
                <TripItineraryCard
                  key={entry.id}
                  title={entry.itinerary.title}
                  destination={entry.itinerary.destination}
                  daysCount={entry.itinerary.days_count}
                  placesCount={entry.itinerary.places_count}
                  savesCount={entry.itinerary.saves}
                  rating={entry.itinerary.rating}
                  badge="POSTED"
                />
              )
            )}
          </View>
        )
      ) : saved.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          subtitle="Save places and itineraries to revisit them later."
        />
      ) : (
        <View>
          {saved.map((item) =>
            item.kind === 'place' ? (
              <PlaceCard
                key={item.id}
                title={item.place.normalized_name}
                subtitle={item.place.address ?? undefined}
                reason={item.place.notes}
                category={item.place.category}
                confidence={item.place.confidence}
                thumbnailUrl={item.place.thumbnail_url}
                trailing={
                  <SaveLocationButton
                    compact
                    saved={!unsavedIds.has(item.id)}
                    onToggle={() => toggleSaved(item.id)}
                  />
                }
              />
            ) : (
              <TripItineraryCard
                key={item.id}
                title={item.itinerary.title}
                destination={item.itinerary.destination}
                daysCount={item.itinerary.days_count}
                placesCount={item.itinerary.places_count}
                savesCount={item.itinerary.saves}
                rating={item.itinerary.rating}
                badge="SAVED"
              />
            )
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { fontSize: 28, fontWeight: '800' },
  gear: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
