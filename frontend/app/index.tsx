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
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { PlaceCard } from '@/components/PlaceCard';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { theme } from '@/components/theme';
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
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      const data = await listPlaces();
      setPlaces(data);
      if (data.length > 0 && activeLocation === null) {
        // Auto-select the first group alphabetically
        const firstKey = locationKey(data.slice().sort((a, b) => locationKey(a).localeCompare(locationKey(b)))[0]);
        setActiveLocation(firstKey);
      }
    } catch (e) {
      console.warn('failed to load places', e);
      setPlaces([]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Build ordered groups by location, sorted alphabetically
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

  const activePlaces = useMemo(() => {
    if (!activeLocation) return [];
    return groups.find((g) => g.key === activeLocation)?.items ?? [];
  }, [groups, activeLocation]);

  if (places === null) return <LoadingState label="Fetching your places…" />;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Saved places</Text>
        <Text style={styles.count}>{places.length}</Text>
      </View>

      <Button title="➕ Turn a TikTok into a trip" onPress={() => router.push('/ingestion/new')} />

      {groups.length === 0 ? (
        <EmptyState
          title="No saved places yet"
          subtitle="Paste a TikTok URL and we'll pull out the spots mentioned in the video."
        />
      ) : (
        <>
          {/* Location tab strip */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabStrip}
            contentContainerStyle={styles.tabStripContent}
          >
            {groups.map(({ key, items }) => {
              const active = key === activeLocation;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setActiveLocation(key)}
                  style={[styles.tab, active && styles.tabActive]}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[styles.tabLabel, active && styles.tabLabelActive]}
                    numberOfLines={1}
                  >
                    {key}
                  </Text>
                  <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>
                      {items.length}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Places for the active location */}
          <FlatList
            data={activePlaces}
            keyExtractor={(p) => p.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.accent}
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
  title: { color: theme.colors.text, fontSize: 28, fontWeight: '800' },
  count: { color: theme.colors.textDim, fontSize: 16 },

  tabStrip: { marginTop: 12, marginBottom: 4 },
  tabStripContent: { gap: 8, paddingHorizontal: 2, paddingVertical: 4 },

  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxWidth: 220,
  },
  tabActive: {
    backgroundColor: theme.colors.accent + '22',
    borderColor: theme.colors.accent,
  },
  tabLabel: {
    color: theme.colors.textDim,
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  tabLabelActive: {
    color: theme.colors.accent,
  },
  tabBadge: {
    backgroundColor: theme.colors.bgElevated,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabBadgeActive: {
    backgroundColor: theme.colors.accent,
  },
  tabBadgeText: {
    color: theme.colors.textDim,
    fontSize: 11,
    fontWeight: '700',
  },
  tabBadgeTextActive: {
    color: '#fff',
  },
});