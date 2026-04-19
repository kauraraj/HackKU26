import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Screen } from '@/components/Screen';
import { PlaceCard } from '@/components/PlaceCard';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { useTheme } from '@/context/ThemeContext';
import { listPlaces } from '@/services/places';
import type { SavedPlace } from '@/types';

function locationKey(p: SavedPlace): string {
  if (p.city && p.country) return `${p.city}, ${p.country}`;
  if (p.city) return p.city;
  if (p.country) return p.country;
  return 'Unknown location';
}

export default function SavedPlacesTab() {
  const [places, setPlaces] = useState<SavedPlace[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const { colors } = useTheme();
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      const data = await listPlaces();
      setPlaces(data);
    } catch (e) {
      console.warn('failed to load places', e);
      setPlaces([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const groups = useMemo(() => {
    if (!places) return [];
    const seen = new Map<string, SavedPlace[]>();
    for (const p of places) {
      const key = locationKey(p);
      if (!seen.has(key)) seen.set(key, []);
      seen.get(key)!.push(p);
    }
    return Array.from(seen.entries())
      .sort(([a], [b]) => {
        if (a === 'Unknown location') return 1;
        if (b === 'Unknown location') return -1;
        return a.localeCompare(b);
      })
      .map(([key, items]) => ({ key, items }));
  }, [places]);

  const effectiveActive =
    activeLocation && groups.some((g) => g.key === activeLocation)
      ? activeLocation
      : groups[0]?.key ?? null;

  const activePlaces = useMemo(() => {
    if (!effectiveActive) return [];
    return groups.find((g) => g.key === effectiveActive)?.items ?? [];
  }, [groups, effectiveActive]);

  if (places === null) return <LoadingState label="Fetching your places…" />;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Saved places</Text>
        <Text style={[styles.count, { color: colors.mutedForeground }]}>{places.length}</Text>
      </View>

      <TouchableOpacity
        onPress={() => router.push('/ingestion/new')}
        activeOpacity={0.8}
        style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
        hitSlop={4}
      >
        <Plus size={18} color={colors.primaryForeground} />
        <Text style={[styles.ctaBtnText, { color: colors.primaryForeground }]}>Turn a TikTok into a trip</Text>
      </TouchableOpacity>

      {groups.length === 0 ? (
        <EmptyState
          title="No saved places yet"
          subtitle="Paste a TikTok URL and we'll pull out the spots mentioned in the video."
        />
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabStrip}
            contentContainerStyle={styles.tabStripContent}
          >
            {groups.map(({ key, items }) => {
              const active = key === effectiveActive;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setActiveLocation(key)}
                  style={[
                    styles.tab,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    active && { backgroundColor: colors.accentBg, borderColor: colors.primary },
                  ]}
                  activeOpacity={0.75}
                  hitSlop={4}
                >
                  <Text
                    style={[
                      styles.tabLabel,
                      { color: colors.mutedForeground },
                      active && { color: colors.primary },
                    ]}
                    numberOfLines={1}
                  >
                    {key}
                  </Text>
                  <View style={[
                    styles.tabBadge,
                    { backgroundColor: colors.secondary },
                    active && { backgroundColor: colors.primary },
                  ]}>
                    <Text style={[
                      styles.tabBadgeText,
                      { color: colors.mutedForeground },
                      active && { color: colors.primaryForeground },
                    ]}>
                      {items.length}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <FlatList
            data={activePlaces}
            keyExtractor={(p) => p.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
            contentContainerStyle={{ paddingVertical: 8 }}
            renderItem={({ item }) => (
              <PlaceCard
                title={item.normalized_name}
                subtitle={item.address ?? undefined}
                reason={item.notes}
                category={item.category}
                confidence={item.confidence}
                thumbnailUrl={item.thumbnail_url}
              />
            )}
            ListEmptyComponent={
              <EmptyState title="No places here" subtitle="Try refreshing." />
            }
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  title: { fontSize: 28, fontWeight: '800' },
  count: { fontSize: 16 },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  ctaBtnText: { fontSize: 16, fontWeight: '600' },
  tabStrip: { marginTop: 4, marginBottom: 4 },
  tabStripContent: { gap: 8, paddingHorizontal: 2, paddingVertical: 4 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 220,
  },
  tabLabel: { fontSize: 12, fontWeight: '600', flexShrink: 1 },
  tabBadge: { borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeText: { fontSize: 11, fontWeight: '700' },
});
