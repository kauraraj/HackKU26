import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Bookmark, MapPin, TrendingUp, Users } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { PlaceImageCard } from '@/components/PlaceImageCard';
import { useTheme } from '@/context/ThemeContext';
import { getLocationById } from '@/services/search';
import type { SearchLocation } from '@/types/search';

export default function LocationDetailScreen() {
  const { locationId } = useLocalSearchParams<{ locationId: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const [location, setLocation] = useState<SearchLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getLocationById(locationId ?? '').then((data) => {
        setLocation(data);
        setLoading(false);
      });
    }, [locationId])
  );

  if (loading) return <LoadingState label="Loading location…" />;
  if (!location) return <EmptyState title="Location not found" subtitle="This place could not be found." />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroWrap}>
          <LinearGradient
            colors={['#0ea5e9', '#6366f1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroOverlay}>
              <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
                <ArrowLeft size={22} color="#fff" />
              </Pressable>
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>{location.name}</Text>
                <View style={styles.heroMeta}>
                  <MapPin size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.heroSubtitle}>{location.country}</Text>
                  <View style={[styles.categoryPill]}>
                    <Text style={styles.categoryPillText}>{location.category}</Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.body}>
          {/* Stats row */}
          <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.statItem}>
              <TrendingUp size={16} color={colors.warn} />
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {formatCount(location.trending_count)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Trending</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Users size={16} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {formatCount(location.visit_count)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Visits</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Bookmark size={16} color={saved ? colors.primary : colors.mutedForeground} fill={saved ? colors.primary : 'transparent'} />
              <Text style={[styles.statValue, { color: colors.foreground }]}>Save</Text>
              <Pressable onPress={() => setSaved((s) => !s)}>
                <Text style={[styles.statLabel, { color: saved ? colors.primary : colors.mutedForeground }]}>
                  {saved ? 'Saved' : 'Tap to save'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Description */}
          {location.short_description ? (
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {location.short_description}
            </Text>
          ) : null}

          {/* Attractions */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Top Attractions
          </Text>

          {location.attractions.length === 0 ? (
            <EmptyState title="No attractions yet" subtitle="Check back soon." />
          ) : (
            location.attractions.map((place) => (
              <PlaceImageCard
                key={place.id}
                name={place.name}
                category={place.category}
                short_description={place.short_description}
                trending_count={place.trending_count}
                visit_count={place.visit_count}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  heroWrap: { height: 240 },
  hero: { flex: 1 },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 20,
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: { gap: 6 },
  heroTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '500' },
  categoryPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  categoryPillText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  body: { padding: 20, gap: 16 },
  statsRow: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 16, fontWeight: '700' },
  statLabel: { fontSize: 11, fontWeight: '500' },
  statDivider: { width: 1, height: 40, marginHorizontal: 8 },
  description: { fontSize: 14, lineHeight: 22 },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
});
