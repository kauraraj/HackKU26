import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bookmark, MapPin, Star } from 'lucide-react-native';
import { PlaceCard } from '@/components/PlaceCard';
import { SaveLocationButton } from '@/components/SaveLocationButton';
import { StatPill } from '@/components/StatPill';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/context/ThemeContext';
import { getFeedItems, saveFeedItinerary, saveFeedPlace } from '@/services/feed';
import type { FeedItem } from '@/types/feed';

const BLOCK_LABELS: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

function AvatarInitials({ name, size = 40 }: { name: string; size?: number }) {
  const { colors } = useTheme();
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.accentBg,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
    >
      <Text style={{ color: colors.accentFg, fontSize: size * 0.38, fontWeight: '700' }}>{initials}</Text>
    </View>
  );
}

export default function SharedTripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();

  const [item, setItem] = useState<FeedItem | null | undefined>(undefined);
  const [savedItin, setSavedItin] = useState(false);
  const [savedPlaceIds, setSavedPlaceIds] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      getFeedItems().then((items) => {
        setItem(items.find((i) => i.id === id) ?? null);
      });
    }, [id])
  );

  const toggleItinerary = async () => {
    const next = !savedItin;
    setSavedItin(next);
    if (next) await saveFeedItinerary(id);
  };

  const togglePlace = async (placeId: string) => {
    setSavedPlaceIds((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return next;
    });
    await saveFeedPlace(placeId);
  };

  if (item === undefined) {
    return <LoadingState label="Loading trip…" />;
  }

  if (item === null) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <EmptyState
          title="Trip not found"
          subtitle="This trip may have been removed."
          action={
            <Pressable onPress={() => router.back()}>
              <Text style={{ color: colors.primary, fontWeight: '600', textAlign: 'center' }}>Go back</Text>
            </Pressable>
          }
        />
      </SafeAreaView>
    );
  }

  const blocks = ['morning', 'afternoon', 'evening'] as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero */}
        <View style={styles.heroWrap}>
          <LinearGradient
            colors={['#0ea5e9', '#6366f1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          />
          <View style={styles.heroOverlay}>
            <Pressable
              onPress={() => router.back()}
              style={[styles.backBtn, { backgroundColor: 'rgba(0,0,0,0.35)' }]}
              hitSlop={8}
            >
              <ArrowLeft size={20} color="#fff" />
            </Pressable>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle} numberOfLines={2}>{item.title}</Text>
              <View style={styles.heroRow}>
                <MapPin size={14} color="rgba(255,255,255,0.85)" />
                <Text style={styles.heroDestination}>{item.destination}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Creator row */}
          <View style={styles.creatorRow}>
            <AvatarInitials name={item.creator.display_name} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.creatorName, { color: colors.foreground }]}>{item.creator.display_name}</Text>
              <Text style={[styles.creatorUsername, { color: colors.mutedForeground }]}>@{item.creator.username}</Text>
            </View>
            {item.creator.is_friend && (
              <View style={[styles.friendBadge, { backgroundColor: colors.accentBg }]}>
                <Text style={[styles.friendBadgeText, { color: colors.accentFg }]}>Friend</Text>
              </View>
            )}
            <Pressable
              onPress={toggleItinerary}
              style={[
                styles.saveItinBtn,
                {
                  backgroundColor: savedItin ? colors.primary : colors.card,
                  borderColor: savedItin ? colors.primary : colors.border,
                },
              ]}
              hitSlop={4}
            >
              <Bookmark size={16} color={savedItin ? colors.primaryForeground : colors.foreground} fill={savedItin ? colors.primaryForeground : 'none'} />
              <Text style={[styles.saveItinLabel, { color: savedItin ? colors.primaryForeground : colors.foreground }]}>
                {savedItin ? 'Saved' : 'Save'}
              </Text>
            </Pressable>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatPill label="days" value={item.days_count} />
            <StatPill label="places" value={item.places_count} />
            <StatPill label="saves" value={item.saves} />
            {item.rating != null && (
              <View style={[styles.ratingPill, { backgroundColor: colors.secondary }]}>
                <Star size={13} color={colors.warn} fill={colors.warn} />
                <Text style={[styles.ratingText, { color: colors.warn }]}>{item.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          {/* Itinerary */}
          <Text style={[styles.sectionHeader, { color: colors.foreground }]}>Itinerary</Text>
          {item.days.map((day) => (
            <View key={day.day_number} style={styles.dayWrap}>
              <View style={styles.dayHeader}>
                <View style={[styles.dayBadge, { backgroundColor: colors.accentBg }]}>
                  <Text style={[styles.dayBadgeText, { color: colors.accentFg }]}>Day {day.day_number}</Text>
                </View>
                <Text style={[styles.dayDate, { color: colors.mutedForeground }]}>{day.day_date}</Text>
              </View>
              {day.summary ? (
                <Text style={[styles.daySummary, { color: colors.mutedForeground }]}>{day.summary}</Text>
              ) : null}
              {blocks.map((block) => {
                const blockItems = day.items.filter((i) => i.block === block);
                if (!blockItems.length) return null;
                return (
                  <View key={block} style={styles.blockWrap}>
                    <Text style={[styles.blockLabel, { color: colors.primary }]}>{BLOCK_LABELS[block]}</Text>
                    {blockItems.map((itm) => (
                      <View key={itm.id} style={styles.itinItem}>
                        <View style={[styles.itinDot, { backgroundColor: colors.primary }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.itinTitle, { color: colors.foreground }]}>{itm.title}</Text>
                          {itm.notes ? (
                            <Text style={[styles.itinNotes, { color: colors.mutedForeground }]}>{itm.notes}</Text>
                          ) : null}
                        </View>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          ))}

          {/* Places */}
          {item.places.length > 0 && (
            <>
              <Text style={[styles.sectionHeader, { color: colors.foreground }]}>Places</Text>
              {item.places.map((place) => (
                <PlaceCard
                  key={place.id}
                  title={place.name}
                  subtitle={[place.city, place.country].filter(Boolean).join(', ')}
                  category={place.category}
                  trailing={
                    <SaveLocationButton
                      compact
                      saved={savedPlaceIds.has(place.id)}
                      onToggle={() => togglePlace(place.id)}
                    />
                  }
                />
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heroWrap: { position: 'relative', height: 200 },
  hero: { ...StyleSheet.absoluteFillObject },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  heroText: { gap: 6 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', lineHeight: 28 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroDestination: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  content: { padding: 20, gap: 20 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  creatorName: { fontSize: 15, fontWeight: '700' },
  creatorUsername: { fontSize: 13, marginTop: 2 },
  friendBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  friendBadgeText: { fontSize: 12, fontWeight: '600' },
  saveItinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  saveItinLabel: { fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  ratingText: { fontSize: 14, fontWeight: '700' },
  sectionHeader: { fontSize: 18, fontWeight: '700' },
  dayWrap: { gap: 10 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  dayBadgeText: { fontSize: 13, fontWeight: '700' },
  dayDate: { fontSize: 13 },
  daySummary: { fontSize: 13, lineHeight: 18 },
  blockWrap: { gap: 8 },
  blockLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  itinItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  itinDot: { width: 7, height: 7, borderRadius: 4, marginTop: 6 },
  itinTitle: { fontSize: 14, fontWeight: '600' },
  itinNotes: { fontSize: 13, marginTop: 2, lineHeight: 18 },
});
