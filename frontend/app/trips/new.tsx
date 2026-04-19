import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { PlaceCard } from '@/components/PlaceCard';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { theme } from '@/components/theme';
import { listPlaces } from '@/services/places';
import { createTrip } from '@/services/trips';
import type { SavedPlace } from '@/types';

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export default function NewTrip() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const today = new Date();
  const weekLater = new Date(today.getTime() + 6 * 86400_000);
  const [startDate, setStartDate] = useState(isoDate(today));
  const [endDate, setEndDate] = useState(isoDate(weekLater));
  const [vibe, setVibe] = useState('');
  const [places, setPlaces] = useState<SavedPlace[] | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listPlaces()
      .then(setPlaces)
      .catch(() => setPlaces([]));
  }, []);

  const toggle = useCallback((id: string) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }, []);

  const submit = async () => {
    if (!title.trim()) {
      Alert.alert('Give your trip a title.');
      return;
    }
    if (!/\d{4}-\d{2}-\d{2}/.test(startDate) || !/\d{4}-\d{2}-\d{2}/.test(endDate)) {
      Alert.alert('Dates must be YYYY-MM-DD.');
      return;
    }
    const place_ids = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
    setSubmitting(true);
    try {
      const trip = await createTrip({
        title: title.trim(),
        destination: destination.trim() || undefined,
        start_date: startDate,
        end_date: endDate,
        vibe: vibe.trim() || undefined,
        place_ids,
      });
      router.replace(`/trips/${trip.id}`);
    } catch (e) {
      Alert.alert('Could not create trip', (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (places === null) return <LoadingState />;

  return (
    <Screen>
      <FlatList
        data={places}
        keyExtractor={(p) => p.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <TextInput placeholder="Title (e.g. Summer in Japan)" placeholderTextColor={theme.colors.textDim} style={styles.input} value={title} onChangeText={setTitle} />
            <TextInput placeholder="Destination" placeholderTextColor={theme.colors.textDim} style={styles.input} value={destination} onChangeText={setDestination} />
            <View style={styles.row}>
              <TextInput placeholder="Start YYYY-MM-DD" placeholderTextColor={theme.colors.textDim} style={[styles.input, styles.flex]} value={startDate} onChangeText={setStartDate} />
              <TextInput placeholder="End YYYY-MM-DD" placeholderTextColor={theme.colors.textDim} style={[styles.input, styles.flex]} value={endDate} onChangeText={setEndDate} />
            </View>
            <TextInput placeholder="Vibe (optional, e.g. chill + foodie)" placeholderTextColor={theme.colors.textDim} style={styles.input} value={vibe} onChangeText={setVibe} />
            <Text style={styles.sectionTitle}>Pick places for this trip</Text>
          </View>
        }
        renderItem={({ item }) => {
          const picked = !!selected[item.id];
          return (
            <View style={[styles.cardWrap, picked && styles.cardPicked]}>
              <PlaceCard
                title={item.normalized_name}
                subtitle={[item.city, item.country].filter(Boolean).join(', ') || null}
                category={item.category}
                thumbnailUrl={item.thumbnail_url}
                onPress={() => toggle(item.id)}
              />
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState title="No saved places yet" subtitle="Go save a few from a TikTok before creating a trip." />
        }
        ListFooterComponent={
          <Button title={submitting ? 'Planning…' : 'Create & generate itinerary'} onPress={submit} loading={submitting} />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  input: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: 14,
    color: theme.colors.text,
    fontSize: 15,
  },
  sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700', marginTop: 8 },
  cardWrap: { borderRadius: theme.radius.md },
  cardPicked: { borderColor: theme.colors.accent, borderWidth: 1 },
});
