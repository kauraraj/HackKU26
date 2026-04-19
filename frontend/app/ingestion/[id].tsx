import { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { PlaceCard } from '@/components/PlaceCard';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { useTheme } from '@/context/ThemeContext';
import { useIngestionPolling } from '@/hooks/useIngestionPolling';
import { confirmPlaces } from '@/services/places';

export default function IngestionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { job, error } = useIngestionPolling(id);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const { colors } = useTheme();
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
        <Text style={[styles.helper, { color: colors.mutedForeground }]}>This usually takes 5–20 seconds.</Text>
      </Screen>
    );
  }

  if (job.status === 'failed') {
    return (
      <Screen>
        <EmptyState
          title="Couldn't scan that one"
          subtitle={job.error_message ?? "The video didn't contain enough info to extract places."}
        />
        <Button title="Try another video" onPress={() => router.replace('/ingestion/new')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={[styles.title, { color: colors.foreground }]}>We found these places</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>Tap the ones you want to save. You can edit details later.</Text>

      <FlatList
        data={places}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => {
          const picked = !!selected[item.id];
          return (
            <View style={[
              styles.cardWrap,
              picked && { borderColor: colors.primary, borderWidth: 1, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 6 },
            ]}>
              <PlaceCard
                title={item.normalized_name ?? item.original_name}
                subtitle={[item.city, item.country].filter(Boolean).join(', ') || null}
                reason={item.reason}
                category={item.category}
                confidence={item.confidence}
                thumbnailUrl={item.thumbnail_url}
                onPress={() => toggle(item.id)}
                trailing={
                  <View style={[
                    styles.check,
                    { borderColor: colors.border },
                    picked && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}>
                    <Text style={{ color: colors.primaryForeground }}>{picked ? '✓' : ''}</Text>
                  </View>
                }
              />
            </View>
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
  title: { fontSize: 24, fontWeight: '800' },
  sub: { marginBottom: 4 },
  helper: { textAlign: 'center', marginTop: -40 },
  cardWrap: { borderRadius: 12 },
  check: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
