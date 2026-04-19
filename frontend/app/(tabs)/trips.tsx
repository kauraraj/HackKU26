import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus, Calendar } from 'lucide-react-native';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { useTheme } from '@/context/ThemeContext';
import { listTrips } from '@/services/trips';
import type { Trip } from '@/types';

export default function TripsTab() {
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const { colors } = useTheme();
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
      <Text style={[styles.title, { color: colors.foreground }]}>Your trips</Text>

      <TouchableOpacity
        onPress={() => router.push('/trips/new')}
        activeOpacity={0.8}
        style={[styles.newBtn, { backgroundColor: colors.primary }]}
        hitSlop={4}
      >
        <Plus size={18} color={colors.primaryForeground} />
        <Text style={[styles.newBtnText, { color: colors.primaryForeground }]}>New trip</Text>
      </TouchableOpacity>

      <FlatList
        data={trips}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
                elevation: 2,
              },
              pressed && { opacity: 0.9 },
            ]}
            onPress={() => router.push(`/trips/${item.id}`)}
            hitSlop={4}
          >
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              {item.destination ?? 'Destination TBD'}
            </Text>
            <View style={styles.datesRow}>
              <Calendar size={14} color={colors.primary} />
              <Text style={[styles.cardDates, { color: colors.primary }]}>
                {item.start_date} → {item.end_date}
              </Text>
            </View>
            <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
              {item.days.length} days · {item.places.length} places
            </Text>
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
  title: { fontSize: 28, fontWeight: '800' },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  newBtnText: { fontSize: 16, fontWeight: '600' },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 4,
    borderWidth: 1,
  },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  cardSub: { fontSize: 14 },
  datesRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  cardDates: { fontSize: 14, fontWeight: '500' },
  cardMeta: { fontSize: 12, marginTop: 4 },
});
