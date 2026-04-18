import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { PlaceCard } from '@/components/PlaceCard';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { theme } from '@/components/theme';
import { listPlaces } from '@/services/places';
import type { SavedPlace } from '@/types';

export default function SavedPlacesTab() {
  const [places, setPlaces] = useState<SavedPlace[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
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

  if (places === null) return <LoadingState label="Fetching your places…" />;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Saved places</Text>
        <Text style={styles.count}>{places.length}</Text>
      </View>
      <Button title="➕ Turn a TikTok into a trip" onPress={() => router.push('/ingestion/new')} />

      <FlatList
        data={places}
        keyExtractor={(p) => p.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item }) => (
          <PlaceCard
            title={item.normalized_name}
            subtitle={[item.city, item.country].filter(Boolean).join(', ') || null}
            reason={item.notes}
            category={item.category}
            confidence={item.confidence}
            thumbnailUrl={item.thumbnail_url}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No saved places yet"
            subtitle="Paste a TikTok URL and we'll pull out the spots mentioned in the video."
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  title: { color: theme.colors.text, fontSize: 28, fontWeight: '800' },
  count: { color: theme.colors.textDim, fontSize: 16 },
});
