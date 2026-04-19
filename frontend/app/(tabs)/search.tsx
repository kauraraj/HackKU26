import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bookmark, MapPin, Search, Star, TrendingUp, UserCheck, UserPlus, Users, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { EmptyState } from '@/components/EmptyState';
import { PlaceImageCard } from '@/components/PlaceImageCard';
import { SearchFilterChips } from '@/components/SearchFilterChips';
import { useTheme } from '@/context/ThemeContext';
import { searchAll } from '@/services/search';
import type { SearchFilter, SearchItinerary, SearchLocation, SearchResults, SearchUser } from '@/types/search';

export default function SearchScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('all');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchAll(text);
        setResults(data);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults(null);
    setLoading(false);
  }, []);

  const hasResults = results && (
    results.users.length > 0 ||
    results.locations.length > 0 ||
    results.itineraries.length > 0
  );

  const showUsers = filter === 'all' || filter === 'users';
  const showLocations = filter === 'all' || filter === 'locations';
  const showItineraries = filter === 'all' || filter === 'itineraries';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Search</Text>

        {/* Search bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Search size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Users, places, itineraries…"
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={handleQueryChange}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={clearSearch} hitSlop={10}>
              <X size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {/* Filter chips — only show once user has typed */}
        {query.length > 0 && (
          <SearchFilterChips active={filter} onChange={setFilter} />
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Idle state */}
        {!query && (
          <IdleHints colors={colors} />
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Searching…</Text>
          </View>
        )}

        {/* No results */}
        {!loading && results && !hasResults && (
          <EmptyState
            title="No results"
            subtitle={`Nothing matched "${query}". Try a different keyword.`}
          />
        )}

        {/* Results */}
        {!loading && hasResults && (
          <>
            {/* Users section */}
            {showUsers && results!.users.length > 0 && (
              <Section title="Users" count={results!.users.length} colors={colors}>
                {results!.users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    colors={colors}
                    onPress={() => router.push(`/profile/${user.username}` as never)}
                  />
                ))}
              </Section>
            )}

            {/* Locations section */}
            {showLocations && results!.locations.length > 0 && (
              <Section title="Locations" count={results!.locations.length} colors={colors}>
                {results!.locations.map((loc) => (
                  <PlaceImageCard
                    key={loc.id}
                    name={loc.name}
                    category={loc.category}
                    short_description={loc.short_description}
                    trending_count={loc.trending_count}
                    visit_count={loc.visit_count}
                    onPress={() => router.push(`/search/${loc.id}` as never)}
                  />
                ))}
              </Section>
            )}

            {/* Itineraries section */}
            {showItineraries && results!.itineraries.length > 0 && (
              <Section title="Itineraries" count={results!.itineraries.length} colors={colors}>
                {results!.itineraries.map((itin) => (
                  <ItineraryRow
                    key={itin.id}
                    itin={itin}
                    colors={colors}
                    onPress={() => router.push(`/shared-trip/${itin.id}` as never)}
                  />
                ))}
              </Section>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Section wrapper ─────────────────────────────────────────── */
function Section({
  title,
  count,
  colors,
  children,
}: {
  title: string;
  count: number;
  colors: ReturnType<typeof import('@/context/ThemeContext').getColors>;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>{count}</Text>
      </View>
      {children}
    </View>
  );
}

/* ── User row ─────────────────────────────────────────────────── */
function UserRow({
  user,
  colors,
  onPress,
}: {
  user: SearchUser;
  colors: ReturnType<typeof import('@/context/ThemeContext').getColors>;
  onPress: () => void;
}) {
  const [following, setFollowing] = useState(user.is_following);
  const initials = user.display_name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.userRow,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
        pressed && { opacity: 0.88 },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: colors.accentBg }]}>
        <Text style={[styles.avatarText, { color: colors.accentFg }]}>{initials}</Text>
      </View>
      <View style={styles.userInfo}>
        <View style={styles.userNameRow}>
          <Text style={[styles.userDisplayName, { color: colors.foreground }]} numberOfLines={1}>
            {user.display_name}
          </Text>
          {user.is_friend && (
            <View style={[styles.friendBadge, { backgroundColor: colors.accentBg }]}>
              <Text style={[styles.friendBadgeText, { color: colors.accentFg }]}>Friend</Text>
            </View>
          )}
        </View>
        <Text style={[styles.username, { color: colors.mutedForeground }]}>@{user.username}</Text>
        <View style={styles.userMeta}>
          {user.home_city && (
            <View style={styles.metaItem}>
              <MapPin size={11} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{user.home_city}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <TrendingUp size={11} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{user.trips_count} trips</Text>
          </View>
        </View>
      </View>
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          setFollowing((f) => !f);
        }}
        style={[
          styles.followBtn,
          { backgroundColor: following ? colors.secondary : colors.primary, borderColor: following ? colors.border : colors.primary },
        ]}
      >
        {following ? (
          <UserCheck size={14} color={colors.foreground} />
        ) : (
          <UserPlus size={14} color={colors.primaryForeground} />
        )}
        <Text style={[styles.followText, { color: following ? colors.foreground : colors.primaryForeground }]}>
          {following ? 'Following' : 'Follow'}
        </Text>
      </Pressable>
    </Pressable>
  );
}

/* ── Itinerary row ────────────────────────────────────────────── */
function ItineraryRow({
  itin,
  colors,
  onPress,
}: {
  itin: SearchItinerary;
  colors: ReturnType<typeof import('@/context/ThemeContext').getColors>;
  onPress: () => void;
}) {
  const grad = pickItineraryGradient(itin.title);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.itinCard,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
        pressed && { opacity: 0.9 },
      ]}
    >
      <LinearGradient
        colors={grad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.itinCover}
      />
      <View style={styles.itinBody}>
        <Text style={[styles.itinTitle, { color: colors.foreground }]} numberOfLines={2}>{itin.title}</Text>
        <View style={styles.metaItem}>
          <MapPin size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{itin.destination}</Text>
        </View>
        <Text style={[styles.itinCreator, { color: colors.mutedForeground }]}>by {itin.creator_name}</Text>
        <View style={styles.itinStats}>
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {itin.days_count}d · {itin.places_count} places
          </Text>
          <View style={styles.metaItem}>
            <Bookmark size={11} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{itin.saves}</Text>
          </View>
          {itin.rating != null && (
            <View style={styles.metaItem}>
              <Star size={11} color={colors.warn} fill={colors.warn} />
              <Text style={[styles.metaText, { color: colors.warn }]}>{itin.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

/* ── Idle hints ───────────────────────────────────────────────── */
function IdleHints({ colors }: { colors: ReturnType<typeof import('@/context/ThemeContext').getColors> }) {
  return (
    <View style={styles.idleWrap}>
      <Search size={40} color={colors.border} />
      <Text style={[styles.idleTitle, { color: colors.foreground }]}>Discover the world</Text>
      <Text style={[styles.idleSubtitle, { color: colors.mutedForeground }]}>
        Search for users, destinations, or itineraries made by travelers like you.
      </Text>
      <View style={styles.hintChips}>
        {['Tokyo', 'Bali', 'Lisbon', 'Kyoto'].map((hint) => (
          <View key={hint} style={[styles.hintChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Text style={[styles.hintChipText, { color: colors.mutedForeground }]}>{hint}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const ITIN_GRADIENTS: [string, string][] = [
  ['#0ea5e9', '#6366f1'],
  ['#f43f5e', '#f97316'],
  ['#10b981', '#0891b2'],
  ['#8b5cf6', '#ec4899'],
];

function pickItineraryGradient(title: string): [string, string] {
  const code = title.charCodeAt(0) + title.charCodeAt(title.length - 1);
  return ITIN_GRADIENTS[code % ITIN_GRADIENTS.length];
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, gap: 12 },
  title: { fontSize: 28, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 15 },
  scroll: { padding: 20, paddingTop: 8, gap: 0 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', paddingVertical: 24 },
  loadingText: { fontSize: 14 },
  section: { marginBottom: 24, gap: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  sectionCount: { fontSize: 13, fontWeight: '500' },
  /* User row */
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontWeight: '700', fontSize: 16 },
  userInfo: { flex: 1, gap: 2 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userDisplayName: { fontSize: 15, fontWeight: '700', flex: 1 },
  friendBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  friendBadgeText: { fontSize: 11, fontWeight: '600' },
  username: { fontSize: 12 },
  userMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontWeight: '500' },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  followText: { fontSize: 13, fontWeight: '600' },
  /* Itinerary card */
  itinCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
    flexDirection: 'row',
  },
  itinCover: { width: 90, height: 90 },
  itinBody: { flex: 1, padding: 12, gap: 4 },
  itinTitle: { fontSize: 14, fontWeight: '700', lineHeight: 18 },
  itinCreator: { fontSize: 12 },
  itinStats: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 2 },
  /* Idle */
  idleWrap: { alignItems: 'center', paddingTop: 60, gap: 12 },
  idleTitle: { fontSize: 22, fontWeight: '700' },
  idleSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  hintChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 },
  hintChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  hintChipText: { fontSize: 13, fontWeight: '500' },
});
