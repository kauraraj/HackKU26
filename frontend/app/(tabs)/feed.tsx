import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { CTAInputCard } from '@/components/CTAInputCard';
import { EmptyState } from '@/components/EmptyState';
import { FeedTripCard } from '@/components/FeedTripCard';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/context/ThemeContext';
import { getFeedItems } from '@/services/feed';
import type { FeedItem, FeedSection } from '@/types/feed';

const SECTION_LABELS: Record<FeedSection, string> = {
  following: 'From Friends',
  trending: 'Trending',
  recommended: 'Recommended',
};

const SECTION_ORDER: FeedSection[] = ['following', 'trending', 'recommended'];

function SectionHeader({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.sectionHeader, { color: colors.foreground }]}>{label}</Text>
  );
}

export default function FeedScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await getFeedItems();
      setItems(data);
    } catch (e) {
      setError((e as Error).message ?? 'Could not load feed');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (items === null && !error) {
    return <LoadingState label="Loading feed…" />;
  }

  const bySection = (section: FeedSection) => (items ?? []).filter((i) => i.section === section);

  return (
    <Screen scroll>
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Feed</Text>

      <CTAInputCard
        onSubmit={(url) => {
          router.push({ pathname: '/ingestion/new', params: { url } } as never);
        }}
      />

      {error ? (
        <View style={styles.errorWrap}>
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          <Button title="Retry" onPress={load} variant="ghost" />
        </View>
      ) : items && items.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          subtitle="Follow friends or check back later for travel inspiration."
        />
      ) : (
        SECTION_ORDER.map((section) => {
          const sectionItems = bySection(section);
          if (!sectionItems.length) return null;
          return (
            <View key={section} style={styles.section}>
              <SectionHeader label={SECTION_LABELS[section]} />
              {sectionItems.map((item) => (
                <FeedTripCard
                  key={item.id}
                  item={item}
                  onPress={() => router.push(`/shared-trip/${item.id}` as never)}
                />
              ))}
            </View>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontSize: 28, fontWeight: '800' },
  section: { gap: 4 },
  sectionHeader: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  errorWrap: { gap: 12, alignItems: 'center' },
  errorText: { fontSize: 14, textAlign: 'center' },
});
