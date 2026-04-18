import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { theme } from '@/components/theme';
import { listTrips } from '@/services/trips';
import type { Trip } from '@/types';

export default function TripsTab() {
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      setTrips(await listTrips());
    } catch (e) {
      console.warn(e);
      setTrips([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (trips === null) return <LoadingState />;

  return (
    <Screen>
      <Text style={styles.title}>Your trips</Text>
      <Button title="➕ New trip" onPress={() => router.push('/trips/new')} />
      <FlatList
        data={trips}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/trips/${item.id}`)}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSub}>{item.destination ?? 'Destination TBD'}</Text>
            <Text style={styles.cardDates}>
              {item.start_date} → {item.end_date}
            </Text>
            <Text style={styles.cardMeta}>{item.days.length} days · {item.places.length} places</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No trips yet"
            subtitle="Save some places, then bundle them into a trip with dates."
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.colors.text, fontSize: 28, fontWeight: '800' },
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: 16,
    marginBottom: 12,
    gap: 4,
  },
  cardTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
  cardSub: { color: theme.colors.textDim },
  cardDates: { color: theme.colors.accentSoft, marginTop: 6 },
  cardMeta: { color: theme.colors.textDim, fontSize: 12, marginTop: 4 },
});
