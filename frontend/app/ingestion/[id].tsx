import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { PlaceCard } from '@/components/PlaceCard';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { theme } from '@/components/theme';
import { useIngestionPolling } from '@/hooks/useIngestionPolling';
import { confirmPlaces } from '@/services/places';

export default function IngestionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { job, error } = useIngestionPolling(id);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const places = useMemo(() => job?.extracted_places ?? [], [job]);

  const toggle = (pid: string) => setSelected((s) => ({ ...s, [pid]: !s[pid] }));

  const save = async () => {
    const confirmations = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([extracted_place_id]) => ({ extracted_place_id }));
    const rejectedIds = places.filter((p) => !selected[p.id]).map((p) => p.id);

    if (confirmations.length === 0) {
      Alert.alert('Pick at least one place to save, or skip this video.');
      return;
    }

    setSaving(true);
    try {
      await confirmPlaces(confirmations, rejectedIds);
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Save failed', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <Screen>
        <EmptyState title="Something went wrong" subtitle={error} />
        <Button title="Back" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (!job) return <LoadingState label="Fetching the video…" />;

  if (job.status === 'queued' || job.status === 'processing') {
    return (
      <Screen>
        <LoadingState label="Scanning for travel spots…" />
        <Text style={styles.helper}>This usually takes 5–20 seconds.</Text>
      </Screen>
    );
  }

  if (job.status === 'failed') {
    return (
      <Screen>
        <EmptyState
          title="Couldn't scan that one"
          subtitle={job.error_message ?? 'The video didn\'t contain enough info to extract places.'}
        />
        <Button title="Try another video" onPress={() => router.replace('/ingestion/new')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>We found these places</Text>
      <Text style={styles.sub}>Tap the ones you want to save. You can edit details later.</Text>

      <FlatList
        data={places}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => {
          const picked = !!selected[item.id];
          return (
            <Pressable onPress={() => toggle(item.id)}>
              <View style={[styles.cardWrap, picked && styles.cardPicked]}>
                <PlaceCard
                  title={item.normalized_name ?? item.original_name}
                  subtitle={[item.city, item.country].filter(Boolean).join(', ') || null}
                  reason={item.reason}
                  category={item.category}
                  confidence={item.confidence}
                  thumbnailUrl={item.thumbnail_url}
                  trailing={
                    <View style={[styles.check, picked && styles.checkOn]}>
                      <Text style={{ color: theme.colors.text }}>{picked ? '✓' : ''}</Text>
                    </View>
                  }
                />
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            title="No places detected"
            subtitle="The video didn't mention any recognizable spots. Try another TikTok."
          />
        }
      />

      {places.length > 0 ? (
        <Button title={`Save ${Object.values(selected).filter(Boolean).length} place(s)`} onPress={save} loading={saving} />
      ) : (
        <Button title="Try another video" onPress={() => router.replace('/ingestion/new')} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: theme.colors.text, fontSize: 24, fontWeight: '800' },
  sub: { color: theme.colors.textDim, marginBottom: 4 },
  helper: { color: theme.colors.textDim, textAlign: 'center', marginTop: -40 },
  cardWrap: { borderRadius: theme.radius.md },
  cardPicked: { borderColor: theme.colors.accent, borderWidth: 1, shadowColor: theme.colors.accent, shadowOpacity: 0.3, shadowRadius: 6 },
  check: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
});
